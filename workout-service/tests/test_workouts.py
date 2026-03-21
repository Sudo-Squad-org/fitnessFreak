"""Unit tests for workout plan generation, condition overrides, and day selection."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from routes.workouts import (
    _base_frequency, _condition_overrides, _build_weekly_plan, _goal_focus,
)


# ── Day frequency ──────────────────────────────────────────────────────────────

def test_sedentary_frequency():
    assert _base_frequency("sedentary") == 3


def test_moderately_active_frequency():
    assert _base_frequency("moderately_active") == 5


def test_extra_active_frequency():
    assert _base_frequency("extra_active") == 6


# ── Condition overrides ────────────────────────────────────────────────────────

def test_no_conditions_returns_moderate():
    result = _condition_overrides([])
    assert result["intensity"] == "moderate"
    assert result["notes"] == []
    assert result["avoid"] == []


def test_heart_disease_sets_low_intensity():
    result = _condition_overrides(["heart_disease"])
    assert result["intensity"] == "low"
    assert "Unsupervised maximal-intensity workouts" in result["avoid"]


def test_hypertension_sets_low_to_moderate():
    result = _condition_overrides(["hypertension"])
    assert result["intensity"] == "low to moderate"


def test_diabetes_increases_cardio_minutes():
    result = _condition_overrides(["diabetes"])
    assert result["cardio_minutes"] == "25-35"


def test_high_cholesterol_increases_cardio():
    result = _condition_overrides(["high_cholesterol"])
    assert result["cardio_minutes"] == "30-40"


def test_multiple_conditions_accumulate_notes():
    result = _condition_overrides(["diabetes", "hypertension"])
    assert len(result["notes"]) == 2


# ── Weekly plan building ───────────────────────────────────────────────────────

def test_sedentary_plan_has_3_days():
    plan = _build_weekly_plan("maintain", "sedentary", [])
    assert len(plan) == 3


def test_lightly_active_plan_has_4_days():
    plan = _build_weekly_plan("maintain", "lightly_active", [])
    assert len(plan) == 4


def test_moderately_active_plan_has_6_days():
    plan = _build_weekly_plan("maintain", "moderately_active", [])
    assert len(plan) == 6


def test_extra_active_plan_has_7_days():
    plan = _build_weekly_plan("maintain", "extra_active", [])
    assert len(plan) == 7


def test_plan_ends_with_rest_day():
    plan = _build_weekly_plan("maintain", "moderately_active", [])
    assert plan[-1]["title"] == "Rest"


def test_muscle_gain_renames_day2():
    plan = _build_weekly_plan("muscle_gain", "moderately_active", [])
    titles = [d["title"] for d in plan]
    assert "Recovery Cardio" in titles


# ── Goal focus ─────────────────────────────────────────────────────────────────

def test_weight_loss_focus_includes_cardio():
    focus = _goal_focus("weight_loss")
    assert any("cardio" in f.lower() for f in focus)


def test_muscle_gain_focus_includes_strength():
    focus = _goal_focus("muscle_gain")
    assert any("strength" in f.lower() for f in focus)
