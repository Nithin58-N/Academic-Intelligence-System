"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/axios";

interface ProviderStatus {
  provider: string;
  status: "online" | "offline";
  model?: string;
  error?: string;
}

export default function ProviderStatusIndicator() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get("/health");
        setProviderStatus(res.data.provider);
      } catch {
        setProviderStatus({ provider: "unknown", status: "offline" });
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!providerStatus) return null;

  const isOnline = providerStatus.status === "online";
  const isGroq = providerStatus.provider === "groq";
  const isOllama = providerStatus.provider === "ollama";

  let bg = "rgba(100,100,100,0.2)";
  let border = "rgba(100,100,100,0.4)";
  let textColor = "text-slate-400";
  let dot = "bg-slate-500";
  let label = "Offline";

  if (isOnline) {
    if (isGroq) {
      bg = "rgba(34,197,94,0.1)";
      border = "rgba(34,197,94,0.3)";
      textColor = "text-emerald-400";
      dot = "bg-emerald-400";
      label = `Groq Online`;
    } else if (isOllama) {
      bg = "rgba(249,115,22,0.1)";
      border = "rgba(249,115,22,0.3)";
      textColor = "text-orange-400";
      dot = "bg-orange-400";
      label = "Ollama Mode";
    } else {
      bg = "rgba(34,197,94,0.1)";
      border = "rgba(34,197,94,0.3)";
      textColor = "text-emerald-400";
      dot = "bg-emerald-400";
      label = `${providerStatus.provider} Online`;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{ background: bg, border: `1px solid ${border}` }}
      title={`Provider: ${providerStatus.provider?.toUpperCase()}\nModel: ${providerStatus.model ?? "—"}\nStatus: ${providerStatus.status}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dot} ${isOnline ? "animate-pulse" : ""}`} />
      <span className={textColor}>{label}</span>
      {providerStatus.model && (
        <span className="text-slate-500 hidden sm:inline">({providerStatus.model})</span>
      )}
    </motion.div>
  );
}
