import os
import uuid
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from auth_utils import verify_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Progress Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_URL", "http://notifications-service:8000")

# ---------------------------------------------------------------------------
# Badge definitions (12 types)
# ---------------------------------------------------------------------------

BADGE_DEFINITIONS = {
    # Workout milestones
    "first_workout":      {"label": "First Step",        "desc": "Logged your first workout",            "icon": "🏃"},
    "workout_5":          {"label": "High Five",         "desc": "Logged 5 workouts",                    "icon": "🙏"},
    "workout_10":         {"label": "Perfect Ten",       "desc": "Logged 10 workouts",                   "icon": "💪"},
    "workout_25":         {"label": "Quarter Century",   "desc": "Logged 25 workouts",                   "icon": "🏋️"},
    "workout_50":         {"label": "Half Century",      "desc": "Logged 50 workouts",                   "icon": "🥈"},
    "workout_100":        {"label": "Centurion",         "desc": "Logged 100 workouts",                  "icon": "🏆"},
    # Streak badges
    "streak_3":           {"label": "3-Day Streak",      "desc": "Worked out 3 days in a row",           "icon": "🔥"},
    "streak_7":           {"label": "Week Warrior",      "desc": "Worked out 7 days in a row",           "icon": "⚡"},
    "streak_30":          {"label": "Monthly Master",    "desc": "Worked out 30 days in a row",          "icon": "🌟"},
    # Nutrition milestones
    "first_meal":         {"label": "Fuel Up",           "desc": "Logged your first meal",               "icon": "🥗"},
    "meal_30":            {"label": "Nutrition Ninja",   "desc": "Logged 30 meals",                      "icon": "🥦"},
    "meal_100":           {"label": "Macro Master",      "desc": "Logged 100 meals",                     "icon": "🎯"},
}


def _check_and_award_badges(db: Session, user_id: str, stats: models.UserStats):
    """Check which badges the user qualifies for and award any new ones."""
    existing = {b.badge_type for b in db.query(models.Badge).filter(models.Badge.user_id == user_id).all()}
    new_badges = []

    checks = [
        ("first_workout",  stats.total_workouts >= 1),
        ("workout_5",      stats.total_workouts >= 5),
        ("workout_10",     stats.total_workouts >= 10),
        ("workout_25",     stats.total_workouts >= 25),
        ("workout_50",     stats.total_workouts >= 50),
        ("workout_100",    stats.total_workouts >= 100),
        ("streak_3",       stats.longest_workout_streak >= 3),
        ("streak_7",       stats.longest_workout_streak >= 7),
        ("streak_30",      stats.longest_workout_streak >= 30),
        ("first_meal",     stats.total_meals_logged >= 1),
        ("meal_30",        stats.total_meals_logged >= 30),
        ("meal_100",       stats.total_meals_logged >= 100),
    ]

    for badge_type, condition in checks:
        if condition and badge_type not in existing:
            badge = models.Badge(
                id=str(uuid.uuid4()),
                user_id=user_id,
                badge_type=badge_type,
            )
            db.add(badge)
            new_badges.append(badge_type)

    if new_badges:
        db.commit()

    return new_badges


