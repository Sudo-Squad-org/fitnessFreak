import uuid
from datetime import date, timedelta
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
from database import Base


def today_str() -> str:
    return date.today().isoformat()


class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False)
    duration_hrs = Column(Float, nullable=False)          # 1.0 – 14.0
    quality = Column(Integer, nullable=False)              # 1–5
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_sleep_user_date"),
    )


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False)
    mood = Column(Integer, nullable=False)                 # 1–5
    stress_level = Column(Integer, nullable=False)         # 1–5
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_mood_user_date"),
    )
