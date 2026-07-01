/**
 * Zustand auth store with localStorage persistence.
 * Stores the JWT token and user object so sessions survive page refresh.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "@/types/auth";

const TOKEN_KEY = "academic_ai_token";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user: User, token: string) =>
        set({ user, token, isAuthenticated: true, isLoading: false }),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false, isLoading: false }),

      setLoading: (v: boolean) => set({ isLoading: v }),

      updateUser: (partial: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: TOKEN_KEY,
      // Only persist token + user, not loading state
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // After hydration, mark authenticated if token exists
          state.isAuthenticated = !!state.token;
          state.isLoading = false;
        }
      },
    }
  )
);
