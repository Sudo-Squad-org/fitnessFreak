import React, { useEffect, useState } from "react";
import { communityService } from "@/services/communityService";
import { useInterval } from "@/hooks/useInterval";
import { BuddySetupForm } from "./buddy/BuddySetupForm";
import { BuddyCandidateCard } from "./buddy/BuddyCandidateCard";
import { BuddyPairCard } from "./buddy/BuddyPairCard";
import { BuddyCheckinCard } from "./buddy/BuddyCheckinCard";
import { BuddyMessageThread } from "./buddy/BuddyMessageThread";
import { Loader2, UserX, Swords, CheckCircle2, Clock, Zap } from "lucide-react";

// state: no_profile | setup | seeking | matched
export function BuddyTab() {
  const [phase, setPhase]       = useState(null);
  const [profile, setProfile]   = useState(null);
  const [pair, setPair]         = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [dare, setDare]         = useState(null);
  const [pulse, setPulse]       = useState(null);
  const [wrap, setWrap]         = useState(null);
  const [error, setError]       = useState(null);

  const isSunday = new Date().getDay() === 0;

  const load = async () => {
    try {
      const res = await communityService.getMyProfile();
      setProfile(res.data);
      if (res.data.status === "matched") {
        const [pairRes, ciRes] = await Promise.all([
          communityService.getMyPair(),
          communityService.getCheckins(),
        ]);
        setPair(pairRes.data);
        setCheckins(ciRes.data);
        setPhase("matched");

        // Load dare, pulse, and (on weekends) weekly wrap in background
        Promise.all([
          communityService.getDare().then(r => setDare(r.data)).catch(() => {}),
          communityService.getPartnerPulse().then(r => setPulse(r.data)).catch(() => {}),
          isSunday
            ? communityService.getWeeklyWrap().then(r => setWrap(r.data)).catch(() => {})
            : Promise.resolve(),
        ]);
      } else {
        setPhase("seeking");
      }
    } catch (e) {
      if (e?.response?.status === 404) {
        setPhase("no_profile");
      } else {
        setError("Failed to load buddy profile.");
      }
    }
  };

  useEffect(() => { load(); }, []);

  if (phase === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (phase === "no_profile") {
    return (
      <div className="rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">Find an Accountability Buddy</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Matched anonymously by goal & schedule. Your alias is auto-generated — your identity stays private.
        </p>
        <BuddySetupForm onCreate={(p) => { setProfile(p); setPhase("seeking"); }} />
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="rounded-xl border border-border p-6">
        <BuddySetupForm profile={profile} onCreate={(p) => { setProfile(p); setPhase("seeking"); }} />
      </div>
    );
  }

  if (phase === "seeking") {
    return <SeekingView profile={profile} onMatch={load} onDelete={() => setPhase("no_profile")} />;
  }

  return (
    <div className="space-y-6">
      {/* Weekly Wrap — Sundays only */}
      {isSunday && wrap && <WeeklyWrapCard wrap={wrap} />}

      <BuddyPairCard pair={pair} onDissolve={() => { setPair(null); setPhase("seeking"); load(); }} />

      {/* Partner Activity Pulse */}
      {pulse && <PartnerPulseRow pulse={pulse} />}

      {/* Dare Card */}
      <DareSection dare={dare} pair={pair} onUpdate={(d) => setDare(d)} />

      {/* Weekly Check-ins */}
      {checkins.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Weekly Check-ins</h3>
          <div className="space-y-2">
            {checkins.map((ci) => (
              <BuddyCheckinCard
                key={ci.id}
                checkin={ci}
                partnerAlias={pair.partner_alias}
                onRespond={load}
              />
            ))}
          </div>
        </div>
      )}

      <BuddyMessageThread pair={pair} />
    </div>
  );
}


// ── Partner Activity Pulse ────────────────────────────────────────────────────

function PartnerPulseRow({ pulse }) {
  const moodEmoji =
    pulse.mood_avg >= 4 ? "😄" :
    pulse.mood_avg >= 3 ? "🙂" :
    pulse.mood_avg >= 2 ? "😐" :
    pulse.mood_avg != null ? "😔" : null;

  const items = [];
  if (pulse.workout_count != null)     items.push(`${pulse.workout_count} workout${pulse.workout_count !== 1 ? "s" : ""}`);
  if (moodEmoji)                        items.push(`Mood ${moodEmoji}`);
  if (pulse.last_active_days_ago != null) {
    items.push(pulse.last_active_days_ago === 0 ? "Active today" : `Last active ${pulse.last_active_days_ago}d ago`);
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 flex items-center gap-2">
      <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{pulse.partner_alias}</span> this week:{" "}
        {items.join(" · ")}
      </p>
    </div>
  );
}


// ── Dare Section ──────────────────────────────────────────────────────────────

