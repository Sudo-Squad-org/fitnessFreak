import React, { useState } from "react";
import { nutritionService } from "@/services/nutritionService";
import { FoodSearchModal } from "./FoodSearchModal";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const MEAL_META = {
  breakfast: { label: "Breakfast", emoji: "🌅", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  lunch: { label: "Lunch", emoji: "☀️", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  dinner: { label: "Dinner", emoji: "🌙", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  snack: { label: "Snacks", emoji: "🍎", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
};

export const MealSection = ({ mealType, logs = [], logDate, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const meta = MEAL_META[mealType];
  const total = logs.reduce((s, l) => s + l.calories, 0);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await nutritionService.deleteLog(id);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer select-none"
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${meta.bg} flex items-center justify-center text-lg`}>
              {meta.emoji}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{meta.label}</p>
              <p className="text-xs text-muted-foreground">
                {logs.length === 0 ? "Nothing logged yet" : `${logs.length} item${logs.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${meta.color}`}>{Math.round(total)} kcal</span>
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <>
            {logs.length > 0 && (
              <div className="divide-y divide-border border-t border-border">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {log.food?.name || `Food #${log.food_id}`}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{log.quantity_g}g</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-emerald-500">P {Math.round(log.protein_g * 10) / 10}g</span>
                        <span className="text-xs text-amber-500">C {Math.round(log.carbs_g * 10) / 10}g</span>
                        <span className="text-xs text-rose-500">F {Math.round(log.fat_g * 10) / 10}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-sm font-semibold text-foreground">{Math.round(log.calories)}</span>
                      <span className="text-xs text-muted-foreground">kcal</span>
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={deleting === log.id}
                        className="ml-1 opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add button */}
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
                className="w-full gap-2 text-muted-foreground hover:text-foreground rounded-xl border border-dashed border-border hover:border-foreground/30"
              >
                <Plus className="h-4 w-4" />
                Add food to {meta.label.toLowerCase()}
              </Button>
            </div>
          </>
        )}
      </div>

      <FoodSearchModal
        open={modalOpen}
        mealType={mealType}
        logDate={logDate}
        onClose={() => setModalOpen(false)}
        onFoodAdded={() => {
          setModalOpen(false);
          onRefresh();
        }}
      />
    </>
  );
};
