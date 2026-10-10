import type { Metadata } from "next";
import { makeFunctionReference } from "convex/server";
import Link from "next/link";

import { DoneContent, type DoneOrder } from "./DoneContent";
import { LanguageProvider } from "@/app/components/LanguageProvider";
import { LanguageToggleHeader } from "@/app/components/LanguageToggleHeader";
import { buildAttendanceQrDataUrl } from "@/lib/attendanceQr";
import { createConvexHttpClient } from "@/lib/convexHttp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "報名成功",
};

type CheckoutResult = Omit<DoneOrder, "participants"> & {
  status: string;
  participants: Array<{ participant_id: string; name: string }>;
};

type DonePageProps = {
  searchParams: Promise<{ hold?: string; lang?: string }>;
};

/** Shown once a booking is paid (or a free booking confirmed): everyone's Attendance QR. */
export default async function ApplyDonePage({ searchParams }: DonePageProps) {
  const sp = await searchParams;
  const result = sp.hold
    ? ((await createConvexHttpClient().query(makeFunctionReference<"query">("checkout:getCheckoutResult"), {
        hold_id: sp.hold,
      })) as CheckoutResult | null)
    : null;

  if (!result || result.status !== "completed") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0] p-4">
        <div className="w-full max-w-md space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-700">
            搵唔到呢個報名記錄。如已付款，請 WhatsApp 我哋。
            <br />
            We couldn&apos;t find this booking. If you have paid, please WhatsApp us.
          </p>
          <Link href="/" className="text-sm underline">
            返回主頁 Back to home
          </Link>
        </div>
      </main>
    );
  }

  const participants = await Promise.all(
    result.participants.map(async (p) => ({
      ...p,
      qrCodeDataUrl: await buildAttendanceQrDataUrl(p.participant_id),
    }))
  );

  return (
    <LanguageProvider>
      <LanguageToggleHeader />
      <DoneContent order={{ ...result, participants }} holdId={sp.hold!} />
    </LanguageProvider>
  );
}
