"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Lang = "zh-TW" | "en";

const t = {
  "zh-TW": {
    title: "報名連結",
    reminder: (mobile: string) =>
      `以下連結已傳送至您的 WhatsApp 號碼 ${mobile}，請每位參加者分別點擊連結填寫資料。`,
    copyButton: "複製連結",
    copied: "已複製",
    fillButton: "填寫資料",
    participant: (n: number) => `參加者 ${n}`,
  },
  en: {
    title: "Application Links",
    reminder: (mobile: string) =>
      `The following links have been sent to your WhatsApp number ${mobile}. Each participant should click their own link to fill in their details.`,
    copyButton: "Copy Link",
    copied: "Copied",
    fillButton: "Fill Details",
    participant: (n: number) => `Participant ${n}`,
  },
};

function PassesContent() {
  const searchParams = useSearchParams();
  const rawTokens = searchParams.get("tokens") ?? "";
  const mobile = searchParams.get("mobile") ?? "";
  const initialLang = (searchParams.get("lang") as Lang) ?? "zh-TW";

  const [lang, setLang] = useState<Lang>(initialLang);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const tokens = rawTokens ? rawTokens.split(",").filter(Boolean) : [];
  const copy = t[lang];

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";

  const handleCopy = async (token: string, idx: number) => {
    const url = `${baseUrl}/terms?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback for browsers that block clipboard
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
      {/* Language toggle */}
      <div className="w-full max-w-md flex justify-end mb-4">
        <div className="flex rounded-lg border border-zinc-300 overflow-hidden text-xs font-medium">
          <button
            onClick={() => setLang("zh-TW")}
            className={`px-3 py-1.5 transition-colors ${lang === "zh-TW" ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
          >
            中文
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 transition-colors ${lang === "en" ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* Title */}
        <h1 className="text-xl font-semibold text-zinc-900">{copy.title}</h1>

        {/* WhatsApp reminder banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex gap-3 items-start">
          <svg className="mt-0.5 shrink-0 text-emerald-500" width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-emerald-800">{copy.reminder(mobile)}</p>
        </div>

        {/* Pass cards */}
        {tokens.map((token, idx) => {
          const termsUrl = `${baseUrl}/terms?token=${token}`;
          return (
            <div
              key={token}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3"
            >
              <p className="text-sm font-semibold text-zinc-900">{copy.participant(idx + 1)}</p>

              <p className="break-all rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 font-mono">
                {termsUrl}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(token, idx)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  {copiedIndex === idx ? copy.copied : copy.copyButton}
                </button>
                <Link
                  href={termsUrl}
                  className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  {copy.fillButton}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function PassesPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0]">
        <p className="text-zinc-500 text-sm">載入中…</p>
      </main>
    }>
      <PassesContent />
    </Suspense>
  );
}
