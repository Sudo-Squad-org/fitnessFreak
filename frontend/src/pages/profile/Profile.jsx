import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { FadeIn } from "@/components/common/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, User, Mail, Phone, Calendar, Ruler, Weight,
  Shield, AlertTriangle, CheckCircle2, ChevronDown,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────

const SelectField = ({ id, value, onChange, children, className = "" }) => (
  <div className="relative">
    <select
      id={id}
      value={value ?? ""}
      onChange={onChange}
      className={`flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 ${className}`}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  </div>
);

const Field = ({ label, icon: Icon, children, error }) => (
  <div className="space-y-1.5">
    <Label className={`flex items-center gap-1.5 text-xs font-medium ${error ? "text-destructive" : "text-muted-foreground"}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

// ── OTP Timer ──────────────────────────────────────────────────────────────────

const OTPTimer = ({ seconds, onExpire }) => {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const pct = (remaining / seconds) * 100;
  const color = remaining > 60 ? "text-emerald-500" : remaining > 30 ? "text-amber-500" : "text-destructive";

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8">
        <svg viewBox="0 0 32 32" className="-rotate-90 h-8 w-8">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
          <circle
            cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3"
            className={color}
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold rotate-90 ${color}`}>
          {remaining}
        </span>
      </div>
      <span className={`text-xs font-medium ${color}`}>{remaining}s remaining</span>
    </div>
  );
};

// ── Delete Account Section ─────────────────────────────────────────────────────

const DangerZone = ({ onDeleted }) => {
  const { toast } = useToast();
  const [phase, setPhase] = useState("idle"); // idle | confirm | otp | deleting
  const [otp, setOtp] = useState("");
  const [otpExpired, setOtpExpired] = useState(false);
  const [devOtp, setDevOtp] = useState(null);
  const inputRefs = useRef([]);

  const handleRequestOTP = async () => {
    setPhase("otp");
    setOtp("");
    setOtpExpired(false);
    setDevOtp(null);
    try {
      const res = await authService.requestDeleteAccount();
      if (res.dev_otp) setDevOtp(res.dev_otp);
      toast({ title: "OTP sent", description: "Check your email for the 6-digit code." });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to send OTP", description: err.response?.data?.detail });
      setPhase("confirm");
    }
  };

  const handleConfirmDelete = async () => {
    if (otp.length !== 6) return;
    setPhase("deleting");
    try {
      await authService.confirmDeleteAccount(otp);
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      onDeleted();
    } catch (err) {
      toast({ variant: "destructive", title: "Invalid OTP", description: err.response?.data?.detail });
      setPhase("otp");
    }
  };

  // Split-input OTP: handle input per digit
  const handleOtpChange = (index, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const arr = otp.split("");
    arr[index] = digit;
    const next = arr.join("").slice(0, 6);
    setOtp(next.padEnd(6, " ").slice(0, 6).trimEnd());
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const otpDigits = otp.split("").concat(Array(6).fill("")).slice(0, 6);
  const otpComplete = otp.replace(/\s/g, "").length === 6;

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <p className="text-sm font-semibold text-destructive">Danger Zone</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Permanently deletes your account and all associated data. This action cannot be undone.
      </p>

      {phase === "idle" && (
        <Button
          variant="destructive"
          size="sm"
          className="h-9 rounded-lg text-xs"
          onClick={() => setPhase("confirm")}
        >
          Delete my account
        </Button>
      )}

      {phase === "confirm" && (
        <div className="space-y-3">
          <p className="text-xs text-foreground font-medium">
            Are you sure? We'll send a 6-digit OTP to your email to confirm.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" className="h-9 text-xs rounded-lg" onClick={handleRequestOTP}>
              Yes, send OTP
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => setPhase("idle")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {phase === "otp" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Enter the 6-digit OTP from your email</p>
            <OTPTimer seconds={120} onExpire={() => setOtpExpired(true)} />
          </div>

          {devOtp && (
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Dev mode OTP:</p>
              <code className="text-xs font-mono font-bold">{devOtp}</code>
            </div>
          )}

          {/* Split OTP input */}
          <div className="flex gap-2 justify-start">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit.trim()}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                disabled={otpExpired}
                className="h-11 w-10 rounded-lg border border-input bg-background text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1 disabled:opacity-40"
              />
            ))}
          </div>

          {otpExpired ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-destructive">OTP expired.</p>
              <button
                onClick={handleRequestOTP}
                className="text-xs font-semibold text-foreground hover:underline"
              >
                Resend OTP
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="h-9 text-xs rounded-lg"
                onClick={handleConfirmDelete}
                disabled={!otpComplete}
              >
                Confirm deletion
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs rounded-lg"
                onClick={() => { setPhase("idle"); setOtp(""); }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "deleting" && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
          <span className="text-xs text-muted-foreground">Deleting your account…</span>
        </div>
      )}
    </div>
  );
};

