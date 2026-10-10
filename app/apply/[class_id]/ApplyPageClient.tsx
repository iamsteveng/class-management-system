"use client";

import { useState } from "react";
import Link from "next/link";

import { ApplyForm, type ApplyData } from "@/app/components/apply/ApplyForm";
import { applyCopy, type ApplyLang } from "@/app/i18n/applyTranslations";

export function ApplyPageClient({
  data,
  initialSessionId,
  initialLang,
}: {
  data: ApplyData;
  initialSessionId?: string;
  initialLang: ApplyLang;
}) {
  const [lang, setLang] = useState<ApplyLang>(initialLang);

  return (
    <main className="min-h-screen bg-[#f5f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-600 underline">
            {applyCopy[lang].backToHome}
          </Link>
          <div className="flex overflow-hidden rounded-lg border border-zinc-300 text-xs font-medium">
            {(["zh-TW", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 ${lang === l ? "bg-zinc-900 text-white" : "bg-white text-zinc-500"}`}
              >
                {l === "zh-TW" ? "中文" : "EN"}
              </button>
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">{applyCopy[lang].pageTitle}</h1>
        <ApplyForm data={data} lang={lang} initialSessionId={initialSessionId} />
      </div>
    </main>
  );
}
