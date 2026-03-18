from fastapi import APIRouter

router = APIRouter()

@router.get("/stats")
def stats():
    return {
        "totalWorkouts": 10,
        "streak": 3
    }
