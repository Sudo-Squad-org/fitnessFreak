# FitnessFreak Product Roadmap

> **Status Legend:**
> - `[ ]` — Not Started Yet
> - `[~]` — Working On
> - `[x]` — Done

---

## Current MVP (Already Built)
- [x] Auth service (JWT, role-based)
- [x] Booking service (class browsing, booking, cancellation)
- [x] Nutrition service (macro tracking, health-condition-aware TDEE, food recommendations)
- [x] Workout service (condition-aware weekly plan generation)
- [x] React frontend with dashboard, admin panel, dark/light mode
- [x] Docker Compose microservices architecture

---

## MVP Hardening — Fix Before Growth
> These are existing codebase issues discovered through a full code audit. Fix these before building Phase 1 features on top of them.

### Security & Secrets
- [x] Move all hardcoded secrets to environment variables (`SECRET_KEY`, `ADMIN_SECRET`, DB credentials in all 4 services)
- [x] Remove `print(password)` debug statement leaking passwords to logs (`auth-service/utils.py:13`)
- [x] Fix CORS: replace `allow_origins=["*"]` with explicit frontend origin in all services
- [x] Add rate limiting on login, signup, and admin-create endpoints (use `slowapi`)
- [x] Add JWT authentication to `workout-service` (currently fully public — zero auth)
- [x] Move frontend API base URL to `VITE_API_BASE_URL` env variable (currently hardcoded `localhost:8000`)
- [x] Add Nginx security headers: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`
- [x] Add password strength validation on signup (min length, complexity)

### Auth & Session Management
- [x] Implement token refresh endpoint (currently 24hr tokens with no refresh mechanism)
- [x] Add logout endpoint with token blacklist (Redis or DB-backed)
- [x] Add `GET /auth/me` endpoint so frontend can fetch user profile (currently stored only in localStorage)
- [x] Add email verification on signup (send verification link; block login until verified)
- [x] Add forgot password / password reset flow (email OTP or magic link)
- [x] Validate JWT `exp` claim in booking-service and nutrition-service (currently only signature is checked)

### Data Integrity & Error Handling
- [x] Replace `data: dict` in auth-service endpoints with Pydantic schemas (prevents `KeyError` 500s on missing fields)
- [x] Add `try/except` + `db.rollback()` around all `db.commit()` calls in all services
- [x] Fix N+1 query in `booking-service` `get_my_bookings` (currently 1 DB query per booking — use `joinedload`)
- [x] Add null check for deleted class in booking enrichment (currently crashes with `AttributeError`)
- [x] Add `available_seats <= max_seats` validation in `ClassCreate` schema
- [x] Add admin ability to cancel any user's booking (currently only booking owner can cancel)
- [x] Add booking cancellation deadline (e.g., cannot cancel within 1hr of class start)
- [x] Validate `health_conditions` list against allowed enum values in both nutrition-service and workout-service
- [x] Add waitlist for fully-booked classes (auto-confirm next waiter on cancellation)
- [x] Fix race condition in seat booking: move decrement + check into a single atomic SQL UPDATE

### Performance & Database
- [x] Add database migrations with Alembic to all services (replace raw `ALTER TABLE` in nutrition-service startup)
- [x] Add indexes on high-frequency query columns: `Booking.user_id`, `Booking.class_id`, `MealLog.log_date`, `Food.category`
- [x] Add pagination (`limit`/`offset`) to: class list, booking list, meal logs, admin logs
- [x] Fix food recommendations to use SQL `LIMIT` + `ORDER BY` instead of loading all foods into memory
- [ ] Add caching layer (Redis) for static data: food database, class list
- [x] Add workout plan persistence in `workout-service` (currently stateless — plan re-generated every request with hardcoded stats)
- [x] Pin exact versions in all `requirements.txt` files (currently some are unpinned — non-reproducible builds)

### Frontend & Infrastructure
- [x] Add Nginx reverse proxy: route `/api/*` → `gateway:8000` (currently frontend hits `localhost:8000`, breaks in Docker)
- [x] Add route-based code splitting with `React.lazy()` (currently entire app in one bundle)
- [x] Extract shared constants (class categories, difficulties, meal types) to a single `constants.js` file (currently duplicated in `Classes.jsx` and `AdminPanel.jsx`)
- [x] Replace all `console.error` / `print()` debug statements with structured logging (`logging` module in Python, proper logger in frontend)
- [x] Add health check endpoints to `workout-service` and `booking-service` (nutrition-service already has one)
- [x] Add `HEALTHCHECK` to all Dockerfiles and `healthcheck` conditions in `docker-compose.yml`
- [x] Run all Docker containers as non-root users
- [x] Add unit tests for core logic: TDEE calculation, macro targets, condition overrides, workout day selection
- [x] Add `.env.example` file to document all required environment variables

---

## Phase 1 — Retention Foundation (Weeks 1–6)
> Goal: Solve the 72-hour churn crisis. Show users value before they leave.

### 1.1 Onboarding Overhaul
- [x] Interactive multi-step onboarding flow (not just a signup form)
- [x] "Quick Win" moment: personalized workout + meal shown instantly after setup
- [x] Onboarding progress tracker (5 steps, shows % complete)

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Most users sign up and see a blank dashboard — no data, no plan, nothing personalized. They leave within 72 hours because the app hasn't proven its value yet.

**User Flow:**
1. User signs up → immediately enters a 5-step wizard (not redirected to a blank dashboard)
2. Step 1: Basic profile (name, age, gender, weight, height)
3. Step 2: Primary goal (lose fat / build muscle / improve endurance / general health)
4. Step 3: Health conditions (diabetes, PCOS, hypertension, etc.) — same flags the nutrition service already supports
5. Step 4: Diet preference (vegetarian, vegan, non-veg, keto, etc.)
6. Step 5: "Quick Win" — app calls workout-service + nutrition-service in the background, then reveals a fully personalized first-week plan with today's workout and today's meals
7. Progress bar at top: `(completed_steps / 5) * 100` — fills as user advances

**Technical Approach:**
- Frontend: React multi-step form with local state; each step validates before advancing
- On Step 5 completion: two parallel API calls — `POST /workouts/plan` and `GET /nutrition/recommendations` — results shown in the same screen as a "Your plan is ready" reveal
- Auth-service User model gets a new boolean field `onboarding_completed` (default `false`); set to `true` after Step 5
- Any page that requires onboarding: middleware checks `onboarding_completed`; if false, redirect to `/onboarding`

**Data Model:**
```
-- auth-service (existing users table, add column)
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
```

**Competitor Edge:** Cult.fit drops users into a class browser. MyFitnessPal starts with a calorie goal form. Neither shows a *complete personalized plan* in the first session. We do — and that's the hook that drives 7-day retention.

</details>

---

### 1.2 Flexible Goals Architecture (`goals-service` — NEW)
- [x] Create `goals-service` (FastAPI + PostgreSQL)
- [x] Weekly flexible goals (e.g., "3–4 workouts/week" not rigid daily)
- [x] Auto-adjust goals based on actual user behavior
- [x] New frontend `/goals` page

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Rigid daily goals ("log 3 meals every day") kill motivation the moment a user misses one day. Real life is messy — a goal system should flex with it, not punish users for being human.

**User Flow:**
1. User navigates to `/goals` → sees current active goals and weekly progress rings
2. User creates a goal: picks type (workouts, meals, steps, sleep hours), sets a range (min: 3, max: 5, period: weekly)
3. Each day the user completes a relevant action (logs a workout, meal, etc.), the goal-service is notified via an internal event
4. At week end: if actual ≥ min → goal succeeds (green ring); if actual ≥ max for 3 consecutive weeks → app suggests raising the floor
5. User can edit goals at any time; history is preserved in `goal_logs`

**Technical Approach:**
- New FastAPI service on port **8005** with its own PostgreSQL on port **5437**
- Other services (workout-service, nutrition-service) emit a lightweight webhook `POST /goals/log` when a user completes a relevant action
- Auto-adjust cron: runs every Sunday night — queries `goal_logs` for last 3 weeks — if `value >= max_target` all 3 weeks, create a system suggestion record
- Weekly success check: `SELECT SUM(value) FROM goal_logs WHERE goal_id=? AND date >= week_start` — compare to `min_target`

**Data Model:**
```sql
-- goals-service DB
CREATE TABLE goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  type        VARCHAR(50) NOT NULL,  -- 'workouts', 'meals', 'steps', 'sleep_hrs'
  min_target  FLOAT NOT NULL,
  max_target  FLOAT NOT NULL,
  period      VARCHAR(20) DEFAULT 'weekly',
  status      VARCHAR(20) DEFAULT 'active',  -- 'active', 'paused', 'completed'
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE goal_logs (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id  UUID REFERENCES goals(id),
  date     DATE NOT NULL,
  value    FLOAT NOT NULL
);
```

**Competitor Edge:** Every competitor uses fixed daily targets. A user who travels Monday–Tuesday and misses gym is already "failed" for the week on Cult.fit. Our range system means they can still hit their goal Thursday–Sunday — keeping streaks alive and motivation intact.

</details>

---

### 1.3 Progress & Celebration System
- [x] Milestone badges (first workout, 7-day streak, 10 meals logged, etc.)
- [x] Weekly visual progress report card (shareable)
- [x] Body transformation timeline (weight/measurements over time)

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Users don't feel progress until they can see it. Without visible milestones, the grind feels pointless — especially in the first 30 days before physical results appear.

**User Flow:**
1. User completes their first workout → confetti animation + "First Workout" badge pops up
2. User can view all badges in `/profile` → a grid of earned (colored) and locked (greyed) badges
3. Every Sunday: user receives a "Weekly Report Card" — shows workouts completed, calories tracked, average sleep, active goal status — all in a shareable card format
4. User can log body measurements anytime → `/progress` page shows a line chart of weight and measurements over time

**Technical Approach:**
- Badge engine: cron job runs weekly (and on key events via webhook) — checks thresholds against aggregated data → writes earned badges to `badges` table
- 12 initial badge types: `first_workout`, `streak_7`, `streak_30`, `streak_100`, `meals_10`, `meals_50`, `weight_loss_5kg`, `weight_loss_10kg`, `buddy_week_1`, `challenge_complete`, `early_bird`, `consistency_star`
- Weekly report: aggregate query across goal_logs + meal_logs + workout history → generate a summary JSON → frontend renders as a styled card (html2canvas for sharing)
- Body timeline: simple CRUD on `body_measurements` table; chart via Recharts

**Data Model:**
```sql
CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  badge_type  VARCHAR(50) NOT NULL,
  earned_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE body_measurements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  date       DATE NOT NULL,
  weight_kg  FLOAT,
  waist_cm   FLOAT,
  chest_cm   FLOAT,
  hips_cm    FLOAT,
  notes      TEXT
);
```

**Competitor Edge:** Cult.fit has badges but they're buried. MyFitnessPal has streaks but no visual celebration moment. The key differentiator here is the *surprise reveal* — badges pop up contextually at the exact moment they're earned, not discovered later in a menu.

</details>

---

### 1.4 Smart Notifications
- [x] Configurable reminder system (not spammy)
- [x] In-app notification bell with badge count, mark-read, delete
- [x] Notification preferences in user profile

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Generic push notifications ("Don't forget to log your workout!") are ignored or cause app uninstalls. Smart notifications that feel personally timed feel like a helpful friend, not a spam bot.

**User Flow:**
1. During onboarding Step 2, user sets quiet hours and preferred channels (in-app, email, push)
2. App learns their booking patterns — if they book Tuesday 7pm classes 3 weeks in a row, the system detects this as a "usual training day"
3. On that day, user gets: "You usually train on Tuesdays — your Strength class starts in 1hr. Ready?"
4. User can adjust all preferences at `/settings/notifications` — toggle each notification type, set quiet hours

**Technical Approach:**
- New `notifications-service` (FastAPI) on port **8009** with its own DB
- Nudge logic: cron runs daily → queries booking-service for each user's last 4 weeks of bookings → computes most frequent booking day+time → schedules a nudge 1hr before that time if no booking exists for today
- Channels: in-app (stored in `notifications` table, polled by frontend), email (SMTP via SendGrid), push (Firebase Cloud Messaging — future phase)
- Anti-spam guard: `SELECT COUNT(*) FROM notifications WHERE user_id=? AND created_at > NOW() - INTERVAL '1 day'` — if ≥ 1, skip

**Data Model:**
```sql
CREATE TABLE notification_prefs (
  user_id      UUID PRIMARY KEY,
  in_app       BOOLEAN DEFAULT TRUE,
  email        BOOLEAN DEFAULT TRUE,
  push         BOOLEAN DEFAULT FALSE,
  quiet_start  TIME DEFAULT '22:00',
  quiet_end    TIME DEFAULT '07:00'
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       VARCHAR(50) NOT NULL,  -- 'nudge', 'badge', 'report', 'buddy_checkin'
  message    TEXT NOT NULL,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Competitor Edge:** Cult.fit sends the same notification to all users at 8am. Our system uses actual behavioral data (booking history) to personalize *when* and *what* — making every nudge feel like it was written specifically for that user.

</details>

---

## Phase 2 — Holistic Health Hub (Weeks 5–14)
> Goal: Become the single health dashboard. Connect fitness, nutrition, sleep, and mood.

### 2.1 Sleep & Recovery Tracking (`health-service` — NEW)
- [x] Create `health-service` (FastAPI + PostgreSQL)
- [x] Manual sleep logging (duration, quality 1–5, notes)
- [x] Daily readiness score (sleep + mood + rest days input)
- [x] Recovery recommendations ("Low readiness → switch to mobility today")

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Users overtrain because no app connects their sleep quality to their workout intensity. A person sleeping 5 hrs and feeling stressed shouldn't be doing max-effort squats — but every fitness app prescribes the same plan regardless.

**User Flow:**
1. Every morning, a check-in prompt appears on the dashboard: "How did you sleep? (hours + quality 1–5)"
2. User answers in 2 taps → app computes today's readiness score (1–10)
3. If score ≥ 7: "Great — your strength session is ready"
4. If score 4–6: "Moderate energy — consider swapping to a lighter session"
5. If score < 4: "Low readiness — today's plan has been switched to mobility/rest"

**Technical Approach:**
- New `health-service` on port **8006** with PostgreSQL on port **5438**
- Readiness formula: `(sleep_quality * 0.4) + (mood_score * 0.3) + (rest_days_factor * 0.3)` → normalize to 1–10
  - `rest_days_factor`: 1.0 if yesterday was a rest day, 0.5 if trained, 0.0 if trained 2+ consecutive days
- Workout-service reads readiness score via internal API call `GET /health/readiness/today?user_id=X` on plan generation; if score < 5 → returns "low_intensity" flag with the plan
- Scores stored historically for trend analysis

**Data Model:**
```sql
-- health-service DB
CREATE TABLE sleep_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  date         DATE NOT NULL,
  duration_hrs FLOAT NOT NULL,
  quality      INTEGER CHECK (quality BETWEEN 1 AND 5),
  notes        TEXT
);

CREATE TABLE readiness_scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  date       DATE NOT NULL,
  score      FLOAT NOT NULL,  -- 1.0 to 10.0
  breakdown  JSONB           -- { sleep: 4.0, mood: 2.1, rest: 1.5 }
);
```

**Competitor Edge:** No mainstream fitness app (Cult.fit, MyFitnessPal, even Whoop without a device) gives a readiness score that *automatically modifies today's workout*. This closes the loop between health data and training prescription — making the app feel like a real coach.

</details>

---

### 2.2 Mood & Mental Wellness Module
- [x] Daily mood check-in (emoji-based, 5-second interaction)
- [x] Stress level logging
- [x] Guided breathing exercises + meditation library (basic video/audio)
- [x] Weekly mood trend report

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Mental wellness is the hidden variable in physical performance. Stress spikes cortisol, tanks recovery, and predicts churn — but no fitness app treats it as a first-class signal.

**User Flow:**
1. Dashboard shows a daily mood widget: 5 emoji faces (😞😕😐🙂😁) + optional stress slider (1–5)
2. User taps one emoji → done (2 seconds, no friction)
3. If mood ≤ 2 or stress ≥ 4: app suggests a breathing exercise from the library
4. Weekly mood trend card: "Your average mood this week was 3.2 / 5 — that's down from 4.1 last week. Consider a rest day."
5. Breathing exercises: a carousel of 5 static techniques (Box Breathing, 4-7-8, Physiological Sigh, etc.) displayed as cards with step-by-step text and a timer

**Technical Approach:**
- `mood_logs` stored in health-service DB (same service as sleep)
- Breathing library: 5 techniques stored as a static JSON array in the health-service codebase (no DB, no video hosting needed initially — just text + timing parameters)
- Weekly trend: `SELECT AVG(mood), AVG(stress_level) FROM mood_logs WHERE user_id=? AND date >= week_start GROUP BY WEEK(date)` — flag if average drops ≥ 1 point for 2+ consecutive weeks

**Data Model:**
```sql
-- health-service DB (same DB as sleep_logs)
CREATE TABLE mood_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  date         DATE NOT NULL,
  mood         INTEGER CHECK (mood BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  notes        TEXT
);
```

**Competitor Edge:** Cult.fit has a meditation section but it's siloed — it doesn't affect your workout plan or your readiness score. Our mood data feeds directly into the readiness formula, making mental state a first-class input to the entire training system.

</details>

---

### 2.3 Integrated Health Dashboard Redesign
- [x] Redesign `/dashboard` as holistic health hub
- [x] Widget: fitness activity + nutrition macros + sleep quality + mood + readiness score
- [x] 7-day and 30-day trend views
- [x] AI cross-domain insight: "Your energy is highest after 7+ hrs sleep + strength training"

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Users currently juggle 3–5 separate apps for fitness, nutrition, sleep, and mood. The friction of context-switching means most data never gets logged. A single unified view with zero context-switching drives 3x more daily active use.

**User Flow:**
1. User opens app → lands on a widget grid dashboard (6 cards): Today's Calories, Workouts This Week, Last Night's Sleep, Today's Mood, Readiness Score, Active Goal
2. User taps any card → expands to a detail view with a 7-day or 30-day chart
3. Below the widgets: "AI Insight of the Day" — a single sentence cross-domain observation (e.g., "You burned 200 more calories on days you slept 7+ hours")
4. Top-right toggle switches between 7-day and 30-day views across all widgets simultaneously

**Technical Approach:**
- Dashboard makes 4 parallel API calls on load (Promise.all): nutrition-service, workout-service (history), health-service (sleep + mood + readiness), goals-service (active goal progress)
- Widget grid: CSS Grid with 6 responsive cards, each with a sparkline (Recharts AreaChart, 7 data points)
- 7-day multi-series chart: Recharts LineChart with 3 series (energy/calories, sleep hours, workouts completed) — shared X-axis by date
- Cross-domain insight: rule-based engine in a `/dashboard/insight` endpoint — evaluates 10 pre-written rules (e.g., IF avg_sleep > 7 AND workouts_count > 3 → "High performance pattern detected") — returns the most recently triggered rule

**Data Model:** No new tables — this is an aggregation layer reading from existing service databases.

**Competitor Edge:** Cult.fit's dashboard shows only class bookings. MyFitnessPal shows only calories. No competitor aggregates sleep, mood, fitness, and nutrition into a *single correlated view with AI cross-domain insights*. This is the "single source of truth" positioning.

</details>

---

### 2.4 Wearable Integration (`integrations-service` — NEW)
- [ ] Create `integrations-service`
- [ ] Apple Health / Google Fit import
- [ ] Fitbit / Garmin API integration
- [ ] Auto-import sleep, steps, heart rate data

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Users who own wearables (Fitbit, Galaxy Watch, Google Fit) are already logging sleep and steps — but manually re-entering that data in a second app is the #1 reason they stop logging. Auto-sync eliminates the friction entirely.

**User Flow:**
1. User goes to `/settings/integrations` → sees a list of supported providers (Google Fit, Fitbit)
2. Taps "Connect Google Fit" → OAuth2 consent screen → redirected back with an auth code
3. integrations-service exchanges code for access + refresh tokens, stores them
4. From that point: every 6 hours, a background sync job pulls the last 24 hours of data and writes it to health-service

**Technical Approach:**
- New `integrations-service` on port **8007** with PostgreSQL on port **5439**
- OAuth2 flow: standard Authorization Code flow — `GET /integrations/connect/{provider}` redirects to provider's OAuth URL; `GET /integrations/callback/{provider}` handles the code exchange
- Sync job: APScheduler (in-process cron) runs every 6 hours per connected user → calls provider API → maps response to health-service schema → `POST /health/sleep` / `POST /health/steps`
- Token refresh: on every sync, check `expires_at` — if within 5 mins, refresh before calling

**Data Model:**
```sql
-- integrations-service DB
CREATE TABLE integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  provider      VARCHAR(50) NOT NULL,  -- 'google_fit', 'fitbit', 'garmin'
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  last_synced   TIMESTAMP,
  status        VARCHAR(20) DEFAULT 'active'
);
```

**Competitor Edge:** Cult.fit has no wearable integration. MyFitnessPal has Apple Health sync but it's iOS-only and one-directional. Our integrations-service is provider-agnostic (new providers = new adapter class, same core) and writes data into our full cross-domain model so it immediately affects readiness scores and AI insights.

</details>

---

## [x] Phase 3 — Privacy-First Community (Weeks 10–18)
> Goal: 70%+ of fitness transformations happen in community. Build it right.

### 3.1 Accountability Buddy System (`community-service` — NEW)
- [x] Create `community-service` (FastAPI + PostgreSQL)
- [x] Match users based on fitness level, goals, schedule
- [x] Weekly check-in (thumbs up/down per workout)
- [x] Anonymous option (buddy sees progress, not identity)
- [x] Private messaging between buddies

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Working out alone is the #1 reason people quit. A gym partner provides accountability — but most people don't have one. Existing social fitness apps (Strava, Nike Run Club) are about showing off, not private accountability. That social pressure causes anxiety, not motivation.

**User Flow:**
1. User opts in to buddy matching from `/community` page
2. Fills a 3-field buddy profile: fitness level (beginner/intermediate/advanced), primary goal, preferred workout days
3. System runs matching algorithm → suggests 1–3 potential buddies (shown as aliases only: "FitFox#4821")
4. User accepts a match → both get a notification
5. Every week: each buddy sees a simple check-in card: "Did [FitFox#4821] complete their workouts this week?" → thumbs up / down
6. Optional: enable private messaging (text only, stored in DB — no real-time WebSocket initially, just polling)

**Technical Approach:**
- New `community-service` on port **8008** with PostgreSQL on port **5440**
- Matching algorithm: score-based — `score = (goal_match * 3) + (level_match * 2) + (schedule_overlap * 1)` — pick top 3 unmatched users with highest score
- Alias system: on opt-in, generate a unique alias (`[Animal][Color]#[4-digit random]`) — stored in `buddy_profiles`, never exposed externally
- Weekly check-in: cron job creates a `checkin_requests` record every Monday for each active buddy pair
- Messaging: `POST /community/messages` stores a message; `GET /community/messages/{buddy_id}` returns thread — frontend polls every 30s

**Data Model:**
```sql
CREATE TABLE buddy_profiles (
  user_id         UUID PRIMARY KEY,
  alias           VARCHAR(50) UNIQUE NOT NULL,
  fitness_level   VARCHAR(20) NOT NULL,
  goal            VARCHAR(50) NOT NULL,
  preferred_days  VARCHAR[],
  is_anonymous    BOOLEAN DEFAULT TRUE,
  status          VARCHAR(20) DEFAULT 'seeking'  -- 'seeking', 'matched', 'paused'
);

CREATE TABLE buddy_pairs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id  UUID REFERENCES buddy_profiles(user_id),
  user_b_id  UUID REFERENCES buddy_profiles(user_id),
  matched_at TIMESTAMP DEFAULT NOW(),
  status     VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE checkin_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id      UUID REFERENCES buddy_pairs(id),
  week_start   DATE NOT NULL,
  a_response   VARCHAR(10),  -- 'thumbs_up', 'thumbs_down', NULL
  b_response   VARCHAR(10),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE buddy_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id    UUID REFERENCES buddy_pairs(id),
  sender_id  UUID NOT NULL,
  content    TEXT NOT NULL,
  sent_at    TIMESTAMP DEFAULT NOW()
);
```

**Competitor Edge:** No fitness app offers private, anonymous accountability buddies. Strava is public. Peloton is about leaderboards. We give users the accountability of a gym partner without the social anxiety of a public profile — a feature with zero direct competition.

</details>

---

### 3.2 Group Challenges
- [x] Create/join challenges ("30-day strength challenge", "10k steps/day week")
- [x] Fair leaderboards: rank by % improvement, not absolute performance
- [x] Anonymous participation option
- [x] Challenge completion badges

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Traditional leaderboards punish beginners — a fit person always beats a new user on absolute metrics, making the competition pointless and demoralizing. Ranking by *improvement* means a beginner who goes from 2 workouts/week to 5 can beat a veteran who's been at 5 for months.

**User Flow:**
1. User browses challenge catalog (admin-created or user-created challenges)
2. Joins a challenge → system records their baseline metric value at join time
3. Throughout the challenge, their progress is tracked automatically (via goal-service or health-service data)
4. Leaderboard shows: alias, baseline value, current value, % improvement — sorted by % improvement descending
5. On completion: badge awarded automatically; badge type = `challenge_complete`

**Technical Approach:**
- Stored in `community-service` DB (same service as buddy system)
- Leaderboard formula: `rank_score = (current_value - baseline_value) / baseline_value * 100`
- Auto-tracking: challenge_members table linked to a `metric_source` (e.g., "workouts_count" → queries goal-service; "steps" → queries health-service) — sync job updates `current_value` daily
- Badge trigger: cron checks `challenge_members WHERE challenge end_date = yesterday AND current_value >= target` → calls badge engine endpoint `POST /badges/award`

**Data Model:**
```sql
CREATE TABLE challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(100) NOT NULL,
  type            VARCHAR(50) NOT NULL,     -- '30_day_strength', 'steps_week', etc.
  duration_days   INTEGER NOT NULL,
  target_metric   VARCHAR(50) NOT NULL,     -- 'workouts_count', 'steps_total', etc.
  created_by      UUID NOT NULL,
  starts_at       DATE NOT NULL,
  ends_at         DATE NOT NULL
);

CREATE TABLE challenge_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    UUID REFERENCES challenges(id),
  user_id         UUID NOT NULL,
  alias           VARCHAR(50) NOT NULL,
  baseline_value  FLOAT NOT NULL,
  current_value   FLOAT DEFAULT 0,
  completed       BOOLEAN DEFAULT FALSE,
  joined_at       TIMESTAMP DEFAULT NOW()
);
```

**Competitor Edge:** Every fitness challenge app (Nike Run Club, Strava challenges) ranks by absolute performance. A couch-to-5k runner has no chance against a marathon veteran. Our % improvement ranking makes challenges genuinely fair — and more motivating for the majority of users who aren't already fit.

</details>

---

### 3.3 Community Feed (Opt-in Only)
- [x] Share milestones only (not every workout)
- [x] No follower counts, no like counts (removes social anxiety)
- [x] Comment support for encouragement
- [x] Organized by goal type (weight loss, muscle gain, endurance)

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Social feeds in fitness apps (Strava, Nike) create performance anxiety — users compare their casual walk to someone's marathon. Vanity metrics (likes, followers) make fitness feel like a popularity contest. The result: casual users disengage entirely.

**User Flow:**
1. User opts in to the community feed from `/settings`
2. When a user earns a milestone badge, they get a prompt: "Share this to the community feed? (aliases only, no real name)"
3. If shared: a post appears in the feed — showing their alias, milestone type, and an optional custom message
4. Other users see the feed filtered by goal type (tabs: All / Weight Loss / Muscle Gain / Endurance)
5. Users can leave an encouragement reaction (single type: "💪") — but the count is hidden; only the recipient sees how many they got

**Technical Approach:**
- Stored in `community-service` DB
- Posts are system-generated only (no manual text posts) — triggered when a badge is earned and user opts to share
- Feed query: `SELECT * FROM feed_posts WHERE goal = ? ORDER BY created_at DESC LIMIT 20` with cursor-based pagination
- Comments: simple append-only text, stored with alias (no real name ever written to this table)
- Reaction aggregate: `SELECT COUNT(*) FROM reactions WHERE post_id=?` — only returned to the post's author, never shown publicly

**Data Model:**
```sql
CREATE TABLE feed_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  alias          VARCHAR(50) NOT NULL,
  milestone_type VARCHAR(50) NOT NULL,
  message        TEXT,
  goal_type      VARCHAR(50),   -- for feed filtering
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES feed_posts(id),
  user_id    UUID NOT NULL,
  alias      VARCHAR(50) NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES feed_posts(id),
  user_id    UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

**Competitor Edge:** Strava and Nike Run Club are optimized for elite athletes showing off. Our feed is explicitly designed to be anxiety-free: no follower counts, no public like counts, opt-in only, milestone-only posts. It's a support network, not a competition stage.

</details>

---

### 3.4 Expert Content Hub
- [x] Trainer-created workout plans (marketplace model)
- [x] Nutritionist-curated meal plans
- [x] Expert articles on training, recovery, nutrition

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Generic AI-generated plans are good for starting, but serious users eventually want expert-crafted programs from coaches they trust. Trainers need a distribution channel beyond Instagram. Neither side has a good solution today.

**User Flow:**
1. Trainers apply for "Verified Trainer" status → admin reviews and approves
2. Verified trainers create content: workout plans, meal plans, or articles — tagged with goal type, fitness level, duration
3. Free content is browsable by all users; paid content shows a "Pro" gate with a preview
4. User purchases a plan (Pro tier, or one-time purchase) → content unlocked permanently in their library
5. Users rate content (1–5 stars) → ratings visible on content cards to help discovery

**Technical Approach:**
- `content` table in a new schema within community-service DB (or a dedicated content-service — start in community-service, extract later)
- Trainers are `users` with role `trainer` in auth-service; `verified` flag set by admin
- Paid content gate: frontend checks `user.tier === 'pro'` before rendering full content; backend validates tier on `GET /content/{id}/full`
- No video hosting: embed YouTube or Loom URLs (stored as a field) — users click out to watch, then return
- Revenue share (Phase 5): deferred until Stripe Connect is integrated

**Data Model:**
```sql
CREATE TABLE content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL,           -- must be a verified trainer
  type        VARCHAR(30) NOT NULL,    -- 'article', 'workout_plan', 'meal_plan'
  title       VARCHAR(200) NOT NULL,
  body        TEXT NOT NULL,           -- markdown or JSON structured plan
  tags        TEXT[],
  price       NUMERIC(10,2) DEFAULT 0, -- 0 = free
  published   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_purchases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  content_id  UUID REFERENCES content(id),
  purchased_at TIMESTAMP DEFAULT NOW()
);
```

**Competitor Edge:** Cult.fit's content is all in-house — fixed, inflexible, and not personalized by trainer. Our marketplace model means content diversity grows automatically as trainers join. Verified trainers attract their own audience, bringing new users to the platform through the content discovery loop.

</details>

---

## Phase 4 — AI Intelligence Layer (Weeks 16–26)
> Goal: Make AI the invisible backbone that quietly makes everything better.

### 4.1 AI Readiness Score
- [ ] Algorithm: sleep quality + mood + rest days + activity trend + HRV
- [ ] Output: 1–10 daily readiness score + recommended intensity
- [ ] Auto-adjust today's workout if readiness < 5

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Users don't know if they should train hard or rest on any given day. Overtraining causes injury; under-resting causes slow progress. A readiness score turns subjective "I feel okay" into an objective, data-driven decision.

**User Flow:**
1. Every morning, user completes a 30-second check-in (sleep hours + quality + mood) — already captured in health-service
2. App computes today's readiness score instantly
3. Score appears prominently on the dashboard: large number (e.g., "7.2 / 10") with a color ring (green/yellow/red)
4. Tapping the score shows the breakdown: "Sleep contributed 4.1 pts, Mood 2.3 pts, Rest 0.8 pts"
5. The day's workout plan shown on the next screen is already adjusted to the score — no manual intervention needed

**Technical Approach:**
- Implemented as a computed endpoint in health-service: `GET /health/readiness/today?user_id=X`
- Formula v1 (rule-based, no ML needed): `score = (sleep_quality * 0.4) + (mood * 0.3) + (rest_factor * 0.2) + (hrv_normalized * 0.1)`
  - HRV: manual input initially (user types resting heart rate as proxy); Phase 5: pull from wearable
  - `rest_factor`: 1.0 = 2+ rest days, 0.5 = 1 rest day, 0.0 = trained 2+ consecutive days
- workout-service reads this score on every plan generation call; applies a modifier:
  - score ≥ 7: standard plan
  - score 4–6: reduce sets by 20%, drop max-intensity exercises
  - score < 4: replace plan with a mobility/yoga routine from a static library
- Score history stored in `readiness_scores` table (already defined in 2.1 Data Model)

**Data Model:** Uses `readiness_scores` table defined in Phase 2.1.

**Competitor Edge:** Whoop and Oura Ring offer readiness scores but require $200+ hardware. We deliver the same concept with just a 30-second manual check-in — and we immediately *act on it* by modifying the workout. No wearable required.

</details>

---

### 4.2 AI Form Analysis via Phone Camera (`form-analysis-service` — NEW)
- [ ] Create `form-analysis-service` (Python + MediaPipe/OpenCV)
- [ ] User films their exercise set via phone
- [ ] Real-time joint angle analysis + feedback ("Knee caving on squat")
- [ ] Democratizes $200/month coaching

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Bad form causes injury and slows progress. A personal trainer to correct form costs $150–200/session — inaccessible to most users. There is no affordable, scalable alternative.

**User Flow:**
1. User is about to do squats → taps "Analyze Form" on their phone
2. Selects exercise from a list (squat, deadlift, push-up, lunge — 10 initial exercises)
3. Records a short video (max 30 seconds) of themselves performing the exercise
4. Uploads it → app shows "Analyzing…" spinner
5. Result arrives (async, ~15–30 seconds): a card showing detected reps, a list of issues (e.g., "Knee caving inward on reps 2, 4, 5"), and correction tips ("Focus on pushing your knees outward, in line with your toes")

**Technical Approach:**
- New `form-analysis-service` on port **8010** (Python + FastAPI + MediaPipe)
- Processing pipeline:
  1. Receive video upload (`POST /form/analyze`) → store in temp directory → queue for processing
  2. Extract frames at 10fps using OpenCV: `cap = cv2.VideoCapture(path)`
  3. Run MediaPipe Pose on each frame → get 33 landmark coordinates
  4. Compute joint angles: `angle = arccos(dot(v1, v2) / (|v1| * |v2|))` for knee, hip, shoulder, elbow
  5. Rule engine evaluates frame-by-frame angle sequences against exercise-specific thresholds
  6. Result polling: client calls `GET /form/result/{job_id}` every 3 seconds until status = "done"
- Exercise rule examples (squat): knee_angle < 90° = "good depth", torso_lean > 45° from vertical = "leaning too far forward", knee_x deviation > 15% shoulder width = "knee cave"
- No real-time processing initially — async batch with result stored as JSON

**Data Model:**
```sql
-- form-analysis-service DB
CREATE TABLE form_analysis_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  exercise     VARCHAR(50) NOT NULL,
  status       VARCHAR(20) DEFAULT 'queued',  -- 'queued', 'processing', 'done', 'failed'
  result_json  JSONB,   -- { reps_detected, issues: [], tips: [] }
  created_at   TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**Competitor Edge:** This feature straight-up democratizes personal training. Tonal ($3,000 device) and Mirror ($1,500 device) offer form feedback but require expensive hardware. We do it with the camera already in the user's pocket — at zero additional cost.

</details>

---

### 4.3 Conversational AI Coach (`ai-coach-service` — NEW)
- [ ] Create `ai-coach-service` (Claude API integration)
- [ ] Chat interface knowing full user profile (goals, conditions, history, mood)
- [ ] Answer: "Why am I not losing weight?", "Should I train today?", "Pre-workout meal?"
- [ ] New frontend chat component

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Users have fitness questions every single day that no static FAQ or generic content library can answer. "Should I train if I'm sore?" depends on the user's specific training history, goals, and recovery data. A context-aware AI coach can answer questions that would otherwise require a $100/hr human trainer.

**User Flow:**
1. Dashboard shows a "Chat with Coach" button → opens a slide-in drawer on the right
2. User types any question: "Why am I not losing weight?", "Is it okay to train with a sore shoulder?", "Give me a pre-workout snack idea for tonight's class"
3. AI responds in plain English, referencing the user's actual data: "Based on your last 7 days of meal logs, you're averaging 2,300 calories — that's 200 above your target of 2,100. That's likely why the scale isn't moving."
4. Conversation history persists across sessions — user can scroll back to previous advice

**Technical Approach:**
- New `ai-coach-service` on port **8011** (FastAPI + Anthropic Claude API)
- On every user message: fetch context from 4 services → build a system prompt → call Claude API → stream response back to frontend
- System prompt construction:
  ```
  You are FitnessFreak's personal AI coach. Here is everything you know about this user:
  - Profile: {age, weight, height, health_conditions}
  - Current goals: {goals from goals-service}
  - Last 7 days: {workout_logs, meal_logs, sleep_logs, mood_logs}
  - Today's readiness score: {score}
  - Active workout plan: {plan summary}
  Always be encouraging but honest. Reference specific data when relevant.
  ```
- Context window management: send last 10 chat messages + full user profile on every request (≈ 2,000 tokens total — well within Claude's context limit)
- Model: `claude-sonnet-4-6` (fast and capable enough for real-time chat)
- Streaming: use Claude API's streaming mode → SSE (Server-Sent Events) to frontend → show typing indicator as response arrives

**Data Model:**
```sql
-- ai-coach-service DB
CREATE TABLE chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  role       VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
  content    TEXT NOT NULL,
  timestamp  TIMESTAMP DEFAULT NOW()
);
```

**Competitor Edge:** Cult.fit has no AI chat. MyFitnessPal added a generic AI feature but it has no access to workout history, sleep data, or mood. Our AI coach is the only one with the user's *complete health picture* — making its advice genuinely personalized, not generic.

</details>

---

### 4.4 Predictive Churn Detection (`analytics-service` — NEW)
- [ ] Create `analytics-service` (Python + ML pipeline)
- [ ] Monitor: login frequency, workouts logged, meals tracked
- [ ] Predict dropout 7 days before it happens
- [ ] Trigger personalized intervention (modified plan, challenge invite, message)

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** By the time a user stops using the app, it's too late to retain them. The signal is always there 7–10 days before they churn — but no one is reading it. Detecting the pattern early enables proactive intervention while the user is still reachable.

**User Flow (invisible to user):**
1. Every night: analytics-service computes an engagement score for every active user
2. If score drops below 0.3 (high churn risk): trigger intervention pipeline:
   - Modify the user's next workout plan to be shorter and easier (reduce barrier to return)
   - Send a personalized notification: "We noticed you haven't been around — here's a 15-minute workout just for today"
   - If they have a buddy: trigger a buddy check-in request
3. If score recovers over 7 days: mark intervention as successful; log outcome for model retraining

**Technical Approach:**
- New `analytics-service` on port **8012** (Python + FastAPI + scikit-learn)
- Feature vector (computed daily per user):
  - `days_since_login` (from auth-service last_login)
  - `workouts_last_7d` (from workout history)
  - `meals_last_7d` (from nutrition-service)
  - `streak_broken` (boolean — from goals-service)
  - `buddy_checkin_missed` (boolean — from community-service)
  - `avg_mood_last_7d` (from health-service)
- Model v1: logistic regression trained on synthetic labeled data (simulated 1,000 users with known churn outcomes) — replace with real data after 3 months of production
- Retrain schedule: monthly cron job — `model.fit(X_train, y_train)` → pickle to disk → hot-reload
- Intervention trigger: if `predict_proba(features) > 0.7` → call notifications-service + workout-service endpoints

**Data Model:**
```sql
-- analytics-service DB
CREATE TABLE engagement_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  date          DATE NOT NULL,
  score         FLOAT NOT NULL,
  features_json JSONB,   -- full feature vector for audit/retraining
  intervened    BOOLEAN DEFAULT FALSE
);
```

**Competitor Edge:** No consumer fitness app does proactive churn prediction. B2B SaaS companies (Amplitude, Mixpanel) sell churn analytics tools but they don't integrate with the fitness app layer to auto-intervene. We close the entire loop — detect, intervene, measure — automatically.

</details>

---

### 4.5 Natural Language Meal Logging
- [ ] Input: "I had rice, dal, and sabzi for lunch" → auto-parsed macros
- [ ] "Meal plan for my goal this week" → AI generates full week plan
- [ ] Upgrade `nutrition-service` recommendations from rule-based to LLM-powered

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Manual macro logging ("search for 'brown rice', select, enter 180g, repeat for 6 ingredients") is the #1 drop-off point in nutrition apps. Most users abandon it within a week. Natural language logging reduces the effort to one sentence.

**User Flow:**
1. On the meal logging screen: user sees a text input at the top: "What did you eat? (just tell me)"
2. User types: "I had dal rice with sabzi and a cup of chai for lunch"
3. App sends this to the new endpoint → Claude API parses it → response: "I found: Dal (1 cup, ~150 cal), Rice (200g, ~260 cal), Mixed Sabzi (100g, ~80 cal), Masala Chai (200ml, ~60 cal) — Total: ~550 cal, 18g protein. Does this look right?"
4. User confirms or adjusts quantities → meal logged automatically
5. If Claude can't match an item to the food DB: "I couldn't find 'Kadi Patta Chutney' — can you estimate the quantity? I'll use 50 calories as a default."

**Technical Approach:**
- New endpoint in existing nutrition-service: `POST /nutrition/logs/natural`
- Request: `{ "text": "I had dal rice and sabzi for lunch", "meal_type": "lunch" }`
- Processing:
  1. Call Claude API with a structured prompt including the food database as context (top 500 common Indian foods as a JSON list)
  2. Claude returns: `{ "food_items": [{ "name": "dal", "quantity_g": 200, "meal_type": "lunch" }] }`
  3. Match each item against the existing `foods` table using fuzzy string match (`pg_trgm` similarity)
  4. For matched items: create `meal_log` entries normally
  5. For unmatched items: return them to the frontend with Claude's estimated macros → user confirms
- Claude prompt structure: "Parse the following meal description into structured food items. Use these common foods as reference: [food_db_json]. Return JSON only."

**Data Model:** No new tables — reuses existing `meal_logs` and `foods` tables in nutrition-service.

**Competitor Edge:** MyFitnessPal has barcode scanning and search but no natural language. Cronometer has extensive manual logging. Neither understands "I had thali for lunch." Our LLM-powered parser understands mixed Indian meal descriptions, colloquial quantities ("a handful"), and regional food names — a specific advantage for the Indian market.

</details>

---

## Phase 5 — Ecosystem Expansion (Weeks 24–52)
> Goal: Build moats, network effects, and multiple revenue streams.

### 5.1 Trainer Marketplace
- [ ] Verified trainers can create & sell plans
- [ ] 1-on-1 coaching (video sessions, async feedback)
- [ ] Revenue share: 70% trainer / 30% platform

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Independent trainers have followers on Instagram but no reliable monetization channel beyond DMs and WhatsApp. Users want expert programs but can't afford private coaching. A marketplace bridges both sides.

**User Flow:**
1. Trainer registers → applies for verification → admin approves (checks credentials)
2. Trainer creates a plan: title, description, duration, price, target goal type
3. User browses marketplace → buys a plan (Stripe Checkout) → plan unlocked in their library
4. For 1-on-1 coaching: user books a coaching session (extends booking-service with "coaching" class type) → pays → trainer gets a Stripe Connect payout
5. Monthly: platform processes revenue share (70% to trainer, 30% retained) via Stripe Connect automatic payouts

**Technical Approach:**
- Trainer role: `users.role = 'trainer'` in auth-service; `trainers` table stores additional metadata
- Stripe Connect: each trainer completes onboarding → gets a `stripe_account_id`
- Purchase flow: Stripe Checkout session created with `transfer_data.destination = trainer.stripe_account_id` and `application_fee_amount = price * 0.30`
- 1-on-1 sessions: extend booking-service's `class_types` to include `coaching_session`; restrict booking to trainer's availability calendar

**Data Model:**
```sql
CREATE TABLE trainers (
  user_id           UUID PRIMARY KEY REFERENCES users(id),
  bio               TEXT,
  specializations   TEXT[],
  verified          BOOLEAN DEFAULT FALSE,
  stripe_account_id VARCHAR(100)
);

CREATE TABLE content_purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  content_id   UUID NOT NULL,
  amount_paid  NUMERIC(10,2),
  purchased_at TIMESTAMP DEFAULT NOW()
);
```

**Competitor Edge:** Cult.fit employs trainers (fixed inventory, fixed styles). Our marketplace model means content diversity scales with the number of trainers who join — and trainers bring their Instagram audience with them, creating a built-in acquisition channel.

</details>

---

### 5.2 Wearable-First Architecture
- [ ] Full support: Apple Watch, Fitbit, Whoop, Oura Ring, Garmin, Samsung Health
- [ ] "Ambient fitness tracking" — app fills data automatically

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Manual data logging is the biggest friction point in any health app. Once users stop logging, the AI insights degrade, readiness scores go stale, and eventually they churn. Wearables eliminate the logging burden entirely.

**User Flow:**
1. User connects their wearable in `/settings/integrations` (OAuth2 flow per provider — built in Phase 2.4)
2. From that point forward: sleep, steps, HRV, heart rate all appear automatically every morning
3. User never needs to manually log sleep or steps again — the dashboard just fills in
4. App displays a "Data Source" badge on each metric: "From Fitbit" / "Manual" — transparency builds trust

**Technical Approach:**
- Extend Phase 2.4's `integrations-service` with additional provider adapters (Whoop, Garmin, Samsung Health, Oura Ring)
- Each provider = one Python class implementing a common `HealthProvider` interface: `get_sleep(date)`, `get_steps(date)`, `get_hrv(date)`
- Unified internal schema: regardless of source, all data normalized to health-service's `sleep_logs` / `steps_logs` / `hrv_logs` tables
- Background sync: APScheduler cron every 6 hours per connected user — calls provider API → writes to health-service
- HRV data (from Whoop/Oura): write to `readiness_scores` as the HRV component → readiness score becomes 100% automated

**Data Model:** Extends Phase 2.4's `integrations` table — no new tables needed. Add `data_source` VARCHAR field to sleep_logs, steps_logs, etc. to track origin.

**Competitor Edge:** MyFitnessPal syncs with Apple Health (iOS only). Cult.fit has no wearable integration. We support all major wearables cross-platform with a unified data model — making FitnessFreak the hub that aggregates all a user's health data regardless of what device they own.

</details>

---

### 5.3 D2C Supplement & Gear
- [ ] AI-curated product recommendations based on goals + deficiencies
- [ ] Affiliate model initially; own D2C inventory later

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Users struggling to hit protein targets don't know what supplement to buy. Users with iron deficiency (flagged in their health conditions) should be using iron supplements. Generic ads are ignored; personalized, data-backed recommendations convert.

**User Flow:**
1. User views their weekly nutrition summary → sees "You've been consistently under protein target by 25g/day"
2. Below the summary: "Recommended: Whey Protein — based on your goal and current intake" with a "Shop Now" affiliate link
3. Products are filtered by health conditions: a diabetic user never sees high-sugar supplements
4. User clicks → redirected to affiliate partner → platform earns commission

**Technical Approach:**
- Recommendation engine: query user's `nutrition_logs` for last 30 days → compute average deficit per macro/micronutrient → cross-reference with health conditions → match to `products` table
- Rule examples: `protein_deficit > 20g/day` → recommend protein powder; `health_conditions CONTAINS 'iron_deficiency'` → recommend iron supplement
- `products` table: seeded with 50–100 manually curated products from affiliate partners (Amazon, Healthkart, etc.)
- Affiliate tracking: each product link includes a UTM parameter and an internal `click_log` record for commission tracking
- Phase 2: negotiate direct inventory with 2–3 supplement brands → ship directly, higher margins

**Data Model:**
```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  category        VARCHAR(50) NOT NULL,   -- 'protein', 'vitamins', 'gear'
  target_deficiency VARCHAR(50),          -- nutrient or condition it addresses
  affiliate_url   TEXT NOT NULL,
  commission_pct  FLOAT DEFAULT 0.05,
  contraindications TEXT[]                -- conditions where this shouldn't be recommended
);

CREATE TABLE product_clicks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  clicked_at TIMESTAMP DEFAULT NOW()
);
```

**Competitor Edge:** No fitness app currently offers health-condition-aware supplement recommendations. A diabetic getting told to eat protein powder (that contains sugar) is a real failure mode we explicitly handle. This safety-first recommendation engine builds trust and differentiation.

</details>

---

### 5.4 Corporate Wellness B2B Tier
- [ ] Company admin panel + employee fitness dashboards
- [ ] Group challenges for companies
- [ ] B2B SaaS pricing ($8/employee/month)

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Companies spend $500–2,000/employee/year on wellness benefits that employees barely use. Existing corporate wellness platforms (Virgin Pulse, Wellable) are generic, expensive, and not integrated with real fitness tracking. HR teams have no visibility into engagement.

**User Flow:**
1. Company HR admin signs up for Corporate tier → creates an organization
2. HR admin invites employees via email (bulk CSV upload) → each employee gets an invite to join FitnessFreak under the company umbrella
3. Employees use the app normally — no different experience for them
4. HR admin dashboard shows: aggregate stats only (% of employees active this week, avg workouts/week, avg daily steps) — never individual data
5. HR admin can create company-scoped group challenges ("Q1 Step Challenge") that only company employees see

**Technical Approach:**
- New `organizations` table in auth-service DB
- Company scope: `users.organization_id` foreign key — if set, user is part of that org
- Admin dashboard API: `GET /analytics/org/{org_id}/summary` — aggregates across all employees with `organization_id = org_id`; returns only counts and averages, never individual records
- Company challenges: extend Phase 3.2's challenges with `organization_id` field — filter challenge listings by org
- Billing: Stripe Subscriptions with `quantity = employee_count` and `unit_amount = 800` (cents = $8) — auto-adjusts when employees join/leave

**Data Model:**
```sql
CREATE TABLE organizations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  admin_user_id  UUID NOT NULL,
  employee_seats INTEGER DEFAULT 10,
  stripe_sub_id  VARCHAR(100),
  plan           VARCHAR(30) DEFAULT 'corporate'
);

-- auth-service users table (add column)
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
```

**Competitor Edge:** Cult.fit has a corporate product but it requires on-site classes. Virgin Pulse is web-only and doesn't integrate with real workout/nutrition tracking. We offer real behavioral data (actual workouts logged, not just step counts from a pedometer) at $8/employee vs. Virgin Pulse's $15–30/employee.

</details>

---

### 5.5 Clinical Integration
- [ ] Partner with telehealth providers
- [ ] Prescribable workout plans (doctor → FitnessFreak plan)
- [ ] Lab test result integration (blood work → nutrition advice)

<details>
<summary><strong>How to achieve this</strong></summary>

**Problem:** Doctors prescribe "exercise more and eat better" but have no way to ensure it happens or measure compliance. Patients with chronic conditions (diabetes, hypertension, PCOS) need medically-appropriate fitness plans — but their fitness app knows nothing about their lab results.

**User Flow:**
1. User uploads a lab report PDF (CBC, lipid panel, HbA1c) in `/health/records`
2. Claude API extracts key values: HbA1c: 7.2%, LDL: 145 mg/dL, Hemoglobin: 10.2 g/dL
3. Nutrition-service reads these values → adjusts TDEE targets: high HbA1c → reduce carb % to 40% max; low hemoglobin → flag iron-rich foods
4. Alternatively: a doctor (with `role = 'doctor'` in auth-service) creates a pre-filled workout plan and "prescribes" it to a patient → patient sees it as their plan

**Technical Approach:**
- `health_records` table in health-service DB
- PDF extraction: `POST /health/records/upload` → save PDF → call Claude API with vision capability: "Extract all lab values from this medical report as JSON: { HbA1c, LDL, HDL, hemoglobin, ... }"
- Nutrition-service integration: on every recommendation call, check `GET /health/records/latest_labs?user_id=X` → apply condition-specific adjustments (already partially built for health conditions — this extends that logic with actual lab values)
- Doctor portal: admin creates users with `role = 'doctor'`; doctors can search patients by email → view their fitness data → create a "prescribed plan" that the patient sees on login

**Data Model:**
```sql
CREATE TABLE health_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  type        VARCHAR(30) NOT NULL,    -- 'lab_report', 'prescription'
  data_json   JSONB,                   -- extracted values: { HbA1c: 7.2, LDL: 145 }
  raw_file    TEXT,                    -- path to uploaded PDF
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prescribed_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL,
  patient_id  UUID NOT NULL,
  plan_json   JSONB NOT NULL,
  prescribed_at TIMESTAMP DEFAULT NOW(),
  active      BOOLEAN DEFAULT TRUE
);
```

**Competitor Edge:** No fitness app in India (or globally at scale) has real clinical integration. Cult.fit, HealthifyMe — none of them can ingest a lab report and adjust nutrition targets accordingly. This positions FitnessFreak as a clinical wellness platform, not just a consumer fitness app — opening an entirely different sales channel (hospital networks, insurance companies, corporate health plans).

</details>

---

## Unique Features vs. Cult.fit & All Competitors

| Feature | Status |
|---------|--------|
| AI Readiness Score (sleep + mood + HRV combined) | [ ] |
| Anonymous accountability buddy matching | [ ] |
| Fair leaderboards (% improvement, not absolute) | [ ] |
| Natural language meal logging ("I had dal rice") | [ ] |
| Cross-domain AI insights (sleep ↔ mood ↔ performance) | [ ] |
| Flexible weekly goals that adapt to real life | [ ] |
| Privacy-first community (no follower counts, opt-in) | [ ] |
| AI form analysis via phone camera | [ ] |
| Corporate wellness + clinical B2B tier | [ ] |

---

## New Services to Build

| Service | Purpose | Port | DB Port | Status |
|---------|---------|------|---------|--------|
| `goals-service` | Flexible goals, streaks, milestones | 8005 | 5437 | [ ] |
| `health-service` | Sleep, mood, HRV, readiness scoring | 8006 | 5438 | [ ] |
| `integrations-service` | Wearable + health app APIs | 8007 | 5439 | [ ] |
| `community-service` | Buddies, challenges, community feed | 8008 | 5440 | [ ] |
| `notifications-service` | Smart push + email reminders | 8009 | 5441 | [ ] |
| `form-analysis-service` | Computer vision form feedback | 8010 | 5442 | [ ] |
| `ai-coach-service` | Conversational AI coach (Claude API) | 8011 | 5443 | [ ] |
| `analytics-service` | Churn prediction, engagement scoring | 8012 | 5444 | [ ] |

---

## Monetization Tiers

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | Workout tracking, nutrition logging, limited classes, challenges |
| Pro | $9.99/mo | AI coach, form analysis, advanced analytics, unlimited classes, wearable sync |
| Elite | $24.99/mo | Human coach check-ins, personalized meal plans, full health hub |
| Corporate | $8/employee/mo | Admin dashboard, group challenges, aggregate health reports |
