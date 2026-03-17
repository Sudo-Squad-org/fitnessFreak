from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import Base, engine, SessionLocal
from models import Class, Booking

app = FastAPI()
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/bookings")
def book(data: dict, db: Session = Depends(get_db)):

    cls = db.query(Class).filter(Class.id == data["classId"]).with_for_update().first()

    if cls.available_seats <= 0:
        raise HTTPException(400, "No seats")

    cls.available_seats -= 1

    booking = Booking(
        user_id=data["userId"],
        class_id=data["classId"]
    )

    db.add(booking)
    db.commit()

    return {"message": "Booked"}
