import { api } from "./api";

export const bookingService = {
  // ── Classes (public) ────────────────────────────────────────
  getClasses: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.difficulty) params.append("difficulty", filters.difficulty);
    if (filters.class_type) params.append("class_type", filters.class_type);
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);
    const qs = params.toString();
    return api.get(`/classes${qs ? `?${qs}` : ""}`);
  },

  getClass: (classId) => api.get(`/classes/${classId}`),

  // ── Classes (admin) ─────────────────────────────────────────
  createClass: (data) => api.post("/classes", data),
  updateClass: (classId, data) => api.put(`/classes/${classId}`, data),
  deleteClass: (classId) => api.delete(`/classes/${classId}`),
  getClassBookings: (classId) => api.get(`/classes/${classId}/bookings`),

  // ── Bookings (user) ─────────────────────────────────────────
  bookClass: (classId) => api.post("/bookings", { classId }),
  cancelBooking: (bookingId) => api.delete(`/bookings/${bookingId}`),
  getMyBookings: () => api.get("/bookings/my"),

  // ── Dev seed ─────────────────────────────────────────────────
  seed: () => api.post("/seed"),
};