function DareSection({ dare, pair, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [dareText, setDareText] = useState("");
  const [loading, setLoading]  = useState(false);

  const createDare = async () => {
    if (!dareText.trim()) return;
    setLoading(true);
    try {
      const res = await communityService.createDare({ dare_text: dareText.trim() });
      onUpdate(res.data);
      setShowForm(false);
      setDareText("");
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  const acceptDare = async () => {
    setLoading(true);
    try {
      const res = await communityService.acceptDare(dare.id);
      onUpdate(res.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  const completeDare = async () => {
    setLoading(true);
    try {
      const res = await communityService.completeDare(dare.id);
      onUpdate(res.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  if (!dare) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5" /> Weekly Dare
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showForm ? "Cancel" : "+ Dare your buddy"}
          </button>
        </div>
        {showForm ? (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <input
              value={dareText}
              onChange={(e) => setDareText(e.target.value)}
              maxLength={200}
              placeholder={`Dare ${pair?.partner_alias ?? "your buddy"} to complete 4 workouts this week…`}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={createDare}
              disabled={loading || dareText.trim().length < 3}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              Send Dare
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No dare this week yet.</p>
        )}
      </div>
    );
  }

  // Dare exists
  const bothDone = dare.issuer_completed && dare.receiver_completed;
  const myTurn   = !dare.is_mine && !dare.accepted;
  const canComplete = dare.accepted && (dare.is_mine ? !dare.issuer_completed : !dare.receiver_completed);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
        <Swords className="h-3.5 w-3.5" /> Weekly Dare
      </h3>
      <div className="rounded-lg border border-border p-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          {dare.is_mine ? `You dared ${pair?.partner_alias ?? "your buddy"}:` : `${pair?.partner_alias ?? "Buddy"} dared you:`}
        </p>
        <p className="text-sm font-medium text-foreground">"{dare.dare_text}"</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {dare.issuer_completed ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
            {dare.issued_by_alias}
          </span>
          <span className="flex items-center gap-1">
            {dare.receiver_completed ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
            {dare.is_mine ? (pair?.partner_alias ?? "Buddy") : "You"}
          </span>
        </div>
        {bothDone && (
          <p className="text-xs font-medium text-green-600 dark:text-green-400">🎉 Both completed! Great week!</p>
        )}
        {myTurn && (
          <button
            onClick={acceptDare}
            disabled={loading}
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            Accept Dare
          </button>
        )}
        {canComplete && (
          <button
            onClick={completeDare}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Mark as Completed ✓
          </button>
        )}
        {!dare.accepted && dare.is_mine && (
          <p className="text-xs text-muted-foreground">Waiting for {pair?.partner_alias ?? "buddy"} to accept…</p>
        )}
      </div>
    </div>
  );
}


// ── Weekly Wrap Card (Sundays) ────────────────────────────────────────────────

function WeeklyWrapCard({ wrap }) {
  const streakText = wrap.pair_streak > 0
    ? `🔥 ${wrap.pair_streak}-week streak together`
    : "First week together!";

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">This Week with {wrap.partner_alias}</h3>
        <span className="text-xs text-muted-foreground">{streakText}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {wrap.my_workouts != null && (
          <div className="rounded-lg bg-background border border-border px-3 py-2 text-center">
            <p className="text-lg font-bold text-foreground">{wrap.my_workouts}</p>
            <p className="text-xs text-muted-foreground">Your workouts</p>
          </div>
        )}
        {wrap.their_workouts != null && (
          <div className="rounded-lg bg-background border border-border px-3 py-2 text-center">
            <p className="text-lg font-bold text-foreground">{wrap.their_workouts}</p>
            <p className="text-xs text-muted-foreground">{wrap.partner_alias}'s workouts</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{wrap.checkin_both_responded ? "✅ Both checked in" : "⏳ Check-in pending"}</span>
        <span>·</span>
        <span>{wrap.messages_this_week} messages this week</span>
        {wrap.dare && (
          <>
            <span>·</span>
            <span>{wrap.dare.issuer_completed && wrap.dare.receiver_completed ? "💪 Dare done!" : "⚔️ Dare active"}</span>
          </>
        )}
      </div>
    </div>
  );
}


// ── SeekingView (unchanged) ───────────────────────────────────────────────────

function SeekingView({ profile, onMatch, onDelete }) {
  const [matches, setMatches]   = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([
        communityService.getMatches(),
        communityService.getRequests(),
      ]);
      setMatches(mRes.data);
      setRequests(rRes.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useInterval(async () => {
    try {
      const rRes = await communityService.getRequests();
      setRequests(rRes.data);
    } catch {/* */}
  }, 20000);

  const handleAccept = async (id) => {
    await communityService.acceptRequest(id);
    onMatch();
  };
  const handleDecline = async (id) => {
    await communityService.declineRequest(id);
    loadAll();
  };
  const handleSend = async (alias) => {
    await communityService.sendRequest(alias);
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">Your Profile</h3>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {profile.alias}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {profile.fitness_level} · {profile.goal.replace("_", " ")} · {profile.preferred_days}
        </p>
        <button
          onClick={async () => { await communityService.deleteProfile(); onDelete(); }}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <UserX className="h-3.5 w-3.5" /> Remove profile
        </button>
      </div>

      {requests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Incoming Requests</h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.from_alias}</p>
                  <p className="text-xs text-muted-foreground">{r.fitness_level} · {r.goal.replace("_", " ")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.id)}
                    className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(r.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Suggested Matches</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No candidates found yet. Check back soon.</p>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <BuddyCandidateCard key={m.alias} candidate={m} onSend={() => handleSend(m.alias)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
