"use client";

import { motion } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import {
  Brain,
  FileText,
  Upload,
  MessageSquare,
  TrendingUp,
  BookOpen,
  Zap,
  Clock,
  Star,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

interface Stats {
  total_documents: number;
  indexed_documents: number;
  total_pages: number;
  total_chunks: number;
  by_type: Record<string, number>;
}

const quickActions = [
  {
    href: "/chat",
    icon: MessageSquare,
    title: "Ask AI",
    desc: "Chat with your documents",
    color: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/30",
    iconColor: "text-indigo-400",
  },
  {
    href: "/upload",
    icon: Upload,
    title: "Upload PDF",
    desc: "Add study materials",
    color: "from-cyan-500/20 to-emerald-500/20",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    href: "/exam-intelligence",
    icon: Brain,
    title: "Analyze PYQs",
    desc: "Find important questions",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    href: "/notes",
    icon: FileText,
    title: "Generate Notes",
    desc: "Create study notes",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
];

const features = [
  { icon: "🌐", title: "Multilingual", desc: "Kannada, Hindi, English" },
  { icon: "🔒", title: "100% Offline", desc: "No internet required" },
  { icon: "🧠", title: "RAG-Powered", desc: "Grounded in your docs" },
  { icon: "🎤", title: "Voice Support", desc: "Speak in any language" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/documents/stats/overview")
      .then((res: { data: Stats }) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Documents",
      value: stats?.total_documents ?? 0,
      icon: BookOpen,
      color: "text-indigo-400",
      bg: "from-indigo-500/10 to-indigo-500/5",
    },
    {
      label: "Indexed",
      value: stats?.indexed_documents ?? 0,
      icon: Zap,
      color: "text-cyan-400",
      bg: "from-cyan-500/10 to-cyan-500/5",
    },
    {
      label: "Pages",
      value: stats?.total_pages ?? 0,
      icon: FileText,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      label: "Chunks",
      value: stats?.total_chunks ?? 0,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "from-purple-500/10 to-purple-500/5",
    },
  ];

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 25px rgba(99, 102, 241, 0.4)",
              }}
            >
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Academic AI Dashboard
              </h1>
              <p className="text-slate-400 text-sm">
                Offline Multilingual Intelligence System
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-card p-5"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center mb-3`}
                >
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? (
                    <span className="animate-pulse">—</span>
                  ) : (
                    card.value.toLocaleString()
                  )}
                </p>
                <p className="text-sm text-slate-400">{card.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`glass-card p-5 cursor-pointer border bg-gradient-to-br ${action.color} ${action.border} group`}
                  >
                    <Icon
                      className={`w-8 h-8 ${action.iconColor} mb-3 group-hover:scale-110 transition-transform`}
                    />
                    <p className="font-semibold text-white text-sm">
                      {action.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
                    <ChevronRight className="w-4 h-4 text-slate-500 mt-2 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Features & System Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              System Features
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{f.title}</p>
                    <p className="text-xs text-slate-400">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              System Status
            </h2>
            <div className="space-y-3">
              {[
                { label: "Ollama LLM (llama3:8b)", status: "active", color: "bg-emerald-400" },
                { label: "ChromaDB Vector Store", status: "active", color: "bg-emerald-400" },
                { label: "Whisper STT", status: "ready", color: "bg-yellow-400" },
                { label: "Piper TTS", status: "ready", color: "bg-yellow-400" },
                { label: "IndicTrans2", status: "optional", color: "bg-slate-400" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${item.color} ${
                        item.status === "active" ? "animate-pulse" : ""
                      }`}
                    />
                    <span className="text-xs text-slate-400 capitalize">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Document type breakdown */}
        {stats && Object.keys(stats.by_type).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Documents by Type
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div
                  key={type}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <span className="text-indigo-300 font-medium capitalize">
                    {type}
                  </span>
                  <span className="text-slate-400 ml-2">({count})</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
