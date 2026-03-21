import React, { useState } from "react";
import { progressService } from "@/services/progressService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";

const FIELDS = [
  { key: "weight_kg", label: "Weight (kg)", placeholder: "e.g. 72.5" },
  { key: "body_fat_pct", label: "Body fat (%)", placeholder: "e.g. 18.0" },
  { key: "waist_cm", label: "Waist (cm)", placeholder: "e.g. 82" },
  { key: "chest_cm", label: "Chest (cm)", placeholder: "e.g. 96" },
  { key: "hips_cm", label: "Hips (cm)", placeholder: "e.g. 95" },
  { key: "biceps_cm", label: "Biceps (cm)", placeholder: "e.g. 34" },
];

export const AddMeasurementModal = ({ open, onClose, onAdded }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { date: form.date };
    FIELDS.forEach(({ key }) => {
      if (form[key]) payload[key] = parseFloat(form[key]);
    });
    if (form.notes) payload.notes = form.notes;

    setSubmitting(true);
    try {
      const res = await progressService.addMeasurement(payload);
      onAdded(res.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: err.response?.data?.detail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Add Measurement</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key} className="text-xs">{label}</Label>
                <Input
                  id={key}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={placeholder}
                  value={form[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any notes..."
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full h-10" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Measurement"}
          </Button>
        </form>
      </div>
    </div>
  );
};
