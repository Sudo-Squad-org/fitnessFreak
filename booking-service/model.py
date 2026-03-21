from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.sql import func
from database import Base
import uuid


class Class(Base):
    __tablename__ = "classes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # cult.fit style categorization
    category = Column(String, nullable=False, default="hiit")
    # yoga | hiit | dance | boxing | strength | cardio | mindfulness | cycling | pilates | functional

    difficulty = Column(String, nullable=False, default="beginner")
    # beginner | intermediate | advanced

    class_type = Column(String, nullable=False, default="live_online")
    # live_online | on_demand | in_person

    instructor_name = Column(String, nullable=False)
    instructor_bio = Column(Text, nullable=True)

    duration_minutes = Column(Integer, nullable=False)
    schedule_time = Column(DateTime, nullable=False)
    max_seats = Column(Integer, nullable=False, default=20)
    available_seats = Column(Integer, nullable=False)

    status = Column(String, nullable=False, default="upcoming")
    # upcoming | live | completed | cancelled

    created_at = Column(DateTime, server_default=func.now())


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    class_id = Column(String, nullable=False, index=True)
    booked_at = Column(DateTime, server_default=func.now())
    status = Column(String, nullable=False, default="confirmed")
    # confirmed | cancelled


class Waitlist(Base):
    """Users who joined the waitlist for a fully-booked class."""
    __tablename__ = "waitlist"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    class_id = Column(String, nullable=False, index=True)
    joined_at = Column(DateTime, server_default=func.now())
    status = Column(String, nullable=False, default="waiting")
    # waiting | confirmed | cancelled
