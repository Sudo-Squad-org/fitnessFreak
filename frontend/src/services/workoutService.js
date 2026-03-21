import { api } from "./api";

export const workoutService = {
  getPlan: (data) => api.post("/workouts/plan", data),
  getStats: () => api.get("/workouts/stats"),
  getSavedPlan: () => api.get("/workouts/plan/saved"),
  getPlanFromProfile: () => api.post("/workouts/plan/from-profile", {}),
  getWeekProgress: () => api.get("/workouts/progress/week"),
  toggleExercise: (data) => api.post("/workouts/progress/toggle", data),
};
