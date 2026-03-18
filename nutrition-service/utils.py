"""
TDEE and macro calculation utilities.
Uses Mifflin-St Jeor BMR formula.
"""

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "extra_active": 1.9,
}

# Calorie factor and macro overrides per health condition.
# calorie_factor: multiplied onto goal-adjusted calories (most restrictive wins across conditions).
# carbs_pct / fat_pct: upper-bound override (min wins); protein_pct: lower-bound override (max wins).
# Macros are re-normalised to sum to 1.0 after all conditions are applied.
HEALTH_CONDITION_ADJUSTMENTS = {
    "diabetes":         {"calorie_factor": 0.90, "carbs_pct": 0.30, "protein_pct": 0.35, "fat_pct": 0.35},
    "hypertension":     {"calorie_factor": 0.95},
    "high_cholesterol": {"calorie_factor": 0.95, "fat_pct": 0.20},
    "hypothyroidism":   {"calorie_factor": 0.85},
    "pcos":             {"calorie_factor": 0.90, "carbs_pct": 0.30, "protein_pct": 0.35, "fat_pct": 0.35},
    "heart_disease":    {"calorie_factor": 0.90, "fat_pct": 0.20},
}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor BMR formula."""
    if gender == "male":
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161


def calculate_tdee(weight_kg: float, height_cm: float, age: int, gender: str, activity_level: str) -> float:
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    return round(bmr * ACTIVITY_MULTIPLIERS[activity_level], 1)


def calculate_targets(tdee: float, goal: str, health_conditions: list = None) -> dict:
    """
    Returns target calories and macros based on goal and optional health conditions.

    Base splits by goal:
      Weight loss:  -20% calories, 30% protein / 40% carbs / 30% fat
      Muscle gain:  +15% calories, 35% protein / 45% carbs / 20% fat
      Maintain:     TDEE calories, 25% protein / 50% carbs / 25% fat

    Health conditions apply a calorie reduction factor and tighten macro limits.
    """
    if goal == "weight_loss":
        target_cal = tdee * 0.80
        protein_pct, carbs_pct, fat_pct = 0.30, 0.40, 0.30
    elif goal == "muscle_gain":
        target_cal = tdee * 1.15
        protein_pct, carbs_pct, fat_pct = 0.35, 0.45, 0.20
    else:  # maintain
        target_cal = tdee
        protein_pct, carbs_pct, fat_pct = 0.25, 0.50, 0.25

    if health_conditions:
        calorie_factor = 1.0
        for cond in health_conditions:
            adj = HEALTH_CONDITION_ADJUSTMENTS.get(cond, {})
            calorie_factor = min(calorie_factor, adj.get("calorie_factor", 1.0))
            if "carbs_pct" in adj:
                carbs_pct = min(carbs_pct, adj["carbs_pct"])
            if "fat_pct" in adj:
                fat_pct = min(fat_pct, adj["fat_pct"])
            if "protein_pct" in adj:
                protein_pct = max(protein_pct, adj["protein_pct"])

        target_cal *= calorie_factor

        # Re-normalise so macros always sum to 1.0
        total = protein_pct + carbs_pct + fat_pct
        protein_pct /= total
        carbs_pct /= total
        fat_pct /= total

    target_cal = round(target_cal, 1)

    # 1g protein = 4 kcal, 1g carbs = 4 kcal, 1g fat = 9 kcal
    return {
        "target_calories": target_cal,
        "target_protein_g": round((target_cal * protein_pct) / 4, 1),
        "target_carbs_g": round((target_cal * carbs_pct) / 4, 1),
        "target_fat_g": round((target_cal * fat_pct) / 9, 1),
    }


def compute_log_macros(food, quantity_g: float) -> dict:
    """Scale food macros by quantity."""
    ratio = quantity_g / 100.0
    return {
        "calories": round(food.calories_per_100g * ratio, 2),
        "protein_g": round(food.protein_per_100g * ratio, 2),
        "carbs_g": round(food.carbs_per_100g * ratio, 2),
        "fat_g": round(food.fat_per_100g * ratio, 2),
        "fiber_g": round((food.fiber_per_100g or 0) * ratio, 2),
    }
