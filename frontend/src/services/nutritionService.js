import { api } from "./api";

const fmt = (d) => d instanceof Date ? d.toISOString().split("T")[0] : d;

export const nutritionService = {
  // ── Profile ────────────────────────────────────────────────────────────────
  getProfile: () => api.get("/nutrition/profile"),
  createProfile: (data) => api.post("/nutrition/profile", data),
  updateProfile: (data) => api.put("/nutrition/profile", data),

  // ── Foods ──────────────────────────────────────────────────────────────────
  searchFoods: (q = "", category = "", limit = 20) => {
    const params = new URLSearchParams({ limit });
    if (q) params.append("q", q);
    if (category) params.append("category", category);
    return api.get(`/nutrition/foods?${params.toString()}`);
  },
  getFood: (id) => api.get(`/nutrition/foods/${id}`),
  getRecommendations: () => api.get("/nutrition/recommendations"),


  // ── Meal Logs ──────────────────────────────────────────────────────────────
  addLog: (data) => api.post("/nutrition/logs", { ...data, log_date: fmt(data.log_date) }),
  getLogs: (log_date, meal_type) => {
    const params = new URLSearchParams();
    if (log_date) params.append("log_date", fmt(log_date));
    if (meal_type) params.append("meal_type", meal_type);
    return api.get(`/nutrition/logs?${params.toString()}`);
  },
  deleteLog: (id) => api.delete(`/nutrition/logs/${id}`),

  // ── Summaries ──────────────────────────────────────────────────────────────
  getDailySummary: (date) => api.get(`/nutrition/summary/daily?log_date=${fmt(date)}`),
  getWeeklySummary: (end_date) => api.get(`/nutrition/summary/weekly?end_date=${fmt(end_date)}`),

  // ── Seed ───────────────────────────────────────────────────────────────────
  seedFoods: () => api.post("/nutrition/seed"),
};