// ── Main Profile Page ──────────────────────────────────────────────────────────

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authService.me().then((data) => {
      setForm({
        name: data.name ?? "",
        phone: data.phone ?? "",
        bio: data.bio ?? "",
        date_of_birth: data.date_of_birth ?? "",
        gender: data.gender ?? "",
        height_cm: data.height_cm ?? "",
        weight_kg: data.weight_kg ?? "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => { setForm((prev) => ({ ...prev, [k]: v })); setSaved(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      if (form.name?.trim()) payload.name = form.name.trim();
      if (form.phone?.trim()) payload.phone = form.phone.trim();
      if (form.bio?.trim()) payload.bio = form.bio.trim();
      if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
      if (form.gender) payload.gender = form.gender;
      if (form.height_cm !== "") payload.height_cm = parseFloat(form.height_cm);
      if (form.weight_kg !== "") payload.weight_kg = parseFloat(form.weight_kg);

      await authService.updateProfile(payload);
      setSaved(true);
      toast({ title: "Profile updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update", description: err.response?.data?.detail });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleted = async () => {
    await logout();
    navigate("/login");
  };

  const initials = currentUser?.user?.name
    ? currentUser.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <FadeIn>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {currentUser?.user?.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-muted-foreground">{currentUser?.user?.email}</span>
                {currentUser?.user?.role === "admin" && (
                  <span className="flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.06}>
          <form onSubmit={handleSave}>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-foreground">Personal Information</p>
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>

              {/* Read-only fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email" icon={Mail}>
                  <Input value={currentUser?.user?.email ?? ""} disabled className="opacity-60" />
                </Field>
                <Field label="Role">
                  <Input value={currentUser?.user?.role === "admin" ? "Administrator" : "Member"} disabled className="opacity-60 capitalize" />
                </Field>
              </div>

              <div className="h-px bg-border" />

              {/* Editable fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full name" icon={User}>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Your full name"
                  />
                </Field>
                <Field label="Phone" icon={Phone}>
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                  />
                </Field>
                <Field label="Date of birth" icon={Calendar}>
                  <Input
                    value={form.date_of_birth}
                    onChange={(e) => set("date_of_birth", e.target.value)}
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </Field>
                <Field label="Gender">
                  <SelectField value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </SelectField>
                </Field>
                <Field label="Height (cm)" icon={Ruler}>
                  <Input
                    value={form.height_cm}
                    onChange={(e) => set("height_cm", e.target.value)}
                    type="number"
                    min="50"
                    max="300"
                    step="0.1"
                    placeholder="e.g. 175"
                  />
                </Field>
                <Field label="Weight (kg)" icon={Weight}>
                  <Input
                    value={form.weight_kg}
                    onChange={(e) => set("weight_kg", e.target.value)}
                    type="number"
                    min="20"
                    max="500"
                    step="0.1"
                    placeholder="e.g. 72.5"
                  />
                </Field>
              </div>

              {/* Bio */}
              <Field label="Bio">
                <textarea
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Tell us a bit about yourself…"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                />
              </Field>

              <Button type="submit" className="w-full h-10 rounded-lg" disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                ) : "Save changes"}
              </Button>
            </div>
          </form>
        </FadeIn>

        {/* Danger Zone */}
        <FadeIn delay={0.12}>
          <div className="mt-6">
            <DangerZone onDeleted={handleDeleted} />
          </div>
        </FadeIn>
      </main>
    </div>
  );
};

export default Profile;
