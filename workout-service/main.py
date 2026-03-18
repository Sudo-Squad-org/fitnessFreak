from fastapi import FastAPI
from routes import workouts

app = FastAPI()

app.include_router(workouts.router, prefix="/workouts")
