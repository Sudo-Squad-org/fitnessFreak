import os
import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from typing import List, Optional
from auth_utils import verify_token
from database import get_db
from models import WorkoutPlan, WorkoutLog, WorkoutDayProgress, current_week_start
from exercise_library import EXERCISES

router = APIRouter()
bearer_scheme = HTTPBearer()

ALLOWED_HEALTH_CONDITIONS = {
    "diabetes", "hypertension", "high_cholesterol",
    "hypothyroidism", "pcos", "heart_disease",
}


# ── Pydantic models ───────────────────────────────────────────────────────────

class WorkoutPlanRequest(BaseModel):
    goal: str = Field("maintain", pattern="^(maintain|weight_loss|muscle_gain)$")
    activity_level: str = Field(
        "moderately_active",
        pattern="^(sedentary|lightly_active|moderately_active|very_active|extra_active)$",
    )
    age: int | None = None
    health_conditions: List[str] = Field(default_factory=list)

    @field_validator("health_conditions")
    @classmethod
    def validate_health_conditions(cls, v):
        if v:
            invalid = set(v) - ALLOWED_HEALTH_CONDITIONS
            if invalid:
                raise ValueError(f"Unknown health condition(s): {invalid}. Allowed: {ALLOWED_HEALTH_CONDITIONS}")
        return v


class WorkoutLogRequest(BaseModel):
    day_title: str
    duration_minutes: int | None = None


class ToggleExerciseRequest(BaseModel):
    day_number: int = Field(..., ge=1, le=4)
    exercise_id: str


# ── Plan helpers ──────────────────────────────────────────────────────────────

def _goal_focus(goal: str) -> list[str]:
    return {
        "weight_loss": ["Zone 2 cardio", "Full-body strength", "Calorie deficit support"],
        "muscle_gain": ["Progressive overload", "Compound lifts", "Hypertrophy volume"],
        "maintain": ["Balanced strength", "Cardio health", "Mobility"],
    }.get(goal, ["Balanced strength", "Cardio health", "Mobility"])


def _condition_overrides(conditions: list[str]) -> dict:
    notes = []
    avoid = []
    intensity = "moderate"
    cardio_minutes = "20-30"

    for condition in conditions:
        if condition == "diabetes":
            notes.append("Use regular walking or cycling sessions to support steady blood sugar control.")
            avoid.append("Very long fasted HIIT sessions")
            cardio_minutes = "25-35"
        elif condition == "hypertension":
            notes.append("Keep effort controlled and focus on breathing during strength work.")
            avoid.append("Heavy straining or breath-holding during lifts")
            intensity = "low to moderate"
        elif condition == "high_cholesterol":
            notes.append("Increase weekly cardio volume through brisk walking, cycling, or rowing.")
            cardio_minutes = "30-40"
        elif condition == "heart_disease":
            notes.append("Choose low-impact exercise and progress conservatively with medical clearance.")
            avoid.append("Unsupervised maximal-intensity workouts")
            intensity = "low"
            cardio_minutes = "15-25"
        elif condition == "pcos":
            notes.append("Pair steady cardio with strength work to support recovery and consistency.")
        elif condition == "hypothyroidism":
            notes.append("Build routines around manageable sessions and strong recovery habits.")
            intensity = "low to moderate"

    return {
        "notes": notes,
        "avoid": avoid,
        "intensity": intensity,
        "cardio_minutes": cardio_minutes,
    }


def _make_exercise(ex_id: str, sets_reps: str) -> dict:
    """Look up an exercise from the library and return a structured object."""
    ex = EXERCISES[ex_id]
    return {
        "id": ex_id,
        "name": ex["name"],
        "muscle_group": ex["muscle_group"],
        "sets_reps": sets_reps,
        "how_to": ex["how_to"],
    }


def _sets(activity_level: str, low: str, mid: str, high: str) -> str:
    """Return sets_reps string scaled to activity level."""
    if activity_level in ("sedentary", "lightly_active"):
        return low
    if activity_level == "moderately_active":
        return mid
    return high  # very_active, extra_active


