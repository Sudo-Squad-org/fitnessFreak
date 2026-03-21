from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class UserStatsOut(BaseModel):
    user_id: str
    total_workouts: int
    total_meals_logged: int
    current_workout_streak: int
    longest_workout_streak: int
    last_workout_date: Optional[date] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BadgeOut(BaseModel):
    id: str
    user_id: str
    badge_type: str
    earned_at: datetime
    seen: bool

    model_config = {"from_attributes": True}


class BodyMeasurementCreate(BaseModel):
    date: date
    weight_kg: Optional[float] = None
    body_fat_pct: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    biceps_cm: Optional[float] = None
    notes: Optional[str] = None


class BodyMeasurementOut(BaseModel):
    id: str
    user_id: str
    date: date
    weight_kg: Optional[float] = None
    body_fat_pct: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    biceps_cm: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# Internal event schema
class ProgressEvent(BaseModel):
    user_id: str
    event_type: str    # workout_logged | meal_logged
    date: str          # ISO date
    value: Optional[float] = None
