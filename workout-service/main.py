from fastapi import FastAPI
from app.routes import workouts

app = FastAPI()

app.include_router(workouts.router, prefix="/workouts")
