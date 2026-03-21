import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    type = Column(String(50), nullable=False)          # workouts, meals, steps, sleep_hrs, calories
    min_target = Column(Float, nullable=False)
    max_target = Column(Float, nullable=False)
    period = Column(String(20), default="weekly")      # weekly, daily
    status = Column(String(20), default="active")      # active, paused, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = relationship("GoalLog", back_populates="goal", cascade="all, delete-orphan")


class GoalLog(Base):
    __tablename__ = "goal_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    goal_id = Column(String(36), ForeignKey("goals.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, default=date.today)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="logs")


class GoalSuggestion(Base):
    __tablename__ = "goal_suggestions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    goal_type = Column(String(50), nullable=False)
    suggested_min = Column(Float, nullable=False)
    suggested_max = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
