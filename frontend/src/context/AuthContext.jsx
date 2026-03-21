import React, { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { authService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const storeTokens = (token, refreshToken) => {
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
  };

  const applyUserData = (token, userData, verified) => {
    setCurrentUser({
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role || "user",
      },
    });
    setEmailVerified(!!verified);
    setOnboardingCompleted(!!userData.onboarding_completed);
  };

  // Try to load user from stored token by calling /auth/me
  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Check token expiry before making a network call
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        // Token expired — try refresh
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          clearTokens();
          setLoading(false);
          return;
        }
        try {
          const data = await authService.refresh(refreshToken);
          storeTokens(data.token, data.refresh_token);
        } catch {
          clearTokens();
          setLoading(false);
          return;
        }
      }
    } catch {
      clearTokens();
      setLoading(false);
      return;
    }

    // Fetch fresh user profile from server
    try {
      const profile = await authService.me();
      applyUserData(localStorage.getItem("token"), profile, profile.email_verified);
    } catch {
      clearTokens();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    storeTokens(data.token, data.refresh_token);
    // Fetch profile after login for accurate server-side data
    const profile = await authService.me();
    applyUserData(data.token, profile, data.email_verified);
    return { ...data, onboarding_completed: profile.onboarding_completed };
  };

  const signup = async (userData) => {
    // Backend no longer issues tokens on signup — user must verify email first.
    const data = await authService.signup(userData);
    return data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      await authService.logout(refreshToken);
    } catch {
      // Best-effort — always clear local state
    }
    clearTokens();
    setCurrentUser(null);
    setEmailVerified(false);
    setOnboardingCompleted(false);
  };

  const isAdmin = currentUser?.user?.role === "admin";

  const value = {
    currentUser,
    emailVerified,
    setEmailVerified,
    onboardingCompleted,
    setOnboardingCompleted,
    loading,
    login,
    signup,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
