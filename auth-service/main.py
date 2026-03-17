from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import User
from utils import hash_password, verify, create_token

app = FastAPI()
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/auth/signup")
def signup(data: dict, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data["email"]).first():
        raise HTTPException(400, "User exists")

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=hash_password(data["password"])
    )

    db.add(user)
    db.commit()

    return {"token": create_token({"user_id": user.id})}

@app.post("/auth/login")
def login(data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data["email"]).first()

    if not user or not verify(data["password"], user.password_hash):
        raise HTTPException(401, "Invalid")

    return {"token": create_token({"user_id": user.id})}
