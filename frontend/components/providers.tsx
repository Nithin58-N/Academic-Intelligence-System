"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

function AuthHydration() {
  const { token, setLoading } = useAuthStore();

  useEffect(() => {
    // After store hydration from localStorage, sync cookie for middleware
    if (token) {
      document.cookie = `academic_ai_token=${encodeURIComponent(
        JSON.stringify({ state: { token } })
      )}; path=/; max-age=86400; SameSite=Lax`;
    }
    setLoading(false);
  }, [token, setLoading]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthHydration />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(15, 12, 41, 0.95)",
            color: "#f1f5f9",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            backdropFilter: "blur(20px)",
            borderRadius: "12px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#f1f5f9" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#f1f5f9" },
          },
        }}
      />
    </>
  );
}
