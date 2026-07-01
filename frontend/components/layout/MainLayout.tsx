"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import ProviderStatusIndicator from "./ProviderStatusIndicator";
import { useAuthStore } from "@/store/authStore";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while hydrating to prevent flash
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <span className="text-2xl">🎓</span>
          </div>
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 min-h-screen transition-all duration-300"
        style={{ marginLeft: "256px" }}
      >
        {/* Sticky header */}
        <div
          className="sticky top-0 z-40 w-full"
          style={{
            background: "rgba(10, 10, 26, 0.8)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="px-6 py-3 flex items-center justify-end gap-4">
            <ProviderStatusIndicator />
          </div>
        </div>

        {/* Page content */}
        {children}
      </motion.main>
    </div>
  );
}
