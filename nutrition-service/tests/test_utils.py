"""Unit tests for TDEE, macro target calculations, and condition overrides."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from utils import calculate_bmr, calculate_tdee, calculate_targets, compute_log_macros


# ── BMR ────────────────────────────────────────────────────────────────────────

def test_bmr_male():
    # 75kg, 175cm, 30yo male → (10*75)+(6.25*175)-(5*30)+5 = 750+1093.75-150+5 = 1698.75
    assert calculate_bmr(75, 175, 30, "male") == 1698.75


def test_bmr_female():
    # 60kg, 165cm, 25yo female → (10*60)+(6.25*165)-(5*25)-161 = 600+1031.25-125-161 = 1345.25
    assert calculate_bmr(60, 165, 25, "female") == 1345.25


# ── TDEE ───────────────────────────────────────────────────────────────────────

def test_tdee_sedentary():
    bmr = calculate_bmr(75, 175, 30, "male")
    tdee = calculate_tdee(75, 175, 30, "male", "sedentary")
    assert tdee == round(bmr * 1.2, 1)


def test_tdee_very_active():
    tdee = calculate_tdee(80, 180, 28, "male", "very_active")
    assert tdee > 3000  # sanity check


# ── Macro targets — base goals ─────────────────────────────────────────────────

def test_targets_weight_loss_calories():
    tdee = 2000.0
    result = calculate_targets(tdee, "weight_loss")
    assert result["target_calories"] == 1600.0


def test_targets_muscle_gain_calories():
    tdee = 2000.0
    result = calculate_targets(tdee, "muscle_gain")
    assert result["target_calories"] == 2300.0


def test_targets_maintain_calories():
    tdee = 2000.0
    result = calculate_targets(tdee, "maintain")
    assert result["target_calories"] == 2000.0


def test_targets_macros_sum_to_calories():
    """Protein + carbs + fat calories should approximately equal target_calories."""
    result = calculate_targets(2000.0, "muscle_gain")
    macro_calories = (
        result["target_protein_g"] * 4
        + result["target_carbs_g"] * 4
        + result["target_fat_g"] * 9
    )
    assert abs(macro_calories - result["target_calories"]) < 5  # within 5 kcal rounding error


# ── Health condition overrides ─────────────────────────────────────────────────

def test_diabetes_reduces_calories():
    tdee = 2000.0
    no_condition = calculate_targets(tdee, "maintain")
    with_diabetes = calculate_targets(tdee, "maintain", ["diabetes"])
    assert with_diabetes["target_calories"] < no_condition["target_calories"]


def test_hypothyroidism_most_restrictive():
    """hypothyroidism has 0.85 factor — most restrictive single condition."""
    tdee = 2000.0
    result = calculate_targets(tdee, "maintain", ["hypothyroidism"])
    assert result["target_calories"] == round(tdee * 0.85, 1)


def test_multiple_conditions_take_minimum_calorie_factor():
    """When multiple conditions apply, the most restrictive calorie factor wins."""
    tdee = 2000.0
    # hypothyroidism (0.85) + hypertension (0.95) → should use 0.85
    result = calculate_targets(tdee, "maintain", ["hypothyroidism", "hypertension"])
    assert result["target_calories"] == round(tdee * 0.85, 1)


def test_diabetes_reduces_carb_pct():
    tdee = 2000.0
    base = calculate_targets(tdee, "maintain")
    diabetes = calculate_targets(tdee, "maintain", ["diabetes"])
    # diabetes limits carbs to 30% max — calories from carbs should be lower
    base_carb_cal = base["target_carbs_g"] * 4
    diabetes_carb_cal = diabetes["target_carbs_g"] * 4
    assert diabetes_carb_cal < base_carb_cal


# ── compute_log_macros ─────────────────────────────────────────────────────────

class FakeFood:
    calories_per_100g = 200.0
    protein_per_100g = 20.0
    carbs_per_100g = 15.0
    fat_per_100g = 5.0
    fiber_per_100g = 2.0


def test_compute_log_macros_100g():
    macros = compute_log_macros(FakeFood(), 100.0)
    assert macros["calories"] == 200.0
    assert macros["protein_g"] == 20.0
    assert macros["carbs_g"] == 15.0
    assert macros["fat_g"] == 5.0
    assert macros["fiber_g"] == 2.0


def test_compute_log_macros_half_serving():
    macros = compute_log_macros(FakeFood(), 50.0)
    assert macros["calories"] == 100.0
    assert macros["protein_g"] == 10.0
