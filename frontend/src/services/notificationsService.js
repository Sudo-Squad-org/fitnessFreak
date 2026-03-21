import { api } from "./api";

export const notificationsService = {
  list: (unreadOnly = false) =>
    api.get("/notifications", { params: unreadOnly ? { unread_only: true } : {} }),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
  getPrefs: () => api.get("/notifications/prefs"),
  updatePrefs: (data) => api.patch("/notifications/prefs", data),
};
