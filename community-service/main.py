import os
import uuid
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from apscheduler.schedulers.background import BackgroundScheduler

import httpx
import models
import schemas
from database import Base, engine, get_db, SessionLocal
from auth_utils import verify_token
from alias_gen import generate_alias

models.Base.metadata.create_all(bind=engine)

# Apply columns added after initial table creation (create_all won't ALTER existing tables)
from sqlalchemy import text as _text
with engine.connect() as _conn:
    for _stmt in [
        "ALTER TABLE buddy_pairs ADD COLUMN IF NOT EXISTS pair_streak INTEGER DEFAULT 0",
        "ALTER TABLE checkin_requests ADD COLUMN IF NOT EXISTS a_difficulty VARCHAR(10)",
        "ALTER TABLE checkin_requests ADD COLUMN IF NOT EXISTS b_difficulty VARCHAR(10)",
        "ALTER TABLE checkin_requests ADD COLUMN IF NOT EXISTS a_note VARCHAR(100)",
        "ALTER TABLE checkin_requests ADD COLUMN IF NOT EXISTS b_note VARCHAR(100)",
    ]:
        _conn.execute(_text(_stmt))
    _conn.commit()

SECRET_KEY        = os.getenv("SECRET_KEY",        "change-me-in-production")
ALLOWED_ORIGINS   = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]
NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_URL", "http://notifications-service:8000")
WORKOUT_URL       = os.getenv("WORKOUT_URL",       "http://workout-service:8000")
HEALTH_URL        = os.getenv("HEALTH_URL",        "http://health-service:8000")

app = FastAPI(title="Community Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_week_start(d: date = None) -> date:
    d = d or date.today()
    return d - timedelta(days=d.weekday())


def _get_or_create_alias(user_id: str, db: Session) -> str:
    """Return existing alias for user (from BuddyProfile or FeedOptIn) or generate new one."""
    profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    if profile:
        return profile.alias
    optin = db.query(models.FeedOptIn).filter(models.FeedOptIn.user_id == user_id).first()
    if optin:
        return optin.alias
    return generate_alias(db)


def _send_notification(user_id: str, title: str, body: str) -> None:
    """Fire-and-forget notification to the notifications service."""
    try:
        httpx.post(
            f"{NOTIFICATIONS_URL}/internal/notifications",
            json={"user_id": user_id, "title": title, "body": body},
            headers={"X-Internal-Secret": SECRET_KEY},
            timeout=3.0,
        )
    except Exception:
        pass  # notifications are best-effort; never fail the main request


def _get_active_pair(user_id: str, db: Session) -> Optional[models.BuddyPair]:
    return db.query(models.BuddyPair).filter(
        ((models.BuddyPair.user_a_id == user_id) | (models.BuddyPair.user_b_id == user_id)),
        models.BuddyPair.status == "active",
    ).first()


def _partner_id(pair: models.BuddyPair, user_id: str) -> str:
    return pair.user_b_id if pair.user_a_id == user_id else pair.user_a_id


def _partner_alias(pair: models.BuddyPair, user_id: str, db: Session) -> str:
    pid = _partner_id(pair, user_id)
    profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == pid).first()
    if profile and not profile.is_anonymous:
        return profile.alias
    return profile.alias if profile else "Unknown"


def _require_trainer_or_admin(token_data: dict):
    if token_data.get("role") not in ("trainer", "admin"):
        raise HTTPException(status_code=403, detail="Trainer or admin role required")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "community-service"}


