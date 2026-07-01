"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  User,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard",        color: "text-indigo-400" },
  { href: "/chat",      icon: MessageSquare,   label: "AI Chat",           color: "text-cyan-400" },
  { href: "/upload",    icon: Upload,          label: "Upload Center",     color: "text-emerald-400" },
  { href: "/exam-intelligence", icon: Brain,   label: "Exam Intelligence", color: "text-purple-400" },
  { href: "/notes",     icon: FileText,        label: "Notes Generator",   color: "text-yellow-400" },
  { href: "/voice",     icon: Mic,             label: "Voice Assistant",   color: "text-pink-400" },
  { href: "/settings",  icon: Settings,        label: "Settings",          color: "text-slate-400" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const avatar = (user?.full_name || user?.username || "U")[0].toUpperCase();
  const displayName = user?.full_name || user?.username || "User";

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-bold text-white text-sm leading-tight">Academic AI</p>
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
                <Icon className={clsx("w-5 h-5 flex-shrink-0", isActive ? "text-white" : item.color)} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
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

      {/* Bottom: user info + logout */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {/* Language badges — only when expanded */}
        {!collapsed && (
          <div className="glass-card p-2.5 text-center">
            <p className="text-xs text-slate-500 mb-1">Supported Languages</p>
            <div className="flex justify-center gap-1.5">
              {["EN", "हि", "ಕ"].map((l, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: ["rgba(99,102,241,0.2)", "rgba(6,182,212,0.2)", "rgba(16,185,129,0.2)"][i],
                    color: ["#a5b4fc", "#67e8f9", "#6ee7b7"][i],
                    border: `1px solid ${["rgba(99,102,241,0.3)", "rgba(6,182,212,0.3)", "rgba(16,185,129,0.3)"][i]}`,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Profile link */}
        <Link href="/profile">
          <motion.div
            whileHover={{ x: 2 }}
            className={clsx(
              "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
              collapsed && "justify-center",
              pathname === "/profile" ? "bg-indigo-500/20 border border-indigo-500/30" : "hover:bg-white/5"
            )}
            title={collapsed ? displayName : undefined}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {avatar}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
            {!collapsed && <User className="w-3.5 h-3.5 text-slate-500" />}
          </motion.div>
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          className={clsx(
            "w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sign Out" : undefined}
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
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
