from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from database import Base, engine, SessionLocal
from model import Class, Booking
from schemas import ClassCreate, ClassOut, ClassUpdate
from auth_utils import verify_token, require_admin

app = FastAPI()
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Dev Seed ──────────────────────────────────────────────────────────────────

@app.post("/seed")
def seed_classes(db: Session = Depends(get_db)):
    """Populate with sample cult.fit-style classes (idempotent)."""
    if db.query(Class).count() > 0:
        return {"message": "Already seeded"}

    now = datetime.utcnow()
    samples = [
        Class(id=str(uuid.uuid4()), title="Morning Yoga Flow",
              description="Start your day with a calming yoga session focused on flexibility and mindfulness.",
              category="yoga", difficulty="beginner", class_type="live_online",
              instructor_name="Priya Sharma", instructor_bio="500-hour certified yoga instructor with 8 years of experience.",
              duration_minutes=60, schedule_time=now + timedelta(days=1, hours=7),
              max_seats=20, available_seats=15, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="HIIT Blast",
              description="High-intensity interval training designed to maximize calorie burn in minimum time.",
              category="hiit", difficulty="advanced", class_type="live_online",
              instructor_name="Arjun Mehta", instructor_bio="CrossFit Level 2 trainer and ex-national athlete.",
              duration_minutes=45, schedule_time=now + timedelta(days=1, hours=9),
              max_seats=25, available_seats=20, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Strength & Conditioning",
              description="Build functional strength with compound movements and progressive overload principles.",
              category="strength", difficulty="intermediate", class_type="live_online",
              instructor_name="Rohan Verma", instructor_bio="Certified strength and conditioning specialist (CSCS).",
              duration_minutes=60, schedule_time=now + timedelta(days=2, hours=8),
              max_seats=15, available_seats=12, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Zumba Dance Fitness",
              description="An exhilarating dance fitness party combining Latin and world rhythms.",
              category="dance", difficulty="beginner", class_type="live_online",
              instructor_name="Neha Kapoor", instructor_bio="Licensed Zumba instructor and professional dancer.",
              duration_minutes=50, schedule_time=now + timedelta(days=2, hours=18),
              max_seats=30, available_seats=25, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Pilates Core",
              description="Precision Pilates exercises targeting core stability and postural alignment.",
              category="pilates", difficulty="intermediate", class_type="on_demand",
              instructor_name="Ananya Singh", instructor_bio="Stott Pilates certified instructor with 6 years experience.",
              duration_minutes=45, schedule_time=now + timedelta(days=3, hours=7, minutes=30),
              max_seats=12, available_seats=10, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Kickboxing Cardio",
              description="Combine martial arts techniques with heart-pumping cardio for the ultimate total-body workout.",
              category="boxing", difficulty="intermediate", class_type="live_online",
              instructor_name="Vikram Nair", instructor_bio="Former state-level kickboxer, certified fitness trainer.",
              duration_minutes=60, schedule_time=now + timedelta(days=3, hours=17),
              max_seats=20, available_seats=18, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Power Cycling",
              description="High-energy indoor cycling session with interval training and resistance challenges.",
              category="cycling", difficulty="advanced", class_type="in_person",
              instructor_name="Kavita Reddy", instructor_bio="Spinning certified instructor, marathon runner.",
              duration_minutes=45, schedule_time=now + timedelta(days=4, hours=6, minutes=30),
              max_seats=10, available_seats=4, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Meditation & Breathwork",
              description="Guided meditation and pranayama techniques for stress relief and mental clarity.",
              category="mindfulness", difficulty="beginner", class_type="on_demand",
              instructor_name="Sunita Joshi", instructor_bio="Mindfulness coach and certified meditation teacher.",
              duration_minutes=30, schedule_time=now + timedelta(days=4, hours=20),
              max_seats=50, available_seats=45, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Cardio Burn",
              description="Non-stop cardio combinations to elevate your heart rate and torch calories.",
              category="cardio", difficulty="intermediate", class_type="live_online",
              instructor_name="Rahul Gupta", instructor_bio="Sports science graduate with 5 years of group fitness experience.",
              duration_minutes=40, schedule_time=now + timedelta(days=5, hours=8),
              max_seats=30, available_seats=22, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Functional Training",
              description="Movement-based training that mimics real-life activities for strength, balance and coordination.",
              category="functional", difficulty="intermediate", class_type="in_person",
              instructor_name="Deepak Sharma", instructor_bio="FMS certified functional movement specialist.",
              duration_minutes=55, schedule_time=now + timedelta(days=5, hours=11),
              max_seats=15, available_seats=11, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Advanced Boxing",
              description="Sharpen your boxing technique with combination drills, shadowboxing and heavy bag work.",
              category="boxing", difficulty="advanced", class_type="in_person",
              instructor_name="Kiran Patel", instructor_bio="Amateur boxing champion, certified boxing coach.",
              duration_minutes=60, schedule_time=now + timedelta(days=6, hours=7),
              max_seats=12, available_seats=4, status="upcoming"),

        Class(id=str(uuid.uuid4()), title="Gentle Yoga for Beginners",
              description="A gentle introduction to yoga with basic poses, breathing and relaxation techniques.",
              category="yoga", difficulty="beginner", class_type="on_demand",
              instructor_name="Priya Sharma", instructor_bio="500-hour certified yoga instructor with 8 years of experience.",
              duration_minutes=45, schedule_time=now + timedelta(days=6, hours=9),
              max_seats=25, available_seats=20, status="upcoming"),
    ]

    db.add_all(samples)
    db.commit()
    return {"message": f"Seeded {len(samples)} classes"}


