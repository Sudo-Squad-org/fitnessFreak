import os
import secrets
import hashlib
import uuid
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGO = "HS256"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(p):
    return pwd_context.hash(p)


def verify(p, h):
    return pwd_context.verify(p, h)


def create_token(data: dict, expires_hours: int = 1) -> tuple:
    """Returns (token_string, jti). Each token gets a unique jti for revocation."""
    payload = data.copy()
    jti = str(uuid.uuid4())
    payload["jti"] = jti
    payload["exp"] = datetime.utcnow() + timedelta(hours=expires_hours)
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGO)
    token_str = token if isinstance(token, str) else token.decode("utf-8")
    return token_str, jti


def generate_opaque_token() -> tuple:
    """Returns (raw_token, hashed_token). Store the hash in DB, give raw to client."""
    raw = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
