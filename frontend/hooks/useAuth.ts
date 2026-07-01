/**
 * useAuth — convenience hook wrapping the auth store.
 * Provides login, register, logout helpers with toast feedback.
 */

"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/auth";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Shape of an axios error response from our backend
interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, setAuth, clearAuth, updateUser } =
    useAuthStore();

  const login = async (payload: LoginPayload): Promise<boolean> => {
    try {
      const res = await api.post("/api/auth/login", payload);
      const data = res.data as AuthResponse;
      setAuth(data.user, data.access_token);

      // Persist token in cookie for middleware (edge runtime can't read localStorage)
      document.cookie = `academic_ai_token=${encodeURIComponent(
        JSON.stringify({ state: { token: data.access_token, user: data.user } })
      )}; path=/; max-age=86400; SameSite=Lax`;

      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`);
      return true;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const msg = apiErr.response?.data?.detail ?? "Login failed. Check your credentials.";
      toast.error(msg);
      return false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const res = await api.post("/api/auth/register", payload);
      const data = res.data as AuthResponse;
      setAuth(data.user, data.access_token);

      document.cookie = `academic_ai_token=${encodeURIComponent(
        JSON.stringify({ state: { token: data.access_token, user: data.user } })
      )}; path=/; max-age=86400; SameSite=Lax`;

      toast.success("Account created! Welcome to Academic AI 🎓");
      return true;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const msg = apiErr.response?.data?.detail ?? "Registration failed.";
      toast.error(msg);
      return false;
    }
  };

  const logout = (): void => {
    clearAuth();
    // Clear auth cookie
    document.cookie =
      "academic_ai_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const res = await api.get("/api/auth/me");
      const data = res.data as User;
      updateUser(data);
    } catch {
      // Token expired or invalid
      logout();
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };
}
