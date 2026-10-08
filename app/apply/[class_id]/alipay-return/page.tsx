"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";

type Lang = "zh-TW" | "en";

const t = {
  "zh-TW": {
    loading: "正在確認付款…",
    errorNotCompleted: "付款未成功，請返回重試。",
    errorGeneric: "發生錯誤，請返回重試。",
    errorRefunded: "付款期間班期已滿，款項會全數退回。我哋會 WhatsApp 你安排其他班期。",
    back: "返回",
  },
  en: {
    loading: "Confirming payment…",
    errorNotCompleted: "Payment was not completed. Please go back and try again.",
    errorGeneric: "An error occurred. Please go back and try again.",
    errorRefunded: "The session filled up while you were paying, so you'll be refunded in full. We'll WhatsApp you to arrange another session.",
    back: "Go back",
  },
};

export default function AlipayReturnPage({
  params,
}: {
  params: Promise<{ class_id: string }>;
}) {
  const { class_id: classId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const intentId = searchParams.get("intent_id") ?? "";
  // Set by the new apply flow: the booking's Seat Hold.
  const holdId = searchParams.get("hold_id");
  const mobile = searchParams.get("mobile") ?? "";
  const quantity = searchParams.get("quantity") ?? "1";
  const lang = (searchParams.get("lang") ?? "zh-TW") as Lang;

  const copy = t[lang] ?? t["zh-TW"];

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!intentId) {
      setError(copy.errorGeneric);
      return;
    }

    (async () => {
      try {
        // Step 1: Check payment status
        const statusRes = await fetch(
          `/api/payment/alipay-hk/status?intent_id=${encodeURIComponent(intentId)}`
        );
        if (!statusRes.ok) {
          setError(copy.errorGeneric);
          return;
        }
        const statusData = (await statusRes.json()) as { succeeded: boolean };

        if (!statusData.succeeded) {
          setError(copy.errorNotCompleted);
          return;
        }

        if (holdId) {
          const completeRes = await fetch("/api/checkout/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hold_id: holdId, intent_id: intentId }),
          });
          const result = completeRes.ok ? ((await completeRes.json()) as { outcome: string }) : null;
          if (result?.outcome === "seated") {
            router.push(`/apply/${classId}/done?hold=${encodeURIComponent(holdId)}&lang=${lang}`);
          } else if (result?.outcome === "refunded") {
            setError(copy.errorRefunded);
          } else {
            setError(copy.errorGeneric);
          }
          return;
        }

        // Step 2: Confirm payment and create records
        const confirmRes = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent_id: intentId,
            class_id: classId,
            mobile,
            quantity: Number(quantity),
          }),
        });

        if (!confirmRes.ok) {
          setError(copy.errorGeneric);
          return;
        }

        const { tokens } = (await confirmRes.json()) as { tokens: string[] };

        router.push(
          `/apply/${classId}/passes?tokens=${tokens.join(",")}&mobile=${encodeURIComponent(mobile)}&lang=${lang}`
        );
      } catch {
        setError(copy.errorGeneric);
      }
    })();
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0] p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
        {error ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="text-sm text-zinc-900 underline"
            >
              {copy.back}
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{copy.loading}</p>
        )}
      </div>
    </main>
  );
}
