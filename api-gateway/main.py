from fastapi import FastAPI, Request
import httpx

app = FastAPI()

AUTH = "http://auth-service:8000"
BOOK = "http://booking-service:8000"

@app.api_route("/auth/{path:path}", methods=["GET", "POST"])
async def auth_proxy(path: str, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            request.method,
            f"{AUTH}/auth/{path}",
            json=await request.json()
        )
        return resp.json()

@app.api_route("/bookings/{path:path}", methods=["GET", "POST"])
async def booking_proxy(path: str, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            request.method,
            f"{BOOK}/bookings/{path}",
            json=await request.json()
        )
        return resp.json()
