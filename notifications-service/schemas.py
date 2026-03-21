from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: Optional[str] = None
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationPrefsOut(BaseModel):
    user_id: str
    badge_earned: bool
    goal_achieved: bool
    reminder: bool
    system: bool

    model_config = {"from_attributes": True}


class NotificationPrefsUpdate(BaseModel):
    badge_earned: Optional[bool] = None
    goal_achieved: Optional[bool] = None
    reminder: Optional[bool] = None
    system: Optional[bool] = None


# Internal create schema (called by other services)
class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    body: Optional[str] = None
