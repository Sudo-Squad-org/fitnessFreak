import { api } from "./api";

export const goalsService = {
  // Goals CRUD
  listGoals: (status) => api.get("/goals", { params: status ? { status_filter: status } : {} }),
  createGoal: (data) => api.post("/goals", data),
  updateGoal: (id, data) => api.patch(`/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/goals/${id}`),

  // Logs
  addLog: (data) => api.post("/goals/logs", data),
  getLogs: (goalId) => api.get(`/goals/${goalId}/logs`),

  // Summary
  weeklySummary: () => api.get("/goals/summary/week"),
};
