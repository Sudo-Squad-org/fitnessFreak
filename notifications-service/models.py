import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    type = Column(String(50), nullable=False)       # badge_earned | goal_achieved | reminder | system
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationPrefs(Base):
    __tablename__ = "notification_prefs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False, unique=True, index=True)
    badge_earned = Column(Boolean, default=True)
    goal_achieved = Column(Boolean, default=True)
    reminder = Column(Boolean, default=True)
    system = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
