import random

ADJECTIVES = [
    "Fit", "Iron", "Swift", "Bold", "Keen", "Apex", "Peak", "Wild",
    "Surge", "Lean", "Forge", "Steel", "Prime", "Blaze", "Feral",
]
ANIMALS = [
    "Fox", "Wolf", "Bear", "Hawk", "Lion", "Tiger", "Owl", "Elk",
    "Lynx", "Falcon", "Eagle", "Panther", "Puma", "Raven", "Bison",
]


def generate_alias(db) -> str:
    from models import BuddyProfile
    for _ in range(20):
        alias = f"{random.choice(ADJECTIVES)}{random.choice(ANIMALS)}-{random.randint(1000, 9999)}"
        if not db.query(BuddyProfile).filter(BuddyProfile.alias == alias).first():
            return alias
    raise RuntimeError("Could not generate a unique alias after 20 attempts")
