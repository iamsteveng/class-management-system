import { makeFunctionReference } from "convex/server";
import Link from "next/link";

import { createConvexHttpClient } from "@/lib/convexHttp";

export const dynamic = "force-dynamic";

type CheckoutResult = {
  status: string;
  participant_ids: string[];
  session_id: string;
  class_id: string;
  quantity: number;
} | null;

type DonePageProps = {
  searchParams: Promise<{ hold?: string; lang?: string }>;
};

/** Shown once a booking is paid (or a free booking confirmed). */
export default async function ApplyDonePage({ searchParams }: DonePageProps) {
  const sp = await searchParams;
  const en = sp.lang === "en";
  const result = sp.hold
    ? ((await createConvexHttpClient().query(makeFunctionReference<"query">("checkout:getCheckoutResult"), {
        hold_id: sp.hold,
      })) as CheckoutResult)
    : null;

  if (!result || result.status !== "completed") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0] p-4">
        <div className="w-full max-w-md space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-700">
            {en
              ? "We couldn't find this booking. If you have paid, please WhatsApp us."
              : "搵唔到呢個報名記錄。如已付款，請 WhatsApp 我哋。"}
          </p>
          <Link href="/" className="text-sm underline">
            {en ? "Back to home" : "返回主頁"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0] px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-bold text-zinc-900">{en ? "You're booked" : "報名成功"}</h1>
        <ul className="space-y-2">
          {result.participant_ids.map((id, i) => (
            <li key={id}>
              <Link href={`/participant/${id}`} className="text-sm text-[#1f6f5c] underline" data-participant-link={id}>
                {en ? `Participant ${i + 1}: details and attendance QR` : `學員 ${i + 1}：資料及出席 QR Code`}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
