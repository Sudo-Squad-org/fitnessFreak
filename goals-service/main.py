import os
import uuid
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler

import models
import schemas
from database import engine, get_db, SessionLocal
from auth_utils import verify_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Goals Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_week_start(d: date) -> date:
    """Return the Monday of the week containing `d`."""
    return d - timedelta(days=d.weekday())


def _week_total(db: Session, goal_id: str, week_start: date) -> float:
    week_end = week_start + timedelta(days=6)
    logs = (
        db.query(models.GoalLog)
        .filter(
            models.GoalLog.goal_id == goal_id,
            models.GoalLog.date >= week_start,
            models.GoalLog.date <= week_end,
        )
        .all()
    )
    return sum(l.value for l in logs)


def _auto_adjust_goals():
    """
    Every Sunday: review each user's active goals.
    If last week's total > max_target  → increase min/max by 10 %
    If last week's total < min_target  → decrease min/max by 10 % (floor 1)
    """
    db = SessionLocal()
    try:
        today = date.today()
        last_week_start = _get_week_start(today) - timedelta(weeks=1)

        goals = db.query(models.Goal).filter(models.Goal.status == "active").all()
        for goal in goals:
            if goal.period != "weekly":
                continue
            total = _week_total(db, goal.id, last_week_start)
            if total > goal.max_target:
                goal.min_target = round(goal.min_target * 1.10, 2)
                goal.max_target = round(goal.max_target * 1.10, 2)
            elif total < goal.min_target and total > 0:
                goal.min_target = max(1.0, round(goal.min_target * 0.90, 2))
                goal.max_target = max(1.0, round(goal.max_target * 0.90, 2))
        db.commit()
    except Exception as e:
        print(f"[auto-adjust] error: {e}")
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(_auto_adjust_goals, "cron", day_of_week="sun", hour=0, minute=0)
scheduler.start()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "goals-service"}


# ---------------------------------------------------------------------------
# Goals CRUD
# ---------------------------------------------------------------------------

@app.post("/goals", response_model=schemas.GoalOut, status_code=201)
def create_goal(
    payload: schemas.GoalCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    goal = models.Goal(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=payload.type,
        min_target=payload.min_target,
        max_target=payload.max_target,
        period=payload.period,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@app.get("/goals", response_model=List[schemas.GoalOut])
def list_goals(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    q = db.query(models.Goal).filter(models.Goal.user_id == user_id)
    if status_filter:
        q = q.filter(models.Goal.status == status_filter)
    return q.order_by(models.Goal.created_at.desc()).all()


@app.get("/goals/{goal_id}", response_model=schemas.GoalOut)
def get_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id, models.Goal.user_id == user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@app.patch("/goals/{goal_id}", response_model=schemas.GoalOut)
def update_goal(
    goal_id: str,
    payload: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id, models.Goal.user_id == user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(goal, field, val)
    goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(goal)
    return goal


@app.delete("/goals/{goal_id}", status_code=204)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id, models.Goal.user_id == user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()


# ---------------------------------------------------------------------------
# Goal Logs
# ---------------------------------------------------------------------------

@app.post("/goals/logs", response_model=schemas.GoalLogOut, status_code=201)
def add_log(
    payload: schemas.GoalLogCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    goal = db.query(models.Goal).filter(
        models.Goal.id == payload.goal_id, models.Goal.user_id == user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    log = models.GoalLog(
        id=str(uuid.uuid4()),
        goal_id=payload.goal_id,
        date=payload.date,
        value=payload.value,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@app.get("/goals/{goal_id}/logs", response_model=List[schemas.GoalLogOut])
def get_logs(
    goal_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id, models.Goal.user_id == user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal.logs


# ---------------------------------------------------------------------------
# Weekly summary (for frontend dashboard)
# ---------------------------------------------------------------------------

@app.get("/goals/summary/week")
def weekly_summary(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    today = date.today()
    week_start = _get_week_start(today)

    goals = db.query(models.Goal).filter(
        models.Goal.user_id == user_id,
        models.Goal.status == "active",
    ).all()

    result = []
    for goal in goals:
        total = _week_total(db, goal.id, week_start)
        pct = min((total / goal.max_target) * 100, 100) if goal.max_target > 0 else 0
        on_track = goal.min_target <= total <= goal.max_target
        result.append({
            "goal_id": goal.id,
            "type": goal.type,
            "min_target": goal.min_target,
            "max_target": goal.max_target,
            "current": round(total, 2),
            "pct": round(pct, 1),
            "on_track": on_track,
            "period": goal.period,
        })
    return result


# ---------------------------------------------------------------------------
# Internal event endpoint (called by nutrition/workout services)
# ---------------------------------------------------------------------------

@app.post("/internal/goals/event", status_code=200)
def record_event(
    payload: schemas.GoalProgressEvent,
    x_internal_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if x_internal_secret != SECRET_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")

    event_to_goal_type = {
        "meal_logged": "meals",
        "workout_logged": "workouts",
        "calories_logged": "calories",
    }
    goal_type = event_to_goal_type.get(payload.event_type)
    if not goal_type:
        return {"status": "ignored", "reason": "unknown event_type"}

    goals = db.query(models.Goal).filter(
        models.Goal.user_id == payload.user_id,
        models.Goal.type == goal_type,
        models.Goal.status == "active",
    ).all()

    log_date = date.fromisoformat(payload.date)
    for goal in goals:
        log = models.GoalLog(
            id=str(uuid.uuid4()),
            goal_id=goal.id,
            date=log_date,
            value=payload.value,
        )
        db.add(log)
    db.commit()
    return {"status": "ok", "goals_updated": len(goals)}


# ---------------------------------------------------------------------------
# Goal suggestions (simple rule-based)
# ---------------------------------------------------------------------------

@app.get("/goals/suggestions", response_model=List[schemas.GoalSuggestionOut])
def get_suggestions(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    suggestions = (
        db.query(models.GoalSuggestion)
        .filter(models.GoalSuggestion.user_id == user_id)
        .order_by(models.GoalSuggestion.created_at.desc())
        .limit(10)
        .all()
    )
    return suggestions
