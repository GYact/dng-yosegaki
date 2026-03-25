"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Graduate, Message, Photo } from "@/lib/types";

const ACCENT_CLASSES = [
  "accent-border-0",
  "accent-border-1",
  "accent-border-2",
  "accent-border-3",
  "accent-border-4",
  "accent-border-5",
];

const SHIKISHI_COLORS = [
  "#FFF0E8",
  "#FFF8E1",
  "#F1F8E9",
  "#E8EAF6",
  "#FCE4EC",
  "#FFF3E0",
  "#E0F2F1",
  "#F3E5F5",
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface Props {
  graduate: Graduate;
  year: number;
  labName: string;
}

export default function GraduateView({ graduate, year, labName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    fetch(`/api/messages?slug=${graduate.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});
    fetch(`/api/photos?slug=${graduate.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPhotos(data);
      })
      .catch(() => {});
  }, [graduate.slug]);
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const shikishiRef = useRef<HTMLDivElement>(null);

  function getPhotoUrl(filePath: string) {
    return `${SUPABASE_URL}/storage/v1/object/public/photos/${filePath}`;
  }

  const handlePhotoUpload = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const file = fileInputRef.current?.files?.[0];
      if (!file || !uploadName.trim()) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("graduate_slug", graduate.slug);
        formData.append("uploaded_by", uploadName);

        const res = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const newPhoto: Photo = await res.json();
          setPhotos((prev) => [newPhoto, ...prev]);
          setUploadName("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      } catch {
        // ignore
      } finally {
        setUploading(false);
      }
    },
    [uploadName, graduate.slug],
  );

  const handleDeletePhoto = useCallback(async (id: string) => {
    if (!confirm("この写真を削除しますか？")) return;
    try {
      const res = await fetch(`/api/photos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!from.trim() || !body.trim()) return;

      setSubmitting(true);
      setSubmitStatus("idle");

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: graduate.slug, from, body }),
        });

        if (res.ok) {
          const newMessage: Message = await res.json();
          setMessages((prev) => [...prev, newMessage]);
          setFrom("");
          setBody("");
          setSubmitStatus("success");
          setTimeout(() => setSubmitStatus("idle"), 3000);
        } else {
          setSubmitStatus("error");
        }
      } catch {
        setSubmitStatus("error");
      } finally {
        setSubmitting(false);
      }
    },
    [from, body, graduate.slug],
  );

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("このメッセージを削除しますか？")) return;

    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!shikishiRef.current) return;
    setDownloading(true);

    try {
      // Wait for all images in shikishi div to load
      const imgs = shikishiRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(imgs).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
        ),
      );

      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(shikishiRef.current, {
        scale: 2,
        backgroundColor: "#FBF5E6",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;
      const ratio = Math.min(
        availWidth / canvas.width,
        availHeight / canvas.height,
      );
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`yosegaki_${graduate.name}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [graduate.name]);

  return (
    <main className="grid-bg scan-lines min-h-dvh relative">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-sm text-text-muted hover:text-cyan transition-colors mb-8"
        >
          ← トップに戻る
        </Link>

        {/* Yosegaki Board - This is captured as PDF */}
        <div
          ref={boardRef}
          className="yosegaki-board rounded-xl p-6 sm:p-10 mb-8"
        >
          {/* Board Header */}
          <div className="text-center mb-8">
            <p className="font-mono text-xs tracking-[0.2em] text-text-muted uppercase mb-2">
              {labName} — {year}
            </p>
            <h1 className="text-3xl font-bold tracking-wide sm:text-4xl">
              {graduate.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-cyan">{graduate.role}</p>
            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-cyan to-transparent" />
            <p className="mt-4 font-mono text-sm text-text-muted">
              卒業おめでとうございます
            </p>
          </div>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div className="mb-8">
              <h2 className="font-mono text-xs tracking-[0.2em] text-text-muted mb-4 uppercase">
                // Photos
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden bg-[#0d0d1a] border border-border"
                  >
                    <img
                      src={getPhotoUrl(photo.file_path)}
                      alt={`Photo by ${photo.uploaded_by}`}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="font-mono text-xs text-cyan truncate flex-1">
                        — {photo.uploaded_by}
                      </p>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="font-mono text-xs text-text-muted hover:text-magenta transition-colors ml-2"
                        title="削除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Grid */}
          {messages.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`${ACCENT_CLASSES[i % ACCENT_CLASSES.length]} rounded-lg bg-[#0d0d1a] p-4`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.body}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-mono text-xs text-cyan">
                      — {msg.from_name}
                    </p>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="font-mono text-xs text-text-muted hover:text-magenta transition-colors"
                      title="削除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-mono text-sm text-text-muted">
                まだメッセージがありません
              </p>
            </div>
          )}

          {/* Board Footer */}
          <div className="mt-8 text-center">
            <div className="mx-auto h-px w-48 bg-gradient-to-r from-transparent via-border to-transparent" />
            <p className="mt-4 font-mono text-xs text-text-muted">
              {labName} © {year}
            </p>
          </div>
        </div>

        {/* PDF Download Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading || messages.length === 0}
            className="pulse-glow font-mono text-sm px-8 py-3 rounded-lg bg-bg-card border border-cyan text-cyan hover:bg-cyan/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:animate-none"
          >
            {downloading ? "生成中..." : "PDFをダウンロード"}
          </button>
        </div>

        {/* Upload Photo Form */}
        <section className="mx-auto max-w-lg mb-12">
          <h2 className="font-mono text-xs tracking-[0.2em] text-text-muted mb-6 uppercase">
            // Upload a photo
          </h2>
          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-text-muted mb-2">
                あなたの名前
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="例: 山田花子"
                className="w-full rounded-lg px-4 py-3 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-muted mb-2">
                写真を選択
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="w-full rounded-lg px-4 py-3 font-mono text-sm bg-bg-card border border-border text-text-muted file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:font-mono file:text-xs file:bg-cyan/10 file:text-cyan"
                required
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full font-mono text-sm px-6 py-3 rounded-lg bg-magenta/10 border border-magenta text-magenta hover:bg-magenta/20 transition-all disabled:opacity-50"
            >
              {uploading ? "アップロード中..." : "写真をアップロード"}
            </button>
          </form>
        </section>

        {/* Write Message Form */}
        <section className="mx-auto max-w-lg">
          <h2 className="font-mono text-xs tracking-[0.2em] text-text-muted mb-6 uppercase">
            // Write a message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-text-muted mb-2">
                あなたの名前
              </label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="例: 山田花子"
                className="w-full rounded-lg px-4 py-3 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-muted mb-2">
                メッセージ
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="卒業おめでとうございます！..."
                rows={4}
                className="w-full resize-none rounded-lg px-4 py-3 font-mono text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full font-mono text-sm px-6 py-3 rounded-lg bg-cyan/10 border border-cyan text-cyan hover:bg-cyan/20 transition-all disabled:opacity-50"
            >
              {submitting ? "送信中..." : "メッセージを送信"}
            </button>
            {submitStatus === "success" && (
              <p className="font-mono text-xs text-neon-green text-center">
                ✓ メッセージを送信しました
              </p>
            )}
            {submitStatus === "error" && (
              <p className="font-mono text-xs text-magenta text-center">
                ✕ 送信に失敗しました
              </p>
            )}
          </form>
        </section>
      </div>

      {/* Hidden: shikishi-style rendering for PDF */}
      <div
        ref={shikishiRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "1200px",
          fontFamily:
            '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif',
          color: "#2C1810",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(ellipse at center, #FDF8EE 0%, #FBF5E6 50%, #F5EDD8 100%)",
            padding: "32px",
            border: "3px solid #B8960C",
          }}
        >
          <div
            style={{
              border: "2px solid #C9A84C",
              padding: "48px",
              position: "relative",
            }}
          >
            {/* Corner decorations */}
            <span
              style={{
                position: "absolute",
                top: "12px",
                left: "16px",
                fontSize: "22px",
                opacity: 0.5,
              }}
            >
              🌸
            </span>
            <span
              style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                fontSize: "22px",
                opacity: 0.5,
              }}
            >
              🌸
            </span>
            <span
              style={{
                position: "absolute",
                bottom: "12px",
                left: "16px",
                fontSize: "22px",
                opacity: 0.5,
              }}
            >
              🌸
            </span>
            <span
              style={{
                position: "absolute",
                bottom: "12px",
                right: "16px",
                fontSize: "22px",
                opacity: 0.5,
              }}
            >
              🌸
            </span>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "#8B7355",
                  letterSpacing: "0.3em",
                  marginBottom: "24px",
                }}
              >
                🌸&ensp;{labName} — {year}&ensp;🌸
              </p>
              <p
                style={{
                  fontSize: "16px",
                  color: "#8B7355",
                  marginBottom: "8px",
                }}
              >
                卒業おめでとうございます
              </p>
              <p
                style={{
                  fontSize: "42px",
                  fontWeight: "bold",
                  margin: "8px 0",
                  color: "#1a0f0a",
                }}
              >
                {graduate.name}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#8B7355",
                  marginTop: "4px",
                }}
              >
                {graduate.role}
              </p>
              <div
                style={{
                  width: "80px",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                  margin: "24px auto 0",
                }}
              />
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: "32px",
                }}
              >
                {photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={getPhotoUrl(photo.file_path)}
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      border: "2px solid #D4AF37",
                      boxShadow: "1px 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${messages.length <= 6 ? 2 : 3}, 1fr)`,
                  gap: "12px",
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={msg.id}
                    style={{
                      background: SHIKISHI_COLORS[i % SHIKISHI_COLORS.length],
                      borderRadius: "8px",
                      padding: "16px",
                      transform: `rotate(${(((i * 7 + 3) % 5) - 2) * 0.6}deg)`,
                      boxShadow: "1px 2px 4px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(201, 168, 76, 0.15)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: messages.length > 20 ? "12px" : "13px",
                        lineHeight: "1.8",
                        whiteSpace: "pre-wrap",
                        color: "#2C1810",
                        margin: 0,
                      }}
                    >
                      {msg.body}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#8B7355",
                        marginTop: "10px",
                        textAlign: "right",
                        margin: "10px 0 0",
                      }}
                    >
                      — {msg.from_name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "36px" }}>
              <div
                style={{
                  width: "120px",
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                  margin: "0 auto 16px",
                }}
              />
              <p
                style={{
                  fontSize: "11px",
                  color: "#8B7355",
                  margin: 0,
                }}
              >
                {labName} © {year}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
