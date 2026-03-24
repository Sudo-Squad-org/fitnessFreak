import { api } from "./api";

const shouldSeedClasses = (filters, classes) =>
  classes.length === 0 && Object.keys(filters).length === 0;

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

  getClassesWithSeed: async (filters = {}) => {
    let response = await bookingService.getClasses(filters);

    if (shouldSeedClasses(filters, response.data)) {
      try {
        await bookingService.seed();
        response = await bookingService.getClasses(filters);
      } catch {
        // Leave the original empty response intact if seeding is unavailable.
      }
    }

    return response;
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
