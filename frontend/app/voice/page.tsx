"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Globe,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", hint: "Speak in English" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳", hint: "हिंदी में बोलें" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳", hint: "ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ" },
];

interface VoiceMessage {
  id: string;
  type: "user" | "ai";
  text: string;
  audioUrl?: string;
  language: string;
}

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState("en");
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await processAudio();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const processAudio = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);

      // Transcribe
      const transcribeRes = await api.post("/api/speech/transcribe", formData);
      const text = transcribeRes.data.text;

      if (!text) {
        toast.error("Could not transcribe audio. Please speak clearly.");
        setIsProcessing(false);
        return;
      }

      setTranscript(text);

      // Add user message
      const userMsg: VoiceMessage = {
        id: Date.now().toString(),
        type: "user",
        text,
        language,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Get AI response
      const chatRes = await api.post("/api/chat/message", {
        message: text,
        language,
      });

      const aiText = chatRes.data.answer;

      // Generate TTS
      let audioUrl: string | undefined;
      try {
        const ttsRes = await api.post("/api/speech/synthesize", {
          text: aiText,
          language,
        });
        audioUrl = ttsRes.data.audio_url;
      } catch {
        // TTS optional
      }

      const aiMsg: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: aiText,
        audioUrl,
        language,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Auto-play response
      if (audioUrl) {
        playAudio(audioUrl);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (url: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(url);
    setCurrentAudio(audio);
    setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    audio.play().catch(() => setIsSpeaking(false));
  };

  const stopAudio = () => {
    currentAudio?.pause();
    setIsSpeaking(false);
  };

  const sendTextMessage = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);

    const userMsg: VoiceMessage = {
      id: Date.now().toString(),
      type: "user",
      text: transcript,
      language,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTranscript("");

    try {
      const chatRes = await api.post("/api/chat/message", {
        message: userMsg.text,
        language,
      });

      const aiText = chatRes.data.answer;
      let audioUrl: string | undefined;

      try {
        const ttsRes = await api.post("/api/speech/synthesize", {
          text: aiText,
          language,
        });
        audioUrl = ttsRes.data.audio_url;
      } catch {}

      const aiMsg: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: aiText,
        audioUrl,
        language,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (audioUrl) playAudio(audioUrl);
    } catch (err: any) {
      toast.error("Failed to get response");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language)!;

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Voice Assistant
          </h1>
          <p className="text-slate-400">
            Speak in Kannada, Hindi, or English — get instant academic answers
          </p>
        </motion.div>

        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-3 mb-8"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={clsx(
                "px-5 py-3 rounded-2xl text-sm font-medium transition-all",
                language === lang.code
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              )}
              style={{
                background:
                  language === lang.code
                    ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))"
                    : "rgba(255,255,255,0.05)",
                border:
                  language === lang.code
                    ? "1px solid rgba(99,102,241,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </motion.div>

        {/* Microphone Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center mb-8"
        >
          {/* Mic button */}
          <div className="relative mb-4">
            {/* Ripple effect when recording */}
            {isRecording && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(239, 68, 68, 0.2)" }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(239, 68, 68, 0.1)" }}
                  animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isRecording
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: isRecording
                  ? "0 0 40px rgba(239, 68, 68, 0.5)"
                  : "0 0 40px rgba(99, 102, 241, 0.5)",
              }}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </motion.button>
          </div>

          <p className="text-sm text-slate-400">
            {isProcessing
              ? "Processing your voice..."
              : isRecording
              ? `Recording... (${selectedLang.hint})`
              : `Tap to speak in ${selectedLang.label}`}
          </p>

          {/* Audio controls */}
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mt-3 px-4 py-2 rounded-xl"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
            >
              <div className="flex gap-1 items-center">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-emerald-400"
                    animate={{ height: ["8px", "20px", "8px"] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm text-emerald-400">Speaking...</span>
              <button onClick={stopAudio} className="text-emerald-400 hover:text-white">
                <VolumeX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Text input fallback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex gap-3">
            <input
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTextMessage()}
              placeholder={`Or type in ${selectedLang.label}...`}
              className="glass-input flex-1 text-sm"
            />
            <button
              onClick={sendTextMessage}
              disabled={!transcript.trim() || isProcessing}
              className="glass-button-primary px-4 flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Conversation */}
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "flex gap-3",
                  msg.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.type === "ai" && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <span className="text-sm">🎓</span>
                  </div>
                )}

                <div
                  className={clsx(
                    "max-w-xl rounded-2xl px-4 py-3",
                    msg.type === "user" ? "chat-message-user" : "chat-message-ai"
                  )}
                >
                  {msg.type === "ai" ? (
                    <div className="markdown-content text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-white">{msg.text}</p>
                  )}

                  {msg.audioUrl && msg.type === "ai" && (
                    <button
                      onClick={() => playAudio(msg.audioUrl!)}
                      className="mt-2 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Play audio
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Start speaking to get academic answers in your language
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
