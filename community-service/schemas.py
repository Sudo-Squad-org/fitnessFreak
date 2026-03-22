from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# ── Buddy Profile ─────────────────────────────────────────────────────────────

class BuddyProfileCreate(BaseModel):
    fitness_level:  str  = Field(..., description="beginner | intermediate | advanced")
    goal:           str  = Field(..., description="weight_loss | muscle_gain | maintain | endurance")
    preferred_days: str  = Field(..., description="Comma-separated: mon,wed,fri")
    is_anonymous:   bool = True


class BuddyProfileUpdate(BaseModel):
    fitness_level:  Optional[str]  = None
    goal:           Optional[str]  = None
    preferred_days: Optional[str]  = None
    is_anonymous:   Optional[bool] = None
    status:         Optional[str]  = None


class BuddyProfileOut(BaseModel):
    user_id:       str
    alias:         str
    fitness_level: str
    goal:          str
    preferred_days: str
    is_anonymous:  bool
    status:        str
    created_at:    datetime
    model_config = {"from_attributes": True}


class BuddyCandidateOut(BaseModel):
    alias:         str
    fitness_level: str
    goal:          str
    score:         int


class BuddyRequestOut(BaseModel):
    id:           str
    from_alias:   str
    fitness_level: str
    goal:         str
    created_at:   datetime


class PairOut(BaseModel):
    id:             str
    partner_alias:  str
    matched_at:     datetime
    status:         str
    pair_streak:    int = 0


class CheckinRespondIn(BaseModel):
    response:   str            = Field(..., description="thumbs_up | thumbs_down")
    difficulty: Optional[str]  = Field(None, description="easy | medium | hard")
    note:       Optional[str]  = Field(None, max_length=100)


class CheckinOut(BaseModel):
    id:              str
    week_start:      date
    my_response:     Optional[str]
    their_response:  Optional[str]
    my_difficulty:   Optional[str]
    their_difficulty: Optional[str]
    my_note:         Optional[str]
    their_note:      Optional[str]
    created_at:      datetime


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id:           str
    sender_alias: str
    content:      str
    sent_at:      datetime
    is_mine:      bool
    read:         bool = False


class DareCreate(BaseModel):
    dare_text: str = Field(..., min_length=1, max_length=200)


class DareOut(BaseModel):
    id:                 str
    issued_by_alias:    str
    dare_text:          str
    week_start:         date
    accepted:           bool
    issuer_completed:   bool
    receiver_completed: bool
    is_mine:            bool
    created_at:         datetime


class ReactionCreate(BaseModel):
    badge_type: str
    reaction:   str = Field(..., description="fire | muscle | clap")


class PartnerPulseOut(BaseModel):
    partner_alias:       str
    workout_count:       Optional[int]   = None
    mood_avg:            Optional[float] = None
    last_active_days_ago: Optional[int]  = None


class WeeklyWrapOut(BaseModel):
    partner_alias:          str
    my_workouts:            Optional[int]   = None
    their_workouts:         Optional[int]   = None
    pair_streak:            int
    messages_this_week:     int
    checkin_both_responded: bool
    dare:                   Optional[DareOut] = None


# ── Challenges ────────────────────────────────────────────────────────────────

class ChallengeCreate(BaseModel):
    title:         str   = Field(..., max_length=100)
    description:   Optional[str] = None
    metric_type:   str
    duration_days: int   = Field(..., gt=0)
    target_value:  float = Field(..., gt=0)
    starts_at:     date
    ends_at:       date


class ChallengeUpdate(BaseModel):
    title:       Optional[str]  = None
    description: Optional[str]  = None
    is_active:   Optional[bool] = None


class ChallengeOut(BaseModel):
    id:            str
    title:         str
    description:   Optional[str]
    metric_type:   str
    duration_days: int
    target_value:  float
    starts_at:     date
    ends_at:       date
    is_active:     bool
    member_count:  int
    created_at:    datetime
    is_member:     bool
    model_config = {"from_attributes": True}


class JoinChallengeIn(BaseModel):
    baseline_value: float = Field(..., description="Current metric value at join time")


class ProgressUpdateIn(BaseModel):
    current_value: float = Field(..., ge=0)


class LeaderboardEntry(BaseModel):
    alias:           str
    baseline_value:  float
    current_value:   float
    pct_improvement: float
    completed:       bool
    is_mine:         bool


# ── Feed ──────────────────────────────────────────────────────────────────────

class FeedOptInCreate(BaseModel):
    goal_type: Optional[str] = None


class FeedOptInOut(BaseModel):
    user_id:    str
    alias:      str
    goal_type:  Optional[str]
    opted_in_at: datetime
    model_config = {"from_attributes": True}


class FeedPostCreate(BaseModel):
    milestone_type: str
    message:        Optional[str] = Field(None, max_length=280)
    goal_type:      Optional[str] = None


class FeedPostOut(BaseModel):
    id:             str
    alias:          str
    milestone_type: str
    message:        Optional[str]
    goal_type:      Optional[str]
    comment_count:  int
    created_at:     datetime
    my_reaction:    bool
    is_mine:        bool


class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class CommentOut(BaseModel):
    id:         str
    alias:      str
    text:       str
    created_at: datetime
    is_mine:    bool


# ── Expert Content ────────────────────────────────────────────────────────────

class ContentCreate(BaseModel):
    content_type:  str  = Field(..., description="article | workout_plan | meal_plan")
    title:         str  = Field(..., max_length=200)
    body:          str
    goal_type:     Optional[str] = None
    fitness_level: Optional[str] = None
    video_url:     Optional[str] = Field(None, max_length=500)
    is_paid:       bool = False


class ContentUpdate(BaseModel):
    title:         Optional[str]  = None
    body:          Optional[str]  = None
    goal_type:     Optional[str]  = None
    fitness_level: Optional[str]  = None
    video_url:     Optional[str]  = None
    is_paid:       Optional[bool] = None


class ContentOut(BaseModel):
    id:            str
    author_id:     str
    content_type:  str
    title:         str
    body:          str
    goal_type:     Optional[str]
    fitness_level: Optional[str]
    video_url:     Optional[str]
    is_paid:       bool
    pro_gate:      bool
    avg_rating:    Optional[float]
    own_rating:    Optional[int]
    published:     bool
    created_at:    datetime


class RateContentIn(BaseModel):
    stars: int = Field(..., ge=1, le=5)


# ── Internal ──────────────────────────────────────────────────────────────────

class MilestoneEvent(BaseModel):
    user_id:      str
    badge_type:   str
    goal_type:    str
    metric_value: float
