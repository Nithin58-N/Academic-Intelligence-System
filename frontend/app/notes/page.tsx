"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import {
  FileText,
  Loader2,
  Download,
  BookOpen,
  Clock,
  Zap,
  GraduationCap,
  Calendar,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";

const NOTE_TYPES = [
  { value: "short", label: "Short Notes", icon: "📝", desc: "Key definitions only" },
  { value: "detailed", label: "Detailed Notes", icon: "📚", desc: "Full explanations" },
  { value: "revision", label: "Revision Notes", icon: "⚡", desc: "Quick bullet points" },
  { value: "exam", label: "Exam Notes", icon: "🎯", desc: "Exam-oriented tips" },
  { value: "2mark", label: "2-Mark Answers", icon: "✏️", desc: "Short answer format" },
  { value: "5mark", label: "5-Mark Answers", icon: "📋", desc: "Medium answer format" },
  { value: "10mark", label: "10-Mark Answers", icon: "📄", desc: "Long answer format" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

const PLAN_TYPES = [
  { value: "one_day", label: "1-Day Plan", icon: Clock },
  { value: "one_week", label: "1-Week Plan", icon: Calendar },
  { value: "full_semester", label: "Full Semester", icon: GraduationCap },
];

type ActiveTab = "notes" | "answer" | "plan" | "saved";

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("notes");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [noteType, setNoteType] = useState("detailed");
  const [language, setLanguage] = useState("en");
  const [question, setQuestion] = useState("");
  const [answerType, setAnswerType] = useState("5mark");
  const [planType, setPlanType] = useState("one_week");
  const [hours, setHours] = useState("40");
  const [weakTopics, setWeakTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  useEffect(() => {
    if (activeTab === "saved") loadSavedNotes();
  }, [activeTab]);

  const loadSavedNotes = async () => {
    try {
      const res = await api.get("/api/notes/saved");
      setSavedNotes(res.data);
    } catch {}
  };

  const generateNotes = async () => {
    if (!topic || !subject) {
      toast.error("Enter topic and subject");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await api.post("/api/notes/generate", {
        topic,
        subject,
        note_type: noteType,
        language,
      });
      setResult(res.data.content);
      toast.success("Notes generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generateAnswer = async () => {
    if (!question) {
      toast.error("Enter a question");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await api.post("/api/notes/answer", {
        question,
        answer_type: answerType,
        subject,
        language,
      });
      setResult(res.data.answer);
      toast.success("Answer generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!subject) {
      toast.error("Enter subject name");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await api.post("/api/notes/exam-plan", {
        subject,
        plan_type: planType,
        available_hours: parseInt(hours),
        weak_topics: weakTopics,
      });
      setResult(res.data.content);
      toast.success("Exam plan generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadNotes = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic || subject || "notes"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "notes", label: "Generate Notes", icon: FileText },
    { id: "answer", label: "Model Answer", icon: BookOpen },
    { id: "plan", label: "Exam Plan", icon: Calendar },
    { id: "saved", label: "Saved Notes", icon: Zap },
  ];

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
            Notes Generator
          </h1>
          <p className="text-slate-400">
            Generate exam-oriented notes, model answers, and study plans
          </p>
        </motion.div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-indigo-500/30 text-white border border-indigo-500/40"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Common fields */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-5 space-y-4"
            >
              {activeTab === "notes" && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Topic *</label>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Binary Search Trees"
                      className="glass-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Subject *</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Data Structures"
                      className="glass-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Note Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {NOTE_TYPES.map((nt) => (
                        <button
                          key={nt.value}
                          onClick={() => setNoteType(nt.value)}
                          className={clsx(
                            "p-2.5 rounded-xl text-left transition-all",
                            noteType === nt.value
                              ? "bg-indigo-500/30 border border-indigo-500/50"
                              : "border border-transparent hover:border-white/10"
                          )}
                          style={{
                            background:
                              noteType === nt.value
                                ? undefined
                                : "rgba(255,255,255,0.04)",
                          }}
                        >
                          <span className="text-base">{nt.icon}</span>
                          <p className="text-xs font-medium text-white mt-1">
                            {nt.label}
                          </p>
                          <p className="text-xs text-slate-500">{nt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "answer" && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Question *</label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Enter the exam question..."
                      rows={3}
                      className="glass-input w-full text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Computer Networks"
                      className="glass-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Answer Format</label>
                    <div className="flex gap-2">
                      {["2mark", "5mark", "10mark"].map((at) => (
                        <button
                          key={at}
                          onClick={() => setAnswerType(at)}
                          className={clsx(
                            "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                            answerType === at
                              ? "bg-indigo-500/30 text-white border border-indigo-500/50"
                              : "text-slate-400 border border-white/10 hover:text-white"
                          )}
                        >
                          {at === "2mark" ? "2 Mark" : at === "5mark" ? "5 Mark" : "10 Mark"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "plan" && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Subject *</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Operating Systems"
                      className="glass-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Plan Type</label>
                    <div className="flex gap-2">
                      {PLAN_TYPES.map((pt) => {
                        const Icon = pt.icon;
                        return (
                          <button
                            key={pt.value}
                            onClick={() => setPlanType(pt.value)}
                            className={clsx(
                              "flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1",
                              planType === pt.value
                                ? "bg-indigo-500/30 text-white border border-indigo-500/50"
                                : "text-slate-400 border border-white/10 hover:text-white"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {pt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">
                        Available Hours
                      </label>
                      <input
                        type="number"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="glass-input w-full text-sm"
                        min="1"
                        max="200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">
                        Weak Topics
                      </label>
                      <input
                        value={weakTopics}
                        onChange={(e) => setWeakTopics(e.target.value)}
                        placeholder="e.g., Graphs, Trees"
                        className="glass-input w-full text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab !== "saved" && (
                <>
                  {/* Language selector */}
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Language</label>
                    <div className="flex gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={clsx(
                            "flex-1 py-2 rounded-xl text-sm transition-all",
                            language === lang.code
                              ? "bg-indigo-500/30 text-white border border-indigo-500/50"
                              : "text-slate-400 border border-white/10 hover:text-white"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={
                      activeTab === "notes"
                        ? generateNotes
                        : activeTab === "answer"
                        ? generateAnswer
                        : generatePlan
                    }
                    disabled={loading}
                    className="glass-button-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {loading ? "Generating..." : "Generate"}
                  </button>
                </>
              )}
            </motion.div>
          </div>

          {/* Right: Output */}
          <div>
            {activeTab === "saved" ? (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">
                  Saved Notes ({savedNotes.length})
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {savedNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={async () => {
                        const res = await api.get(`/api/notes/saved/${note.id}`);
                        setSelectedNote(res.data);
                      }}
                      className="w-full text-left p-3 rounded-xl transition-all hover:bg-white/5"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <p className="text-sm text-white font-medium truncate">
                        {note.title}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-slate-500">{note.subject}</span>
                        <span className="text-xs text-indigo-400">{note.note_type}</span>
                        <span className="text-xs text-slate-500">{note.word_count}w</span>
                      </div>
                    </button>
                  ))}
                  {savedNotes.length === 0 && (
                    <p className="text-center text-slate-500 py-8 text-sm">
                      No saved notes yet
                    </p>
                  )}
                </div>
                {selectedNote && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      {selectedNote.title}
                    </h4>
                    <div className="markdown-content text-sm max-h-[400px] overflow-y-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedNote.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    Generated Content
                  </h3>
                  <button
                    onClick={downloadNotes}
                    className="glass-button px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
                <div className="markdown-content text-sm max-h-[600px] overflow-y-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <FileText className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">
                  Generated content will appear here
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Fill in the form and click Generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
