from pydantic import BaseModel, model_validator
from typing import Optional, List
from datetime import datetime


class ClassCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "hiit"
    difficulty: str = "beginner"
    class_type: str = "live_online"
    instructor_name: str
    instructor_bio: Optional[str] = None
    duration_minutes: int
    schedule_time: datetime
    max_seats: int
    available_seats: int
    status: str = "upcoming"

    @model_validator(mode="after")
    def check_available_seats(self):
        if self.available_seats > self.max_seats:
            raise ValueError("available_seats cannot exceed max_seats")
        return self


class ClassUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    class_type: Optional[str] = None
    instructor_name: Optional[str] = None
    instructor_bio: Optional[str] = None
    duration_minutes: Optional[int] = None
    schedule_time: Optional[datetime] = None
    max_seats: Optional[int] = None
    available_seats: Optional[int] = None
    status: Optional[str] = None


class ClassOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    difficulty: str
    class_type: str
    instructor_name: str
    instructor_bio: Optional[str] = None
    duration_minutes: int
    schedule_time: datetime
    max_seats: int
    available_seats: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BookingOut(BaseModel):
    id: str
    user_id: str
    class_id: str
    booked_at: datetime
    status: str

    class Config:
        from_attributes = True
