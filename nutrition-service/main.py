from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import Optional, List

from database import Base, engine, get_db
from models import NutritionProfile, Food, MealLog
from schemas import (
    ProfileCreate, ProfileUpdate, ProfileOut,
    FoodOut,
    MealLogCreate, MealLogOut,
    MacroSummary, MealTypeSummary, DailySummary,
    WeeklyDay, WeeklySummary,
)
from auth_utils import verify_token, require_admin
from utils import calculate_tdee, calculate_targets, compute_log_macros
from seed_data import FOODS

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nutrition Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _empty_macro() -> MacroSummary:
    return MacroSummary(calories=0, protein_g=0, carbs_g=0, fat_g=0, fiber_g=0)


def _sum_logs(logs) -> MacroSummary:
    return MacroSummary(
        calories=round(sum(l.calories for l in logs), 2),
        protein_g=round(sum(l.protein_g for l in logs), 2),
        carbs_g=round(sum(l.carbs_g for l in logs), 2),
        fat_g=round(sum(l.fat_g for l in logs), 2),
        fiber_g=round(sum(l.fiber_g or 0 for l in logs), 2),
    )


# ── Profile ───────────────────────────────────────────────────────────────────

@app.post("/nutrition/profile", response_model=ProfileOut, status_code=201)
def create_profile(
    body: ProfileCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    user_id = payload["user_id"]
    if db.query(NutritionProfile).filter_by(user_id=user_id).first():
        raise HTTPException(400, "Profile already exists. Use PUT to update.")

    tdee = calculate_tdee(body.weight_kg, body.height_cm, body.age, body.gender, body.activity_level)
    targets = calculate_targets(tdee, body.goal)

    profile = NutritionProfile(
        user_id=user_id,
        **body.model_dump(),
        tdee=tdee,
        **targets,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@app.get("/nutrition/profile", response_model=ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    profile = db.query(NutritionProfile).filter_by(user_id=payload["user_id"]).first()
    if not profile:
        raise HTTPException(404, "Nutrition profile not found. Please create one.")
    return profile


@app.put("/nutrition/profile", response_model=ProfileOut)
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    profile = db.query(NutritionProfile).filter_by(user_id=payload["user_id"]).first()
    if not profile:
        raise HTTPException(404, "Profile not found.")

    update_data = body.model_dump(exclude_none=True)
    for key, val in update_data.items():
        setattr(profile, key, val)

    # Recalculate TDEE and targets with updated values
    tdee = calculate_tdee(
        profile.weight_kg, profile.height_cm,
        profile.age, profile.gender, profile.activity_level,
    )
    targets = calculate_targets(tdee, profile.goal)
    profile.tdee = tdee
    profile.target_calories = targets["target_calories"]
    profile.target_protein_g = targets["target_protein_g"]
    profile.target_carbs_g = targets["target_carbs_g"]
    profile.target_fat_g = targets["target_fat_g"]

    db.commit()
    db.refresh(profile)
    return profile


# ── Foods ─────────────────────────────────────────────────────────────────────

@app.get("/nutrition/foods", response_model=List[FoodOut])
def search_foods(
    q: Optional[str] = Query(None, description="Search by name"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token),
):
    query = db.query(Food)
    if q:
        query = query.filter(Food.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Food.category == category)
    return query.offset(offset).limit(limit).all()


@app.get("/nutrition/foods/{food_id}", response_model=FoodOut)
def get_food(
    food_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token),
):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(404, "Food not found.")
    return food


# ── Meal Logs ─────────────────────────────────────────────────────────────────

@app.post("/nutrition/logs", response_model=MealLogOut, status_code=201)
def add_meal_log(
    body: MealLogCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    food = db.query(Food).filter(Food.id == body.food_id).first()
    if not food:
        raise HTTPException(404, "Food not found.")

    macros = compute_log_macros(food, body.quantity_g)
    log = MealLog(
        user_id=payload["user_id"],
        food_id=body.food_id,
        meal_type=body.meal_type,
        quantity_g=body.quantity_g,
        log_date=body.log_date,
        notes=body.notes,
        **macros,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # Attach food for response
    log.food = food
    return log


@app.get("/nutrition/logs", response_model=List[MealLogOut])
def get_logs(
    log_date: Optional[date] = Query(None),
    meal_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    query = db.query(MealLog).filter(MealLog.user_id == payload["user_id"])
    if log_date:
        query = query.filter(MealLog.log_date == log_date)
    if meal_type:
        query = query.filter(MealLog.meal_type == meal_type)

    logs = query.order_by(MealLog.logged_at.desc()).all()

    # Eager-attach food objects
    food_ids = {l.food_id for l in logs}
    foods = {f.id: f for f in db.query(Food).filter(Food.id.in_(food_ids)).all()}
    for log in logs:
        log.food = foods.get(log.food_id)

    return logs


@app.delete("/nutrition/logs/{log_id}", status_code=204)
def delete_log(
    log_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    log = db.query(MealLog).filter(MealLog.id == log_id, MealLog.user_id == payload["user_id"]).first()
    if not log:
        raise HTTPException(404, "Log not found.")
    db.delete(log)
    db.commit()


# ── Daily Summary ─────────────────────────────────────────────────────────────

@app.get("/nutrition/summary/daily", response_model=DailySummary)
def daily_summary(
    log_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    user_id = payload["user_id"]
    logs = db.query(MealLog).filter(
        MealLog.user_id == user_id,
        MealLog.log_date == log_date,
    ).all()

    food_ids = {l.food_id for l in logs}
    foods = {f.id: f for f in db.query(Food).filter(Food.id.in_(food_ids)).all()}
    for log in logs:
        log.food = foods.get(log.food_id)

    by_meal: dict[str, list] = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    for log in logs:
        by_meal[log.meal_type].append(log)

    profile = db.query(NutritionProfile).filter_by(user_id=user_id).first()
    target_cal = profile.target_calories if profile else None
    totals = _sum_logs(logs)

    return DailySummary(
        date=log_date,
        totals=totals,
        by_meal=MealTypeSummary(
            breakfast=_sum_logs(by_meal["breakfast"]),
            lunch=_sum_logs(by_meal["lunch"]),
            dinner=_sum_logs(by_meal["dinner"]),
            snack=_sum_logs(by_meal["snack"]),
        ),
        target_calories=target_cal,
        calories_remaining=round(target_cal - totals.calories, 1) if target_cal else None,
        logs=logs,
    )


# ── Weekly Summary ────────────────────────────────────────────────────────────

@app.get("/nutrition/summary/weekly", response_model=WeeklySummary)
def weekly_summary(
    end_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_token),
):
    user_id = payload["user_id"]
    start_date = end_date - timedelta(days=6)

    logs = db.query(MealLog).filter(
        MealLog.user_id == user_id,
        MealLog.log_date >= start_date,
        MealLog.log_date <= end_date,
    ).all()

    # Group by date
    by_date: dict = {}
    for log in logs:
        d = log.log_date
        if d not in by_date:
            by_date[d] = []
        by_date[d].append(log)

    days = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        day_logs = by_date.get(d, [])
        macro = _sum_logs(day_logs)
        days.append(WeeklyDay(
            date=d,
            calories=macro.calories,
            protein_g=macro.protein_g,
            carbs_g=macro.carbs_g,
            fat_g=macro.fat_g,
        ))

    n = len(days) or 1
    profile = db.query(NutritionProfile).filter_by(user_id=user_id).first()

    return WeeklySummary(
        days=days,
        avg_calories=round(sum(d.calories for d in days) / n, 1),
        avg_protein_g=round(sum(d.protein_g for d in days) / n, 1),
        avg_carbs_g=round(sum(d.carbs_g for d in days) / n, 1),
        avg_fat_g=round(sum(d.fat_g for d in days) / n, 1),
        target_calories=profile.target_calories if profile else None,
    )


# ── Admin: all users' logs ────────────────────────────────────────────────────

@app.get("/nutrition/admin/logs", response_model=List[MealLogOut])
def admin_all_logs(
    log_date: Optional[date] = Query(None),
    user_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    query = db.query(MealLog)
    if log_date:
        query = query.filter(MealLog.log_date == log_date)
    if user_id:
        query = query.filter(MealLog.user_id == user_id)
    logs = query.order_by(MealLog.logged_at.desc()).limit(limit).all()

    food_ids = {l.food_id for l in logs}
    foods = {f.id: f for f in db.query(Food).filter(Food.id.in_(food_ids)).all()}
    for log in logs:
        log.food = foods.get(log.food_id)

    return logs


# ── Seed ──────────────────────────────────────────────────────────────────────

@app.post("/nutrition/seed", status_code=201)
def seed_foods(db: Session = Depends(get_db)):
    if db.query(Food).count() > 0:
        return {"message": "Foods already seeded.", "count": db.query(Food).count()}

    foods = [Food(**f) for f in FOODS]
    db.add_all(foods)
    db.commit()
    return {"message": "Seeded successfully.", "count": len(foods)}


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/nutrition/health")
def health():
    return {"status": "ok", "service": "nutrition-service"}
