import os
import re
import random
import logging
import smtplib
import httpx
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("auth-service")

from fastapi import FastAPI, Depends, HTTPException, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy import or_
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import User, TokenBlacklist, RefreshToken, EmailVerification, PasswordReset, DeleteAccountOTP
from schemas import (
    SignupRequest, LoginRequest, AdminSignupRequest,
    RefreshRequest, LogoutRequest, ForgotPasswordRequest, ResetPasswordRequest,
    OnboardingUpdateRequest, ProfileUpdateRequest, ConfirmDeleteAccount,
)
from utils import hash_password, verify, create_token, generate_opaque_token, hash_token, SECRET_KEY, ALGO

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me-in-production")
NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_URL", "http://notifications-service:8000")
REFRESH_TOKEN_EXPIRE_DAYS = 30

# ── Email config ──────────────────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER) or "no-reply@fitnessfreak.com"
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

Base.metadata.create_all(bind=engine)

# ── Safe column migrations (idempotent) ───────────────────────────────────────
def _run_migrations():
    """Add new columns to existing tables if they don't exist yet."""
    from sqlalchemy import text
    new_cols = [
        ("users", "phone",         "VARCHAR"),
        ("users", "bio",           "TEXT"),
        ("users", "date_of_birth", "DATE"),
        ("users", "gender",        "VARCHAR"),
        ("users", "height_cm",     "FLOAT"),
        ("users", "weight_kg",     "FLOAT"),
        ("users", "is_active",     "BOOLEAN DEFAULT TRUE"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in new_cols:
            try:
                conn.execute(text(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"
                ))
            except Exception as exc:
                logger.warning("Migration skipped for %s.%s: %s", table, col, exc)
        conn.commit()

_run_migrations()

bearer_scheme = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters long")
    if not re.search(r"[0-9!@#$%^&*()\-_=+\[\]{};:'\",.<>/?\\|`~]", password):
        raise HTTPException(400, "Password must contain at least one number or special character")


def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Decode token, check blacklist, return (User, payload)."""
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGO],
            options={"verify_exp": True},
        )
        jti = payload.get("jti")
        if not jti:
            raise HTTPException(401, "Invalid token")
        if db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first():
            raise HTTPException(401, "Token has been revoked")
        user = db.query(User).filter(User.id == payload["user_id"]).first()
        if not user:
            raise HTTPException(401, "User not found")
        return user, payload
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")


def _create_refresh_token(user_id: str, db: Session) -> str:
    raw, hashed = generate_opaque_token()
    rt = RefreshToken(
        token_hash=hashed,
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()
    return raw


def _send_email(to: str, subject: str, html_body: str, text_body: str):
    """Send an email via SMTP. Silently skips if SMTP_HOST is not configured."""
    if not SMTP_HOST:
        logger.warning("SMTP_HOST not set — skipping email to %s", to)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, to, msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, to, msg.as_string())
        logger.info("Email sent to %s — %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)


def _send_verification_email(email: str, token: str):
    link = f"{APP_BASE_URL}/verify-email?token={token}"
    subject = "Verify your FitnessFreak email"
    text_body = (
        f"Hi,\n\nPlease verify your email by clicking the link below:\n{link}\n\n"
        "This link expires in 24 hours.\n\nIf you did not create an account, ignore this email."
    )
    html_body = f"""
    <html><body style="font-family:sans-serif;color:#111;max-width:560px;margin:auto;padding:24px">
      <h2 style="color:#18181b">Verify your email</h2>
      <p>Thanks for signing up for <strong>FitnessFreak</strong>! Click the button below to verify your email address.</p>
      <a href="{link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#18181b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        Verify Email
      </a>
      <p style="color:#71717a;font-size:13px">This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0"/>
      <p style="color:#a1a1aa;font-size:12px">FitnessFreak &bull; {APP_BASE_URL}</p>
    </body></html>
    """
    _send_email(email, subject, html_body, text_body)


def _send_password_reset_email(email: str, token: str):
    link = f"{APP_BASE_URL}/reset-password?token={token}"
    subject = "Reset your FitnessFreak password"
    text_body = (
        f"Hi,\n\nWe received a request to reset your password. Click the link below:\n{link}\n\n"
        "This link expires in 1 hour.\n\nIf you did not request a password reset, ignore this email."
    )
    html_body = f"""
    <html><body style="font-family:sans-serif;color:#111;max-width:560px;margin:auto;padding:24px">
      <h2 style="color:#18181b">Reset your password</h2>
      <p>We received a request to reset the password for your <strong>FitnessFreak</strong> account. Click the button below to choose a new password.</p>
      <a href="{link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#18181b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        Reset Password
      </a>
      <p style="color:#71717a;font-size:13px">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0"/>
      <p style="color:#a1a1aa;font-size:12px">FitnessFreak &bull; {APP_BASE_URL}</p>
    </body></html>
    """
    _send_email(email, subject, html_body, text_body)


# ── Signup ────────────────────────────────────────────────────────────────────

@app.post("/auth/signup")
@limiter.limit("10/minute")
def signup(request: Request, body: SignupRequest, db: Session = Depends(get_db)):
    _validate_password(body.password)
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "User already exists")

    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="user",
        email_verified=False,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to create user")

    raw_ev, hashed_ev = generate_opaque_token()
    try:
        ev = EmailVerification(
            token=hashed_ev,
            user_id=user.id,
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
        db.add(ev)
        db.commit()
    except Exception:
        db.rollback()

    _send_verification_email(user.email, raw_ev)

    # Do NOT issue tokens — user must verify email before they can log in.
    response = {"message": "Account created. Please check your email to verify your account before logging in."}
    if not os.getenv("SMTP_HOST"):
        response["dev_verification_token"] = raw_ev
    return response


# ── Login ─────────────────────────────────────────────────────────────────────

@app.post("/auth/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    if user.is_active is False:
        raise HTTPException(403, "Account has been deactivated. Please contact support.")

    if not user.email_verified:
        raise HTTPException(403, "Email not verified. Please check your inbox and verify your email before logging in.")

    access_token, _ = create_token({"user_id": user.id, "name": user.name, "role": user.role})
    refresh_token = _create_refresh_token(user.id, db)

    return {
        "token": access_token,
        "refresh_token": refresh_token,
        "email_verified": True,
    }


# ── Resend Verification ───────────────────────────────────────────────────────

@app.post("/auth/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Resend a verification email. Reuses ForgotPasswordRequest (just needs email field)."""
    user = db.query(User).filter(User.email == body.email).first()

    if user and not user.email_verified:
        raw_ev, hashed_ev = generate_opaque_token()
        try:
            ev = EmailVerification(
                token=hashed_ev,
                user_id=user.id,
                expires_at=datetime.utcnow() + timedelta(hours=24),
            )
            db.add(ev)
            db.commit()
        except Exception:
            db.rollback()

        _send_verification_email(user.email, raw_ev)

        if not os.getenv("SMTP_HOST"):
            return {"message": "Verification email resent.", "dev_verification_token": raw_ev}

    # Always return the same message to avoid email enumeration
    return {"message": "If that account exists and is unverified, a new verification email has been sent."}


# ── Admin Signup ──────────────────────────────────────────────────────────────

@app.post("/auth/admin/signup")
@limiter.limit("5/minute")
def admin_signup(request: Request, body: AdminSignupRequest, db: Session = Depends(get_db)):
    """Create an admin account. Requires the admin_secret key."""
    if body.admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Invalid admin secret")

    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "User already exists")

    _validate_password(body.password)
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="admin",
        email_verified=True,
        onboarding_completed=True,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to create admin user")

    access_token, _ = create_token({"user_id": user.id, "name": user.name, "role": user.role})
    refresh_token = _create_refresh_token(user.id, db)
    return {"token": access_token, "refresh_token": refresh_token}


# ── Me ────────────────────────────────────────────────────────────────────────

@app.get("/auth/me")
def get_me(current=Depends(_get_current_user)):
    user, _ = current
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "email_verified": user.email_verified,
        "onboarding_completed": user.onboarding_completed,
        "onboarding_step": user.onboarding_step,
        "phone": user.phone,
        "bio": user.bio,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "gender": user.gender,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
    }


