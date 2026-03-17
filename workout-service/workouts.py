from fastapi import FastAPI

app = FastAPI()

@app.get("/workouts/stats")
def stats():
    return {
        "totalWorkouts": 10,
        "streak": 3
    }
