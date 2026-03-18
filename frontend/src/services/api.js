import axios from "axios";

// Create an Axios instance with base URL configuration
export const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Interceptor to attach JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
