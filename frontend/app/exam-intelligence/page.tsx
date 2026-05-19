"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import {
  Brain,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Target,
  Lightbulb,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Question {
  question: string;
  frequency: number;
  marks: number;
  importance_score: number;
  category: string;
  module: string;
  category_label: string;
}

interface AnalysisResult {
  success: boolean;
  questions: Question[];
  stats: {
    total_questions: number;
    very_important: number;
    important: number;
    practice: number;
    repeated_questions: number;
    top_topics: Array<{ topic: string; count: number }>;
    module_distribution: Record<string, number>;
  };
  very_important: Question[];
  important: Question[];
  practice: Question[];
  llm_analysis?: string;
}

export default function ExamIntelligencePage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [predictions, setPredictions] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [predLoading, setPredLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [activeTab, setActiveTab] = useState<"very_important" | "important" | "practice" | "topics">(
    "very_important"
  );

  const analyzeQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/pyq/analyze", { subject });
      setAnalysis(res.data);
      toast.success("PYQ analysis complete!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Analysis failed. Upload PYQ documents first.");
    } finally {
      setLoading(false);
    }
  };

  const predictQuestions = async () => {
    if (!subject) {
      toast.error("Enter a subject name for predictions");
      return;
    }
    setPredLoading(true);
    try {
      const res = await axios.post("/api/pyq/predict", { subject });
      setPredictions(res.data.predictions?.[0]?.predictions || "No predictions available");
      toast.success("Predictions generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Prediction failed");
    } finally {
      setPredLoading(false);
    }
  };

  const tabs = [
    { id: "very_important", label: "🔴 Very Important", count: analysis?.stats.very_important },
    { id: "important", label: "🟡 Important", count: analysis?.stats.important },
    { id: "practice", label: "🟢 Practice", count: analysis?.stats.practice },
    { id: "topics", label: "📊 Topics", count: null },
  ];

  const currentQuestions =
    activeTab === "topics"
      ? []
      : analysis?.[activeTab as keyof Pick<AnalysisResult, "very_important" | "important" | "practice">] || [];

  return (
    <MainLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Exam Intelligence
          </h1>
          <p className="text-slate-400">
            Analyze previous year questions, find patterns, predict important topics
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              placeholder="Subject name (e.g., Data Structures)"
              className="glass-input flex-1 text-sm"
            />
            <button
              onClick={analyzeQuestions}
              disabled={loading}
              className="glass-button-primary flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              Analyze PYQs
            </button>
            <button
              onClick={predictQuestions}
              disabled={predLoading}
              className="glass-button flex items-center gap-2 whitespace-nowrap"
            >
              {predLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              Predict Questions
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
          >
            {[
              { label: "Total", value: analysis.stats.total_questions, color: "text-white", icon: BarChart3 },
              { label: "Very Important", value: analysis.stats.very_important, color: "text-red-400", icon: AlertCircle },
              { label: "Important", value: analysis.stats.important, color: "text-yellow-400", icon: Star },
              { label: "Practice", value: analysis.stats.practice, color: "text-emerald-400", icon: CheckCircle },
              { label: "Repeated", value: analysis.stats.repeated_questions, color: "text-cyan-400", icon: TrendingUp },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card p-4 text-center">
                  <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Predictions */}
        {predictions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Predicted Questions for {subject}
            </h3>
            <div className="markdown-content text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{predictions}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Questions Tabs */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            {/* Tab Headers */}
            <div
              className="flex border-b"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    "flex-1 px-4 py-3 text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "text-white border-b-2 border-indigo-500"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab.label}
                  {tab.count !== null && tab.count !== undefined && (
                    <span className="ml-1 text-xs text-slate-500">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === "topics" ? (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    High-Frequency Topics
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {analysis.stats.top_topics.map((t: { topic: string; count: number }, i: number) => (
                      <div
                        key={t.topic}
                        className="px-3 py-1.5 rounded-xl text-sm flex items-center gap-2"
                        style={{
                          background: `rgba(99,102,241,${0.1 + (i / analysis.stats.top_topics.length) * 0.2})`,
                          border: "1px solid rgba(99,102,241,0.3)",
                        }}
                      >
                        <span className="text-indigo-300 font-medium capitalize">
                          {t.topic}
                        </span>
                        <span className="text-xs text-slate-400">×{t.count}</span>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    Module Distribution
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.stats.module_distribution).map(
                      ([module, count]) => {
                        const total = analysis.stats.total_questions;
                        const pct = Math.round(((count as number) / total) * 100);
                        return (
                          <div key={module}>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>{module}</span>
                              <span>{count} questions ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                className="h-full progress-bar"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {currentQuestions.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      No questions in this category
                    </p>
                  ) : (
                    currentQuestions.map((q: Question, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-4 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-white flex-1">{q.question}</p>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={clsx(
                                "text-xs px-2 py-0.5 rounded-full",
                                q.category === "very_important"
                                  ? "badge-important"
                                  : q.category === "important"
                                  ? "badge-medium"
                                  : "badge-practice"
                              )}
                            >
                              {q.marks}M
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-500">
                            {q.module}
                          </span>
                          <span className="text-xs text-slate-500">
                            Appeared {q.frequency}×
                          </span>
                          <span className="text-xs text-indigo-400">
                            Score: {q.importance_score}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* LLM Analysis fallback */}
        {analysis?.llm_analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6 mt-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              AI Analysis
            </h3>
            <div className="markdown-content text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysis.llm_analysis}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!analysis && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">
              No Analysis Yet
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Upload previous year question papers in the Upload Center, then
              click "Analyze PYQs" to discover patterns and important questions.
            </p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
