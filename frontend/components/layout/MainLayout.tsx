"use client";

import Sidebar from "./Sidebar";
import ProviderStatusIndicator from "./ProviderStatusIndicator";
import { motion } from "framer-motion";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 ml-64 min-h-screen transition-all duration-300"
        style={{ marginLeft: "256px" }}
      >
        {/* Header with Provider Status */}
        <div className="sticky top-0 z-40 w-full" style={{ background: "rgba(10, 10, 26, 0.8)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div className="px-6 py-3 flex items-center justify-end gap-4">
            <ProviderStatusIndicator />
          </div>
        </div>

        {/* Main Content */}
        {children}
      </motion.main>
    </div>
  );
}
