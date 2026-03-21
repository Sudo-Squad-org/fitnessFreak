import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from auth_utils import verify_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notifications Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "notifications-service"}


# ---------------------------------------------------------------------------
# User-facing notification endpoints
# ---------------------------------------------------------------------------

@app.get("/notifications", response_model=List[schemas.NotificationOut])
def list_notifications(
    unread_only: bool = False,
    limit: int = 30,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    q = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if unread_only:
        q = q.filter(models.Notification.read == False)
    return q.order_by(models.Notification.created_at.desc()).limit(limit).all()


@app.get("/notifications/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    count = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id, models.Notification.read == False)
        .count()
    )
    return {"count": count}


@app.patch("/notifications/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    n = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.read = True
    db.commit()
    db.refresh(n)
    return n


@app.post("/notifications/read-all", status_code=200)
def mark_all_read(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.read == False,
    ).update({"read": True})
    db.commit()
    return {"status": "ok"}


@app.delete("/notifications/{notification_id}", status_code=204)
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    n = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(n)
    db.commit()


# ---------------------------------------------------------------------------
# Notification preferences
# ---------------------------------------------------------------------------

@app.get("/notifications/prefs", response_model=schemas.NotificationPrefsOut)
def get_prefs(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    prefs = db.query(models.NotificationPrefs).filter(
        models.NotificationPrefs.user_id == user_id
    ).first()
    if not prefs:
        prefs = models.NotificationPrefs(id=str(uuid.uuid4()), user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


@app.patch("/notifications/prefs", response_model=schemas.NotificationPrefsOut)
def update_prefs(
    payload: schemas.NotificationPrefsUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    prefs = db.query(models.NotificationPrefs).filter(
        models.NotificationPrefs.user_id == user_id
    ).first()
    if not prefs:
        prefs = models.NotificationPrefs(id=str(uuid.uuid4()), user_id=user_id)
        db.add(prefs)

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(prefs, field, val)
    db.commit()
    db.refresh(prefs)
    return prefs


# ---------------------------------------------------------------------------
# Internal create endpoint (called by other services)
# ---------------------------------------------------------------------------

@app.post("/internal/notifications", status_code=201)
def create_notification_internal(
    payload: schemas.NotificationCreate,
    x_internal_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if x_internal_secret != SECRET_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Check user prefs
    prefs = db.query(models.NotificationPrefs).filter(
        models.NotificationPrefs.user_id == payload.user_id
    ).first()

    if prefs:
        pref_field = payload.type  # e.g. "badge_earned"
        if hasattr(prefs, pref_field) and not getattr(prefs, pref_field):
            return {"status": "skipped", "reason": "user preference off"}

    n = models.Notification(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        type=payload.type,
        title=payload.title,
        body=payload.body,
    )
    db.add(n)
    db.commit()
    return {"status": "ok", "id": n.id}
