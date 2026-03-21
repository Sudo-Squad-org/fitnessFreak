from sqlalchemy import Column, Integer, String, JSON, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from database import Base
from datetime import date, timedelta
import uuid


def current_week_start() -> str:
    """Return the ISO date string for the Monday of the current week."""
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    goal = Column(String, nullable=False)
    activity_level = Column(String, nullable=False)
    health_conditions = Column(String, nullable=True)   # comma-separated
    plan_json = Column(JSON, nullable=False)            # full plan response
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class WorkoutLog(Base):
    """Records each completed workout session."""
    __tablename__ = "workout_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    day_title = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    logged_at = Column(DateTime, server_default=func.now())


class WorkoutDayProgress(Base):
    """Tracks per-exercise completion for a user per day per week.
    Completions are stored as a JSON list of exercise IDs.
    Resets automatically each week via the week_start date column.
    """
    __tablename__ = "workout_day_progress"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    plan_id = Column(String, nullable=False)
    day_number = Column(Integer, nullable=False)        # 1–4
    week_start = Column(String, nullable=False)         # ISO date "YYYY-MM-DD" (Monday)
    completed_exercise_ids = Column(JSON, nullable=False, default=list)
    completed_at = Column(DateTime, nullable=True)   # set once when day first fully completed
    updated_at = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        UniqueConstraint(
            "user_id", "plan_id", "day_number", "week_start",
            name="uq_user_plan_day_week",
        ),
    )
