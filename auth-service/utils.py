from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

import hashlib

SECRET_KEY = "supersecret"
ALGO = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"],  deprecated="auto")

def hash_password(p):
    if len(p.encode("utf-8")) > 72:
        raise ValueError("Password too long (max 72 bytes)")
    return pwd_context.hash(p)
    #return pwd_context.hash(p[:72])
    # Pre-hash to avoid 72 byte limit
    # sha = hashlib.sha256(p.encode()).hexdigest()
    # return pwd_context.hash(sha)

def verify(p, h):
    return pwd_context.verify(p, h)

def create_token(data: dict):
    data["exp"] = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode(data, SECRET_KEY, algorithm=ALGO)
