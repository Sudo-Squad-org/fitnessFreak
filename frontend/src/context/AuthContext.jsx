import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { authService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleAuthSuccess = (token) => {
    localStorage.setItem("token", token);
    try {
      const decoded = jwtDecode(token);
      setCurrentUser({
        token,
        user: {
          id: decoded.user_id,
          name: decoded.name,
          role: decoded.role || "user",
        },
      });
    } catch (err) {
      console.error("Token decode error:", err);
      localStorage.removeItem("token");
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      handleAuthSuccess(token);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    handleAuthSuccess(data.token);
    return data;
  };

  const signup = async (userData) => {
    const data = await authService.signup(userData);
    handleAuthSuccess(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  const isAdmin = currentUser?.user?.role === "admin";

  const value = { currentUser, loading, login, signup, logout, isAdmin };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
