"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  BookOpen,
  FileQuestion,
  GraduationCap,
  FlaskConical,
  Briefcase,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { clsx } from "clsx";

interface UploadedDoc {
  id: number;
  filename: string;
  doc_type: string;
  subject: string;
  semester: string;
  total_pages: number;
  total_chunks: number;
  status: string;
  file_size: number;
  created_at: string;
}

interface UploadingFile {
  name: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
}

const DOC_TYPES = [
  { value: "syllabus", label: "Syllabus", icon: BookOpen, color: "text-indigo-400" },
  { value: "pyq", label: "Previous Year Questions", icon: FileQuestion, color: "text-red-400" },
  { value: "notes", label: "Study Notes", icon: FileText, color: "text-cyan-400" },
  { value: "textbook", label: "Textbook", icon: GraduationCap, color: "text-emerald-400" },
  { value: "lab_manual", label: "Lab Manual", icon: FlaskConical, color: "text-yellow-400" },
  { value: "placement", label: "Placement Material", icon: Briefcase, color: "text-purple-400" },
  { value: "other", label: "Other", icon: FileText, color: "text-slate-400" },
];

export default function UploadPage() {
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [docType, setDocType] = useState("other");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await axios.get("/api/documents/");
      setDocuments(res.data);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const uploadEntry: UploadingFile = {
          name: file.name,
          progress: 0,
          status: "uploading",
        };

        setUploading((prev) => [...prev, uploadEntry]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("doc_type", docType);
        formData.append("subject", subject);
        formData.append("semester", semester);

        try {
          setUploading((prev) =>
            prev.map((u) =>
              u.name === file.name ? { ...u, progress: 30, status: "uploading" } : u
            )
          );

          const res = await axios.post("/api/documents/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              const pct = Math.round((e.loaded * 60) / (e.total || 1));
              setUploading((prev) =>
                prev.map((u) =>
                  u.name === file.name ? { ...u, progress: pct } : u
                )
              );
            },
          });

          setUploading((prev) =>
            prev.map((u) =>
              u.name === file.name
                ? { ...u, progress: 100, status: "done" }
                : u
            )
          );

          toast.success(
            `✅ ${file.name} indexed (${res.data.total_chunks} chunks)`
          );
          loadDocuments();
        } catch (err: any) {
          setUploading((prev) =>
            prev.map((u) =>
              u.name === file.name
                ? {
                    ...u,
                    status: "error",
                    error: err.response?.data?.detail || "Upload failed",
                  }
                : u
            )
          );
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Clear completed uploads after 3s
      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.status !== "done"));
      }, 3000);
    },
    [docType, subject, semester]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 50 * 1024 * 1024,
  });

  const deleteDocument = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await axios.delete(`/api/documents/${id}`);
      toast.success("Document deleted");
      loadDocuments();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
            PDF Upload Center
          </h1>
          <p className="text-slate-400">
            Upload your study materials to enable AI-powered analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Document metadata */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-4">
                Document Settings
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Data Structures"
                    className="glass-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g., 4th Sem"
                    className="glass-input w-full text-sm"
                  />
                </div>
              </div>

              <label className="text-xs text-slate-400 mb-2 block">
                Document Type
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {DOC_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setDocType(type.value)}
                      className={clsx(
                        "p-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1",
                        docType === type.value
                          ? "bg-indigo-500/30 border border-indigo-500/50 text-white"
                          : "text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                      )}
                      style={{
                        background:
                          docType === type.value
                            ? undefined
                            : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <Icon className={`w-4 h-4 ${type.color}`} />
                      <span className="text-center leading-tight">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Dropzone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div
                {...getRootProps()}
                className={clsx(
                  "rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300",
                  isDragActive
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 hover:border-indigo-500/50 hover:bg-white/5"
                )}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: isDragActive
                        ? "rgba(99,102,241,0.3)"
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Upload
                      className={clsx(
                        "w-8 h-8",
                        isDragActive ? "text-indigo-400" : "text-slate-400"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {isDragActive
                        ? "Drop your PDFs here"
                        : "Drag & drop PDFs here"}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      or click to browse • Max 50MB per file
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Upload progress */}
            <AnimatePresence>
              {uploading.map((file) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {file.status === "done" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : file.status === "error" ? (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      {file.error && (
                        <p className="text-xs text-red-400">{file.error}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {file.status === "done"
                        ? "Indexed"
                        : file.status === "error"
                        ? "Failed"
                        : `${file.progress}%`}
                    </span>
                  </div>
                  {file.status !== "error" && (
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Documents List */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center justify-between">
                <span>Uploaded Documents</span>
                <span className="text-xs text-slate-500">
                  {documents.length} files
                </span>
              </h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No documents yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 rounded-xl group"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate font-medium">
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "rgba(99,102,241,0.2)",
                                color: "#a5b4fc",
                              }}
                            >
                              {doc.doc_type}
                            </span>
                            {doc.subject && (
                              <span className="text-xs text-slate-500">
                                {doc.subject}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">
                              {doc.total_pages}p
                            </span>
                            <span className="text-xs text-slate-500">
                              {doc.total_chunks} chunks
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatSize(doc.file_size)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={clsx(
                              "w-2 h-2 rounded-full",
                              doc.status === "indexed"
                                ? "bg-emerald-400"
                                : doc.status === "failed"
                                ? "bg-red-400"
                                : "bg-yellow-400 animate-pulse"
                            )}
                          />
                          <button
                            onClick={() => deleteDocument(doc.id, doc.filename)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
