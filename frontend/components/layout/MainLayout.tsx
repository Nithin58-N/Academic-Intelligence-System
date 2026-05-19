"use client";

import Sidebar from "./Sidebar";
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
        {children}
      </motion.main>
    </div>
  );
}
