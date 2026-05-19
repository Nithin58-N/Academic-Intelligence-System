"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Mic,
  MicOff,
  Globe,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  Volume2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { clsx } from "clsx";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  sources?: Array<{ source: string; page: number; score: number }>;
  timestamp: Date;
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await axios.get("/api/chat/sessions");
      setSessions(res.data);
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      language,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/chat/message", {
        message: userMessage.content,
        session_id: sessionId,
        language,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.answer,
        language: res.data.language,
        sources: res.data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (!sessionId) {
        setSessionId(res.data.session_id);
        loadSessions();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Failed to get response. Is Ollama running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        if (language !== "en") formData.append("language", language);

        try {
          const res = await axios.post("/api/speech/transcribe", formData);
          if (res.data.text) {
            setInput(res.data.text);
            toast.success(`Transcribed: "${res.data.text.substring(0, 30)}..."`);
          }
        } catch {
          toast.error("Transcription failed");
        }

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const speakMessage = async (text: string) => {
    try {
      const res = await axios.post("/api/speech/synthesize", { text, language });
      if (res.data.audio_url) {
        const audio = new Audio(res.data.audio_url);
        audio.play();
      }
    } catch {
      toast.error("TTS not available");
    }
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
  };

  const loadSession = async (sid: string) => {
    try {
      const res = await axios.get(`/api/chat/sessions/${sid}/messages`);
      const msgs: Message[] = res.data.map((m: any) => ({
        id: m.id.toString(),
        role: m.role,
        content: m.content,
        language: m.language,
        sources: m.sources,
        timestamp: new Date(m.created_at),
      }));
      setMessages(msgs);
      setSessionId(sid);
      setShowSessions(false);
    } catch {
      toast.error("Failed to load session");
    }
  };

  return (
    <MainLayout>
      <div className="flex h-screen">
        {/* Sessions Sidebar */}
        <AnimatePresence>
          {showSessions && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r overflow-hidden flex-shrink-0"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(10,10,26,0.6)",
              }}
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Chat History
                </h3>
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <button
                      key={s.session_id}
                      onClick={() => loadSession(s.session_id)}
                      className="w-full text-left p-3 rounded-xl text-sm text-slate-300 hover:text-white transition-all"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">
                      No chat history yet
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(10,10,26,0.6)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="glass-button px-3 py-2 text-sm"
              >
                History
              </button>
              <button onClick={newChat} className="glass-button px-3 py-2 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <div className="flex gap-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      language === lang.code
                        ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                    border: "1px solid rgba(99,102,241,0.3)",
                  }}
                >
                  <Bot className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Academic AI Assistant
                </h2>
                <p className="text-slate-400 max-w-md text-sm">
                  Ask questions about your uploaded documents. I answer only from
                  your study materials — no hallucinations.
                </p>
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                  {[
                    "Explain this concept",
                    "What are important questions?",
                    "Generate 5-mark answer",
                    "Summarize this topic",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      }}
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={clsx(
                      "max-w-2xl rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? "chat-message-user"
                        : "chat-message-ai"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="markdown-content text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-white">{msg.content}</p>
                    )}

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-slate-500 mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.slice(0, 3).map((s, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: "rgba(99,102,241,0.15)",
                                border: "1px solid rgba(99,102,241,0.2)",
                                color: "#a5b4fc",
                              }}
                            >
                              {s.source} p.{s.page}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TTS button for AI messages */}
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => speakMessage(msg.content)}
                        className="mt-2 text-slate-500 hover:text-slate-300 transition-colors"
                        title="Listen"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "rgba(99,102,241,0.3)" }}
                    >
                      <User className="w-4 h-4 text-indigo-300" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="chat-message-ai rounded-2xl px-4 py-3">
                  <div className="typing-indicator flex gap-1 items-center h-5">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="p-4 border-t"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(10,10,26,0.8)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="flex items-end gap-3 rounded-2xl p-3"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask in ${LANGUAGES.find((l) => l.code === language)?.label}...`}
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none resize-none text-sm leading-relaxed"
                style={{ maxHeight: "120px" }}
              />

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    isRecording
                      ? "bg-red-500/30 border border-red-500/50 animate-pulse"
                      : "hover:bg-white/10"
                  )}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording ? (
                    <MicOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  style={{
                    background: input.trim() && !loading
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600 text-center mt-2">
              Answers are grounded in your uploaded documents only
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
