from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class NutritionProfile(Base):
    __tablename__ = "nutrition_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)          # "male" | "female"
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    activity_level = Column(String, nullable=False)  # sedentary | lightly_active | moderately_active | very_active | extra_active
    goal = Column(String, nullable=False)             # weight_loss | muscle_gain | maintain
    tdee = Column(Float, nullable=True)
    target_calories = Column(Float, nullable=True)
    target_protein_g = Column(Float, nullable=True)
    target_carbs_g = Column(Float, nullable=True)
    target_fat_g = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)        # grain | protein | dairy | vegetable | fruit | fat | beverage | snack
    calories_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, nullable=False)
    carbs_per_100g = Column(Float, nullable=False)
    fat_per_100g = Column(Float, nullable=False)
    fiber_per_100g = Column(Float, nullable=True, default=0.0)
    serving_size_g = Column(Float, nullable=False, default=100.0)
    serving_label = Column(String, nullable=True)    # "1 cup", "1 roti", "1 egg"
    is_indian = Column(Integer, default=1)           # 1 = Indian food


class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    meal_type = Column(String, nullable=False)       # breakfast | lunch | dinner | snack
    quantity_g = Column(Float, nullable=False)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    fiber_g = Column(Float, nullable=True, default=0.0)
    log_date = Column(Date, nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