# ── Classes (Public Read) ─────────────────────────────────────────────────────

@app.get("/classes", response_model=List[ClassOut])
def get_classes(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    class_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Class)
    if category:
        query = query.filter(Class.category == category)
    if difficulty:
        query = query.filter(Class.difficulty == difficulty)
    if class_type:
        query = query.filter(Class.class_type == class_type)
    if status:
        query = query.filter(Class.status == status)
    if search:
        term = f"%{search}%"
        query = query.filter(
            Class.title.ilike(term) | Class.instructor_name.ilike(term)
        )
    return query.order_by(Class.schedule_time).all()


@app.get("/classes/{class_id}", response_model=ClassOut)
def get_class(class_id: str, db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Class not found")
    return cls


# ── Classes (Admin Write) ─────────────────────────────────────────────────────

@app.post("/classes", response_model=ClassOut)
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    payload=Depends(require_admin),
):
    cls = Class(id=str(uuid.uuid4()), **data.dict())
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls


@app.put("/classes/{class_id}", response_model=ClassOut)
def update_class(
    class_id: str,
    data: ClassUpdate,
    db: Session = Depends(get_db),
    payload=Depends(require_admin),
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Class not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(cls, field, value)
    db.commit()
    db.refresh(cls)
    return cls


@app.delete("/classes/{class_id}")
def delete_class(
    class_id: str,
    db: Session = Depends(get_db),
    payload=Depends(require_admin),
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Class not found")
    db.delete(cls)
    db.commit()
    return {"message": "Class deleted"}


@app.get("/classes/{class_id}/bookings")
def get_class_bookings(
    class_id: str,
    db: Session = Depends(get_db),
    payload=Depends(require_admin),
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Class not found")
    bookings = (
        db.query(Booking)
        .filter(Booking.class_id == class_id, Booking.status == "confirmed")
        .all()
    )
    return {
        "class_title": cls.title,
        "total_booked": len(bookings),
        "max_seats": cls.max_seats,
        "bookings": [
            {"id": b.id, "user_id": b.user_id, "booked_at": b.booked_at}
            for b in bookings
        ],
    }


# ── Bookings ──────────────────────────────────────────────────────────────────

@app.post("/bookings")
def book(
    data: dict,
    db: Session = Depends(get_db),
    payload=Depends(verify_token),
):
    user_id = payload["user_id"]
    class_id = data.get("classId")

    if not class_id:
        raise HTTPException(400, "classId is required")

    cls = db.query(Class).filter(Class.id == class_id).with_for_update().first()
    if not cls:
        raise HTTPException(404, "Class not found")
    if cls.status == "cancelled":
        raise HTTPException(400, "This class has been cancelled")
    if cls.status == "completed":
        raise HTTPException(400, "This class has already ended")
    if cls.available_seats <= 0:
        raise HTTPException(400, "No seats available for this class")

    existing = (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id,
            Booking.class_id == class_id,
            Booking.status == "confirmed",
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "You have already booked this class")

    cls.available_seats -= 1
    booking = Booking(
        id=str(uuid.uuid4()),
        user_id=user_id,
        class_id=class_id,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    return {"message": "Booked successfully", "booking_id": booking.id}


@app.delete("/bookings/{booking_id}")
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    payload=Depends(verify_token),
):
    user_id = payload["user_id"]
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == user_id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(400, "Booking is already cancelled")

    # Restore seat count
    cls = db.query(Class).filter(Class.id == booking.class_id).first()
    if cls and cls.status in ("upcoming", "live"):
        cls.available_seats = min(cls.available_seats + 1, cls.max_seats)

    booking.status = "cancelled"
    db.commit()
    return {"message": "Booking cancelled successfully"}


@app.get("/bookings/my")
def get_my_bookings(
    db: Session = Depends(get_db),
    payload=Depends(verify_token),
):
    user_id = payload["user_id"]
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user_id, Booking.status == "confirmed")
        .order_by(Booking.booked_at.desc())
        .all()
    )

    enriched = []
    for b in bookings:
        cls = db.query(Class).filter(Class.id == b.class_id).first()
        enriched.append({
            "id": b.id,
            "user_id": b.user_id,
            "booked_at": b.booked_at,
            "status": b.status,
            "class_info": {
                "id": cls.id,
                "title": cls.title,
                "description": cls.description,
                "category": cls.category,
                "difficulty": cls.difficulty,
                "class_type": cls.class_type,
                "instructor_name": cls.instructor_name,
                "duration_minutes": cls.duration_minutes,
                "schedule_time": cls.schedule_time,
                "max_seats": cls.max_seats,
                "available_seats": cls.available_seats,
                "status": cls.status,
            } if cls else None,
        })

    return enriched