# ─────────────────────────────────────────────────────────────────────────────
# 3.1 BUDDY SYSTEM
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/community/buddy/profile", response_model=schemas.BuddyProfileOut, status_code=201)
def create_buddy_profile(
    payload: schemas.BuddyProfileCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    if profile:
        # Upsert existing profile
        profile.fitness_level  = payload.fitness_level
        profile.goal           = payload.goal
        profile.preferred_days = payload.preferred_days
        profile.is_anonymous   = payload.is_anonymous
        profile.updated_at     = datetime.utcnow()
        db.commit()
        db.refresh(profile)
        return profile

    alias = generate_alias(db)
    profile = models.BuddyProfile(
        user_id       = user_id,
        alias         = alias,
        fitness_level = payload.fitness_level,
        goal          = payload.goal,
        preferred_days= payload.preferred_days,
        is_anonymous  = payload.is_anonymous,
    )
    db.add(profile)
    try:
        db.commit()
        db.refresh(profile)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to create profile")
    return profile


@app.get("/community/buddy/profile", response_model=schemas.BuddyProfileOut)
def get_buddy_profile(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(404, "No buddy profile found")
    return profile


@app.patch("/community/buddy/profile", response_model=schemas.BuddyProfileOut)
def update_buddy_profile(
    payload: schemas.BuddyProfileUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(404, "No buddy profile found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, val)
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@app.delete("/community/buddy/profile", status_code=204)
def delete_buddy_profile(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(404, "No buddy profile found")
    # Dissolve active pairs
    pair = _get_active_pair(user_id, db)
    if pair:
        pair.status = "dissolved"
    db.delete(profile)
    db.commit()


# ── Buddy Matching ────────────────────────────────────────────────────────────

@app.get("/community/buddy/matches", response_model=List[schemas.BuddyCandidateOut])
def get_buddy_matches(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    me = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    if not me:
        raise HTTPException(400, "Create a buddy profile first")

    # IDs already paired with this user
    paired_ids = set()
    pairs = db.query(models.BuddyPair).filter(
        ((models.BuddyPair.user_a_id == user_id) | (models.BuddyPair.user_b_id == user_id)),
        models.BuddyPair.status == "active",
    ).all()
    for p in pairs:
        paired_ids.add(p.user_a_id)
        paired_ids.add(p.user_b_id)

    # IDs with pending requests from/to this user
    request_ids = set()
    requests = db.query(models.BuddyRequest).filter(
        ((models.BuddyRequest.from_user_id == user_id) | (models.BuddyRequest.to_user_id == user_id)),
        models.BuddyRequest.status == "pending",
    ).all()
    for r in requests:
        request_ids.add(r.from_user_id)
        request_ids.add(r.to_user_id)

    excluded = paired_ids | request_ids | {user_id}

    candidates = db.query(models.BuddyProfile).filter(
        models.BuddyProfile.status == "seeking",
        ~models.BuddyProfile.user_id.in_(excluded),
    ).all()

    my_days = set(me.preferred_days.split(",")) if me.preferred_days else set()

    scored = []
    for c in candidates:
        c_days = set(c.preferred_days.split(",")) if c.preferred_days else set()
        score = (
            (3 if me.goal == c.goal else 0) +
            (2 if me.fitness_level == c.fitness_level else 0) +
            len(my_days & c_days)
        )
        scored.append({"alias": c.alias, "fitness_level": c.fitness_level, "goal": c.goal, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:3]


@app.post("/community/buddy/request/{alias}", status_code=201)
def send_buddy_request(
    alias: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    me = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    if not me:
        raise HTTPException(400, "Create a buddy profile first")

    target = db.query(models.BuddyProfile).filter(models.BuddyProfile.alias == alias).first()
    if not target:
        raise HTTPException(404, "Buddy not found")
    if target.user_id == user_id:
        raise HTTPException(400, "Cannot send request to yourself")

    existing = db.query(models.BuddyRequest).filter(
        models.BuddyRequest.from_user_id == user_id,
        models.BuddyRequest.to_user_id == target.user_id,
    ).first()
    if existing:
        raise HTTPException(409, "Request already sent")

    req = models.BuddyRequest(
        id           = str(uuid.uuid4()),
        from_user_id = user_id,
        to_user_id   = target.user_id,
    )
    db.add(req)
    db.commit()
    _send_notification(
        target.user_id,
        "New buddy request",
        f"{me.alias} wants to be your accountability buddy. Open the Community tab to accept.",
    )
    return {"status": "ok", "message": f"Request sent to {alias}"}


@app.get("/community/buddy/requests", response_model=List[schemas.BuddyRequestOut])
def list_buddy_requests(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    requests = db.query(models.BuddyRequest).filter(
        models.BuddyRequest.to_user_id == user_id,
        models.BuddyRequest.status == "pending",
    ).all()

    result = []
    for r in requests:
        sender = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == r.from_user_id).first()
        if sender:
            result.append(schemas.BuddyRequestOut(
                id=r.id,
                from_alias=sender.alias,
                fitness_level=sender.fitness_level,
                goal=sender.goal,
                created_at=r.created_at,
            ))
    return result


@app.post("/community/buddy/requests/{request_id}/accept", response_model=schemas.PairOut)
def accept_buddy_request(
    request_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    req = db.query(models.BuddyRequest).filter(
        models.BuddyRequest.id == request_id,
        models.BuddyRequest.to_user_id == user_id,
        models.BuddyRequest.status == "pending",
    ).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.status = "accepted"
    pair = models.BuddyPair(
        id        = str(uuid.uuid4()),
        user_a_id = req.from_user_id,
        user_b_id = user_id,
    )
    db.add(pair)
    # Mark both profiles as matched
    for uid in [req.from_user_id, user_id]:
        p = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == uid).first()
        if p:
            p.status = "matched"
    try:
        db.commit()
        db.refresh(pair)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to create pair")

    partner_profile = db.query(models.BuddyProfile).filter(
        models.BuddyProfile.user_id == req.from_user_id
    ).first()
    accepter_profile = db.query(models.BuddyProfile).filter(
        models.BuddyProfile.user_id == user_id
    ).first()
    accepter_alias = accepter_profile.alias if accepter_profile else "Someone"
    _send_notification(
        req.from_user_id,
        "Buddy request accepted!",
        f"{accepter_alias} accepted your buddy request. You're now matched!",
    )
    return schemas.PairOut(
        id=pair.id,
        partner_alias=partner_profile.alias if partner_profile else "Unknown",
        matched_at=pair.matched_at,
        status=pair.status,
    )


@app.delete("/community/buddy/requests/{request_id}", status_code=204)
def decline_buddy_request(
    request_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    req = db.query(models.BuddyRequest).filter(
        models.BuddyRequest.id == request_id,
        models.BuddyRequest.to_user_id == user_id,
    ).first()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status = "declined"
    db.commit()


# ── Active Pair ───────────────────────────────────────────────────────────────

@app.get("/community/buddy/pair", response_model=schemas.PairOut)
def get_my_pair(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")
    return schemas.PairOut(
        id=pair.id,
        partner_alias=_partner_alias(pair, user_id, db),
        matched_at=pair.matched_at,
        status=pair.status,
        pair_streak=pair.pair_streak or 0,
    )


@app.delete("/community/buddy/pair", status_code=204)
def dissolve_pair(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")
    pair.status = "dissolved"
    for uid in [pair.user_a_id, pair.user_b_id]:
        p = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == uid).first()
        if p:
            p.status = "seeking"
    db.commit()


# ── Check-ins ─────────────────────────────────────────────────────────────────

@app.get("/community/buddy/checkins", response_model=List[schemas.CheckinOut])
def get_checkins(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")

    since = _get_week_start() - timedelta(weeks=4)
    checkins = db.query(models.CheckinRequest).filter(
        models.CheckinRequest.pair_id == pair.id,
        models.CheckinRequest.week_start >= since,
    ).order_by(models.CheckinRequest.week_start.desc()).all()

    is_a = pair.user_a_id == user_id
    result = []
    for c in checkins:
        result.append(schemas.CheckinOut(
            id=c.id,
            week_start=c.week_start,
            my_response=c.a_response   if is_a else c.b_response,
            their_response=c.b_response if is_a else c.a_response,
            my_difficulty=c.a_difficulty   if is_a else c.b_difficulty,
            their_difficulty=c.b_difficulty if is_a else c.a_difficulty,
            my_note=c.a_note   if is_a else c.b_note,
            their_note=c.b_note if is_a else c.a_note,
            created_at=c.created_at,
        ))
    return result


@app.post("/community/buddy/checkins/{checkin_id}/respond")
def respond_checkin(
    checkin_id: str,
    payload: schemas.CheckinRespondIn,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    if payload.response not in ("thumbs_up", "thumbs_down"):
        raise HTTPException(400, "response must be thumbs_up or thumbs_down")

    checkin = db.query(models.CheckinRequest).filter(models.CheckinRequest.id == checkin_id).first()
    if not checkin:
        raise HTTPException(404, "Check-in not found")

    pair = db.query(models.BuddyPair).filter(models.BuddyPair.id == checkin.pair_id).first()
    if not pair or (pair.user_a_id != user_id and pair.user_b_id != user_id):
        raise HTTPException(403, "Not part of this buddy pair")

    my_profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    my_alias = my_profile.alias if my_profile else "Your buddy"

    if pair.user_a_id == user_id:
        checkin.a_response   = payload.response
        checkin.a_difficulty = payload.difficulty
        checkin.a_note       = payload.note
    else:
        checkin.b_response   = payload.response
        checkin.b_difficulty = payload.difficulty
        checkin.b_note       = payload.note
    db.commit()

    # Notify the partner that this user has checked in
    partner_id = _partner_id(pair, user_id)
    _send_notification(
        partner_id,
        "Buddy checked in!",
        f"{my_alias} completed their check-in — it's your turn!",
    )
    return {"status": "ok"}


# ── Buddy Messages ────────────────────────────────────────────────────────────

@app.get("/community/buddy/messages", response_model=List[schemas.MessageOut])
def get_messages(
    limit: int = 50,
    before_id: Optional[str] = None,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")

    q = db.query(models.BuddyMessage).filter(models.BuddyMessage.pair_id == pair.id)
    if before_id:
        ref = db.query(models.BuddyMessage).filter(models.BuddyMessage.id == before_id).first()
        if ref:
            q = q.filter(models.BuddyMessage.sent_at < ref.sent_at)

    messages = q.order_by(models.BuddyMessage.sent_at.desc()).limit(limit).all()
    messages.reverse()

    # Build alias lookup
    aliases = {}
    for uid in [pair.user_a_id, pair.user_b_id]:
        p = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == uid).first()
        aliases[uid] = p.alias if p else "Unknown"

    # Mark partner's messages as read
    for m in messages:
        if m.sender_id != user_id and not m.read:
            m.read = True
    db.commit()

    return [
        schemas.MessageOut(
            id=m.id,
            sender_alias=aliases.get(m.sender_id, "Unknown"),
            content=m.content,
            sent_at=m.sent_at,
            is_mine=(m.sender_id == user_id),
            read=m.read,
        )
        for m in messages
    ]


@app.post("/community/buddy/messages", response_model=schemas.MessageOut, status_code=201)
def send_message(
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")

    my_profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    msg = models.BuddyMessage(
        id        = str(uuid.uuid4()),
        pair_id   = pair.id,
        sender_id = user_id,
        content   = payload.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return schemas.MessageOut(
        id=msg.id,
        sender_alias=my_profile.alias if my_profile else "Unknown",
        content=msg.content,
        sent_at=msg.sent_at,
        is_mine=True,
    )


# ── Buddy Dares ───────────────────────────────────────────────────────────────

@app.get("/community/buddy/dare", response_model=Optional[schemas.DareOut])
def get_current_dare(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")
    week_start = _get_week_start()
    dare = db.query(models.BuddyDare).filter(
        models.BuddyDare.pair_id == pair.id,
        models.BuddyDare.week_start == week_start,
    ).first()
    if not dare:
        return None
    issuer = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == dare.issued_by_user_id).first()
    return schemas.DareOut(
        id=dare.id,
        issued_by_alias=issuer.alias if issuer else "Unknown",
        dare_text=dare.dare_text,
        week_start=dare.week_start,
        accepted=dare.accepted,
        issuer_completed=dare.issuer_completed,
        receiver_completed=dare.receiver_completed,
        is_mine=(dare.issued_by_user_id == user_id),
        created_at=dare.created_at,
    )


@app.post("/community/buddy/dare", response_model=schemas.DareOut, status_code=201)
def create_dare(
    payload: schemas.DareCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")

    week_start = _get_week_start()
    existing = db.query(models.BuddyDare).filter(
        models.BuddyDare.pair_id == pair.id,
        models.BuddyDare.week_start == week_start,
    ).first()
    if existing:
        raise HTTPException(409, "A dare already exists for this week")

    dare = models.BuddyDare(
        pair_id=pair.id,
        issued_by_user_id=user_id,
        week_start=week_start,
        dare_text=payload.dare_text,
    )
    db.add(dare)
    db.commit()
    db.refresh(dare)

    my_profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    partner_id = _partner_id(pair, user_id)
    _send_notification(
        partner_id,
        "You've been dared!",
        f"{my_profile.alias if my_profile else 'Your buddy'} dared you: {payload.dare_text[:80]}",
    )
    return schemas.DareOut(
        id=dare.id,
        issued_by_alias=my_profile.alias if my_profile else "Unknown",
        dare_text=dare.dare_text,
        week_start=dare.week_start,
        accepted=dare.accepted,
        issuer_completed=dare.issuer_completed,
        receiver_completed=dare.receiver_completed,
        is_mine=True,
        created_at=dare.created_at,
    )


@app.patch("/community/buddy/dare/{dare_id}/accept", response_model=schemas.DareOut)
def accept_dare(
    dare_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    dare = db.query(models.BuddyDare).filter(models.BuddyDare.id == dare_id).first()
    if not dare:
        raise HTTPException(404, "Dare not found")
    pair = db.query(models.BuddyPair).filter(models.BuddyPair.id == dare.pair_id).first()
    if not pair or (pair.user_a_id != user_id and pair.user_b_id != user_id):
        raise HTTPException(403, "Not part of this buddy pair")
    if dare.issued_by_user_id == user_id:
        raise HTTPException(400, "Cannot accept your own dare")
    dare.accepted = True
    db.commit()
    issuer = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == dare.issued_by_user_id).first()
    return schemas.DareOut(
        id=dare.id,
        issued_by_alias=issuer.alias if issuer else "Unknown",
        dare_text=dare.dare_text,
        week_start=dare.week_start,
        accepted=dare.accepted,
        issuer_completed=dare.issuer_completed,
        receiver_completed=dare.receiver_completed,
        is_mine=False,
        created_at=dare.created_at,
    )


@app.patch("/community/buddy/dare/{dare_id}/complete", response_model=schemas.DareOut)
def complete_dare(
    dare_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    dare = db.query(models.BuddyDare).filter(models.BuddyDare.id == dare_id).first()
    if not dare:
        raise HTTPException(404, "Dare not found")
    pair = db.query(models.BuddyPair).filter(models.BuddyPair.id == dare.pair_id).first()
    if not pair or (pair.user_a_id != user_id and pair.user_b_id != user_id):
        raise HTTPException(403, "Not part of this buddy pair")

    is_issuer = dare.issued_by_user_id == user_id
    if is_issuer:
        dare.issuer_completed = True
    else:
        dare.receiver_completed = True
    db.commit()

    # Notify partner
    my_profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    partner_id = _partner_id(pair, user_id)
    _send_notification(
        partner_id,
        "Dare completed!",
        f"{my_profile.alias if my_profile else 'Your buddy'} completed the dare!",
    )

    issuer = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == dare.issued_by_user_id).first()
    return schemas.DareOut(
        id=dare.id,
        issued_by_alias=issuer.alias if issuer else "Unknown",
        dare_text=dare.dare_text,
        week_start=dare.week_start,
        accepted=dare.accepted,
        issuer_completed=dare.issuer_completed,
        receiver_completed=dare.receiver_completed,
        is_mine=is_issuer,
        created_at=dare.created_at,
    )


# ── Buddy Reactions (milestone celebration) ───────────────────────────────────

@app.post("/community/buddy/reactions", status_code=201)
def react_to_milestone(
    payload: schemas.ReactionCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    if payload.reaction not in ("fire", "muscle", "clap"):
        raise HTTPException(400, "reaction must be fire | muscle | clap")

    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")

    reaction = models.BuddyReaction(
        pair_id=pair.id,
        from_user_id=user_id,
        badge_type=payload.badge_type,
        reaction=payload.reaction,
    )
    db.add(reaction)
    db.commit()

    my_profile = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == user_id).first()
    emoji = {"fire": "🔥", "muscle": "💪", "clap": "🙌"}.get(payload.reaction, "")
    partner_id = _partner_id(pair, user_id)
    _send_notification(
        partner_id,
        "Your buddy reacted!",
        f"{my_profile.alias if my_profile else 'Your buddy'} reacted {emoji} to your achievement!",
    )
    return {"status": "ok"}


# ── Partner Activity Pulse ────────────────────────────────────────────────────

def _fetch_weekly_workout_count(user_id: str) -> Optional[int]:
    try:
        resp = httpx.get(
            f"{WORKOUT_URL}/workouts/internal/weekly-stats",
            params={"user_id": user_id},
            headers={"X-Internal-Secret": SECRET_KEY},
            timeout=3.0,
        )
        if resp.status_code == 200:
            return resp.json().get("workout_count")
    except Exception:
        pass
    return None


def _fetch_weekly_mood_avg(user_id: str) -> Optional[float]:
    try:
        resp = httpx.get(
            f"{HEALTH_URL}/health/internal/weekly-stats",
            params={"user_id": user_id},
            headers={"X-Internal-Secret": SECRET_KEY},
            timeout=3.0,
        )
        if resp.status_code == 200:
            return resp.json().get("mood_avg")
    except Exception:
        pass
    return None


@app.get("/community/buddy/partner-pulse", response_model=schemas.PartnerPulseOut)
def get_partner_pulse(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")

    partner_id = _partner_id(pair, user_id)
    partner_alias = _partner_alias(pair, user_id, db)

    workout_count = _fetch_weekly_workout_count(partner_id)
    mood_avg = _fetch_weekly_mood_avg(partner_id)

    # Last active = last message or check-in from partner
    last_message = db.query(models.BuddyMessage).filter(
        models.BuddyMessage.pair_id == pair.id,
        models.BuddyMessage.sender_id == partner_id,
    ).order_by(models.BuddyMessage.sent_at.desc()).first()

    last_active_days_ago = None
    if last_message:
        delta = datetime.utcnow() - last_message.sent_at
        last_active_days_ago = delta.days

    return schemas.PartnerPulseOut(
        partner_alias=partner_alias,
        workout_count=workout_count,
        mood_avg=mood_avg,
        last_active_days_ago=last_active_days_ago,
    )


# ── Weekly Pair Wrap ──────────────────────────────────────────────────────────

@app.get("/community/buddy/weekly-wrap", response_model=schemas.WeeklyWrapOut)
def get_weekly_wrap(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    pair = _get_active_pair(user_id, db)
    if not pair:
        raise HTTPException(404, "No active buddy pair")

    partner_id = _partner_id(pair, user_id)
    partner_alias = _partner_alias(pair, user_id, db)
    week_start = _get_week_start()

    # Workout counts from workout-service
    my_workouts    = _fetch_weekly_workout_count(user_id)
    their_workouts = _fetch_weekly_workout_count(partner_id)

    # Messages this week
    messages_this_week = db.query(models.BuddyMessage).filter(
        models.BuddyMessage.pair_id == pair.id,
        models.BuddyMessage.sent_at >= datetime.combine(week_start, datetime.min.time()),
    ).count()

    # Checkin status
    checkin = db.query(models.CheckinRequest).filter(
        models.CheckinRequest.pair_id == pair.id,
        models.CheckinRequest.week_start == week_start,
    ).first()
    both_responded = bool(checkin and checkin.a_response and checkin.b_response)

    # Current dare
    dare_row = db.query(models.BuddyDare).filter(
        models.BuddyDare.pair_id == pair.id,
        models.BuddyDare.week_start == week_start,
    ).first()
    dare_out = None
    if dare_row:
        issuer = db.query(models.BuddyProfile).filter(models.BuddyProfile.user_id == dare_row.issued_by_user_id).first()
        dare_out = schemas.DareOut(
            id=dare_row.id,
            issued_by_alias=issuer.alias if issuer else "Unknown",
            dare_text=dare_row.dare_text,
            week_start=dare_row.week_start,
            accepted=dare_row.accepted,
            issuer_completed=dare_row.issuer_completed,
            receiver_completed=dare_row.receiver_completed,
            is_mine=(dare_row.issued_by_user_id == user_id),
            created_at=dare_row.created_at,
        )

    return schemas.WeeklyWrapOut(
        partner_alias=partner_alias,
        my_workouts=my_workouts,
        their_workouts=their_workouts,
        pair_streak=pair.pair_streak or 0,
        messages_this_week=messages_this_week,
        checkin_both_responded=both_responded,
        dare=dare_out,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3.2 GROUP CHALLENGES
# ─────────────────────────────────────────────────────────────────────────────

def _challenge_out(c: models.Challenge, user_id: str, db: Session) -> schemas.ChallengeOut:
    member_count = len(c.members)
    is_member = any(m.user_id == user_id for m in c.members)
    return schemas.ChallengeOut(
        id=c.id, title=c.title, description=c.description,
        metric_type=c.metric_type, duration_days=c.duration_days,
        target_value=c.target_value, starts_at=c.starts_at, ends_at=c.ends_at,
        is_active=c.is_active, member_count=member_count,
        created_at=c.created_at, is_member=is_member,
    )


@app.get("/community/challenges", response_model=List[schemas.ChallengeOut])
def list_challenges(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    challenges = (
        db.query(models.Challenge)
        .filter(models.Challenge.is_active == True)
        .order_by(models.Challenge.starts_at.asc())
        .offset(offset).limit(limit).all()
    )
    return [_challenge_out(c, user_id, db) for c in challenges]


@app.get("/community/challenges/{challenge_id}", response_model=schemas.ChallengeOut)
def get_challenge(
    challenge_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    c = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not c:
        raise HTTPException(404, "Challenge not found")
    return _challenge_out(c, user_id, db)


@app.post("/community/challenges", response_model=schemas.ChallengeOut, status_code=201)
def create_challenge(
    payload: schemas.ChallengeCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    _require_trainer_or_admin(token_data)
    user_id = token_data["user_id"]
    c = models.Challenge(
        id           = str(uuid.uuid4()),
        title        = payload.title,
        description  = payload.description,
        metric_type  = payload.metric_type,
        duration_days= payload.duration_days,
        target_value = payload.target_value,
        starts_at    = payload.starts_at,
        ends_at      = payload.ends_at,
        created_by   = user_id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _challenge_out(c, user_id, db)


@app.patch("/community/challenges/{challenge_id}", response_model=schemas.ChallengeOut)
def update_challenge(
    challenge_id: str,
    payload: schemas.ChallengeUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    _require_trainer_or_admin(token_data)
    user_id = token_data["user_id"]
    c = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not c:
        raise HTTPException(404, "Challenge not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(c, field, val)
    db.commit()
    db.refresh(c)
    return _challenge_out(c, user_id, db)


@app.delete("/community/challenges/{challenge_id}", status_code=204)
def delete_challenge(
    challenge_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    if token_data.get("role") != "admin":
        raise HTTPException(403, "Admin role required")
    c = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not c:
        raise HTTPException(404, "Challenge not found")
    c.is_active = False
    db.commit()


@app.post("/community/challenges/{challenge_id}/join", status_code=201)
def join_challenge(
    challenge_id: str,
    payload: schemas.JoinChallengeIn,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    c = db.query(models.Challenge).filter(
        models.Challenge.id == challenge_id,
        models.Challenge.is_active == True,
    ).first()
    if not c:
        raise HTTPException(404, "Challenge not found")

    existing = db.query(models.ChallengeMember).filter(
        models.ChallengeMember.challenge_id == challenge_id,
        models.ChallengeMember.user_id == user_id,
    ).first()
    if existing:
        raise HTTPException(409, "Already joined this challenge")

    alias = _get_or_create_alias(user_id, db)
    member = models.ChallengeMember(
        id             = str(uuid.uuid4()),
        challenge_id   = challenge_id,
        user_id        = user_id,
        alias          = alias,
        baseline_value = payload.baseline_value,
        current_value  = payload.baseline_value,
    )
    db.add(member)
    db.commit()
    return {"status": "ok", "alias": alias}


@app.delete("/community/challenges/{challenge_id}/leave", status_code=204)
def leave_challenge(
    challenge_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    member = db.query(models.ChallengeMember).filter(
        models.ChallengeMember.challenge_id == challenge_id,
        models.ChallengeMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Not a member of this challenge")
    db.delete(member)
    db.commit()


@app.get("/community/challenges/{challenge_id}/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(
    challenge_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    c = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not c:
        raise HTTPException(404, "Challenge not found")

    entries = []
    for m in c.members:
        if m.baseline_value > 0:
            pct = (m.current_value - m.baseline_value) / m.baseline_value * 100
        else:
            pct = 0.0
        entries.append(schemas.LeaderboardEntry(
            alias=m.alias,
            baseline_value=m.baseline_value,
            current_value=m.current_value,
            pct_improvement=round(pct, 1),
            completed=m.completed,
            is_mine=(m.user_id == user_id),
        ))
    entries.sort(key=lambda x: x.pct_improvement, reverse=True)
    return entries


@app.patch("/community/challenges/{challenge_id}/progress")
def update_challenge_progress(
    challenge_id: str,
    payload: schemas.ProgressUpdateIn,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    member = db.query(models.ChallengeMember).filter(
        models.ChallengeMember.challenge_id == challenge_id,
        models.ChallengeMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Not a member of this challenge")
    member.current_value = payload.current_value
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if challenge and member.current_value >= challenge.target_value:
        member.completed = True
    db.commit()
    return {"status": "ok", "current_value": member.current_value, "completed": member.completed}


# ─────────────────────────────────────────────────────────────────────────────
# 3.3 COMMUNITY FEED
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/community/feed/opt-in", response_model=schemas.FeedOptInOut)
def get_feed_optin(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    optin = db.query(models.FeedOptIn).filter(models.FeedOptIn.user_id == user_id).first()
    if not optin:
        raise HTTPException(404, "Not opted in to feed")
    return optin


@app.post("/community/feed/opt-in", response_model=schemas.FeedOptInOut, status_code=201)
def opt_in_feed(
    payload: schemas.FeedOptInCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    existing = db.query(models.FeedOptIn).filter(models.FeedOptIn.user_id == user_id).first()
    if existing:
        return existing

    alias = _get_or_create_alias(user_id, db)
    optin = models.FeedOptIn(
        user_id   = user_id,
        alias     = alias,
        goal_type = payload.goal_type,
    )
    db.add(optin)
    db.commit()
    db.refresh(optin)
    return optin


@app.delete("/community/feed/opt-in", status_code=204)
def opt_out_feed(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    optin = db.query(models.FeedOptIn).filter(models.FeedOptIn.user_id == user_id).first()
    if not optin:
        raise HTTPException(404, "Not opted in")
    # Delete user's posts too
    db.query(models.FeedPost).filter(models.FeedPost.user_id == user_id).delete()
    db.delete(optin)
    db.commit()


@app.get("/community/feed", response_model=List[schemas.FeedPostOut])
def get_feed(
    goal_type: Optional[str] = None,
    limit: int = 20,
    before_id: Optional[str] = None,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    q = db.query(models.FeedPost)
    if goal_type:
        q = q.filter(models.FeedPost.goal_type == goal_type)
    if before_id:
        ref = db.query(models.FeedPost).filter(models.FeedPost.id == before_id).first()
        if ref:
            q = q.filter(models.FeedPost.created_at < ref.created_at)
    posts = q.order_by(models.FeedPost.created_at.desc()).limit(limit).all()

    result = []
    for p in posts:
        my_reaction = any(r.user_id == user_id for r in p.reactions)
        result.append(schemas.FeedPostOut(
            id=p.id,
            alias=p.alias,
            milestone_type=p.milestone_type,
            message=p.message,
            goal_type=p.goal_type,
            comment_count=len(p.comments),
            created_at=p.created_at,
            my_reaction=my_reaction,
            is_mine=(p.user_id == user_id),
        ))
    return result


@app.post("/community/feed/posts", response_model=schemas.FeedPostOut, status_code=201)
def create_feed_post(
    payload: schemas.FeedPostCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    optin = db.query(models.FeedOptIn).filter(models.FeedOptIn.user_id == user_id).first()
    if not optin:
        raise HTTPException(403, "Opt in to the community feed first")

    post = models.FeedPost(
        id             = str(uuid.uuid4()),
        user_id        = user_id,
        alias          = optin.alias,
        milestone_type = payload.milestone_type,
        message        = payload.message,
        goal_type      = payload.goal_type,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return schemas.FeedPostOut(
        id=post.id, alias=post.alias, milestone_type=post.milestone_type,
        message=post.message, goal_type=post.goal_type, comment_count=0,
        created_at=post.created_at, my_reaction=False, is_mine=True,
    )


@app.delete("/community/feed/posts/{post_id}", status_code=204)
def delete_feed_post(
    post_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    post = db.query(models.FeedPost).filter(
        models.FeedPost.id == post_id,
        models.FeedPost.user_id == user_id,
    ).first()
    if not post:
        raise HTTPException(404, "Post not found")
    db.delete(post)
    db.commit()


@app.post("/community/feed/posts/{post_id}/react")
def toggle_reaction(
    post_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    post = db.query(models.FeedPost).filter(models.FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    existing = db.query(models.FeedReaction).filter(
        models.FeedReaction.post_id == post_id,
        models.FeedReaction.user_id == user_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"reacted": False}
    else:
        reaction = models.FeedReaction(
            id=str(uuid.uuid4()), post_id=post_id, user_id=user_id
        )
        db.add(reaction)
        db.commit()
        return {"reacted": True}


@app.get("/community/feed/posts/{post_id}/reaction-count")
def get_reaction_count(
    post_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    post = db.query(models.FeedPost).filter(models.FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != user_id:
        raise HTTPException(403, "Only the post author can see reaction count")
    count = db.query(models.FeedReaction).filter(models.FeedReaction.post_id == post_id).count()
    return {"count": count}


@app.get("/community/feed/posts/{post_id}/comments", response_model=List[schemas.CommentOut])
def get_comments(
    post_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    post = db.query(models.FeedPost).filter(models.FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    comments = db.query(models.FeedComment).filter(
        models.FeedComment.post_id == post_id
    ).order_by(models.FeedComment.created_at.asc()).all()
    return [
        schemas.CommentOut(
            id=c.id, alias=c.alias, text=c.text,
            created_at=c.created_at, is_mine=(c.user_id == user_id)
        )
        for c in comments
    ]


@app.post("/community/feed/posts/{post_id}/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(
    post_id: str,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    post = db.query(models.FeedPost).filter(models.FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    alias = _get_or_create_alias(user_id, db)
    comment = models.FeedComment(
        id=str(uuid.uuid4()), post_id=post_id,
        user_id=user_id, alias=alias, text=payload.text,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return schemas.CommentOut(
        id=comment.id, alias=comment.alias, text=comment.text,
        created_at=comment.created_at, is_mine=True,
    )


@app.delete("/community/feed/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    comment = db.query(models.FeedComment).filter(
        models.FeedComment.id == comment_id,
        models.FeedComment.user_id == user_id,
    ).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
    db.delete(comment)
    db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# 3.4 EXPERT CONTENT HUB
# ─────────────────────────────────────────────────────────────────────────────

def _content_out(c: models.ExpertContent, user_id: str, db: Session, is_pro: bool = False) -> schemas.ContentOut:
    ratings = c.ratings
    avg_rating = round(sum(r.stars for r in ratings) / len(ratings), 1) if ratings else None
    own_rating = next((r.stars for r in ratings if r.user_id == user_id), None)
    pro_gate = c.is_paid and not is_pro
    body = c.body[:500] + "…" if pro_gate and len(c.body) > 500 else c.body
    return schemas.ContentOut(
        id=c.id, author_id=c.author_id, content_type=c.content_type,
        title=c.title, body=body, goal_type=c.goal_type,
        fitness_level=c.fitness_level, video_url=c.video_url,
        is_paid=c.is_paid, pro_gate=pro_gate,
        avg_rating=avg_rating, own_rating=own_rating,
        published=c.published, created_at=c.created_at,
    )


@app.get("/community/content", response_model=List[schemas.ContentOut])
def list_content(
    content_type: Optional[str] = None,
    goal_type: Optional[str] = None,
    fitness_level: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    q = db.query(models.ExpertContent).filter(models.ExpertContent.published == True)
    if content_type:
        q = q.filter(models.ExpertContent.content_type == content_type)
    if goal_type:
        q = q.filter(models.ExpertContent.goal_type == goal_type)
    if fitness_level:
        q = q.filter(models.ExpertContent.fitness_level == fitness_level)
    items = q.order_by(models.ExpertContent.created_at.desc()).offset(offset).limit(limit).all()
    return [_content_out(c, user_id, db) for c in items]


@app.get("/community/content/{content_id}", response_model=schemas.ContentOut)
def get_content(
    content_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    c = db.query(models.ExpertContent).filter(models.ExpertContent.id == content_id).first()
    if not c or not c.published:
        raise HTTPException(404, "Content not found")
    return _content_out(c, user_id, db)


@app.post("/community/content", response_model=schemas.ContentOut, status_code=201)
def create_content(
    payload: schemas.ContentCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    _require_trainer_or_admin(token_data)
    user_id = token_data["user_id"]
    c = models.ExpertContent(
        id            = str(uuid.uuid4()),
        author_id     = user_id,
        content_type  = payload.content_type,
        title         = payload.title,
        body          = payload.body,
        goal_type     = payload.goal_type,
        fitness_level = payload.fitness_level,
        video_url     = payload.video_url,
        is_paid       = payload.is_paid,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _content_out(c, user_id, db)


@app.patch("/community/content/{content_id}", response_model=schemas.ContentOut)
def update_content(
    content_id: str,
    payload: schemas.ContentUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    _require_trainer_or_admin(token_data)
    user_id = token_data["user_id"]
    c = db.query(models.ExpertContent).filter(models.ExpertContent.id == content_id).first()
    if not c:
        raise HTTPException(404, "Content not found")
    if c.author_id != user_id and token_data.get("role") != "admin":
        raise HTTPException(403, "Not your content")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(c, field, val)
    c.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(c)
    return _content_out(c, user_id, db)


@app.post("/community/content/{content_id}/publish")
def publish_content(
    content_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    _require_trainer_or_admin(token_data)
    user_id = token_data["user_id"]
    c = db.query(models.ExpertContent).filter(models.ExpertContent.id == content_id).first()
    if not c:
        raise HTTPException(404, "Content not found")
    if c.author_id != user_id and token_data.get("role") != "admin":
        raise HTTPException(403, "Not your content")
    c.published = True
    db.commit()
    return {"status": "published"}


@app.post("/community/content/{content_id}/rate")
def rate_content(
    content_id: str,
    payload: schemas.RateContentIn,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    c = db.query(models.ExpertContent).filter(models.ExpertContent.id == content_id).first()
    if not c or not c.published:
        raise HTTPException(404, "Content not found")

    existing = db.query(models.ContentRating).filter(
        models.ContentRating.content_id == content_id,
        models.ContentRating.user_id == user_id,
    ).first()
    if existing:
        existing.stars = payload.stars
    else:
        db.add(models.ContentRating(
            id=str(uuid.uuid4()), content_id=content_id,
            user_id=user_id, stars=payload.stars,
        ))
    db.commit()
    return {"status": "ok", "stars": payload.stars}


@app.get("/community/content/{content_id}/rating")
def get_content_rating(
    content_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token),
):
    user_id = token_data["user_id"]
    ratings = db.query(models.ContentRating).filter(
        models.ContentRating.content_id == content_id
    ).all()
    avg = round(sum(r.stars for r in ratings) / len(ratings), 1) if ratings else None
    own = next((r.stars for r in ratings if r.user_id == user_id), None)
    return {"avg_rating": avg, "own_rating": own, "count": len(ratings)}


# ─────────────────────────────────────────────────────────────────────────────
# INTERNAL ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/community/internal/milestone", status_code=200)
def internal_milestone(
    payload: schemas.MilestoneEvent,
    x_internal_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if x_internal_secret != SECRET_KEY:
        raise HTTPException(403, "Forbidden")

    # Auto-post to feed if user is opted in
    optin = db.query(models.FeedOptIn).filter(models.FeedOptIn.user_id == payload.user_id).first()
    if optin:
        post = models.FeedPost(
            id             = str(uuid.uuid4()),
            user_id        = payload.user_id,
            alias          = optin.alias,
            milestone_type = payload.badge_type,
            goal_type      = payload.goal_type or optin.goal_type,
        )
        db.add(post)

    # Update challenge progress for matching metric
    metric_map = {
        "first_workout": "workouts_count",
        "streak_7": "workouts_count",
        "streak_30": "workouts_count",
        "meals_10": "meals_logged",
        "meals_50": "meals_logged",
    }
    metric = metric_map.get(payload.badge_type)
    if metric:
        members = db.query(models.ChallengeMember).filter(
            models.ChallengeMember.user_id == payload.user_id,
            models.ChallengeMember.completed == False,
        ).all()
        for m in members:
            ch = db.query(models.Challenge).filter(models.Challenge.id == m.challenge_id).first()
            if ch and ch.metric_type == metric and ch.is_active:
                m.current_value = max(m.current_value, payload.metric_value)
                if m.current_value >= ch.target_value:
                    m.completed = True

    try:
        db.commit()
    except Exception:
        db.rollback()
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────────────────────────
# APSCHEDULER CRONS
# ─────────────────────────────────────────────────────────────────────────────

def _create_weekly_checkins():
    """Every Monday: update pair streaks for last week, then create new checkin rows."""
    db = SessionLocal()
    try:
        today = date.today()
        week_start = _get_week_start(today)
        last_week_start = week_start - timedelta(weeks=1)

        pairs = db.query(models.BuddyPair).filter(models.BuddyPair.status == "active").all()
        for pair in pairs:
            # Update streak based on last week's check-in
            last_checkin = db.query(models.CheckinRequest).filter(
                models.CheckinRequest.pair_id == pair.id,
                models.CheckinRequest.week_start == last_week_start,
            ).first()
            if last_checkin and last_checkin.a_response and last_checkin.b_response:
                pair.pair_streak = (pair.pair_streak or 0) + 1
            elif last_checkin:
                pair.pair_streak = 0

            # Create new check-in for this week if not already exists
            existing = db.query(models.CheckinRequest).filter(
                models.CheckinRequest.pair_id == pair.id,
                models.CheckinRequest.week_start == week_start,
            ).first()
            if not existing:
                db.add(models.CheckinRequest(
                    id=str(uuid.uuid4()),
                    pair_id=pair.id,
                    week_start=week_start,
                ))
        db.commit()
    except Exception as e:
        print(f"[checkin-cron] error: {e}")
        db.rollback()
    finally:
        db.close()


def _mark_completed_challenges():
    """Daily: mark challenge members as completed if they hit target and challenge has ended."""
    db = SessionLocal()
    try:
        today = date.today()
        members = db.query(models.ChallengeMember).filter(
            models.ChallengeMember.completed == False,
            models.ChallengeMember.badge_awarded == False,
        ).all()
        for m in members:
            ch = db.query(models.Challenge).filter(models.Challenge.id == m.challenge_id).first()
            if ch and ch.ends_at < today and m.current_value >= ch.target_value:
                m.completed = True
                m.badge_awarded = True
        db.commit()
    except Exception as e:
        print(f"[challenge-cron] error: {e}")
        db.rollback()
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(_create_weekly_checkins,  "cron", day_of_week="mon", hour=0, minute=5)
scheduler.add_job(_mark_completed_challenges, "cron", hour=1, minute=0)
scheduler.start()
