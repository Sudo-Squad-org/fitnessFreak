import { api } from "./api";

export const adminService = {
  // Stats
  getStats:          ()           => api.get("/admin/stats"),

  // User management
  getUsers:          (params)     => api.get("/admin/users", { params }),
  updateUserRole:    (id, role)   => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserActive:  (id, active) => api.patch(`/admin/users/${id}/active`, { is_active: active }),

  // Broadcast
  broadcast:         (data)       => api.post("/admin/broadcast", data),

  // Nutrition logs (admin view)
  getMealLogs:       (params)     => api.get("/nutrition/admin/logs", { params }),
};
