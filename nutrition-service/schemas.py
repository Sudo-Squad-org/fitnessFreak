from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# ── Nutrition Profile ─────────────────────────────────────────────────────────

class ProfileCreate(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str = Field(..., pattern="^(male|female)$")
    weight_kg: float = Field(..., gt=20, lt=300)
    height_cm: float = Field(..., gt=100, lt=250)
    activity_level: str = Field(..., pattern="^(sedentary|lightly_active|moderately_active|very_active|extra_active)$")
    goal: str = Field(..., pattern="^(weight_loss|muscle_gain|maintain)$")


class ProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=10, le=100)
    gender: Optional[str] = Field(None, pattern="^(male|female)$")
    weight_kg: Optional[float] = Field(None, gt=20, lt=300)
    height_cm: Optional[float] = Field(None, gt=100, lt=250)
    activity_level: Optional[str] = Field(None, pattern="^(sedentary|lightly_active|moderately_active|very_active|extra_active)$")
    goal: Optional[str] = Field(None, pattern="^(weight_loss|muscle_gain|maintain)$")


class ProfileOut(BaseModel):
    id: int
    user_id: str
    age: int
    gender: str
    weight_kg: float
    height_cm: float
    activity_level: str
    goal: str
    tdee: Optional[float]
    target_calories: Optional[float]
    target_protein_g: Optional[float]
    target_carbs_g: Optional[float]
    target_fat_g: Optional[float]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ── Food ──────────────────────────────────────────────────────────────────────

class FoodOut(BaseModel):
    id: int
    name: str
    category: str
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    fiber_per_100g: Optional[float]
    serving_size_g: float
    serving_label: Optional[str]
    is_indian: int

    model_config = {"from_attributes": True}


# ── Meal Log ──────────────────────────────────────────────────────────────────

class MealLogCreate(BaseModel):
    food_id: int
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    quantity_g: float = Field(..., gt=0, lt=5000)
    log_date: date
    notes: Optional[str] = None


class MealLogOut(BaseModel):
    id: int
    user_id: str
    food_id: int
    meal_type: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: Optional[float]
    log_date: date
    logged_at: Optional[datetime]
    notes: Optional[str]
    food: Optional[FoodOut] = None

    model_config = {"from_attributes": True}


# ── Summary Responses ─────────────────────────────────────────────────────────

class MacroSummary(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


class MealTypeSummary(BaseModel):
    breakfast: MacroSummary
    lunch: MacroSummary
    dinner: MacroSummary
    snack: MacroSummary


class DailySummary(BaseModel):
    date: date
    totals: MacroSummary
    by_meal: MealTypeSummary
    target_calories: Optional[float]
    calories_remaining: Optional[float]
    logs: List[MealLogOut]


class WeeklyDay(BaseModel):
    date: date
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class WeeklySummary(BaseModel):
    days: List[WeeklyDay]
    avg_calories: float
    avg_protein_g: float
    avg_carbs_g: float
    avg_fat_g: float
    target_calories: Optional[float]
