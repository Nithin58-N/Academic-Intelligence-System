"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

interface ProviderStatus {
  provider: string;
  status: "online" | "offline";
  model?: string;
  error?: string;
}

interface HealthResponse {
  status: string;
  system: string;
  provider: ProviderStatus;
}

export default function ProviderStatusIndicator() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get("/api/health");
        setProviderStatus(response.data.provider);
      } catch (error) {
        setProviderStatus({
          provider: "unknown",
          status: "offline",
          error: "Failed to fetch provider status",
        });
      } finally {
        setLoading(false);
      }
    };

    // Check on mount
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !providerStatus) {
    return null;
  }

  const isOnline = providerStatus.status === "online";
  const isGrok = providerStatus.provider === "grok";
  const isOllama = providerStatus.provider === "ollama";

  // Determine colors and icons based on provider and status
  let bgColor = "rgba(100, 100, 100, 0.2)"; // Offline gray
  let borderColor = "rgba(100, 100, 100, 0.4)";
  let textColor = "text-gray-400";
  let statusIcon = "⚠️";
  let statusText = "Offline";

  if (isOnline) {
    if (isGrok) {
      bgColor = "rgba(34, 197, 94, 0.1)"; // Green for Grok (online)
      borderColor = "rgba(34, 197, 94, 0.3)";
      textColor = "text-emerald-400";
      statusIcon = "✓";
      statusText = `Grok Online`;
    } else if (isOllama) {
      bgColor = "rgba(249, 115, 22, 0.1)"; // Orange for Ollama (hybrid)
      borderColor = "rgba(249, 115, 22, 0.3)";
      textColor = "text-orange-400";
      statusIcon = "↔";
      statusText = `Hybrid Mode`;
    }
  } else if (isOllama) {
    bgColor = "rgba(239, 68, 68, 0.1)"; // Red for offline
    borderColor = "rgba(239, 68, 68, 0.3)";
    textColor = "text-red-400";
    statusIcon = "✗";
    statusText = "Offline";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
      }}
      title={`Provider: ${providerStatus.provider.toUpperCase()}\nModel: ${providerStatus.model || "Unknown"}\nStatus: ${providerStatus.status}`}
    >
      <span className="text-lg">{statusIcon}</span>
      <span className={`font-semibold ${textColor}`}>{statusText}</span>
    </motion.div>
  );
}
