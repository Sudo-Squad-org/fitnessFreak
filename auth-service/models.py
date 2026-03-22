from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, Date, Text
from database import Base
import uuid
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")  # "user" | "admin" | "trainer"
    is_active = Column(Boolean, default=True, nullable=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    onboarding_step = Column(Integer, default=0, nullable=False)
    # Extended profile fields
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)   # male | female | other | prefer_not_to_say
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)


class TokenBlacklist(Base):
    """Stores revoked JWT IDs (jti claims) so they can be rejected on arrival."""
    __tablename__ = "token_blacklist"

    jti = Column(String, primary_key=True)
    expires_at = Column(DateTime, nullable=False)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    token_hash = Column(String, unique=True, nullable=False)
    user_id = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    token = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)


class PasswordReset(Base):
    __tablename__ = "password_resets"

    token = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)


class DeleteAccountOTP(Base):
    """6-digit OTP for confirming account deletion. Expires in 120 seconds."""
    __tablename__ = "delete_account_otps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