# ── Onboarding ────────────────────────────────────────────────────────────────

@app.put("/auth/onboarding")
def update_onboarding(
    body: OnboardingUpdateRequest,
    current=Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    user, _ = current
    user.onboarding_step = body.step
    if body.completed:
        user.onboarding_completed = True
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to update onboarding status")
    return {
        "onboarding_step": user.onboarding_step,
        "onboarding_completed": user.onboarding_completed,
    }


# ── Refresh ───────────────────────────────────────────────────────────────────

@app.post("/auth/refresh")
def refresh_token_endpoint(body: RefreshRequest, db: Session = Depends(get_db)):
    hashed = hash_token(body.refresh_token)
    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == hashed,
        RefreshToken.revoked == False,  # noqa: E712
    ).first()

    if not rt or rt.expires_at < datetime.utcnow():
        raise HTTPException(401, "Invalid or expired refresh token")

    user = db.query(User).filter(User.id == rt.user_id).first()
    if not user:
        raise HTTPException(401, "User not found")

    rt.revoked = True
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Token rotation failed")

    new_access, _ = create_token({"user_id": user.id, "name": user.name, "role": user.role})
    new_refresh = _create_refresh_token(user.id, db)
    return {"token": new_access, "refresh_token": new_refresh}


# ── Logout ────────────────────────────────────────────────────────────────────

