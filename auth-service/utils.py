from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

import hashlib

SECRET_KEY = "supersecret"
ALGO = "HS256"

pwd_context = CryptContext(schemes=["argon2"],  deprecated="auto")

def hash_password(p):
    print(f"Password in hash_password: {p}")

    return pwd_context.hash(p)

def verify(p, h):
    return pwd_context.verify(p, h)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGO)
    # python-jose may return bytes in older versions
    return token if isinstance(token, str) else token.decode("utf-8")
