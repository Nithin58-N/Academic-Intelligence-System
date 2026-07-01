/**
 * Axios instance with:
 *  - Automatic Bearer token injection from auth store
 *  - 401 → redirect to /login
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/",
  timeout: 60000,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  // Read token directly from localStorage to avoid circular Zustand import
  try {
    const raw = localStorage.getItem("academic_ai_token");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth and redirect to login
      try {
        localStorage.removeItem("academic_ai_token");
      } catch {}
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
