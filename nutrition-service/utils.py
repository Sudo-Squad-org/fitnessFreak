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


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor BMR formula."""
    if gender == "male":
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161


def calculate_tdee(weight_kg: float, height_cm: float, age: int, gender: str, activity_level: str) -> float:
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    return round(bmr * ACTIVITY_MULTIPLIERS[activity_level], 1)


def calculate_targets(tdee: float, goal: str) -> dict:
    """
    Returns target calories and macros based on goal.

    Weight loss:  -20% calories, 30% protein / 40% carbs / 30% fat
    Muscle gain:  +15% calories, 35% protein / 45% carbs / 20% fat
    Maintain:     TDEE calories, 25% protein / 50% carbs / 25% fat
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
