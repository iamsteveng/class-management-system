import { makeFunctionReference } from "convex/server";
import Link from "next/link";

import { ApplyPageClient } from "./ApplyPageClient";
import type { ApplyData } from "@/app/components/apply/ApplyForm";
import { createConvexHttpClient } from "@/lib/convexHttp";

export const dynamic = "force-dynamic";

type ApplyPageProps = {
  params: Promise<{ class_id: string }>;
  searchParams: Promise<{ session?: string; lang?: string }>;
};

/** The Purchase Link of a Class: pick a Session, name everyone, accept the terms, pay. */
export default async function ApplyPage({ params, searchParams }: ApplyPageProps) {
  const { class_id: classId } = await params;
  const sp = await searchParams;

  const data = (await createConvexHttpClient().query(
    makeFunctionReference<"query">("applyPage:getApplyPageData"),
    { class_id: classId }
  )) as ApplyData | null;

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f0] p-4">
        <p className="text-sm text-zinc-600">此課程暫時未能報名。This class cannot be booked right now.</p>
        <Link href="/" className="text-sm text-zinc-900 underline">
          返回主頁 Back to home
        </Link>
      </main>
    );
  }

  return (
    <ApplyPageClient
      data={data}
      initialSessionId={sp.session}
      initialLang={sp.lang === "en" ? "en" : "zh-TW"}
    />
  );
}
