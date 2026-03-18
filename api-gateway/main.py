from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH = "http://auth-service:8000"
BOOK = "http://booking-service:8000"
NUTRITION = "http://nutrition-service:8000"


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
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            return await request.json()
        except Exception:
            return None
    return None


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
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
