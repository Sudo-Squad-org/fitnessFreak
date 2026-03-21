from datetime import date, timedelta
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
import os

from database import Base, engine, get_db
from models import SleepLog, MoodLog
from auth_utils import verify_token
from breathing_library import BREATHING_EXERCISES

Base.metadata.create_all(bind=engine)

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]

app = FastAPI(title="Health Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class SleepIn(BaseModel):
    date: Optional[str] = None          # ISO "YYYY-MM-DD", defaults to today
    duration_hrs: float = Field(..., ge=0.5, le=14.0)
    quality: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None


class MoodIn(BaseModel):
    date: Optional[str] = None
    mood: int = Field(..., ge=1, le=5)
    stress_level: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None


# ── Readiness formula ─────────────────────────────────────────────────────────

def _compute_readiness(duration_hrs: float, quality: int, mood: int, stress_level: int) -> float:
    """Return a readiness score 1.0–10.0."""
    # Each component normalised to 0–1
    duration_norm = min(max((duration_hrs - 4) / 5, 0.0), 1.0)   # optimal ≥9 hrs → 1.0
    quality_norm  = (quality - 1) / 4
    mood_norm     = (mood - 1) / 4
    stress_norm   = (5 - stress_level) / 4                         # low stress = high score

    raw = (quality_norm * 0.35 + duration_norm * 0.25 + mood_norm * 0.25 + stress_norm * 0.15)
    score = 1.0 + raw * 9.0
    return round(max(1.0, min(10.0, score)), 1)


def _readiness_recommendation(score: float) -> str:
    if score >= 7.5:
        return "High readiness — you're primed for a great training session today."
    if score >= 5.0:
        return "Moderate readiness — a lighter workout or brisk walk would be ideal."
    return "Low readiness — consider rest, mobility work, or a breathing exercise today."


def _log_date(date_str: Optional[str]) -> date:
    if date_str:
        return date.fromisoformat(date_str)
    return date.today()


# ── Sleep endpoints ───────────────────────────────────────────────────────────

@app.post("/health/sleep")
def log_sleep(body: SleepIn, payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    log_date = _log_date(body.date)

    existing = db.query(SleepLog).filter_by(user_id=user_id, date=log_date).first()
    if existing:
        existing.duration_hrs = body.duration_hrs
        existing.quality = body.quality
        existing.notes = body.notes
    else:
        existing = SleepLog(
            user_id=user_id,
            date=log_date,
            duration_hrs=body.duration_hrs,
            quality=body.quality,
            notes=body.notes,
        )
        db.add(existing)
    try:
        db.commit()
        db.refresh(existing)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to save sleep log.")

    return _sleep_out(existing)


@app.get("/health/sleep/today")
def get_sleep_today(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    row = db.query(SleepLog).filter_by(user_id=payload["user_id"], date=date.today()).first()
    if not row:
        raise HTTPException(404, "No sleep log for today.")
    return _sleep_out(row)


@app.get("/health/sleep")
def list_sleep(
    days: int = 14,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days - 1)
    rows = (
        db.query(SleepLog)
        .filter(SleepLog.user_id == payload["user_id"], SleepLog.date >= since)
        .order_by(SleepLog.date.asc())
        .all()
    )
    return [_sleep_out(r) for r in rows]


@app.delete("/health/sleep/{log_id}")
def delete_sleep(log_id: str, payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    row = db.query(SleepLog).filter_by(id=log_id, user_id=payload["user_id"]).first()
    if not row:
        raise HTTPException(404, "Log not found.")
    db.delete(row)
    db.commit()
    return {"message": "Deleted."}


# ── Mood endpoints ────────────────────────────────────────────────────────────

@app.post("/health/mood")
def log_mood(body: MoodIn, payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    log_date = _log_date(body.date)

    existing = db.query(MoodLog).filter_by(user_id=user_id, date=log_date).first()
    if existing:
        existing.mood = body.mood
        existing.stress_level = body.stress_level
        existing.notes = body.notes
    else:
        existing = MoodLog(
            user_id=user_id,
            date=log_date,
            mood=body.mood,
            stress_level=body.stress_level,
            notes=body.notes,
        )
        db.add(existing)
    try:
        db.commit()
        db.refresh(existing)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to save mood log.")

    return _mood_out(existing)


@app.get("/health/mood/today")
def get_mood_today(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    row = db.query(MoodLog).filter_by(user_id=payload["user_id"], date=date.today()).first()
    if not row:
        raise HTTPException(404, "No mood log for today.")
    return _mood_out(row)


@app.get("/health/mood")
def list_mood(
    days: int = 14,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days - 1)
    rows = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == payload["user_id"], MoodLog.date >= since)
        .order_by(MoodLog.date.asc())
        .all()
    )
    return [_mood_out(r) for r in rows]


@app.delete("/health/mood/{log_id}")
def delete_mood(log_id: str, payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    row = db.query(MoodLog).filter_by(id=log_id, user_id=payload["user_id"]).first()
    if not row:
        raise HTTPException(404, "Log not found.")
    db.delete(row)
    db.commit()
    return {"message": "Deleted."}


# ── Readiness endpoint ────────────────────────────────────────────────────────

@app.get("/health/readiness/today")
def readiness_today(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    today = date.today()
    sleep = db.query(SleepLog).filter_by(user_id=user_id, date=today).first()
    mood = db.query(MoodLog).filter_by(user_id=user_id, date=today).first()

    if not sleep and not mood:
        raise HTTPException(404, "No check-in logged for today.")

    # Use defaults for missing half of the check-in
    dur = sleep.duration_hrs if sleep else 7.0
    qual = sleep.quality if sleep else 3
    m = mood.mood if mood else 3
    stress = mood.stress_level if mood else 3

    score = _compute_readiness(dur, qual, m, stress)
    return {
        "date": today.isoformat(),
        "score": score,
        "recommendation": _readiness_recommendation(score),
        "breakdown": {
            "sleep_quality": qual,
            "sleep_duration_hrs": dur,
            "mood": m,
            "stress_level": stress,
        },
        "has_sleep": sleep is not None,
        "has_mood": mood is not None,
    }


@app.get("/health/readiness/history")
def readiness_history(
    days: int = 7,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    user_id = payload["user_id"]
    since = date.today() - timedelta(days=days - 1)

    sleep_rows = {
        r.date: r for r in
        db.query(SleepLog).filter(SleepLog.user_id == user_id, SleepLog.date >= since).all()
    }
    mood_rows = {
        r.date: r for r in
        db.query(MoodLog).filter(MoodLog.user_id == user_id, MoodLog.date >= since).all()
    }

    result = []
    for i in range(days):
        d = since + timedelta(days=i)
        sl = sleep_rows.get(d)
        mo = mood_rows.get(d)
        if sl or mo:
            score = _compute_readiness(
                sl.duration_hrs if sl else 7.0,
                sl.quality if sl else 3,
                mo.mood if mo else 3,
                mo.stress_level if mo else 3,
            )
            result.append({
                "date": d.isoformat(),
                "score": score,
                "sleep_duration_hrs": sl.duration_hrs if sl else None,
                "sleep_quality": sl.quality if sl else None,
                "mood": mo.mood if mo else None,
                "stress_level": mo.stress_level if mo else None,
            })

    return result


# ── Weekly summary ────────────────────────────────────────────────────────────

@app.get("/health/summary/week")
def weekly_summary(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    today = date.today()
    week_start = today - timedelta(days=6)

    sleep_rows = db.query(SleepLog).filter(
        SleepLog.user_id == user_id, SleepLog.date >= week_start
    ).all()
    mood_rows = db.query(MoodLog).filter(
        MoodLog.user_id == user_id, MoodLog.date >= week_start
    ).all()

    avg_sleep_hrs = round(sum(r.duration_hrs for r in sleep_rows) / len(sleep_rows), 1) if sleep_rows else None
    avg_quality   = round(sum(r.quality for r in sleep_rows) / len(sleep_rows), 1) if sleep_rows else None
    avg_mood      = round(sum(r.mood for r in mood_rows) / len(mood_rows), 1) if mood_rows else None
    avg_stress    = round(sum(r.stress_level for r in mood_rows) / len(mood_rows), 1) if mood_rows else None

    # Compute avg readiness over logged days
    readiness_scores = []
    all_dates = set([r.date for r in sleep_rows] + [r.date for r in mood_rows])
    sleep_map = {r.date: r for r in sleep_rows}
    mood_map  = {r.date: r for r in mood_rows}
    for d in all_dates:
        sl = sleep_map.get(d)
        mo = mood_map.get(d)
        readiness_scores.append(_compute_readiness(
            sl.duration_hrs if sl else 7.0,
            sl.quality if sl else 3,
            mo.mood if mo else 3,
            mo.stress_level if mo else 3,
        ))

    avg_readiness = round(sum(readiness_scores) / len(readiness_scores), 1) if readiness_scores else None

    # Rule-based insight
    insight = _compute_insight(avg_sleep_hrs, avg_quality, avg_mood, avg_stress, avg_readiness)

    return {
        "period": {"start": week_start.isoformat(), "end": today.isoformat()},
        "sleep_days_logged": len(sleep_rows),
        "mood_days_logged": len(mood_rows),
        "avg_sleep_hrs": avg_sleep_hrs,
        "avg_sleep_quality": avg_quality,
        "avg_mood": avg_mood,
        "avg_stress": avg_stress,
        "avg_readiness": avg_readiness,
        "insight": insight,
    }


def _compute_insight(
    avg_sleep_hrs, avg_quality, avg_mood, avg_stress, avg_readiness
) -> Optional[str]:
    if avg_readiness is None:
        return "Start logging sleep and mood daily to unlock personalized insights."

    if avg_readiness >= 7.5 and avg_sleep_hrs and avg_sleep_hrs >= 7:
        return "Strong week — high readiness driven by quality sleep. Keep this rhythm."
    if avg_sleep_hrs and avg_sleep_hrs < 6:
        return f"You averaged {avg_sleep_hrs}h of sleep this week. Even one extra hour can meaningfully lift your readiness score."
    if avg_stress and avg_stress >= 4:
        return "High stress pattern detected this week. A 4-minute breathing exercise before bed can significantly lower baseline cortisol."
    if avg_mood and avg_mood <= 2.5:
        return "Your mood has been lower this week. A short walk or breathing exercise can break the cycle — even 10 minutes helps."
    if avg_quality and avg_quality <= 2:
        return "Sleep quality is low despite the hours. Try cutting caffeine after 2 PM and keeping your room cool and dark."
    if avg_readiness and avg_readiness >= 6:
        return "Consistent check-ins this week. Your readiness trend is stable — great foundation for your training."
    return "Keep logging daily to build a clearer picture of your recovery patterns."


# ── Breathing exercises ───────────────────────────────────────────────────────

@app.get("/health/breathing")
def get_breathing_exercises(_payload: dict = Depends(verify_token)):
    return BREATHING_EXERCISES


# ── Output helpers ────────────────────────────────────────────────────────────

def _sleep_out(r: SleepLog) -> dict:
    return {
        "id": r.id,
        "date": r.date.isoformat(),
        "duration_hrs": r.duration_hrs,
        "quality": r.quality,
        "notes": r.notes,
    }


def _mood_out(r: MoodLog) -> dict:
    return {
        "id": r.id,
        "date": r.date.isoformat(),
        "mood": r.mood,
        "stress_level": r.stress_level,
        "notes": r.notes,
    }


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "health-service"}
