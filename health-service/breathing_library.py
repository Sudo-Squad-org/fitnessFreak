"""Static breathing exercise library — no DB needed."""

BREATHING_EXERCISES = [
    {
        "id": "box_breathing",
        "name": "Box Breathing",
        "tagline": "Calm anxiety, sharpen focus",
        "duration_min": 4,
        "best_for": ["stress", "focus", "pre-workout"],
        "steps": [
            {"phase": "Inhale",  "seconds": 4, "instruction": "Breathe in slowly through your nose"},
            {"phase": "Hold",    "seconds": 4, "instruction": "Hold your breath gently"},
            {"phase": "Exhale",  "seconds": 4, "instruction": "Exhale slowly through your mouth"},
            {"phase": "Hold",    "seconds": 4, "instruction": "Rest before the next breath"},
        ],
        "benefits": "Reduces cortisol, regulates the autonomic nervous system, and sharpens focus. Widely used by athletes and military.",
    },
    {
        "id": "4_7_8",
        "name": "4-7-8 Breathing",
        "tagline": "Fall asleep faster, ease tension",
        "duration_min": 3,
        "best_for": ["sleep", "anxiety", "recovery"],
        "steps": [
            {"phase": "Inhale",  "seconds": 4,  "instruction": "Breathe in quietly through your nose"},
            {"phase": "Hold",    "seconds": 7,  "instruction": "Hold your breath completely"},
            {"phase": "Exhale",  "seconds": 8,  "instruction": "Exhale fully through your mouth with a whoosh sound"},
        ],
        "benefits": "Acts as a natural sedative. Shown to reduce anxiety and help with sleep onset in as few as 3 cycles.",
    },
    {
        "id": "physiological_sigh",
        "name": "Physiological Sigh",
        "tagline": "Instant stress relief in 30 seconds",
        "duration_min": 1,
        "best_for": ["stress", "quick-reset"],
        "steps": [
            {"phase": "Inhale",       "seconds": 2, "instruction": "Take a full inhale through your nose"},
            {"phase": "Double inhale", "seconds": 1, "instruction": "Sniff in a little more air to fully inflate lungs"},
            {"phase": "Exhale",       "seconds": 5, "instruction": "Exhale slowly and fully through your mouth"},
        ],
        "benefits": "The fastest way to lower physiological stress. Deflates over-inflated alveoli and rapidly lowers heart rate. Used in Stanford research.",
    },
    {
        "id": "belly_breathing",
        "name": "Belly Breathing",
        "tagline": "Deep relaxation, better oxygen flow",
        "duration_min": 5,
        "best_for": ["relaxation", "recovery", "low-energy"],
        "steps": [
            {"phase": "Setup",   "seconds": 0,  "instruction": "Place one hand on your chest, one on your belly"},
            {"phase": "Inhale",  "seconds": 4,  "instruction": "Breathe in through your nose — your belly should rise, not your chest"},
            {"phase": "Exhale",  "seconds": 6,  "instruction": "Breathe out slowly through pursed lips, belly falls"},
        ],
        "benefits": "Activates the parasympathetic nervous system, reduces blood pressure, and improves oxygen efficiency. Ideal after high-intensity training.",
    },
    {
        "id": "alternate_nostril",
        "name": "Alternate Nostril Breathing",
        "tagline": "Balance energy, clear the mind",
        "duration_min": 5,
        "best_for": ["balance", "focus", "pre-meditation"],
        "steps": [
            {"phase": "Close right", "seconds": 0, "instruction": "Use your right thumb to close your right nostril"},
            {"phase": "Inhale left", "seconds": 4, "instruction": "Inhale slowly through your left nostril"},
            {"phase": "Switch",      "seconds": 0, "instruction": "Close left nostril with ring finger, release thumb"},
            {"phase": "Exhale right","seconds": 4, "instruction": "Exhale slowly through your right nostril"},
            {"phase": "Inhale right","seconds": 4, "instruction": "Inhale through your right nostril"},
            {"phase": "Switch back", "seconds": 0, "instruction": "Close right nostril, release left"},
            {"phase": "Exhale left", "seconds": 4, "instruction": "Exhale through your left nostril — that's one cycle"},
        ],
        "benefits": "Balances left and right brain hemispheres, reduces anxiety, and improves mental clarity. A core Pranayama technique.",
    },
]
