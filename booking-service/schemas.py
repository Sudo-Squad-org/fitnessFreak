from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Class Schemas ---
class ClassCreate(BaseModel):
    title: str
    instructor: str
    schedule_time: datetime
    duration_minutes: int
    available_seats: int


class ClassOut(BaseModel):
    id: str
    title: str
    instructor: str
    schedule_time: datetime
    duration_minutes: int
    available_seats: int

    class Config:
        from_attributes = True


# --- Booking Schemas ---
class BookingCreate(BaseModel):
    class_id: str


class BookingOut(BaseModel):
    id: str
    user_id: str
    class_id: str
    booked_at: datetime

    class Config:
        from_attributes = True
