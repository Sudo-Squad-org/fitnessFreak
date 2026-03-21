from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import date, datetime


class GoalCreate(BaseModel):
    type: str = Field(..., description="workouts | meals | steps | sleep_hrs | calories")
    min_target: float = Field(..., gt=0)
    max_target: float = Field(..., gt=0)
    period: str = Field("weekly", description="weekly | daily")

    @field_validator("type")
    @classmethod
    def valid_type(cls, v):
        allowed = {"workouts", "meals", "steps", "sleep_hrs", "calories"}
        if v not in allowed:
            raise ValueError(f"type must be one of {allowed}")
        return v

    @field_validator("period")
    @classmethod
    def valid_period(cls, v):
        if v not in {"weekly", "daily"}:
            raise ValueError("period must be 'weekly' or 'daily'")
        return v

    @model_validator(mode="after")
    def max_gte_min(self):
        if self.max_target < self.min_target:
            raise ValueError("max_target must be >= min_target")
        return self


class GoalUpdate(BaseModel):
    min_target: Optional[float] = Field(None, gt=0)
    max_target: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None
    period: Optional[str] = None


class GoalLogCreate(BaseModel):
    goal_id: str
    date: date
    value: float = Field(..., gt=0)


class GoalLogOut(BaseModel):
    id: str
    goal_id: str
    date: date
    value: float
    created_at: datetime

    model_config = {"from_attributes": True}


class GoalOut(BaseModel):
    id: str
    user_id: str
    type: str
    min_target: float
    max_target: float
    period: str
    status: str
    created_at: datetime
    updated_at: datetime
    logs: List[GoalLogOut] = []

    model_config = {"from_attributes": True}


class GoalSuggestionOut(BaseModel):
    id: str
    user_id: str
    goal_type: str
    suggested_min: float
    suggested_max: float
    reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# Internal event schema (from nutrition/workout services)
class GoalProgressEvent(BaseModel):
    user_id: str
    event_type: str    # "meal_logged" | "workout_logged"
    value: float
    date: str          # ISO date string
