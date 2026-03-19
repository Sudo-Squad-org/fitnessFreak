from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List

router = APIRouter()


class WorkoutPlanRequest(BaseModel):
    goal: str = "maintain"
    activity_level: str = "moderately_active"
    age: int | None = None
    health_conditions: List[str] = Field(default_factory=list)


def _base_frequency(activity_level: str) -> int:
    return {
        "sedentary": 3,
        "lightly_active": 4,
        "moderately_active": 5,
        "very_active": 5,
        "extra_active": 6,
    }.get(activity_level, 4)


def _goal_focus(goal: str) -> list[str]:
    return {
        "weight_loss": ["Zone 2 cardio", "Full-body strength", "Daily walking"],
        "muscle_gain": ["Progressive strength", "Mobility", "Light conditioning"],
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


def _build_weekly_plan(goal: str, activity_level: str, conditions: list[str]) -> list[dict]:
    base_days = _base_frequency(activity_level)
    overrides = _condition_overrides(conditions)

    plan = [
        {"day": "Day 1", "title": "Strength Foundation", "duration": "35-45 min", "details": "Full-body strength with controlled tempo and proper breathing."},
        {"day": "Day 2", "title": "Cardio + Mobility", "duration": f"{overrides['cardio_minutes']} min", "details": "Brisk walk, cycling, or elliptical followed by mobility work."},
        {"day": "Day 3", "title": "Recovery", "duration": "20-30 min", "details": "Easy walk, stretching, and light mobility."},
        {"day": "Day 4", "title": "Strength Progression", "duration": "35-45 min", "details": "Repeat full-body work or a simple upper/lower split at sustainable effort."},
        {"day": "Day 5", "title": "Conditioning", "duration": f"{overrides['cardio_minutes']} min", "details": "Low-impact intervals or a longer steady cardio session."},
        {"day": "Day 6", "title": "Optional Movement", "duration": "20-30 min", "details": "Yoga, mobility, or an easy recreational activity."},
        {"day": "Day 7", "title": "Rest", "duration": "Full rest", "details": "Prioritize sleep, hydration, and recovery."},
    ]

    if goal == "muscle_gain":
        plan[1]["title"] = "Recovery Cardio"
        plan[4]["title"] = "Accessory Strength"
        plan[4]["details"] = "Short accessory lifting session plus light conditioning."
    elif goal == "weight_loss":
        plan[4]["details"] = "Longer steady cardio or low-impact intervals to build consistency."

    if base_days <= 3:
        return [plan[0], plan[1], plan[6]]
    if base_days == 4:
        return [plan[0], plan[1], plan[3], plan[6]]
    if base_days == 5:
        return [plan[0], plan[1], plan[2], plan[3], plan[4], plan[6]]
    return plan


@router.get("/stats")
def stats():
    return {
        "totalWorkouts": 10,
        "streak": 3
    }


@router.post("/plan")
def workout_plan(body: WorkoutPlanRequest):
    overrides = _condition_overrides(body.health_conditions)
    return {
        "summary": (
            "A condition-aware workout plan with safer intensity, more recovery, and lower-impact cardio."
            if body.health_conditions else
            "A balanced weekly workout plan focused on consistency, strength, and cardio health."
        ),
        "goal": body.goal,
        "activity_level": body.activity_level,
        "health_conditions": body.health_conditions,
        "recommended_intensity": overrides["intensity"],
        "focus_areas": _goal_focus(body.goal),
        "weekly_plan": _build_weekly_plan(body.goal, body.activity_level, body.health_conditions),
        "coach_notes": overrides["notes"] or ["Progress gradually and stop if you feel dizzy, chest pain, or unusual shortness of breath."],
        "avoid": overrides["avoid"] or ["Sudden jumps in training intensity without recovery days."],
        "medical_disclaimer": "This plan is educational and should complement guidance from a qualified clinician, especially for chronic conditions.",
    }