def _build_weekly_plan(goal: str, activity_level: str, conditions: list[str]) -> list[dict]:
    """Always returns exactly 4 structured workout days."""
    s = activity_level  # shorthand for _sets calls

    if goal == "weight_loss":
        return [
            {
                "day": "Day 1",
                "day_number": 1,
                "title": "Lower Body Strength",
                "duration": "40-50 min",
                "muscle_focus": "Quads, Hamstrings, Glutes",
                "exercises": [
                    _make_exercise("ex_goblet_01",   _sets(s, "3×12", "4×10", "4×10")),
                    _make_exercise("ex_rdl_01",      _sets(s, "3×12", "4×10", "4×10")),
                    _make_exercise("ex_legpress_01", _sets(s, "3×12", "3×12", "4×12")),
                    _make_exercise("ex_hipthrust_01",_sets(s, "3×15", "3×15", "4×12")),
                    _make_exercise("ex_lunge_01",    _sets(s, "2×10", "3×10", "3×12")),
                    _make_exercise("ex_calfrise_01", _sets(s, "3×15", "3×20", "4×20")),
                ],
            },
            {
                "day": "Day 2",
                "day_number": 2,
                "title": "Cardio + Core",
                "duration": "35-45 min",
                "muscle_focus": "Core, Cardio",
                "exercises": [
                    _make_exercise("ex_brwalk_01",  "20-30 min"),
                    _make_exercise("ex_jjack_01",   _sets(s, "3×30s", "3×45s", "4×45s")),
                    _make_exercise("ex_mtclimb_01", _sets(s, "3×20s", "3×30s", "4×30s")),
                    _make_exercise("ex_plank_01",   _sets(s, "3×30s", "3×45s", "3×60s")),
                    _make_exercise("ex_biccrun_01", _sets(s, "3×15", "3×20", "3×25")),
                    _make_exercise("ex_legraise_01",_sets(s, "3×10", "3×12", "3×15")),
                ],
            },
            {
                "day": "Day 3",
                "day_number": 3,
                "title": "Upper Body Strength",
                "duration": "40-50 min",
                "muscle_focus": "Chest, Back, Shoulders",
                "exercises": [
                    _make_exercise("ex_pushup_01",   _sets(s, "3×12", "4×12", "4×15")),
                    _make_exercise("ex_dbrow_01",    _sets(s, "3×12", "4×10", "4×10")),
                    _make_exercise("ex_dbohpress_01",_sets(s, "3×12", "3×10", "4×10")),
                    _make_exercise("ex_latpull_01",  _sets(s, "3×12", "3×10", "4×10")),
                    _make_exercise("ex_lateraise_01",_sets(s, "3×15", "3×15", "3×15")),
                    _make_exercise("ex_tricpush_01", _sets(s, "3×12", "3×12", "3×12")),
                ],
            },
            {
                "day": "Day 4",
                "day_number": 4,
                "title": "Full Body Fat-Burn Circuit",
                "duration": "35-45 min",
                "muscle_focus": "Full Body",
                "exercises": [
                    _make_exercise("ex_goblet_01",  _sets(s, "3×15", "4×15", "4×15")),
                    _make_exercise("ex_pushup_01",  _sets(s, "3×12", "4×12", "4×12")),
                    _make_exercise("ex_dbrow_01",   _sets(s, "3×12", "4×12", "4×12")),
                    _make_exercise("ex_jjack_01",   _sets(s, "3×30s", "4×30s", "4×45s")),
                    _make_exercise("ex_mtclimb_01", _sets(s, "3×20s", "3×30s", "4×30s")),
                    _make_exercise("ex_plank_01",   _sets(s, "3×30s", "3×45s", "3×45s")),
                ],
            },
        ]

    elif goal == "muscle_gain":
        return [
            {
                "day": "Day 1",
                "day_number": 1,
                "title": "Push — Chest, Shoulders, Triceps",
                "duration": "50-60 min",
                "muscle_focus": "Chest, Shoulders, Triceps",
                "exercises": [
                    _make_exercise("ex_bench_01",     _sets(s, "3×10", "4×8", "5×5")),
                    _make_exercise("ex_incdbpress_01",_sets(s, "3×10", "3×10", "4×10")),
                    _make_exercise("ex_ohpress_01",   _sets(s, "3×10", "3×8",  "4×8")),
                    _make_exercise("ex_cablefly_01",  _sets(s, "3×12", "3×12", "3×15")),
                    _make_exercise("ex_lateraise_01", _sets(s, "3×15", "3×15", "4×15")),
                    _make_exercise("ex_tricpush_01",  _sets(s, "3×12", "3×12", "3×12")),
                ],
            },
            {
                "day": "Day 2",
                "day_number": 2,
                "title": "Pull — Back and Biceps",
                "duration": "50-60 min",
                "muscle_focus": "Back, Biceps, Rear Delts",
                "exercises": [
                    _make_exercise("ex_deadlift_01", _sets(s, "3×6",  "4×6",  "5×5")),
                    _make_exercise("ex_pullup_01",   _sets(s, "3×6",  "4×8",  "4×8")),
                    _make_exercise("ex_bbrow_01",    _sets(s, "3×10", "4×8",  "4×8")),
                    _make_exercise("ex_cablerow_01", _sets(s, "3×12", "3×12", "3×12")),
                    _make_exercise("ex_facepull_01", _sets(s, "3×15", "3×15", "3×15")),
                    _make_exercise("ex_bpcurl_01",   _sets(s, "3×12", "3×12", "4×10")),
                    _make_exercise("ex_hammcurl_01", _sets(s, "3×12", "3×12", "3×12")),
                ],
            },
            {
                "day": "Day 3",
                "day_number": 3,
                "title": "Legs — Squat Focus",
                "duration": "50-60 min",
                "muscle_focus": "Quads, Hamstrings, Calves",
                "exercises": [
                    _make_exercise("ex_sq_01",       _sets(s, "3×8",  "4×8",  "5×5")),
                    _make_exercise("ex_legpress_01", _sets(s, "3×12", "3×12", "4×12")),
                    _make_exercise("ex_lunge_01",    _sets(s, "3×10", "3×10", "3×12")),
                    _make_exercise("ex_legcurl_01",  _sets(s, "3×12", "3×12", "3×12")),
                    _make_exercise("ex_legext_01",   _sets(s, "3×12", "3×12", "3×12")),
                    _make_exercise("ex_calfrise_01", _sets(s, "4×15", "4×20", "4×20")),
                ],
            },
            {
                "day": "Day 4",
                "day_number": 4,
                "title": "Legs — Hinge Focus + Core",
                "duration": "45-55 min",
                "muscle_focus": "Glutes, Hamstrings, Core",
                "exercises": [
                    _make_exercise("ex_rdl_01",      _sets(s, "3×10", "4×10", "4×10")),
                    _make_exercise("ex_hipthrust_01",_sets(s, "3×12", "4×12", "4×12")),
                    _make_exercise("ex_splitsq_01",  _sets(s, "3×10", "3×10", "3×12")),
                    _make_exercise("ex_stepup_01",   _sets(s, "3×10", "3×12", "3×12")),
                    _make_exercise("ex_plank_01",    _sets(s, "3×45s","3×60s","3×60s")),
                    _make_exercise("ex_deadbug_01",  _sets(s, "3×8",  "3×10", "3×10")),
                ],
            },
        ]

    else:  # maintain
        return [
            {
                "day": "Day 1",
                "day_number": 1,
                "title": "Full Body Strength A",
                "duration": "40-50 min",
                "muscle_focus": "Full Body",
                "exercises": [
                    _make_exercise("ex_sq_01",       _sets(s, "3×12", "3×10", "4×8")),
                    _make_exercise("ex_bench_01",    _sets(s, "3×12", "3×10", "4×8")),
                    _make_exercise("ex_bbrow_01",    _sets(s, "3×12", "3×10", "4×8")),
                    _make_exercise("ex_ohpress_01",  _sets(s, "3×10", "3×10", "3×8")),
                    _make_exercise("ex_plank_01",    _sets(s, "3×30s","3×45s","3×45s")),
                    _make_exercise("ex_calfrise_01", _sets(s, "3×15", "3×15", "3×15")),
                ],
            },
            {
                "day": "Day 2",
                "day_number": 2,
                "title": "Cardio + Core",
                "duration": "30-40 min",
                "muscle_focus": "Cardio, Core",
                "exercises": [
                    _make_exercise("ex_brwalk_01",  "20-30 min"),
                    _make_exercise("ex_jjack_01",   _sets(s, "3×30s", "3×45s", "3×45s")),
                    _make_exercise("ex_plank_01",   _sets(s, "3×30s", "3×45s", "3×60s")),
                    _make_exercise("ex_deadbug_01", _sets(s, "3×8",   "3×10",  "3×10")),
                    _make_exercise("ex_biccrun_01", _sets(s, "3×15",  "3×20",  "3×20")),
                    _make_exercise("ex_mtclimb_01", _sets(s, "3×20s", "3×30s", "3×30s")),
                ],
            },
            {
                "day": "Day 3",
                "day_number": 3,
                "title": "Full Body Strength B",
                "duration": "40-50 min",
                "muscle_focus": "Full Body",
                "exercises": [
                    _make_exercise("ex_deadlift_01", _sets(s, "3×8",  "3×8",  "4×6")),
                    _make_exercise("ex_dips_01",     _sets(s, "3×10", "3×12", "3×12")),
                    _make_exercise("ex_latpull_01",  _sets(s, "3×12", "3×10", "4×10")),
                    _make_exercise("ex_dbohpress_01",_sets(s, "3×10", "3×10", "3×10")),
                    _make_exercise("ex_lunge_01",    _sets(s, "3×10", "3×10", "3×10")),
                    _make_exercise("ex_deadbug_01",  _sets(s, "3×8",  "3×10", "3×10")),
                ],
            },
            {
                "day": "Day 4",
                "day_number": 4,
                "title": "Lower Body Focus",
                "duration": "40-50 min",
                "muscle_focus": "Quads, Hamstrings, Glutes",
                "exercises": [
                    _make_exercise("ex_goblet_01",   _sets(s, "3×12", "4×10", "4×10")),
                    _make_exercise("ex_rdl_01",      _sets(s, "3×12", "3×10", "4×10")),
                    _make_exercise("ex_hipthrust_01",_sets(s, "3×15", "3×12", "4×12")),
                    _make_exercise("ex_legpress_01", _sets(s, "3×12", "3×12", "3×12")),
                    _make_exercise("ex_stepup_01",   _sets(s, "3×10", "3×10", "3×12")),
                    _make_exercise("ex_calfrise_01", _sets(s, "3×15", "3×15", "4×15")),
                ],
            },
        ]


