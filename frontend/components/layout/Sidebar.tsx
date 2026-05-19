"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Upload,
  Brain,
  FileText,
  Mic,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    color: "text-indigo-400",
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "AI Chat",
    color: "text-cyan-400",
  },
  {
    href: "/upload",
    icon: Upload,
    label: "Upload Center",
    color: "text-emerald-400",
  },
  {
    href: "/exam-intelligence",
    icon: Brain,
    label: "Exam Intelligence",
    color: "text-purple-400",
  },
  {
    href: "/notes",
    icon: FileText,
    label: "Notes Generator",
    color: "text-yellow-400",
  },
  {
    href: "/voice",
    icon: Mic,
    label: "Voice Assistant",
    color: "text-pink-400",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    color: "text-slate-400",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
      style={{
        background: "rgba(10, 10, 26, 0.8)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
          }}
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-bold text-white text-sm leading-tight">
              Academic AI
            </p>
            <p className="text-xs text-slate-500">Offline Assistant</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  "sidebar-item",
                  isActive && "active",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-white" : item.color
                  )}
                />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Language indicator */}
      {!collapsed && (
        <div className="p-3 border-t border-white/5">
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Supported Languages</p>
            <div className="flex justify-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EN
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                हि
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ಕ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: "rgba(99, 102, 241, 0.8)",
          border: "1px solid rgba(99, 102, 241, 0.5)",
          boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-white" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white" />
        )}
      </button>
    </motion.aside>
  );
}
