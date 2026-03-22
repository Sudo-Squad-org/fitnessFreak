import React, { useState, useEffect, useCallback } from "react";
import { bookingService } from "@/services/bookingService";
import { adminService } from "@/services/adminService";
import { communityService } from "@/services/communityService";
import { FadeIn } from "@/components/common/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Pencil, Trash2, Users, Calendar, Clock,
  User, RefreshCcw, AlertCircle, ChevronDown, ChevronUp,
  Dumbbell, LayoutDashboard, Shield, Megaphone, Trophy,
  CheckCircle2, XCircle, Search,
} from "lucide-react";
import { CATEGORIES, DIFFICULTIES, CLASS_TYPES, STATUSES } from "@/constants";

// ─── Design constants ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLES = {
  beginner:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced:     "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const STATUS_STYLES = {
  upcoming:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  live:      "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const ROLE_STYLES = {
  admin:   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  trainer: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  user:    "bg-muted text-muted-foreground",
};

const TYPE_LABELS = { live_online: "Live Online", on_demand: "On Demand", in_person: "In Person" };

const fmt = (dt) =>
  new Date(dt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const toLocalInput = (dt) => {
  const d = new Date(dt);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "users",      label: "Users",      icon: Users           },
  { id: "classes",    label: "Classes",    icon: Dumbbell        },
  { id: "community",  label: "Community",  icon: Trophy          },
  { id: "broadcast",  label: "Broadcast",  icon: Megaphone       },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color = "text-foreground" }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? "—"}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

// ─── Class Form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "", description: "", category: "hiit", difficulty: "beginner",
  class_type: "live_online", instructor_name: "", instructor_bio: "",
  duration_minutes: 60, schedule_time: "", max_seats: 20, available_seats: 20,
  status: "upcoming",
};

