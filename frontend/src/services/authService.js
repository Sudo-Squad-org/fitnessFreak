import { api } from "./api";

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  signup: async (userData) => {
    const response = await api.post("/auth/signup", userData);
    return response.data;
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  logout: async (refreshToken) => {
    const response = await api.post("/auth/logout", { refresh_token: refreshToken });
    return response.data;
  },
  refresh: async (refreshToken) => {
    const response = await api.post("/auth/refresh", { refresh_token: refreshToken });
    return response.data;
  },
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },
  resendVerification: async (email) => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },
  resetPassword: async (token, newPassword) => {
    const response = await api.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
  updateOnboarding: async ({ step, completed = false }) => {
    const response = await api.put("/auth/onboarding", { step, completed });
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.patch("/auth/profile", data);
    return response.data;
  },
  requestDeleteAccount: async () => {
    const response = await api.post("/auth/delete-account/request");
    return response.data;
  },
  confirmDeleteAccount: async (otp) => {
    const response = await api.delete("/auth/delete-account", { data: { otp } });
    return response.data;
  },
};
