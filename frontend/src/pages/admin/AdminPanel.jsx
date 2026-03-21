import React, { useState, useEffect, useCallback } from "react";
import { bookingService } from "@/services/bookingService";
import { FadeIn } from "@/components/common/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Pencil, Trash2, Users, Calendar, Clock,
  User, RefreshCcw, AlertCircle, ChevronDown, ChevronUp, Dumbbell,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
import { CATEGORIES, DIFFICULTIES, CLASS_TYPES, STATUSES } from "@/constants";

const DIFFICULTY_STYLES = {
  beginner:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  advanced:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const STATUS_STYLES = {
  upcoming:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  live:      "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  completed: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  cancelled: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
};

const TYPE_LABELS = { live_online: "Live Online", on_demand: "On Demand", in_person: "In Person" };

const fmt = (dt) =>
  new Date(dt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const toLocalInput = (dt) => {
  const d = new Date(dt);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
};

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "", description: "", category: "hiit", difficulty: "beginner",
  class_type: "live_online", instructor_name: "", instructor_bio: "",
  duration_minutes: 60, schedule_time: "", max_seats: 20, available_seats: 20,
  status: "upcoming",
};

// ─── Class Form ───────────────────────────────────────────────────────────────

const ClassForm = ({ initial, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.instructor_name.trim()) e.instructor_name = "Required";
    if (!form.schedule_time) e.schedule_time = "Required";
    if (form.duration_minutes <= 0) e.duration_minutes = "Must be > 0";
    if (form.max_seats <= 0) e.max_seats = "Must be > 0";
    if (form.available_seats < 0) e.available_seats = "Cannot be negative";
    if (form.available_seats > form.max_seats) e.available_seats = "Cannot exceed max seats";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      duration_minutes: Number(form.duration_minutes),
      max_seats: Number(form.max_seats),
      available_seats: Number(form.available_seats),
      schedule_time: new Date(form.schedule_time).toISOString(),
    };
    onSubmit(payload);
  };

  const field = (label, key, type = "text", props = {}) => (
    <div>
      <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">{label}</Label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className={`bg-white dark:bg-zinc-900 ${errors[key] ? "border-rose-400" : ""}`}
        {...props}
      />
      {errors[key] && <p className="text-xs text-rose-500 mt-0.5">{errors[key]}</p>}
    </div>
  );

  const select = (label, key, options) => (
    <div>
      <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">{label}</Label>
      <select
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-zinc-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief class description…"
            rows={2}
            className="flex w-full rounded-md border border-input bg-white dark:bg-zinc-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>
        {select("Category", "category", CATEGORIES)}
        {select("Difficulty", "difficulty", DIFFICULTIES)}
        {select("Format", "class_type", CLASS_TYPES.map((v) => ({ value: v, label: TYPE_LABELS[v] })))}
        {select("Status", "status", STATUSES)}
        {field("Instructor Name *", "instructor_name", "text", { placeholder: "e.g. Priya Sharma" })}
        {field("Instructor Bio", "instructor_bio", "text", { placeholder: "Optional short bio" })}
        {field("Schedule Date & Time *", "schedule_time", "datetime-local")}
        {field("Duration (minutes) *", "duration_minutes", "number", { min: 1 })}
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
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
        ) : data ? (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{data.total_booked}</span> booked</span>
              <span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{data.max_seats}</span> max seats</span>
              <span><span className="font-semibold text-emerald-600">{data.max_seats - data.total_booked}</span> remaining</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.bookings.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">No confirmed bookings yet.</p>
              ) : (
                data.bookings.map((b, i) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 w-5 text-right">{i + 1}.</span>
                      <User className="h-4 w-4 text-zinc-400" />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-40">{b.user_id.slice(0, 8)}…</span>
                    </div>
                    <span className="text-xs text-zinc-400">{new Date(b.booked_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 text-center py-4">No data available.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminPanel = () => {
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
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await bookingService.createClass(payload);
      toast({ title: "Class created!", description: `"${payload.title}" is now live.` });
      setCreateOpen(false);
      load();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to create class.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSubmitting(true);
    try {
      await bookingService.updateClass(editTarget.id, payload);
      toast({ title: "Class updated!", description: `"${payload.title}" has been updated.` });
      setEditTarget(null);
      load();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update class.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    setDeleteTarget(null);
    try {
      await bookingService.deleteClass(deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.title}" has been removed.` });
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to delete class.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const editInitial = editTarget
    ? { ...editTarget, schedule_time: toLocalInput(editTarget.schedule_time) }
    : null;

  // Summary stats
  const totalBookings = classes.reduce((s, c) => s + (c.max_seats - c.available_seats), 0);
  const liveCount = classes.filter((c) => c.status === "live").length;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Class Management
              </h1>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                Create, edit, and manage all fitness classes.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2 self-start sm:self-auto">
              <Plus className="h-4 w-4" /> New Class
            </Button>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Classes", value: classes.length, color: "text-indigo-600" },
              { label: "Live Now",       value: liveCount,       color: "text-red-500" },
              { label: "Total Bookings", value: totalBookings,   color: "text-emerald-600" },
              { label: "Upcoming",       value: classes.filter((c) => c.status === "upcoming").length, color: "text-blue-600" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="border-none shadow-sm dark:bg-zinc-900/60">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeIn>

        {/* Table */}
        <FadeIn delay={0.15}>
          <Card className="border-none shadow-sm dark:bg-zinc-900/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">All Classes</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-white dark:bg-zinc-900 h-9 w-52"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-9 px-3">
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center py-16 gap-3 text-zinc-400">
                  <Loader2 className="h-6 w-6 animate-spin" /><span className="text-sm">Loading…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <AlertCircle className="h-8 w-8 text-zinc-300" />
                  <p className="text-sm text-zinc-500">No classes found.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filtered.map((cls) => {
                    const expanded = expandedId === cls.id;
                    const booked = cls.max_seats - cls.available_seats;
                    return (
                      <div key={cls.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        {/* Row */}
                        <div className="flex items-center gap-3 px-5 py-4">
                          {/* Icon */}
                          <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                            <Dumbbell className="h-5 w-5 text-zinc-400" />
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">{cls.title}</span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[cls.status]}`}>
                                {cls.status}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[cls.difficulty]}`}>
                                {cls.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-0.5 text-xs text-zinc-400">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{cls.instructor_name}</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmt(cls.schedule_time)}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cls.duration_minutes}m</span>
                              <span className="capitalize">{TYPE_LABELS[cls.class_type]}</span>
                            </div>
                          </div>

                          {/* Booking count */}
                          <div className="hidden sm:flex flex-col items-end shrink-0">
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{booked}/{cls.max_seats}</span>
                            <span className="text-[10px] text-zinc-400">booked</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-blue-600"
                              onClick={() => setAttendeeTarget(cls)}
                              title="View attendees"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-amber-600"
                              onClick={() => setEditTarget(cls)}
                              title="Edit class"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600"
                              onClick={() => setDeleteTarget(cls)}
                              disabled={deleting === cls.id}
                              title="Delete class"
                            >
                              {deleting === cls.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 w-8 p-0 text-zinc-400"
                              onClick={() => setExpandedId(expanded ? null : cls.id)}
                            >
                              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded description */}
                        {expanded && (
                          <div className="px-5 pb-4 pl-[68px] text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
                            {cls.description && <p>{cls.description}</p>}
                            {cls.instructor_bio && (
                              <p className="text-xs italic text-zinc-400">Coach: {cls.instructor_bio}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </main>

      {/* ── Create Dialog ─────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>Fill in the details for the new fitness class.</DialogDescription>
          </DialogHeader>
          <ClassForm onSubmit={handleCreate} onClose={() => setCreateOpen(false)} loading={submitting} />
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update the details for "{editTarget?.title}".</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <ClassForm
              initial={editInitial}
              onSubmit={handleUpdate}
              onClose={() => setEditTarget(null)}
              loading={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Class?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>"{deleteTarget?.title}"</strong> and all its booking records. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Attendee Modal ────────────────────────────────────── */}
      {attendeeTarget && (
        <AttendeeModal
          classId={attendeeTarget.id}
          classTitle={attendeeTarget.title}
          onClose={() => setAttendeeTarget(null)}
        />
      )}
    </div>
  );
};

// Lazy search icon import fix
const Search = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

export default AdminPanel;
