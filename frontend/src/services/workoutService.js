import { api } from "./api";

export const workoutService = {
  getPlan: (data) => api.post("/workouts/plan", data),
  getStats: () => api.get("/workouts/stats"),
};
