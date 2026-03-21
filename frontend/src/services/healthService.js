import { api } from "./api";

export const healthService = {
  // Sleep
  logSleep: (data) => api.post("/health/sleep", data),
  getSleepToday: () => api.get("/health/sleep/today"),
  listSleep: (days = 14) => api.get("/health/sleep", { params: { days } }),
  deleteSleep: (id) => api.delete(`/health/sleep/${id}`),

  // Mood
  logMood: (data) => api.post("/health/mood", data),
  getMoodToday: () => api.get("/health/mood/today"),
  listMood: (days = 14) => api.get("/health/mood", { params: { days } }),
  deleteMood: (id) => api.delete(`/health/mood/${id}`),

  // Readiness
  getReadinessToday: () => api.get("/health/readiness/today"),
  getReadinessHistory: (days = 7) => api.get("/health/readiness/history", { params: { days } }),

  // Summary & insight
  getWeeklySummary: () => api.get("/health/summary/week"),

  // Breathing exercises
  getBreathingExercises: () => api.get("/health/breathing"),
};