def _build_plan_data(goal: str, activity_level: str, health_conditions: list[str]) -> dict:
    overrides = _condition_overrides(health_conditions)
    return {
        "summary": (
            "A condition-aware workout plan with safer intensity, more recovery, and lower-impact cardio."
            if health_conditions else
            "A balanced 4-day weekly workout plan focused on consistency, strength, and cardio health."
        ),
        "goal": goal,
        "activity_level": activity_level,
        "health_conditions": health_conditions,
        "recommended_intensity": overrides["intensity"],
        "focus_areas": _goal_focus(goal),
        "weekly_plan": _build_weekly_plan(goal, activity_level, health_conditions),
        "coach_notes": overrides["notes"] or ["Progress gradually and stop if you feel dizzy, chest pain, or unusual shortness of breath."],
        "avoid": overrides["avoid"] or ["Sudden jumps in training intensity without recovery days."],
        "medical_disclaimer": "This plan is educational and should complement guidance from a qualified clinician, especially for chronic conditions.",
    }


def _upsert_plan(user_id: str, goal: str, activity_level: str, health_conditions: list[str], db: Session) -> tuple[dict, str]:
    """Build plan data and upsert to DB. Returns (plan_data, plan_id)."""
    plan_data = _build_plan_data(goal, activity_level, health_conditions)
    conditions_str = ",".join(health_conditions) if health_conditions else None
    existing = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).first()
    if existing:
        existing.goal = goal
        existing.activity_level = activity_level
        existing.health_conditions = conditions_str
        existing.plan_json = plan_data
        plan_id = existing.id
    else:
        existing = WorkoutPlan(
            user_id=user_id,
            goal=goal,
            activity_level=activity_level,
            health_conditions=conditions_str,
            plan_json=plan_data,
        )
        db.add(existing)
        plan_id = existing.id
    try:
        db.commit()
    except Exception:
        db.rollback()
    return plan_data, plan_id


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/stats")
def stats(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    total = db.query(WorkoutLog).filter(WorkoutLog.user_id == user_id).count()

    from datetime import date, timedelta
    from sqlalchemy import func as sa_func
    logged_dates = {
        row[0] for row in
        db.query(sa_func.date(WorkoutLog.logged_at))
        .filter(WorkoutLog.user_id == user_id)
        .all()
    }
    streak = 0
    check = date.today()
    while check in logged_dates:
        streak += 1
        check -= timedelta(days=1)

    return {"totalWorkouts": total, "streak": streak}


@router.post("/plan")
def workout_plan(
    body: WorkoutPlanRequest,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    plan_data, _ = _upsert_plan(
        payload["user_id"], body.goal, body.activity_level, body.health_conditions, db
    )
    return plan_data


@router.post("/plan/from-profile")
def plan_from_profile(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Auto-generate workout plan using the user's nutrition profile."""
    token = credentials.credentials
    try:
        r = httpx.get(
            "http://nutrition-service:8000/nutrition/profile",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5.0,
        )
        r.raise_for_status()
        profile = r.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(424, "Nutrition profile not found. Complete your nutrition setup first.")
        raise HTTPException(502, "Could not fetch nutrition profile.")
    except Exception:
        raise HTTPException(502, "Could not reach nutrition service.")

    goal = profile.get("goal", "maintain")
    activity_level = profile.get("activity_level", "moderately_active")
    raw_conditions = profile.get("health_conditions") or ""
    health_conditions = [c.strip() for c in raw_conditions.split(",") if c.strip()]
    # Sanitize against allowed list
    health_conditions = [c for c in health_conditions if c in ALLOWED_HEALTH_CONDITIONS]

    plan_data, _ = _upsert_plan(payload["user_id"], goal, activity_level, health_conditions, db)
    return plan_data


@router.get("/plan/saved")
def get_saved_plan(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Return the user's last saved workout plan."""
    user_id = payload["user_id"]
    plan = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).first()
    if not plan:
        raise HTTPException(404, "No saved plan found. POST /workouts/plan to generate one.")
    return plan.plan_json


@router.get("/progress/week")
def week_progress(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Return this week's exercise completion summary for the user's current plan."""
    user_id = payload["user_id"]
    plan = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).first()
    if not plan:
        raise HTTPException(404, "No saved plan found.")

    week_start = current_week_start()
    rows = (
        db.query(WorkoutDayProgress)
        .filter(
            WorkoutDayProgress.user_id == user_id,
            WorkoutDayProgress.plan_id == plan.id,
            WorkoutDayProgress.week_start == week_start,
        )
        .all()
    )
    progress_by_day = {row.day_number: row.completed_exercise_ids or [] for row in rows}

    weekly_plan = plan.plan_json.get("weekly_plan", [])
    total_exercises = 0
    completed_exercises = 0
    days_out = []

    for day in weekly_plan:
        day_num = day["day_number"]
        day_total = len(day.get("exercises", []))
        done_ids = progress_by_day.get(day_num, [])
        day_completed = len(done_ids)
        total_exercises += day_total
        completed_exercises += day_completed
        days_out.append({
            "day_number": day_num,
            "day_title": day["title"],
            "total": day_total,
            "completed": day_completed,
            "completed_exercise_ids": done_ids,
        })

    pct = round((completed_exercises / total_exercises * 100), 1) if total_exercises else 0.0
    return {
        "week_start": week_start,
        "plan_id": plan.id,
        "total_exercises": total_exercises,
        "completed_exercises": completed_exercises,
        "completion_pct": pct,
        "days": days_out,
    }


@router.post("/progress/toggle")
def toggle_exercise(
    body: ToggleExerciseRequest,
    background_tasks: BackgroundTasks,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Toggle an exercise as done or undone for the current week."""
    user_id = payload["user_id"]
    plan = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).first()
    if not plan:
        raise HTTPException(404, "No saved plan found.")

    week_start = current_week_start()
    row = (
        db.query(WorkoutDayProgress)
        .filter_by(
            user_id=user_id,
            plan_id=plan.id,
            day_number=body.day_number,
            week_start=week_start,
        )
        .first()
    )
    if not row:
        row = WorkoutDayProgress(
            user_id=user_id,
            plan_id=plan.id,
            day_number=body.day_number,
            week_start=week_start,
            completed_exercise_ids=[],
        )
        db.add(row)
        db.flush()

    # Snapshot before toggle
    old_ids = list(row.completed_exercise_ids or [])
    ids = list(old_ids)

    if body.exercise_id in ids:
        ids.remove(body.exercise_id)
        now_completed = False
    else:
        ids.append(body.exercise_id)
        now_completed = True

    row.completed_exercise_ids = ids

    # Look up this day in the plan
    day_plan = next(
        (d for d in plan.plan_json.get("weekly_plan", []) if d["day_number"] == body.day_number),
        None,
    )
    total_for_day = len(day_plan.get("exercises", [])) if day_plan else 0
    is_now_complete = total_for_day > 0 and len(ids) >= total_for_day

    # Only fire once per day per week: when all exercises are done AND we haven't
    # logged this day yet (completed_at is None). This prevents double-logging when
    # the user unchecks and re-checks the final exercise.
    day_just_completed = is_now_complete and row.completed_at is None

    if day_just_completed and day_plan:
        from datetime import datetime
        row.completed_at = datetime.utcnow()
        db.add(WorkoutLog(user_id=user_id, day_title=day_plan["title"]))

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to save progress.")

    # Emit event in background after response is sent — avoids blocking and
    # prevents silent drops caused by the 2-second inline timeout.
    if day_just_completed:
        from datetime import date as _date
        background_tasks.add_task(_emit_workout_event, user_id, _date.today().isoformat())

    return {
        "day_number": body.day_number,
        "exercise_id": body.exercise_id,
        "now_completed": now_completed,
        "completed_exercise_ids": ids,
        "day_completed": day_just_completed,
    }


@router.post("/log")
def log_workout(
    body: WorkoutLogRequest,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Log a completed workout session."""
    log = WorkoutLog(
        user_id=payload["user_id"],
        day_title=body.day_title,
        duration_minutes=body.duration_minutes,
    )
    try:
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to log workout")

    from datetime import date as _date
    _emit_workout_event(payload["user_id"], _date.today().isoformat())

    return {"message": "Workout logged", "id": log.id}


def _emit_workout_event(user_id: str, log_date: str):
    _secret = os.getenv("SECRET_KEY", "supersecretkey")
    event = {"user_id": user_id, "event_type": "workout_logged", "value": 1, "date": log_date}
    for url in [
        "http://goals-service:8000/internal/goals/event",
        "http://progress-service:8000/internal/progress/event",
    ]:
        try:
            httpx.post(url, json=event, headers={"X-Internal-Secret": _secret}, timeout=8.0)
        except Exception:
            pass


@router.get("/health")
def health():
    return {"status": "ok", "service": "workout-service"}


@router.get("/internal/weekly-stats")
def internal_weekly_stats(
    user_id: str,
    x_internal_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Internal endpoint: weekly workout count for a given user_id."""
    _secret = os.getenv("SECRET_KEY", "supersecretkey")
    if x_internal_secret != _secret:
        raise HTTPException(status_code=403, detail="Forbidden")
    from datetime import date as _date, timedelta as _timedelta
    today = _date.today()
    week_start = today - _timedelta(days=today.weekday())
    count = db.query(WorkoutLog).filter(
        WorkoutLog.user_id == user_id,
        WorkoutLog.logged_at >= week_start,
    ).count()
    return {"workout_count": count}
