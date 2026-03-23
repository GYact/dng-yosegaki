"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { Graduate, Message } from "@/lib/types";

const ACCENT_CLASSES = [
  "accent-border-0",
  "accent-border-1",
  "accent-border-2",
  "accent-border-3",
  "accent-border-4",
  "accent-border-5",
];

interface Props {
  graduate: Graduate;
  initialMessages: Message[];
  year: number;
  labName: string;
}

export default function GraduateView({
  graduate,
  initialMessages,
  year,
  labName,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [downloading, setDownloading] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

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
    if (!boardRef.current) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(boardRef.current, {
        scale: 2,
        backgroundColor: "#05050c",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
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
                    <p className="font-mono text-xs text-cyan">— {msg.from}</p>
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
                ✕ 送信に失敗しました（本番環境ではメッセージの追加はできません）
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
