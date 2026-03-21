from fastapi import FastAPI
from sqlalchemy import text
from database import Base, engine
from models import WorkoutPlan, WorkoutLog, WorkoutDayProgress  # noqa: F401 — ensures tables are registered
from routes import workouts

Base.metadata.create_all(bind=engine)

# Apply any columns added after initial table creation (create_all won't ALTER existing tables)
with engine.connect() as conn:
    conn.execute(text(
        "ALTER TABLE workout_day_progress "
        "ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITHOUT TIME ZONE"
    ))
    conn.commit()

app = FastAPI()
app.include_router(workouts.router, prefix="/workouts")
