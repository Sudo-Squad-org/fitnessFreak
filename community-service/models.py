import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Float,
    Integer, Text, UniqueConstraint, Index, ForeignKey,
)
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


# ── 3.1 Buddy System ──────────────────────────────────────────────────────────

class BuddyProfile(Base):
    __tablename__ = "buddy_profiles"

    user_id        = Column(String(36), primary_key=True)
    alias          = Column(String(50),  unique=True, nullable=False, index=True)
    fitness_level  = Column(String(20),  nullable=False)   # beginner | intermediate | advanced
    goal           = Column(String(50),  nullable=False)   # weight_loss | muscle_gain | maintain | endurance
    preferred_days = Column(String(100), nullable=True)    # comma-separated: "mon,wed,fri"
    is_anonymous   = Column(Boolean,     default=True)
    status         = Column(String(20),  default="seeking")  # seeking | matched | paused
    created_at     = Column(DateTime,    default=datetime.utcnow)
    updated_at     = Column(DateTime,    default=datetime.utcnow, onupdate=datetime.utcnow)


class BuddyRequest(Base):
    __tablename__ = "buddy_requests"

    id           = Column(String(36), primary_key=True, default=gen_uuid)
    from_user_id = Column(String(36), nullable=False, index=True)
    to_user_id   = Column(String(36), nullable=False, index=True)
    status       = Column(String(20), default="pending")  # pending | accepted | declined
    created_at   = Column(DateTime,   default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("from_user_id", "to_user_id"),)


class BuddyPair(Base):
    __tablename__ = "buddy_pairs"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    user_a_id   = Column(String(36), ForeignKey("buddy_profiles.user_id"), nullable=False)
    user_b_id   = Column(String(36), ForeignKey("buddy_profiles.user_id"), nullable=False)
    matched_at  = Column(DateTime,   default=datetime.utcnow)
    status      = Column(String(20), default="active")  # active | dissolved
    pair_streak = Column(Integer,    default=0)

    checkins    = relationship("CheckinRequest", back_populates="pair", cascade="all, delete-orphan")
    messages    = relationship("BuddyMessage",   back_populates="pair", cascade="all, delete-orphan")
    dares       = relationship("BuddyDare",      back_populates="pair", cascade="all, delete-orphan")
    reactions   = relationship("BuddyReaction",  back_populates="pair", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("user_a_id", "user_b_id"),)


class CheckinRequest(Base):
    __tablename__ = "checkin_requests"

    id           = Column(String(36),  primary_key=True, default=gen_uuid)
    pair_id      = Column(String(36),  ForeignKey("buddy_pairs.id"), nullable=False, index=True)
    week_start   = Column(Date,        nullable=False)
    a_response   = Column(String(15),  nullable=True)  # thumbs_up | thumbs_down | NULL
    b_response   = Column(String(15),  nullable=True)
    a_difficulty = Column(String(10),  nullable=True)  # easy | medium | hard
    b_difficulty = Column(String(10),  nullable=True)
    a_note       = Column(String(100), nullable=True)
    b_note       = Column(String(100), nullable=True)
    created_at   = Column(DateTime,    default=datetime.utcnow)

    pair         = relationship("BuddyPair", back_populates="checkins")

    __table_args__ = (UniqueConstraint("pair_id", "week_start"),)


class BuddyMessage(Base):
    __tablename__ = "buddy_messages"

    id        = Column(String(36), primary_key=True, default=gen_uuid)
    pair_id   = Column(String(36), ForeignKey("buddy_pairs.id"), nullable=False, index=True)
    sender_id = Column(String(36), nullable=False)
    content   = Column(Text,       nullable=False)
    sent_at   = Column(DateTime,   default=datetime.utcnow)
    read      = Column(Boolean,    default=False)

    pair      = relationship("BuddyPair", back_populates="messages")


class BuddyDare(Base):
    __tablename__ = "buddy_dares"

    id                 = Column(String(36),  primary_key=True, default=gen_uuid)
    pair_id            = Column(String(36),  ForeignKey("buddy_pairs.id"), nullable=False, index=True)
    issued_by_user_id  = Column(String(36),  nullable=False)
    week_start         = Column(Date,        nullable=False)
    dare_text          = Column(String(200), nullable=False)
    accepted           = Column(Boolean,     default=False)
    issuer_completed   = Column(Boolean,     default=False)
    receiver_completed = Column(Boolean,     default=False)
    badge_awarded      = Column(Boolean,     default=False)
    created_at         = Column(DateTime,    default=datetime.utcnow)

    pair               = relationship("BuddyPair", back_populates="dares")

    __table_args__ = (UniqueConstraint("pair_id", "week_start"),)


class BuddyReaction(Base):
    __tablename__ = "buddy_reactions"

    id           = Column(String(36), primary_key=True, default=gen_uuid)
    pair_id      = Column(String(36), ForeignKey("buddy_pairs.id"), nullable=False, index=True)
    from_user_id = Column(String(36), nullable=False)
    badge_type   = Column(String(50), nullable=False)
    reaction     = Column(String(10), nullable=False)  # fire | muscle | clap
    created_at   = Column(DateTime,  default=datetime.utcnow)

    pair         = relationship("BuddyPair", back_populates="reactions")