def _get_or_create_stats(db: Session, user_id: str) -> models.UserStats:
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == user_id).first()
    if not stats:
        stats = models.UserStats(id=str(uuid.uuid4()), user_id=user_id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "progress-service"}


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@app.get("/progress/stats", response_model=schemas.UserStatsOut)
def get_stats(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    return _get_or_create_stats(db, user_id)


# ---------------------------------------------------------------------------
# Badges
# ---------------------------------------------------------------------------

@app.get("/progress/badges", response_model=List[schemas.BadgeOut])
def get_badges(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    return (
        db.query(models.Badge)
        .filter(models.Badge.user_id == user_id)
        .order_by(models.Badge.earned_at.desc())
        .all()
    )


@app.get("/progress/badges/definitions")
def get_badge_definitions():
    return BADGE_DEFINITIONS


@app.patch("/progress/badges/{badge_id}/seen", response_model=schemas.BadgeOut)
def mark_badge_seen(
    badge_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    badge = db.query(models.Badge).filter(
        models.Badge.id == badge_id, models.Badge.user_id == user_id
    ).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    badge.seen = True
    db.commit()
    db.refresh(badge)
    return badge


# ---------------------------------------------------------------------------
# Body measurements
# ---------------------------------------------------------------------------

@app.post("/progress/measurements", response_model=schemas.BodyMeasurementOut, status_code=201)
def add_measurement(
    payload: schemas.BodyMeasurementCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    m = models.BodyMeasurement(
        id=str(uuid.uuid4()),
        user_id=user_id,
        **payload.dict(),
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@app.get("/progress/measurements", response_model=List[schemas.BodyMeasurementOut])
def list_measurements(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    return (
        db.query(models.BodyMeasurement)
        .filter(models.BodyMeasurement.user_id == user_id)
        .order_by(models.BodyMeasurement.date.desc())
        .all()
    )


@app.delete("/progress/measurements/{measurement_id}", status_code=204)
def delete_measurement(
    measurement_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    m = db.query(models.BodyMeasurement).filter(
        models.BodyMeasurement.id == measurement_id,
        models.BodyMeasurement.user_id == user_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found")
    db.delete(m)
    db.commit()


# ---------------------------------------------------------------------------
# Weekly report card
# ---------------------------------------------------------------------------

@app.get("/progress/weekly-report")
def weekly_report(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    stats = _get_or_create_stats(db, user_id)
    badges = db.query(models.Badge).filter(models.Badge.user_id == user_id).all()

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    measurements = (
        db.query(models.BodyMeasurement)
        .filter(
            models.BodyMeasurement.user_id == user_id,
            models.BodyMeasurement.date >= week_start,
            models.BodyMeasurement.date <= week_end,
        )
        .all()
    )

    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "total_workouts": stats.total_workouts,
        "current_streak": stats.current_workout_streak,
        "longest_streak": stats.longest_workout_streak,
        "total_meals_logged": stats.total_meals_logged,
        "badges_count": len(badges),
        "measurements_this_week": len(measurements),
        "latest_measurement": {
            "weight_kg": measurements[0].weight_kg if measurements else None,
            "body_fat_pct": measurements[0].body_fat_pct if measurements else None,
        },
    }


# ---------------------------------------------------------------------------
# Internal event endpoint (called by nutrition/workout services)
# ---------------------------------------------------------------------------

@app.post("/internal/progress/event", status_code=200)
def record_progress_event(
    payload: schemas.ProgressEvent,
    x_internal_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if x_internal_secret != SECRET_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")

    stats = _get_or_create_stats(db, payload.user_id)
    event_date = date.fromisoformat(payload.date)

    if payload.event_type == "workout_logged":
        stats.total_workouts += 1

        # Update streak
        if stats.last_workout_date:
            delta = (event_date - stats.last_workout_date).days
            if delta == 1:
                stats.current_workout_streak += 1
            elif delta > 1:
                stats.current_workout_streak = 1
            # same day: don't change streak
        else:
            stats.current_workout_streak = 1

        if stats.current_workout_streak > stats.longest_workout_streak:
            stats.longest_workout_streak = stats.current_workout_streak
        stats.last_workout_date = event_date

    elif payload.event_type == "meal_logged":
        stats.total_meals_logged += 1

    stats.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(stats)

    new_badges = _check_and_award_badges(db, payload.user_id, stats)

    # Fire-and-forget notifications for new badges
    if new_badges:
        try:
            import httpx
            for badge_type in new_badges:
                defn = BADGE_DEFINITIONS.get(badge_type, {})
                httpx.post(
                    f"{NOTIFICATIONS_URL}/internal/notifications",
                    json={
                        "user_id": payload.user_id,
                        "type": "badge_earned",
                        "title": f"Badge earned: {defn.get('label', badge_type)}",
                        "body": defn.get("desc", ""),
                    },
                    headers={"X-Internal-Secret": SECRET_KEY},
                    timeout=2.0,
                )
        except Exception:
            pass

    return {"status": "ok", "new_badges": new_badges}
