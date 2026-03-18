import React, { useState, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { nutritionService } from "@/services/nutritionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, X, Loader2, ChevronRight } from "lucide-react";

const CATEGORIES = ["all", "grain", "protein", "dairy", "vegetable", "fruit", "fat", "beverage", "snack"];
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

export const FoodSearchModal = ({ open, mealType, logDate, onClose, onFoodAdded }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCategory("all");
      setSelected(null);
      setQuantity("");
      setError("");
      setFetchError("");
      fetchFoods("", "all");
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [open]);

  const fetchFoods = (q, cat) => {
    setLoading(true);
    nutritionService
      .searchFoods(q, cat === "all" ? "" : cat, 30)
      .then((res) => {
        setFoods(Array.isArray(res.data) ? res.data : []);
        setFetchError("");
      })
      .catch((err) => {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail || err?.message || "Unknown error";
        console.error("fetchFoods error:", status, detail);
        setFoods([]);
        setFetchError(`Failed to load foods (${status || "network error"}): ${detail}`);
      })
      .finally(() => setLoading(false));
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchFoods(val, category), 300);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    fetchFoods(query, cat);
  };

  const handleSelect = (food) => {
    setSelected(food);
    setQuantity(String(food.serving_size_g));
    setError("");
  };

  const previewMacros =
    selected && quantity && parseFloat(quantity) > 0
      ? (() => {
          const r = parseFloat(quantity) / 100;
          return {
            calories: Math.round(selected.calories_per_100g * r),
            protein: Math.round(selected.protein_per_100g * r * 10) / 10,
            carbs: Math.round(selected.carbs_per_100g * r * 10) / 10,
            fat: Math.round(selected.fat_per_100g * r * 10) / 10,
          };
        })()
      : null;

  const handleAdd = async () => {
    if (!selected || !quantity || parseFloat(quantity) <= 0) return;
    setAdding(true);
    setError("");
    try {
      await nutritionService.addLog({
        food_id: selected.id,
        meal_type: mealType,
        quantity_g: parseFloat(quantity),
        log_date: logDate,
      });
      onFoodAdded();
      setSelected(null);
      setQuantity("");
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to add food.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        />

        {/* Modal panel */}
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            width: "min(480px, calc(100vw - 2rem))",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
          }}
          className="bg-background border border-border"
        >
          <DialogPrimitive.Title className="sr-only">
            Add food to {MEAL_LABELS[mealType]}
          </DialogPrimitive.Title>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div>
              <p className="font-bold text-foreground text-base">Add Food</p>
              <p className="text-xs text-muted-foreground mt-0.5">{MEAL_LABELS[mealType]}</p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search + categories */}
          <div className="px-4 py-3 border-b border-border shrink-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search foods… rice, chicken, dal"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    category === cat
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Selected food + quantity */}
          {selected && (
            <div className="px-4 py-3 border-b border-border bg-muted/40 shrink-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {selected.category} · {selected.serving_label || `${selected.serving_size_g}g per serving`}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-end gap-3">
                <div className="w-28 shrink-0 space-y-1">
                  <Label className="text-xs">Quantity (g)</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    className="h-9"
                  />
                </div>
                {previewMacros && (
                  <div className="flex-1 grid grid-cols-4 gap-1 text-center">
                    {[
                      { l: "kcal", v: previewMacros.calories, c: "text-indigo-500" },
                      { l: "P", v: `${previewMacros.protein}g`, c: "text-emerald-500" },
                      { l: "C", v: `${previewMacros.carbs}g`, c: "text-amber-500" },
                      { l: "F", v: `${previewMacros.fat}g`, c: "text-rose-500" },
                    ].map((m) => (
                      <div key={m.l} className="rounded-lg bg-background border border-border px-1 py-1.5">
                        <p className={`text-xs font-bold ${m.c}`}>{m.v}</p>
                        <p className="text-[10px] text-muted-foreground">{m.l}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}

              <Button
                onClick={handleAdd}
                disabled={adding || !quantity || parseFloat(quantity) <= 0}
                className="w-full mt-3 gap-2 rounded-xl"
                size="sm"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {adding ? "Adding..." : `Add to ${MEAL_LABELS[mealType]}`}
              </Button>
            </div>
          )}

          {/* Food list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : fetchError ? (
              <p className="text-center py-10 text-xs text-rose-500 px-4">{fetchError}</p>
            ) : foods.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground px-4">
                {query ? `No results for "${query}"` : "No foods found."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {(Array.isArray(foods) ? foods : []).map((food) => (
                  <li key={food.id}>
                    <button
                      onClick={() => handleSelect(food)}
                      className={`w-full text-left flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted ${
                        selected?.id === food.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-foreground truncate">{food.name}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {food.category} · {food.serving_label || `${food.serving_size_g}g`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {Math.round((food.calories_per_100g * food.serving_size_g) / 100)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">kcal</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