# ── 3.2 Group Challenges ──────────────────────────────────────────────────────

class Challenge(Base):
    __tablename__ = "challenges"

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    title         = Column(String(100), nullable=False)
    description   = Column(Text,        nullable=True)
    metric_type   = Column(String(50),  nullable=False)  # workouts_count | active_days | meals_logged
    duration_days = Column(Integer,     nullable=False)
    target_value  = Column(Float,       nullable=False)
    starts_at     = Column(Date,        nullable=False)
    ends_at       = Column(Date,        nullable=False)
    created_by    = Column(String(36),  nullable=False)
    is_active     = Column(Boolean,     default=True)
    created_at    = Column(DateTime,    default=datetime.utcnow)

    members       = relationship("ChallengeMember", back_populates="challenge", cascade="all, delete-orphan")


class ChallengeMember(Base):
    __tablename__ = "challenge_members"

    id             = Column(String(36), primary_key=True, default=gen_uuid)
    challenge_id   = Column(String(36), ForeignKey("challenges.id"), nullable=False, index=True)
    user_id        = Column(String(36), nullable=False, index=True)
    alias          = Column(String(50), nullable=False)
    baseline_value = Column(Float,      nullable=False)
    current_value  = Column(Float,      default=0.0)
    completed      = Column(Boolean,    default=False)
    badge_awarded  = Column(Boolean,    default=False)
    joined_at      = Column(DateTime,   default=datetime.utcnow)

    challenge      = relationship("Challenge", back_populates="members")

    __table_args__ = (UniqueConstraint("challenge_id", "user_id"),)


# ── 3.3 Community Feed ────────────────────────────────────────────────────────

class FeedOptIn(Base):
    __tablename__ = "feed_opt_ins"

    user_id     = Column(String(36), primary_key=True)
    alias       = Column(String(50), nullable=False)
    goal_type   = Column(String(50), nullable=True)
    opted_in_at = Column(DateTime,   default=datetime.utcnow)


class FeedPost(Base):
    __tablename__ = "feed_posts"

    id             = Column(String(36), primary_key=True, default=gen_uuid)
    user_id        = Column(String(36), nullable=False, index=True)
    alias          = Column(String(50), nullable=False)
    milestone_type = Column(String(50), nullable=False)
    message        = Column(String(280), nullable=True)
    goal_type      = Column(String(50), nullable=True)
    created_at     = Column(DateTime,   default=datetime.utcnow)

    comments       = relationship("FeedComment",  back_populates="post", cascade="all, delete-orphan")
    reactions      = relationship("FeedReaction", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_feed_posts_goal_type_created", "goal_type", "created_at"),
    )


class FeedComment(Base):
    __tablename__ = "feed_comments"

    id         = Column(String(36),  primary_key=True, default=gen_uuid)
    post_id    = Column(String(36),  ForeignKey("feed_posts.id"), nullable=False, index=True)
    user_id    = Column(String(36),  nullable=False)
    alias      = Column(String(50),  nullable=False)
    text       = Column(String(500), nullable=False)
    created_at = Column(DateTime,    default=datetime.utcnow)

    post       = relationship("FeedPost", back_populates="comments")


class FeedReaction(Base):
    __tablename__ = "feed_reactions"

    id         = Column(String(36), primary_key=True, default=gen_uuid)
    post_id    = Column(String(36), ForeignKey("feed_posts.id"), nullable=False, index=True)
    user_id    = Column(String(36), nullable=False)
    created_at = Column(DateTime,   default=datetime.utcnow)

    post       = relationship("FeedPost", back_populates="reactions")

    __table_args__ = (UniqueConstraint("post_id", "user_id"),)


# ── 3.4 Expert Content Hub ────────────────────────────────────────────────────

class ExpertContent(Base):
    __tablename__ = "expert_content"

    id            = Column(String(36),  primary_key=True, default=gen_uuid)
    author_id     = Column(String(36),  nullable=False, index=True)
    content_type  = Column(String(30),  nullable=False)  # article | workout_plan | meal_plan
    title         = Column(String(200), nullable=False)
    body          = Column(Text,        nullable=False)
    goal_type     = Column(String(50),  nullable=True)
    fitness_level = Column(String(20),  nullable=True)
    video_url     = Column(String(500), nullable=True)
    is_paid       = Column(Boolean,     default=False)
    published     = Column(Boolean,     default=False)
    created_at    = Column(DateTime,    default=datetime.utcnow)
    updated_at    = Column(DateTime,    default=datetime.utcnow, onupdate=datetime.utcnow)

    ratings       = relationship("ContentRating", back_populates="content", cascade="all, delete-orphan")


class ContentRating(Base):
    __tablename__ = "content_ratings"

    id         = Column(String(36), primary_key=True, default=gen_uuid)
    content_id = Column(String(36), ForeignKey("expert_content.id"), nullable=False, index=True)
    user_id    = Column(String(36), nullable=False)
    stars      = Column(Integer,    nullable=False)
    created_at = Column(DateTime,   default=datetime.utcnow)

    content    = relationship("ExpertContent", back_populates="ratings")

    __table_args__ = (UniqueConstraint("content_id", "user_id"),)
