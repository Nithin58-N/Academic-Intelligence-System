"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  User, Mail, Calendar, MessageSquare,
  FileText, Loader2, Edit2, Check, X,
} from "lucide-react";

interface Stats {
  total_chats: number;
  total_documents: number;
  member_since: string | null;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/auth/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    if (!fullName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/api/auth/profile", { full_name: fullName });
      updateUser(data);
      toast.success("Profile updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const joinDate = stats?.member_since
    ? new Date(stats.member_since).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  return (
    <MainLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-1">My Profile</h1>
          <p className="text-slate-400 text-sm">Manage your account details</p>
        </motion.div>

        {/* Avatar + info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6 flex items-start gap-6"
        >
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {(user?.full_name || user?.username || "U")[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="flex items-center gap-3 mb-1">
              {editing ? (
                <>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="glass-input text-lg font-bold py-1.5 px-3 w-48"
                    autoFocus
                  />
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                    aria-label="Save"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setFullName(user?.full_name || ""); }}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white">
                    {user?.full_name || user?.username || "User"}
                  </h2>
                  <button
                    onClick={() => { setEditing(true); setFullName(user?.full_name || ""); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Edit name"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                </>
              )}
            </div>
            <p className="text-slate-400 text-sm">@{user?.username}</p>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-6"
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Account Details</h3>
          <div className="space-y-3">
            {[
              { icon: Mail, label: "Email", value: user?.email || "—" },
              { icon: User, label: "Username", value: `@${user?.username || "—"}` },
              { icon: Calendar, label: "Member Since", value: joinDate },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-sm text-white font-medium">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          {[
            { icon: MessageSquare, label: "Total Chats", value: stats?.total_chats ?? "—", color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-500/5" },
            { icon: FileText, label: "Uploaded Files", value: stats?.total_documents ?? "—", color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="glass-card p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-sm text-slate-400">{card.label}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </MainLayout>
  );
}