@app.post("/auth/logout")
def logout(
    body: LogoutRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGO],
            options={"verify_exp": False},
        )
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and not db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first():
            db.add(TokenBlacklist(
                jti=jti,
                expires_at=datetime.utcfromtimestamp(exp) if exp else datetime.utcnow() + timedelta(hours=1),
            ))
    except JWTError:
        pass

    if body.refresh_token:
        hashed = hash_token(body.refresh_token)
        rt = db.query(RefreshToken).filter(RefreshToken.token_hash == hashed).first()
        if rt:
            rt.revoked = True

    try:
        db.commit()
    except Exception:
        db.rollback()

    return {"message": "Logged out successfully"}


# ── Email Verification ────────────────────────────────────────────────────────

@app.get("/auth/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    hashed = hash_token(token)
    ev = db.query(EmailVerification).filter(
        EmailVerification.token == hashed,
        EmailVerification.used == False,  # noqa: E712
    ).first()

    if not ev or ev.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired verification token")

    user = db.query(User).filter(User.id == ev.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.email_verified = True
    ev.used = True
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Verification failed")

    return {"message": "Email verified successfully"}


# ── Forgot Password ───────────────────────────────────────────────────────────

@app.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    if user:
        raw, hashed = generate_opaque_token()
        try:
            pr = PasswordReset(
                token=hashed,
                user_id=user.id,
                expires_at=datetime.utcnow() + timedelta(hours=1),
            )
            db.add(pr)
            db.commit()
        except Exception:
            db.rollback()
            return {"message": "If that email exists, a reset link has been sent"}

        _send_password_reset_email(user.email, raw)

        if not os.getenv("SMTP_HOST"):
            return {"message": "Reset token sent (check email)", "dev_reset_token": raw}

    return {"message": "If that email exists, a reset link has been sent"}


# ── Reset Password ────────────────────────────────────────────────────────────

@app.post("/auth/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    _validate_password(body.new_password)

    hashed = hash_token(body.token)
    pr = db.query(PasswordReset).filter(
        PasswordReset.token == hashed,
        PasswordReset.used == False,  # noqa: E712
    ).first()

    if not pr or pr.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired reset token")

    user = db.query(User).filter(User.id == pr.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.password_hash = hash_password(body.new_password)
    pr.used = True
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Password reset failed")

    return {"message": "Password reset successfully"}


# ── Profile Update ─────────────────────────────────────────────────────────────

@app.patch("/auth/profile")
def update_profile(
    body: ProfileUpdateRequest,
    current=Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    user, _ = current
    updated = body.dict(exclude_unset=True)
    for field, val in updated.items():
        setattr(user, field, val)
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to update profile")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "email_verified": user.email_verified,
        "onboarding_completed": user.onboarding_completed,
        "phone": user.phone,
        "bio": user.bio,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "gender": user.gender,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
    }


# ── GET /auth/me (extended) ────────────────────────────────────────────────────

# Replace the existing /auth/me with extended profile fields
@app.get("/auth/me/profile")
def get_full_profile(current=Depends(_get_current_user)):
    user, _ = current
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "email_verified": user.email_verified,
        "onboarding_completed": user.onboarding_completed,
        "phone": user.phone,
        "bio": user.bio,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "gender": user.gender,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
    }


# ── Delete Account — Request OTP ───────────────────────────────────────────────

def _send_delete_otp_email(email: str, otp: str, name: str):
    subject = "Confirm account deletion — FitnessFreak"
    text_body = (
        f"Hi {name},\n\nYour account deletion OTP is: {otp}\n\n"
        "This code expires in 120 seconds. If you did not request this, change your password immediately."
    )
    html_body = f"""
    <html><body style="font-family:sans-serif;color:#111;max-width:560px;margin:auto;padding:24px">
      <h2 style="color:#18181b">Confirm account deletion</h2>
      <p>Hi <strong>{name}</strong>, we received a request to permanently delete your FitnessFreak account.</p>
      <p>Enter this code to confirm:</p>
      <div style="margin:20px 0;padding:16px 24px;background:#f4f4f5;border-radius:8px;text-align:center">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b">{otp}</span>
      </div>
      <p style="color:#ef4444;font-weight:600">This code expires in <strong>120 seconds</strong>.</p>
      <p style="color:#71717a;font-size:13px">If you did not request this, your account is safe — but please change your password immediately.</p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0"/>
      <p style="color:#a1a1aa;font-size:12px">FitnessFreak &bull; {APP_BASE_URL}</p>
    </body></html>
    """
    _send_email(email, subject, html_body, text_body)


@app.post("/auth/delete-account/request")
@limiter.limit("3/minute")
def request_delete_account(request: Request, current=Depends(_get_current_user), db: Session = Depends(get_db)):
    user, _ = current

    # Invalidate any existing OTPs for this user
    db.query(DeleteAccountOTP).filter(
        DeleteAccountOTP.user_id == user.id,
        DeleteAccountOTP.used == False,  # noqa: E712
    ).update({"used": True})

    otp_plain = str(random.randint(100000, 999999))
    otp_hashed = hash_password(otp_plain)  # reuse bcrypt hash

    try:
        otp_record = DeleteAccountOTP(
            user_id=user.id,
            otp_hash=otp_hashed,
            expires_at=datetime.utcnow() + timedelta(seconds=120),
        )
        db.add(otp_record)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to generate OTP")

    _send_delete_otp_email(user.email, otp_plain, user.name)

    response = {"message": "OTP sent to your email. It expires in 120 seconds."}
    if not os.getenv("SMTP_HOST"):
        response["dev_otp"] = otp_plain
    return response


# ── Delete Account — Confirm ────────────────────────────────────────────────────

@app.delete("/auth/delete-account")
def confirm_delete_account(
    body: ConfirmDeleteAccount,
    current=Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    user, _ = current

    otp_record = db.query(DeleteAccountOTP).filter(
        DeleteAccountOTP.user_id == user.id,
        DeleteAccountOTP.used == False,  # noqa: E712
    ).order_by(DeleteAccountOTP.expires_at.desc()).first()

    if not otp_record or otp_record.expires_at < datetime.utcnow():
        raise HTTPException(400, "OTP has expired. Please request a new one.")

    if not verify(body.otp, otp_record.otp_hash):
        raise HTTPException(400, "Invalid OTP.")

    otp_record.used = True

    # Delete all user data
    try:
        db.query(DeleteAccountOTP).filter(DeleteAccountOTP.user_id == user.id).delete()
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
        db.query(EmailVerification).filter(EmailVerification.user_id == user.id).delete()
        db.query(PasswordReset).filter(PasswordReset.user_id == user.id).delete()
        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to delete account")

    return {"message": "Account deleted successfully"}


# ── Admin User Management ─────────────────────────────────────────────────────

def _require_admin(current=Depends(_get_current_user)):
    user, payload = current
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user, payload


def _user_to_dict(user):
    return {
        "id":                   user.id,
        "name":                 user.name,
        "email":                user.email,
        "role":                 user.role,
        "is_active":            user.is_active if user.is_active is not None else True,
        "email_verified":       user.email_verified,
        "onboarding_completed": user.onboarding_completed,
    }


@app.get("/auth/admin/users")
def list_users(
    search: Optional[str] = Query(None),
    role:   Optional[str] = Query(None),
    limit:  int           = Query(50, le=200),
    offset: int           = Query(0),
    db: Session = Depends(get_db),
    _=Depends(_require_admin),
):
    q = db.query(User)
    if search:
        q = q.filter(or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        ))
    if role:
        q = q.filter(User.role == role)
    total = q.count()
    users = q.order_by(User.name).offset(offset).limit(limit).all()
    return {
        "total": total,
        "users": [_user_to_dict(u) for u in users],
    }


@app.patch("/auth/admin/users/{user_id}/role")
def update_user_role(
    user_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current=Depends(_require_admin),
):
    admin_user, _ = current
    if user_id == admin_user.id:
        raise HTTPException(400, "Cannot change your own role")
    new_role = body.get("role")
    if new_role not in ("user", "admin", "trainer"):
        raise HTTPException(400, "Role must be 'user', 'admin', or 'trainer'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = new_role
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to update role")
    return _user_to_dict(user)


@app.patch("/auth/admin/users/{user_id}/active")
def toggle_user_active(
    user_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current=Depends(_require_admin),
):
    admin_user, _ = current
    if user_id == admin_user.id:
        raise HTTPException(400, "Cannot deactivate your own account")
    is_active = body.get("is_active")
    if not isinstance(is_active, bool):
        raise HTTPException(400, "is_active must be a boolean")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = is_active
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to update status")
    return _user_to_dict(user)


@app.post("/auth/admin/broadcast")
def broadcast_notification(
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(_require_admin),
):
    title = (body.get("title") or "").strip()
    msg_body = (body.get("body") or "").strip()
    if not title:
        raise HTTPException(400, "title is required")

    users = db.query(User).filter(
        User.is_active != False,  # noqa: E712
        User.email_verified == True,
    ).all()

    sent = 0
    secret = os.getenv("SECRET_KEY", "change-me-in-production")
    for user in users:
        try:
            httpx.post(
                f"{NOTIFICATIONS_URL}/internal/notifications",
                json={"user_id": user.id, "type": "system", "title": title, "body": msg_body or None},
                headers={"X-Internal-Secret": secret},
                timeout=5,
            )
            sent += 1
        except Exception:
            pass

    return {"sent": sent, "total_users": len(users)}


@app.get("/auth/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _=Depends(_require_admin),
):
    total_users  = db.query(User).count()
    active_users = db.query(User).filter(User.is_active != False).count()  # noqa: E712
    admin_count  = db.query(User).filter(User.role == "admin").count()
    trainer_count = db.query(User).filter(User.role == "trainer").count()
    return {
        "total_users":   total_users,
        "active_users":  active_users,
        "admin_count":   admin_count,
        "trainer_count": trainer_count,
    }
