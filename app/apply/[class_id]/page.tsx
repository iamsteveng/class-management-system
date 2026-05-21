"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClassInfo {
  class_id: string;
  name_zh: string;
  name_en?: string;
  airwallex_price?: number;
  airwallex_currency?: string;
}

type Lang = "zh-TW" | "en";

const t = {
  "zh-TW": {
    step1: "付款",
    step2: "報名表格",
    notAvailable: "此課程不支援網上付款。",
    backToHome: "返回主頁",
    loading: "載入中…",
    whatsappLabel: "WhatsApp 號碼",
    whatsappPlaceholder: "+852 9123 4567",
    whatsappHint: "您將透過發送至此 WhatsApp 號碼的連結選擇所需時段，每位參加者需單獨填寫一份表格。",
    quantityLabel: "參加人數",
    unitPrice: (currency: string, price: string) => `單價 ${currency} ${price}`,
    totalPrice: (currency: string, total: string) => `總價 ${currency} ${total}`,
    cardLabel: "信用卡資料",
    pay: (currency: string, total: string) => `付款 ${currency} ${total}`,
    processing: "處理中…",
    errorNoMobile: "請輸入您的 WhatsApp 號碼。",
    errorCardNotReady: "付款表格尚未就緒，請稍候。",
    errorPaymentFailed: "付款失敗，請重試。",
    errorLoadFailed: "載入課程資料失敗。",
  },
  en: {
    step1: "Payment",
    step2: "Application Form",
    notAvailable: "This class is not available for online payment.",
    backToHome: "Back to home",
    loading: "Loading…",
    whatsappLabel: "WhatsApp Mobile Number",
    whatsappPlaceholder: "+852 9123 4567",
    whatsappHint: "You will select the desired session through the link sent to this WhatsApp number. Each participant needs to fill in a separate form.",
    quantityLabel: "Number of Participants",
    unitPrice: (currency: string, price: string) => `Unit price ${currency} ${price}`,
    totalPrice: (currency: string, total: string) => `Total ${currency} ${total}`,
    cardLabel: "Card Details",
    pay: (currency: string, total: string) => `Pay ${currency} ${total}`,
    processing: "Processing…",
    errorNoMobile: "Please enter your WhatsApp mobile number.",
    errorCardNotReady: "Payment form is not ready yet. Please wait.",
    errorPaymentFailed: "Payment failed. Please try again.",
    errorLoadFailed: "Failed to load class information.",
  },
};

export default function ApplyPage({ params }: { params: Promise<{ class_id: string }> }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("zh-TW");
  const [classId, setClassId] = useState<string | null>(null);
  const [mobile, setMobile] = useState("+852");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const cardRef = useRef<any>(null);
  const sdkInitRef = useRef(false);
  const copy = t[lang];

  useEffect(() => {
    params.then((p) => setClassId(p.class_id));
  }, [params]);

  useEffect(() => {
    if (!classId) return;
    fetch(`/api/classes?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        const cls = (data.classes as ClassInfo[])?.find((c) => c.class_id === classId);
        setClassInfo(cls ?? null);
      })
      .catch(() => setError(copy.errorLoadFailed));
  }, [classId]);

  useEffect(() => {
    if (!classInfo?.airwallex_price || sdkInitRef.current) return;
    sdkInitRef.current = true;

    (async () => {
      try {
        const { init, createElement } = await import("@airwallex/components-sdk");
        await init({
          env: (process.env.NEXT_PUBLIC_AIRWALLEX_ENV as "demo" | "prod") ?? "demo",
          enabledElements: ["payments"],
        });
        const card = await createElement("card", {});
        cardRef.current = card;
        card.mount("airwallex-card-container");
        card.on("ready", () => setCardReady(true));
        (card as any).on("error", (e: unknown) => {
          console.error("[apply] card error:", e);
          setError(lang === "zh-TW" ? "載入信用卡表格失敗，請重新整理頁面。" : "Failed to load card form. Please refresh.");
        });
      } catch (e) {
        console.error("[apply] SDK init error:", e);
        setError(lang === "zh-TW" ? "載入付款表格失敗，請重新整理頁面。" : "Failed to load payment form. Please refresh.");
      }
    })();
  }, [classInfo]);

  const handlePay = async () => {
    if (!mobile.trim()) {
      setError(copy.errorNoMobile);
      return;
    }
    if (!cardRef.current) {
      setError(copy.errorCardNotReady);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const intentRes = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, mobile: mobile.trim(), quantity }),
      });
      if (!intentRes.ok) {
        const { error: msg } = await intentRes.json();
        throw new Error(msg ?? copy.errorPaymentFailed);
      }
      const { intent_id, client_secret } = await intentRes.json();

      await cardRef.current.confirm({ intent_id, client_secret });

      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent_id, class_id: classId, mobile: mobile.trim(), quantity }),
      });
      if (!confirmRes.ok) {
        throw new Error(
          lang === "zh-TW"
            ? "付款成功但報名記錄未能建立，請聯絡我們。"
            : "Payment succeeded but your application record could not be created. Please contact support."
        );
      }
      const { tokens } = await confirmRes.json() as { tokens: string[] };

      router.push(
        `/apply/${classId}/passes?tokens=${tokens.join(",")}&mobile=${encodeURIComponent(mobile.trim())}&lang=${lang}`
      );
    } catch (err: any) {
      setError(err.message ?? copy.errorPaymentFailed);
    } finally {
      setLoading(false);
    }
  };

  if (!classInfo && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0]">
        <p className="text-zinc-500 text-sm">{copy.loading}</p>
      </main>
    );
  }

  if (!classInfo?.airwallex_price) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f0] gap-4">
        <p className="text-zinc-600 text-sm">{copy.notAvailable}</p>
        <Link href="/" className="text-sm text-zinc-900 underline">{copy.backToHome}</Link>
      </main>
    );
  }

  const currency = classInfo.airwallex_currency ?? "HKD";
  const unitPrice = classInfo.airwallex_price;
  const totalPrice = unitPrice * quantity;
  const displayName = lang === "zh-TW" ? classInfo.name_zh : (classInfo.name_en ?? classInfo.name_zh);

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
      {/* Language toggle */}
      <div className="w-full max-w-md flex justify-end mb-2">
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

      {/* Step indicator */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">1</span>
            <span className="text-sm font-medium text-zinc-900">{copy.step1}</span>
          </div>
          <div className="h-px flex-1 bg-zinc-300" />
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-400">2</span>
            <span className="text-sm text-zinc-400">{copy.step2}</span>
          </div>
        </div>
      </div>

      {/* Payment card */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{displayName}</h1>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {currency} {totalPrice.toLocaleString()}
          </p>
          {quantity > 1 && (
            <p className="mt-0.5 text-sm text-zinc-400">
              {copy.unitPrice(currency, unitPrice.toLocaleString())} × {quantity}
            </p>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">{copy.whatsappLabel}</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder={copy.whatsappPlaceholder}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <p className="text-xs text-zinc-400">{copy.whatsappHint}</p>
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">{copy.quantityLabel}</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-lg font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold text-zinc-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(15, q + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-lg font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              disabled={quantity >= 15}
            >
              +
            </button>
          </div>
        </div>

        {/* Card element */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">{copy.cardLabel}</label>
          <div id="airwallex-card-container" className="min-h-[52px] rounded-lg border border-zinc-300 p-3" />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={loading || !cardReady}
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {loading ? copy.processing : copy.pay(currency, totalPrice.toLocaleString())}
        </button>
      </div>
    </main>
  );
}
