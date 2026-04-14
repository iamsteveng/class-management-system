import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";
import { ResendButton } from "./resend-button";

type IngestionRun = {
  _id: string;
  run_at: number;
  status: "success" | "partial" | "error";
  files_processed: number;
  rows_inserted: number;
  rows_skipped: number;
  error_message?: string;
};

type FailedSend = {
  _id: string;
  customer_mobile: string;
  order_id: string;
  created_at: number;
};

async function loadIngestionRuns(): Promise<IngestionRun[]> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("ingestionQueries:listRecentIngestionRuns"),
      {}
    );
    return result as IngestionRun[];
  } catch {
    return [];
  }
}

async function loadFailedSends(): Promise<FailedSend[]> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("whatsappResend:listFailedWhatsappSends"),
      {}
    );
    return result as FailedSend[];
  } catch {
    return [];
  }
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-HK", {
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

function StatusBadge({ status }: { status: "success" | "partial" | "error" }) {
  const styles = {
    success: "bg-emerald-100 text-emerald-800",
    partial: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default async function AdminIngestionPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const isSuperAdmin = session.user.role === "super_admin";
  const [runs, failedSends] = await Promise.all([
    loadIngestionRuns(),
    loadFailedSends(),
  ]);

  async function pollNowAction() {
    "use server";

    const authSession = await getServerAuthSession();
    if (authSession?.user?.role !== "super_admin") {
      redirect("/admin/ingestion?error=Unauthorized");
    }

    try {
      const client = createConvexHttpClient();
      await client.action(
        makeFunctionReference<"action">("s3Ingestion:pollS3ForNewFiles"),
        {}
      );
    } catch {
      redirect(
        `/admin/ingestion?error=${encodeURIComponent("Failed to trigger S3 poll. Check server logs.")}`
      );
    }

    redirect("/admin/ingestion?status=polled");
  }

  async function resendAction(formData: FormData) {
    "use server";

    const authSession = await getServerAuthSession();
    if (!authSession?.user?.username) {
      redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
    }

    const purchaseId = formData.get("purchase_id") as string;
    if (!purchaseId) {
      redirect(`/admin/ingestion?error=${encodeURIComponent("Missing purchase ID.")}`);
    }

    try {
      const client = createConvexHttpClient();
      await client.action(
        makeFunctionReference<"action">("purchaseConfirmation:sendPurchaseConfirmation"),
        { purchase_id: purchaseId }
      );
    } catch {
      redirect(
        `/admin/ingestion?error=${encodeURIComponent(`Resend failed for purchase ${purchaseId}. Check server logs.`)}`
      );
    }

    redirect("/admin/ingestion?status=resent");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-10 px-4 py-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            S3 Ingestion Monitoring
          </h1>
          <p className="text-sm text-zinc-700">
            Signed in as{" "}
            <span className="font-medium">{session.user.username}</span> (
            {session.user.role})
          </p>
        </div>

        {isSuperAdmin ? (
          <form action={pollNowAction}>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Poll Now
            </button>
          </form>
        ) : null}
      </section>

      {/* Failed WhatsApp Sends */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            Failed WhatsApp Sends
          </h2>
          {failedSends.length > 0 && (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              {failedSends.length}
            </span>
          )}
        </div>

        {failedSends.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
            No failed WhatsApp sends.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {failedSends.map((send) => (
                  <tr key={send._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      {send.customer_mobile}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {send.order_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {formatTimestamp(send.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <ResendButton
                        purchaseId={send._id}
                        submitAction={resendAction}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ingestion Run History */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900">Run History</h2>

        {runs.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
            No ingestion runs recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Files Processed</th>
                  <th className="px-4 py-3">Rows Inserted</th>
                  <th className="px-4 py-3">Rows Skipped</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {runs.map((run) => (
                  <tr key={run._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {formatTimestamp(run.run_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {run.files_processed}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {run.rows_inserted}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {run.rows_skipped}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600">
                      {run.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link
        href="/admin/dashboard"
        className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
