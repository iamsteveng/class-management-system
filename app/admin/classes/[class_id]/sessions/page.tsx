import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddSessionModal } from "./add-session-modal";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type SessionRow = {
  session_id: string;
  location: string;
  date: string;
  time: string;
  quota_defined: number;
  quota_used: number;
  quota_available: number;
  status: "scheduled" | "completed" | "cancelled";
};

type PageData = {
  class_id: string;
  class_name: string;
  sessions: SessionRow[];
} | null;

type AdminSessionsPageProps = {
  params: Promise<{ class_id: string }>;
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function AdminClassSessionsPage({
  params,
  searchParams,
}: AdminSessionsPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const { class_id: classId } = await params;
  const sp = await searchParams;
  const errorMessage = sp.error ?? undefined;
  const success = sp.status === "session_created";
  const isSuperAdmin = session.user.role === "super_admin";
  const adminUsername = session.user.username;

  const pageData = await loadSessionManagementPageData(classId);

  if (!pageData) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-8">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Class not found.
        </p>
        <Link
          href="/admin/classes"
          className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Back to Classes
        </Link>
      </main>
    );
  }

  async function addSessionAction(formData: FormData) {
    "use server";

    const location = (formData.get("location") as string | null)?.trim() ?? "";
    const date = (formData.get("date") as string | null)?.trim() ?? "";
    const time = (formData.get("time") as string | null)?.trim() ?? "";
    const quotaRaw = formData.get("quota_defined") as string | null;
    const quotaDefined = quotaRaw ? parseInt(quotaRaw, 10) : NaN;

    if (!location || !date || !time || isNaN(quotaDefined) || quotaDefined < 1) {
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(
          "All fields are required and quota must be at least 1."
        )}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(
        makeFunctionReference<"mutation">("adminSessions:createSession"),
        {
          class_id: classId,
          location,
          date,
          time,
          quota_defined: quotaDefined,
          admin_username: adminUsername,
        }
      );
    } catch {
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(
          "Failed to create session. Please try again."
        )}`
      );
    }

    redirect(`/admin/classes/${classId}/sessions?status=session_created`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {pageData.class_name} — Sessions
          </h1>
          <p className="text-sm text-zinc-700">
            Signed in as{" "}
            <span className="font-medium">{session.user.username}</span> (
            {session.user.role})
          </p>
        </div>

        {isSuperAdmin ? (
          <AddSessionModal
            submitAction={addSessionAction}
            errorMessage={errorMessage}
            success={success}
          />
        ) : null}
      </section>

      {pageData.sessions.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          No sessions found for this class.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Quota (Defined / Used / Available)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {pageData.sessions.map((s) => (
                <tr key={s.session_id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-900">{s.location}</td>
                  <td className="px-4 py-3 text-zinc-700">{s.date}</td>
                  <td className="px-4 py-3 text-zinc-700">{s.time}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono">
                      {s.quota_defined} / {s.quota_used} /{" "}
                    </span>
                    {s.quota_available === 0 ? (
                      <span className="font-semibold text-red-600">
                        Full
                      </span>
                    ) : (
                      <span className="font-mono text-zinc-700">
                        {s.quota_available}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "scheduled"
                          ? "bg-blue-100 text-blue-800"
                          : s.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/admin/classes"
        className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
      >
        Back to Classes
      </Link>
    </main>
  );
}

async function loadSessionManagementPageData(
  classId: string
): Promise<PageData> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">(
        "adminSessions:getSessionManagementPageData"
      ),
      { class_id: classId }
    );
    return result;
  } catch {
    return null;
  }
}
