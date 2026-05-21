import { makeFunctionReference } from "convex/server";
import { Info } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

export const dynamic = "force-dynamic";

type PurchaseRow = {
  _id: string;
  created_at: number;
  customer_mobile: string;
  source?: "s3" | "payment_gateway" | "airwallex";
  order_id: string;
  participant_count: number;
  slot_index?: number;
  class_name?: string;
  class_id?: string;
  session_id?: string;
  session_location_zh?: string;
  session_location_en?: string;
  session_date?: string;
  session_time?: string;
  status: "pending_terms" | "confirmation_sent" | "terms_accepted" | "cancelled";
};

const STATUS_STYLES: Record<PurchaseRow["status"], string> = {
  pending_terms: "bg-amber-100 text-amber-800",
  confirmation_sent: "bg-blue-100 text-blue-800",
  terms_accepted: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-600",
};

const STATUS_LABELS: Record<PurchaseRow["status"], string> = {
  pending_terms: "Pending Terms",
  confirmation_sent: "Confirmation Sent",
  terms_accepted: "Terms Accepted",
  cancelled: "Cancelled",
};

function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString("en-GB", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default async function AdminPurchasesPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const purchases = await loadPurchases();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Purchases</h1>
        <p className="text-sm text-zinc-600">
          All purchase records, latest first.{" "}
          {purchases.length} record{purchases.length !== 1 ? "s" : ""}.
        </p>
      </section>

      {purchases.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          No purchase records found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Created</th>
                <th className="px-4 py-3 whitespace-nowrap">Mobile</th>
                <th className="px-4 py-3 whitespace-nowrap">Source</th>
                <th className="px-4 py-3 whitespace-nowrap">Order ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Participants</th>
                <th className="px-4 py-3 whitespace-nowrap">Slot</th>
                <th className="px-4 py-3 whitespace-nowrap">Class</th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <span className="group relative inline-flex items-center gap-1">
                    Session
                    <Info className="h-3 w-3 cursor-help text-zinc-400" />
                    <span className="pointer-events-none absolute top-full right-0 z-10 mt-1 w-80 whitespace-normal rounded bg-zinc-800 px-3 py-2 text-xs font-normal normal-case tracking-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      This column only reflects the initial Session selection, any subsequent session changes is not reflected here.
                    </span>
                  </span>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">Terms Form</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {purchases.map((p) => (
                <tr key={p._id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-zinc-600">
                    {formatDateTime(p.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-800">
                    {p.customer_mobile}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                    {p.source ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                    {p.order_id}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-800">
                    {p.participant_count}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-600">
                    {p.slot_index ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-800">
                    {p.class_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.session_id ? (
                      <Link
                        href={`/admin/sessions/${p.session_id}/participants`}
                        className="text-xs text-blue-600 hover:underline"
                        title={p.session_id}
                      >
                        <div>{p.session_location_zh}{p.session_location_en ? ` / ${p.session_location_en}` : ""}</div>
                        <div className="text-zinc-500">{p.session_date} {p.session_time}</div>
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`/api/admin/purchases/${p._id}/terms-redirect`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open form ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

async function loadPurchases(): Promise<PurchaseRow[]> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("adminPurchases:listPurchases"),
      {}
    );
    return result as PurchaseRow[];
  } catch (err) {
    console.error("[adminPurchases] failed to load purchases:", err);
    return [];
  }
}
