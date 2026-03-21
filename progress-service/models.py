import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, Date, DateTime, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserStats(Base):
    """Aggregated stats per user, updated on each relevant event."""
    __tablename__ = "user_stats"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False, unique=True, index=True)
    total_workouts = Column(Integer, default=0)
    total_meals_logged = Column(Integer, default=0)
    current_workout_streak = Column(Integer, default=0)
    longest_workout_streak = Column(Integer, default=0)
    last_workout_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Badge(Base):
    __tablename__ = "badges"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    badge_type = Column(String(50), nullable=False)   # see BADGE_DEFINITIONS
    earned_at = Column(DateTime, default=datetime.utcnow)
    seen = Column(Boolean, default=False)


class BodyMeasurement(Base):
    __tablename__ = "body_measurements"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    date = Column(Date, nullable=False, default=date.today)
    weight_kg = Column(Float, nullable=True)
    body_fat_pct = Column(Float, nullable=True)
    chest_cm = Column(Float, nullable=True)
    waist_cm = Column(Float, nullable=True)
    hips_cm = Column(Float, nullable=True)
    biceps_cm = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
