import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import httpx

app = FastAPI()

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH = "http://auth-service:8000"
BOOK = "http://booking-service:8000"
WORKOUT = "http://workout-service:8000"
NUTRITION = "http://nutrition-service:8000"
GOALS = "http://goals-service:8000"
PROGRESS = "http://progress-service:8000"
NOTIFICATIONS = "http://notifications-service:8000"
HEALTH = "http://health-service:8000"


async def _proxy(request: Request, url: str, body=None):
    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in ("host", "content-length", "content-type", "transfer-encoding")
    }
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            request.method,
            url,
            json=body,
            headers=headers,
            params=request.query_params,
        )
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            media_type=resp.headers.get("content-type", "application/json"),
        )


async def _body(request: Request):
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        try:
            return await request.json()
        except Exception:
            return None
    return None


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def auth_proxy(path: str, request: Request):
    return await _proxy(request, f"{AUTH}/auth/{path}", await _body(request))


# ── Classes (list + create) ────────────────────────────────────────────────────

@app.api_route("/classes", methods=["GET", "POST"])
async def classes_list_proxy(request: Request):
    return await _proxy(request, f"{BOOK}/classes", await _body(request))


# ── Classes (detail: get / update / delete / attendees) ───────────────────────

@app.api_route("/classes/{path:path}", methods=["GET", "PUT", "DELETE", "POST"])
async def classes_detail_proxy(path: str, request: Request):
    return await _proxy(request, f"{BOOK}/classes/{path}", await _body(request))


# ── Bookings root (POST /bookings) ────────────────────────────────────────────

@app.api_route("/bookings", methods=["GET", "POST"])
async def bookings_root_proxy(request: Request):
    return await _proxy(request, f"{BOOK}/bookings", await _body(request))


# ── Bookings with path (/bookings/my, /bookings/{id}) ────────────────────────

@app.api_route("/bookings/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def bookings_path_proxy(path: str, request: Request):
    return await _proxy(request, f"{BOOK}/bookings/{path}", await _body(request))


# ── Seed (dev only) ───────────────────────────────────────────────────────────

@app.post("/seed")
async def seed_proxy(request: Request):
    return await _proxy(request, f"{BOOK}/seed")


# ── Nutrition ─────────────────────────────────────────────────────────────────

@app.api_route("/nutrition/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def nutrition_proxy(path: str, request: Request):
    return await _proxy(request, f"{NUTRITION}/nutrition/{path}", await _body(request))


# ── Workouts ──────────────────────────────────────────────────────────────────

@app.api_route("/workouts", methods=["GET", "POST"])
async def workouts_root_proxy(request: Request):
    return await _proxy(request, f"{WORKOUT}/workouts", await _body(request))


@app.api_route("/workouts/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def workouts_path_proxy(path: str, request: Request):
    return await _proxy(request, f"{WORKOUT}/workouts/{path}", await _body(request))


# ── Goals ──────────────────────────────────────────────────────────────────────

@app.api_route("/goals", methods=["GET", "POST"])
async def goals_root_proxy(request: Request):
    return await _proxy(request, f"{GOALS}/goals", await _body(request))


@app.api_route("/goals/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def goals_path_proxy(path: str, request: Request):
    return await _proxy(request, f"{GOALS}/goals/{path}", await _body(request))


# ── Progress ───────────────────────────────────────────────────────────────────

@app.api_route("/progress", methods=["GET", "POST"])
async def progress_root_proxy(request: Request):
    return await _proxy(request, f"{PROGRESS}/progress", await _body(request))


@app.api_route("/progress/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def progress_path_proxy(path: str, request: Request):
    return await _proxy(request, f"{PROGRESS}/progress/{path}", await _body(request))


# ── Notifications ──────────────────────────────────────────────────────────────

@app.api_route("/notifications", methods=["GET", "POST"])
async def notifications_root_proxy(request: Request):
    return await _proxy(request, f"{NOTIFICATIONS}/notifications", await _body(request))


@app.api_route("/notifications/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def notifications_path_proxy(path: str, request: Request):
    return await _proxy(request, f"{NOTIFICATIONS}/notifications/{path}", await _body(request))


# ── Health / Wellness ──────────────────────────────────────────────────────────

@app.api_route("/health/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def health_proxy(path: str, request: Request):
    return await _proxy(request, f"{HEALTH}/health/{path}", await _body(request))
