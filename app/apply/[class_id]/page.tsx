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

export default function ApplyPage({ params }: { params: Promise<{ class_id: string }> }) {
  const router = useRouter();
  const [classId, setClassId] = useState<string | null>(null);
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const cardRef = useRef<any>(null);
  const sdkInitRef = useRef(false);

  // Unwrap params (Next.js 15 async params)
  useEffect(() => {
    params.then((p) => setClassId(p.class_id));
  }, [params]);

  // Fetch class info
  useEffect(() => {
    if (!classId) return;
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => {
        const cls = (data.classes as ClassInfo[])?.find((c) => c.class_id === classId);
        setClassInfo(cls ?? null);
      })
      .catch(() => setError("Failed to load class information."));
  }, [classId]);

  // Initialize Airwallex SDK and mount card element
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
        card.on("ready", () => setCardReady(true));
        card.mount("airwallex-card-container");
      } catch (e) {
        console.error("[apply] SDK init error:", e);
        setError("Failed to load payment form. Please refresh.");
      }
    })();
  }, [classInfo]);

  const handlePay = async () => {
    if (!mobile.trim()) {
      setError("Please enter your WhatsApp mobile number.");
      return;
    }
    if (!cardRef.current) {
      setError("Payment form is not ready yet. Please wait.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Create Airwallex payment intent
      const intentRes = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, mobile: mobile.trim() }),
      });
      if (!intentRes.ok) {
        const { error: msg } = await intentRes.json();
        throw new Error(msg ?? "Failed to initialise payment.");
      }
      const { intent_id, client_secret } = await intentRes.json();

      // 2. Confirm via Airwallex SDK (handles 3DS internally)
      await cardRef.current.confirm({ intent_id, client_secret });

      // 3. Create purchase record + trigger WhatsApp
      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent_id, class_id: classId, mobile: mobile.trim() }),
      });
      if (!confirmRes.ok) {
        throw new Error("Payment succeeded but your application record could not be created. Please contact support.");
      }
      const { token } = await confirmRes.json();

      // 4. Redirect to terms form (Step 2)
      router.push(`/terms?token=${token}`);
    } catch (err: any) {
      setError(err.message ?? "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!classInfo && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0]">
        <p className="text-zinc-500 text-sm">Loading…</p>
      </main>
    );
  }

  if (!classInfo?.airwallex_price) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f0] gap-4">
        <p className="text-zinc-600 text-sm">This class is not available for online payment.</p>
        <Link href="/" className="text-sm text-zinc-900 underline">Back to home</Link>
      </main>
    );
  }

  const currency = classInfo.airwallex_currency ?? "HKD";
  const displayName = classInfo.name_en ?? classInfo.name_zh;

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
      {/* Step indicator */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
              1
            </span>
            <span className="text-sm font-medium text-zinc-900">Payment</span>
          </div>
          <div className="h-px flex-1 bg-zinc-300" />
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-400">
              2
            </span>
            <span className="text-sm text-zinc-400">Application Form</span>
          </div>
        </div>
      </div>

      {/* Payment card */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{displayName}</h1>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {currency} {classInfo.airwallex_price.toLocaleString()}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">
            WhatsApp Mobile Number
          </label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+852 9123 4567"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <p className="text-xs text-zinc-400">
            Your terms acceptance link will be sent here after payment.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Card Details</label>
          <div
            id="airwallex-card-container"
            className="min-h-[52px] rounded-lg border border-zinc-300 p-3"
          />
          {!cardReady && (
            <p className="text-xs text-zinc-400">Loading payment form…</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={loading || !cardReady}
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {loading ? "Processing…" : `Pay ${currency} ${classInfo.airwallex_price.toLocaleString()}`}
        </button>

        <p className="text-center text-xs text-zinc-400">
          After payment you will complete your application form. A WhatsApp backup link will also be sent to your mobile.
        </p>
      </div>
    </main>
  );
}