const ClassForm = ({ initial, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())           e.title           = "Required";
    if (!form.instructor_name.trim()) e.instructor_name = "Required";
    if (!form.schedule_time)          e.schedule_time   = "Required";
    if (form.duration_minutes <= 0)   e.duration_minutes = "Must be > 0";
    if (form.max_seats <= 0)          e.max_seats       = "Must be > 0";
    if (form.available_seats < 0)     e.available_seats = "Cannot be negative";
    if (form.available_seats > form.max_seats) e.available_seats = "Cannot exceed max seats";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      duration_minutes: Number(form.duration_minutes),
      max_seats:        Number(form.max_seats),
      available_seats:  Number(form.available_seats),
      schedule_time:    new Date(form.schedule_time).toISOString(),
    });
  };

  const field = (label, key, type = "text", props = {}) => (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className={errors[key] ? "border-destructive" : ""}
        {...props}
      />
      {errors[key] && <p className="text-xs text-destructive mt-0.5">{errors[key]}</p>}
    </div>
  );

  const sel = (label, key, options) => (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
      <select
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map((o) => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o.charAt(0).toUpperCase() + o.slice(1) : o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">{field("Class Title *", "title", "text", { placeholder: "e.g. Morning Yoga Flow" })}</div>
        <div className="sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief class description…"
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
        {sel("Category", "category", CATEGORIES)}
        {sel("Difficulty", "difficulty", DIFFICULTIES)}
        {sel("Format", "class_type", CLASS_TYPES.map((v) => ({ value: v, label: TYPE_LABELS[v] })))}
        {sel("Status", "status", STATUSES)}
        {field("Instructor Name *", "instructor_name", "text", { placeholder: "e.g. Priya Sharma" })}
        {field("Instructor Bio", "instructor_bio", "text", { placeholder: "Optional short bio" })}
        {field("Schedule Date & Time *", "schedule_time", "datetime-local")}
        {field("Duration (min) *", "duration_minutes", "number", { min: 1 })}
        {field("Max Seats *", "max_seats", "number", { min: 1 })}
        {field("Available Seats *", "available_seats", "number", { min: 0 })}
      </div>
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {initial ? "Save Changes" : "Create Class"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// ─── Attendee Modal ───────────────────────────────────────────────────────────

const AttendeeModal = ({ classId, classTitle, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getClassBookings(classId)
      .then((res) => setData(res.data))
      .catch(() => toast({ title: "Error", description: "Could not load attendees.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attendees</DialogTitle>
          <DialogDescription>{classTitle}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data ? (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span><span className="font-semibold text-foreground">{data.total_booked}</span> booked</span>
              <span><span className="font-semibold text-foreground">{data.max_seats}</span> max</span>
              <span><span className="font-semibold text-emerald-500">{data.max_seats - data.total_booked}</span> remaining</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {data.bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No confirmed bookings yet.</p>
              ) : (
                data.bookings.map((b, i) => (
                  <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground truncate max-w-40">{b.user_id.slice(0, 8)}…</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(b.booked_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No data available.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab = ({ classes }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminService.getStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const totalBookings = classes.reduce((s, c) => s + (c.max_seats - c.available_seats), 0);
  const liveNow = classes.filter((c) => c.status === "live").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={stats?.total_users}  color="text-indigo-500" />
        <StatCard label="Active Users"   value={stats?.active_users} color="text-emerald-500" />
        <StatCard label="Trainers"       value={stats?.trainer_count} color="text-violet-500" />
        <StatCard label="Admins"         value={stats?.admin_count}  color="text-amber-500" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Classes"  value={classes.length}      color="text-sky-500" />
        <StatCard label="Live Now"       value={liveNow}             color="text-red-500" />
        <StatCard label="Total Bookings" value={totalBookings}        color="text-foreground" />
        <StatCard label="Upcoming"       value={classes.filter((c) => c.status === "upcoming").length} color="text-foreground" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Class",     desc: "Create a new fitness class",    tab: "classes"   },
            { label: "Manage Users",  desc: "View and update user roles",     tab: "users"     },
            { label: "Challenges",    desc: "Create community challenges",    tab: "community" },
            { label: "Broadcast",     desc: "Send announcement to all users", tab: "broadcast" },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const res = await adminService.getUsers(params);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {
      toast({ title: "Error", description: "Could not load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (userId, newRole) => {
    setActionLoading(userId + "_role");
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: "Role updated" });
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (userId, isActive) => {
    setActionLoading(userId + "_active");
    try {
      await adminService.toggleUserActive(userId, isActive);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: isActive } : u));
      toast({ title: isActive ? "User activated" : "User deactivated" });
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-1.5">
          {["", "user", "trainer", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                roleFilter === r
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {r || "All"}
            </button>
          ))}
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors ${!u.is_active ? "opacity-50" : ""}`}>
                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
                  {u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{u.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_STYLES[u.role] ?? ROLE_STYLES.user}`}>
                      {u.role}
                    </span>
                    {!u.email_verified && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">unverified</span>
                    )}
                    {u.is_active === false && (
                      <span className="text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">deactivated</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Role selector */}
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    disabled={actionLoading === u.id + "_role"}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="user">user</option>
                    <option value="trainer">trainer</option>
                    <option value="admin">admin</option>
                  </select>

                  {/* Deactivate / Activate */}
                  <button
                    onClick={() => toggleActive(u.id, u.is_active === false ? true : false)}
                    disabled={actionLoading === u.id + "_active"}
                    title={u.is_active === false ? "Activate" : "Deactivate"}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    {actionLoading === u.id + "_active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : u.is_active === false ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Classes Tab ──────────────────────────────────────────────────────────────

const ClassesTab = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [attendeeTarget, setAttendeeTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingService.getClasses();
      setClasses(res.data);
    } catch {
      toast({ title: "Error", description: "Could not load classes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = classes.filter((c) =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await bookingService.createClass(payload);
      toast({ title: "Class created" });
      setCreateOpen(false);
      load();
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed to create class.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleUpdate = async (payload) => {
    setSubmitting(true);
    try {
      await bookingService.updateClass(editTarget.id, payload);
      toast({ title: "Class updated" });
      setEditTarget(null);
      load();
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed to update.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    setDeleteTarget(null);
    try {
      await bookingService.deleteClass(deleteTarget.id);
      toast({ title: "Deleted" });
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const editInitial = editTarget ? { ...editTarget, schedule_time: toLocalInput(editTarget.schedule_time) } : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search classes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New Class
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No classes found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((cls) => {
              const expanded = expandedId === cls.id;
              const booked = cls.max_seats - cls.available_seats;
              return (
                <div key={cls.id} className="hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">{cls.title}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[cls.status]}`}>{cls.status}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[cls.difficulty]}`}>{cls.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-x-3 flex-wrap mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{cls.instructor_name}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmt(cls.schedule_time)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cls.duration_minutes}m</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0 mr-2">
                      <span className="text-sm font-bold text-foreground">{booked}/{cls.max_seats}</span>
                      <span className="text-[10px] text-muted-foreground">booked</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[
                        { icon: Users,    title: "Attendees", color: "hover:text-sky-500",       action: () => setAttendeeTarget(cls) },
                        { icon: Pencil,   title: "Edit",      color: "hover:text-amber-500",      action: () => setEditTarget(cls) },
                        { icon: Trash2,   title: "Delete",    color: "hover:text-destructive",    action: () => setDeleteTarget(cls) },
                        { icon: expanded ? ChevronUp : ChevronDown, title: "Expand", color: "", action: () => setExpandedId(expanded ? null : cls.id) },
                      ].map(({ icon: Icon, title, color, action }) => (
                        <button
                          key={title}
                          onClick={action}
                          title={title}
                          disabled={title === "Delete" && deleting === cls.id}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors ${color} disabled:opacity-40`}
                        >
                          {title === "Delete" && deleting === cls.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Icon className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {expanded && (
                    <div className="px-5 pb-4 pl-[68px] space-y-1">
                      {cls.description && <p className="text-sm text-muted-foreground">{cls.description}</p>}
                      {cls.instructor_bio && <p className="text-xs italic text-muted-foreground">Coach: {cls.instructor_bio}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>Fill in the details for the new fitness class.</DialogDescription>
          </DialogHeader>
          <ClassForm onSubmit={handleCreate} onClose={() => setCreateOpen(false)} loading={submitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update "{editTarget?.title}".</DialogDescription>
          </DialogHeader>
          {editTarget && <ClassForm initial={editInitial} onSubmit={handleUpdate} onClose={() => setEditTarget(null)} loading={submitting} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Class?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>"{deleteTarget?.title}"</strong> and all booking records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {attendeeTarget && (
        <AttendeeModal classId={attendeeTarget.id} classTitle={attendeeTarget.title} onClose={() => setAttendeeTarget(null)} />
      )}
    </div>
  );
};

// ─── Community Tab ────────────────────────────────────────────────────────────

const CommunityTab = () => {
  const [challenges, setChallenges] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("challenges");
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, ctRes] = await Promise.all([
        communityService.listChallenges({ limit: 50 }),
        communityService.listContent({ limit: 50 }),
      ]);
      setChallenges(cRes.data);
      setContent(ctRes.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteChallenge = async (id, title) => {
    setDeleting(id);
    try {
      await communityService.deleteChallenge(id);
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      toast({ title: `"${title}" deactivated` });
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const publishContent = async (id) => {
    setDeleting(id + "_pub");
    try {
      await communityService.publishContent(id);
      setContent((prev) => prev.map((c) => c.id === id ? { ...c, published: true } : c));
      toast({ title: "Published" });
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {[{ id: "challenges", label: "Challenges" }, { id: "content", label: "Expert Content" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              subTab === t.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : subTab === "challenges" ? (
        challenges.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No challenges yet. Create one in the Community → Challenges tab.</p>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {challenges.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{c.title}</p>
                      {!c.is_active && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.metric_type.replace("_", " ")} · {c.member_count} members · ends {new Date(c.ends_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteChallenge(c.id, c.title)}
                    disabled={deleting === c.id || !c.is_active}
                    title="Deactivate"
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                  >
                    {deleting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        content.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No content yet.</p>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {content.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{c.title}</p>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                        {c.content_type.replace("_", " ")}
                      </span>
                      {!c.published && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">draft</span>
                      )}
                      {c.is_paid && (
                        <span className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-0.5 rounded-full">pro</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.avg_rating != null ? `★ ${c.avg_rating.toFixed(1)}` : "No ratings"} · {c.fitness_level ?? "all levels"}
                    </p>
                  </div>
                  {!c.published && (
                    <button
                      onClick={() => publishContent(c.id)}
                      disabled={deleting === c.id + "_pub"}
                      className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      {deleting === c.id + "_pub" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Publish
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

// ─── Broadcast Tab ────────────────────────────────────────────────────────────

const BroadcastTab = () => {
  const [form, setForm] = useState({ title: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await adminService.broadcast(form);
      setResult(res.data);
      setForm({ title: "", body: "" });
      toast({ title: `Sent to ${res.data.sent} users` });
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">System Announcement</h3>
        <p className="text-xs text-muted-foreground mb-5">
          Send a notification to all active, verified users. Use for maintenance alerts, new features, or announcements.
        </p>

        <form onSubmit={send} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</Label>
            <Input
              required
              placeholder="e.g. New feature available!"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={200}
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Message (optional)</Label>
            <textarea
              rows={4}
              placeholder="More details about the announcement…"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {result && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Sent to {result.sent} / {result.total_users} users
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.title.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            {loading ? "Sending…" : "Send Announcement"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-5 text-center">
        <Shield className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          Only active, email-verified users receive this notification. Unverified or deactivated accounts are skipped.
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    bookingService.getClasses().then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage users, classes, community, and platform settings.</p>
        </div>

        {/* Tab bar */}
        <div className="mb-8 inline-flex w-full rounded-xl bg-muted p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                activeTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === "overview"  && <OverviewTab classes={classes} />}
        {activeTab === "users"     && <UsersTab />}
        {activeTab === "classes"   && <ClassesTab />}
        {activeTab === "community" && <CommunityTab />}
        {activeTab === "broadcast" && <BroadcastTab />}
      </FadeIn>
    </div>
  );
};

export default AdminPanel;
