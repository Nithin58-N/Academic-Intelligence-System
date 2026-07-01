"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import {
  Settings,
  Server,
  Globe,
  Mic,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { clsx } from "clsx";

export default function SettingsPage() {
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [mainModel, setMainModel] = useState("llama3:8b");
  const [embeddingModel, setEmbeddingModel] = useState("nomic-embed-text");
  const [whisperModel, setWhisperModel] = useState("base");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [chunkSize, setChunkSize] = useState("1000");
  const [topK, setTopK] = useState("5");
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "ok" | "error">("idle");

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus("idle");
    try {
      await api.get("/health");
      setConnectionStatus("ok");
      toast.success("Backend connection successful!");
    } catch {
      setConnectionStatus("error");
      toast.error("Backend connection failed. Is the server running?");
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = () => {
    // In a real app, these would be saved to backend/localStorage
    localStorage.setItem("academic_ai_settings", JSON.stringify({
      ollamaUrl, mainModel, embeddingModel, whisperModel,
      defaultLanguage, chunkSize, topK,
    }));
    toast.success("Settings saved locally");
  };

  const sections = [
    {
      title: "AI Models",
      icon: Server,
      color: "text-indigo-400",
      fields: [
        {
          label: "Ollama Base URL",
          value: ollamaUrl,
          onChange: setOllamaUrl,
          placeholder: "http://localhost:11434",
          hint: "Local Ollama server URL",
        },
        {
          label: "Main LLM Model",
          value: mainModel,
          onChange: setMainModel,
          placeholder: "llama3:8b",
          hint: "Primary model for chat and generation",
        },
        {
          label: "Embedding Model",
          value: embeddingModel,
          onChange: setEmbeddingModel,
          placeholder: "nomic-embed-text",
          hint: "Model for document embeddings",
        },
      ],
    },
    {
      title: "Speech Settings",
      icon: Mic,
      color: "text-cyan-400",
      fields: [
        {
          label: "Whisper Model Size",
          value: whisperModel,
          onChange: setWhisperModel,
          placeholder: "base",
          hint: "tiny / base / small / medium / large",
        },
      ],
    },
    {
      title: "RAG Configuration",
      icon: Database,
      color: "text-emerald-400",
      fields: [
        {
          label: "Chunk Size",
          value: chunkSize,
          onChange: setChunkSize,
          placeholder: "1000",
          hint: "Characters per document chunk",
        },
        {
          label: "Top-K Results",
          value: topK,
          onChange: setTopK,
          placeholder: "5",
          hint: "Number of chunks to retrieve per query",
        },
      ],
    },
  ];

  const models = [
    { name: "llama3:8b", desc: "Main chat model (recommended)", size: "4.7GB" },
    { name: "phi3", desc: "Fast responses, smaller model", size: "2.3GB" },
    { name: "deepseek-coder", desc: "Code-focused tasks", size: "3.8GB" },
    { name: "gemma:7b", desc: "Alternative general model", size: "5.0GB" },
    { name: "nomic-embed-text", desc: "Document embeddings", size: "274MB" },
  ];

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-slate-400">Configure your Academic AI system</p>
        </motion.div>

        {/* Connection Test */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                System Connection
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Test connection to backend and Ollama
              </p>
            </div>
            <div className="flex items-center gap-3">
              {connectionStatus === "ok" && (
                <div className="flex items-center gap-1 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </div>
              )}
              {connectionStatus === "error" && (
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <XCircle className="w-4 h-4" />
                  Failed
                </div>
              )}
              <button
                onClick={testConnection}
                disabled={testing}
                className="glass-button flex items-center gap-2 text-sm"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Test Connection
              </button>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {sections.map((section, si) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.1 }}
                className="glass-card p-5"
              >
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${section.color}`} />
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.label}>
                      <label className="text-xs text-slate-400 mb-1 block">
                        {field.label}
                      </label>
                      <input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className="glass-input w-full text-sm"
                      />
                      <p className="text-xs text-slate-600 mt-1">{field.hint}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Language */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              Language Preferences
            </h3>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">
                Default Language
              </label>
              <div className="flex gap-2">
                {[
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिंदी" },
                  { code: "kn", label: "ಕನ್ನಡ" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setDefaultLanguage(lang.code)}
                    className={clsx(
                      "flex-1 py-2 rounded-xl text-sm transition-all",
                      defaultLanguage === lang.code
                        ? "bg-indigo-500/30 text-white border border-indigo-500/50"
                        : "text-slate-400 border border-white/10 hover:text-white"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Ollama Models Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">
              Required Ollama Models
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Run these commands to pull required models:
            </p>
            <div className="space-y-2">
              {models.map((model) => (
                <div
                  key={model.name}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div>
                    <code className="text-sm text-indigo-300">{model.name}</code>
                    <p className="text-xs text-slate-500 mt-0.5">{model.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">{model.size}</span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ollama pull {model.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex justify-end"
        >
          <button
            onClick={saveSettings}
            className="glass-button-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </motion.div>
      </div>
    </MainLayout>
  );
}
