import { api } from "./api";

export const progressService = {
  getStats: () => api.get("/progress/stats"),
  getBadges: () => api.get("/progress/badges"),
  getBadgeDefinitions: () => api.get("/progress/badges/definitions"),
  markBadgeSeen: (id) => api.patch(`/progress/badges/${id}/seen`),

  // Measurements
  addMeasurement: (data) => api.post("/progress/measurements", data),
  getMeasurements: () => api.get("/progress/measurements"),
  deleteMeasurement: (id) => api.delete(`/progress/measurements/${id}`),

  // Weekly report
  getWeeklyReport: () => api.get("/progress/weekly-report"),
};
