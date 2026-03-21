import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { bookingService } from "@/services/bookingService";
import { FadeIn } from "@/components/common/FadeIn";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Search, Calendar, Clock, User, Dumbbell, CheckCircle2,
  LayoutGrid, BookOpen, AlertCircle, XCircle, Flame, Music2,
  Swords, Brain, Bike, Leaf, Zap, Activity, Heart, RefreshCcw,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "all",         label: "All Classes",  Icon: LayoutGrid },
  { key: "yoga",        label: "Yoga",         Icon: Leaf },
  { key: "hiit",        label: "HIIT",         Icon: Flame },
  { key: "dance",       label: "Dance",        Icon: Music2 },
  { key: "boxing",      label: "Boxing",       Icon: Swords },
  { key: "strength",    label: "Strength",     Icon: Dumbbell },
  { key: "cardio",      label: "Cardio",       Icon: Heart },
  { key: "mindfulness", label: "Mindfulness",  Icon: Brain },
  { key: "cycling",     label: "Cycling",      Icon: Bike },
  { key: "pilates",     label: "Pilates",      Icon: Activity },
  { key: "functional",  label: "Functional",   Icon: Zap },
];

const DIFFICULTIES = [
  { key: "all",          label: "All Levels" },
  { key: "beginner",     label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced",     label: "Advanced" },
];

const CLASS_TYPES = [
  { key: "all",         label: "All Formats" },
  { key: "live_online", label: "Live Online" },
  { key: "on_demand",   label: "On Demand" },
  { key: "in_person",   label: "In Person" },
];

const CATEGORY_STYLES = {
  yoga:        { gradient: "from-green-500/25 to-emerald-400/10",  text: "text-green-600 dark:text-green-400",   bg: "bg-green-100 dark:bg-green-900/30" },
  hiit:        { gradient: "from-orange-500/25 to-red-400/10",     text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
  dance:       { gradient: "from-purple-500/25 to-fuchsia-400/10", text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  boxing:      { gradient: "from-amber-500/25 to-orange-400/10",   text: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-900/30" },
  strength:    { gradient: "from-blue-500/25 to-indigo-400/10",    text: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-100 dark:bg-blue-900/30" },
  cardio:      { gradient: "from-pink-500/25 to-rose-400/10",      text: "text-pink-600 dark:text-pink-400",     bg: "bg-pink-100 dark:bg-pink-900/30" },
  mindfulness: { gradient: "from-indigo-500/25 to-violet-400/10",  text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  cycling:     { gradient: "from-teal-500/25 to-cyan-400/10",      text: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-100 dark:bg-teal-900/30" },
  pilates:     { gradient: "from-violet-500/25 to-purple-400/10",  text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
  functional:  { gradient: "from-yellow-500/25 to-amber-400/10",   text: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
};

const DIFFICULTY_STYLES = {
  beginner:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  advanced:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const CLASS_TYPE_LABELS = {
  live_online: "Live Online",
  on_demand:   "On Demand",
  in_person:   "In Person",
};

const STATUS_STYLES = {
  live:      "bg-red-500 text-white animate-pulse",
  upcoming:  "bg-muted text-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const getCategoryIcon = (category) => {
  const found = CATEGORIES.find((c) => c.key === category);
  return found ? found.Icon : Dumbbell;
};

const getStyle = (category) =>
  CATEGORY_STYLES[category] || CATEGORY_STYLES.hiit;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (dt) =>
  new Date(dt).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const SeatBar = ({ available, max }) => {
  const pct = max > 0 ? Math.round(((max - available) / max) * 100) : 0;
  const color = available === 0
    ? "bg-rose-500"
    : available <= Math.ceil(max * 0.2)
    ? "bg-amber-400"
    : "bg-emerald-400";
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{available} seats left</span>
        <span>{pct}% full</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Class Card ───────────────────────────────────────────────────────────────

const ClassCard = ({ cls, isBooked, isBooking, onBook }) => {
  const style = getStyle(cls.category);
  const Icon = getCategoryIcon(cls.category);
  const full = cls.available_seats <= 0;
  const inactive = cls.status === "cancelled" || cls.status === "completed";

  return (
    <Card className="flex flex-col overflow-hidden border border-border shadow-none hover:shadow-md transition-all duration-300 group cursor-default">
      {/* Banner */}
      <div className={`relative h-40 w-full bg-gradient-to-br ${style.gradient} flex items-center justify-center overflow-hidden`}>
        <Icon className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />

        {/* Status top-left */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[cls.status]}`}>
            {cls.status === "live" && <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />}
            {cls.status}
          </span>
        </div>

        {/* Duration top-right */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {isBooked && (
            <Badge className="bg-emerald-500 text-white border-none text-[10px] px-1.5 py-0">
              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Booked
            </Badge>
          )}
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-border text-[10px]">
            {cls.duration_minutes} min
          </Badge>
        </div>

        {/* Category bottom-left */}
        <div className="absolute bottom-3 left-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            <Icon className="h-3 w-3" />
            {cls.category.charAt(0).toUpperCase() + cls.category.slice(1)}
          </span>
        </div>

        {/* Class type bottom-right */}
        <div className="absolute bottom-3 right-3">
          <span className="text-[10px] font-medium text-muted-foreground">
            {CLASS_TYPE_LABELS[cls.class_type]}
          </span>
        </div>
      </div>

      {/* Body */}
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-base font-bold leading-tight line-clamp-1 group-hover:text-indigo-500 transition-colors">
          {cls.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{cls.description}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 pb-3">
        {/* Instructor */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium">{cls.instructor_name}</span>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{fmt(cls.schedule_time)}</span>
        </div>

        {/* Difficulty */}
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[cls.difficulty]}`}>
            {cls.difficulty.charAt(0).toUpperCase() + cls.difficulty.slice(1)}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{cls.duration_minutes}m</span>
          </div>
        </div>

        {/* Seat bar */}
        <SeatBar available={cls.available_seats} max={cls.max_seats} />
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <Button
          className="w-full rounded-xl text-sm"
          size="sm"
          disabled={full || isBooked || isBooking || inactive}
          onClick={() => onBook(cls)}
          variant={isBooked ? "secondary" : "default"}
        >
          {isBooking ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking…</>
          ) : isBooked ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" />Already Booked</>
          ) : inactive ? (
            cls.status === "cancelled" ? "Cancelled" : "Class Ended"
          ) : full ? (
            "Class Full"
          ) : (
            "Book Now"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// ─── My Booking Card ──────────────────────────────────────────────────────────

const MyBookingCard = ({ booking, idx, onCancel, cancelling }) => {
  const cls = booking.class_info;
  const style = getStyle(cls?.category);
  const Icon = getCategoryIcon(cls?.category);

  return (
    <FadeIn delay={0.04 * idx} yOffset={10}>
      <Card className="overflow-hidden border border-border shadow-none">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Left accent strip */}
            <div className={`w-2 shrink-0 bg-gradient-to-b ${style.gradient}`} />

            <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                  <Icon className={`h-6 w-6 ${style.text}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-foreground">{cls?.title || "Fitness Class"}</h4>
                    {cls?.status && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[cls.status]}`}>
                        {cls.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{cls?.instructor_name || "TBA"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{cls?.schedule_time ? fmt(cls.schedule_time) : "TBA"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{cls?.duration_minutes}min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {cls?.category && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        {cls.category}
                      </span>
                    )}
                    {cls?.difficulty && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DIFFICULTY_STYLES[cls.difficulty]}`}>
                        {cls.difficulty}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      Booked {new Date(booking.booked_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none">
                  Confirmed
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 h-8 px-3"
                  onClick={() => onCancel(booking)}
                  disabled={cancelling === booking.id}
                >
                  {cancelling === booking.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><XCircle className="h-4 w-4 mr-1" />Cancel</>
                  }
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Classes = () => {
  const { currentUser } = useAuth();

  // Data
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState(0);
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [classType, setClassType] = useState("all");
  const [search, setSearch] = useState("");

  // Action state
  const [bookingTarget, setBookingTarget] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Derived: set of booked class IDs
  const bookedClassIds = useMemo(
    () => new Set(myBookings.map((b) => b.class_info?.id).filter(Boolean)),
    [myBookings]
  );

  // Load classes (with auto-seed)
  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const filters = {};
      if (category !== "all") filters.category = category;
      if (difficulty !== "all") filters.difficulty = difficulty;
      if (classType !== "all") filters.class_type = classType;
      if (search) filters.search = search;

      let res = await bookingService.getClasses(filters);
      // Auto-seed on fresh deployment (no filters applied)
      if (res.data.length === 0 && !category && !difficulty && !classType && !search) {
        await bookingService.seed();
        res = await bookingService.getClasses(filters);
      }
      setClasses(res.data);
    } catch {
      toast({ title: "Error", description: "Could not load classes.", variant: "destructive" });
    } finally {
      setLoadingClasses(false);
    }
  }, [category, difficulty, classType, search]);

  // Load my bookings
  const loadMyBookings = useCallback(async () => {
    if (!currentUser) { setLoadingBookings(false); return; }
    setLoadingBookings(true);
    try {
      const res = await bookingService.getMyBookings();
      setMyBookings(res.data);
    } catch {
      toast({ title: "Error", description: "Could not load your bookings.", variant: "destructive" });
    } finally {
      setLoadingBookings(false);
    }
  }, [currentUser]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadClasses, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadClasses]);

  useEffect(() => { loadMyBookings(); }, [loadMyBookings]);

  // ── Book ──────────────────────────────────────────────────────
  const handleConfirmBook = async () => {
    if (!bookingTarget) return;
    const cls = bookingTarget;
    setBookingTarget(null);
    setBookingInProgress(cls.id);

    try {
      await bookingService.bookClass(cls.id);
      // Optimistic seat decrement
      setClasses((prev) =>
        prev.map((c) => c.id === cls.id ? { ...c, available_seats: c.available_seats - 1 } : c)
      );
      await loadMyBookings();
      toast({ title: "Booked!", description: `You're confirmed for "${cls.title}".` });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Booking failed. Please try again.";
      toast({ title: "Booking failed", description: msg, variant: "destructive" });
    } finally {
      setBookingInProgress(null);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const booking = cancelTarget;
    setCancelTarget(null);
    setCancellingId(booking.id);

    try {
      await bookingService.cancelBooking(booking.id);
      // Restore seat optimistically
      setClasses((prev) =>
        prev.map((c) =>
          c.id === booking.class_info?.id
            ? { ...c, available_seats: c.available_seats + 1 }
            : c
        )
      );
      await loadMyBookings();
      toast({ title: "Cancelled", description: `Your booking for "${booking.class_info?.title}" has been cancelled.` });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Cancellation failed. Please try again.";
      toast({ title: "Cancellation failed", description: msg, variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page Header */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Fitness Classes
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Discover expert-led sessions — live online, on-demand and in-person.
            </p>
          </div>
        </FadeIn>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-border">
          {[
            { label: "Browse Classes", Icon: LayoutGrid },
            { label: "My Bookings",    Icon: BookOpen, count: myBookings.length },
          ].map(({ label, Icon, count }, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === i
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab 0: Browse ─────────────────────────────────── */}
        {activeTab === 0 && (
          <div className="space-y-6">

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(({ key, label, Icon }) => {
                const active = category === key;
                const st = key !== "all" ? getStyle(key) : null;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                      active
                        ? st
                          ? `${st.bg} ${st.text} border-transparent`
                          : "bg-foreground text-background border-transparent"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Secondary filters + search */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Difficulty */}
              <div className="flex gap-1 rounded-lg border border-border p-1">
                {DIFFICULTIES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      difficulty === key
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Class type */}
              <div className="flex gap-1 rounded-lg border border-border p-1">
                {CLASS_TYPES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setClassType(key)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      classType === key
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search class or instructor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={loadClasses}
                disabled={loadingClasses}
                className="h-9 px-3"
              >
                <RefreshCcw className={`h-4 w-4 ${loadingClasses ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Stats */}
            {!loadingClasses && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{classes.length}</span>{" "}
                  {classes.length === 1 ? "class" : "classes"} found
                </span>
                <span className="text-border">|</span>
                <span>
                  <span className="font-semibold text-emerald-600">{classes.filter((c) => c.available_seats > 0).length}</span>{" "}
                  with open seats
                </span>
              </div>
            )}

            {/* Grid */}
            {loadingClasses ? (
              <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin" />
                <span className="text-sm">Loading classes…</span>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-foreground">No classes found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
                <Button variant="outline" size="sm" onClick={() => { setCategory("all"); setDifficulty("all"); setClassType("all"); setSearch(""); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {classes.map((cls, idx) => (
                  <FadeIn key={cls.id} delay={0.04 * (idx % 8)} yOffset={12}>
                    <ClassCard
                      cls={cls}
                      isBooked={bookedClassIds.has(cls.id)}
                      isBooking={bookingInProgress === cls.id}
                      onBook={setBookingTarget}
                    />
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 1: My Bookings ─────────────────────────────── */}
        {activeTab === 1 && (
          <div className="space-y-4">
            {loadingBookings ? (
              <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin" />
                <span className="text-sm">Loading your bookings…</span>
              </div>
            ) : myBookings.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No bookings yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mt-1">
                    Browse available classes and hit <strong>Book Now</strong> to get started.
                  </p>
                  <Button className="mt-5" size="sm" onClick={() => setActiveTab(0)}>
                    Browse Classes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You have{" "}
                  <span className="font-semibold text-foreground">{myBookings.length}</span>{" "}
                  active {myBookings.length === 1 ? "booking" : "bookings"}.
                </p>
                <div className="space-y-3">
                  {myBookings.map((booking, idx) => (
                    <MyBookingCard
                      key={booking.id}
                      booking={booking}
                      idx={idx}
                      onCancel={setCancelTarget}
                      cancelling={cancellingId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Confirm Book Dialog ────────────────────────────────── */}
      <Dialog open={!!bookingTarget} onOpenChange={(open) => !open && setBookingTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Review the class details before confirming your spot.
            </DialogDescription>
          </DialogHeader>

          {bookingTarget && (() => {
            const style = getStyle(bookingTarget.category);
            const Icon = getCategoryIcon(bookingTarget.category);
            return (
              <div className="rounded-xl border border-border overflow-hidden my-2">
                <div className={`h-24 w-full bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                  <Icon className={`h-10 w-10 opacity-40 ${style.text}`} />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground text-lg leading-tight">
                      {bookingTarget.title}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${DIFFICULTY_STYLES[bookingTarget.difficulty]}`}>
                      {bookingTarget.difficulty}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      <span>{bookingTarget.instructor_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{bookingTarget.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{fmt(bookingTarget.schedule_time)}</span>
                    </div>
                  </div>
                  <SeatBar available={bookingTarget.available_seats} max={bookingTarget.max_seats} />
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingTarget(null)}>Cancel</Button>
            <Button onClick={handleConfirmBook}>Confirm Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Cancel Dialog ──────────────────────────────── */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your booking for{" "}
              <strong>"{cancelTarget?.class_info?.title}"</strong>? Your seat will be released.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;
