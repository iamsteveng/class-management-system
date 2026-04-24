import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddSessionModal } from "./add-session-modal";
import { CancelSessionButton } from "./cancel-session-button";
import { RainCancelSessionButton } from "./rain-cancel-session-button";
import { EditSessionModal } from "./edit-session-modal";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type SessionRow = {
  session_id: string;
  location_zh: string;
  location_en?: string;
  end_time?: string;
  date: string;
  time: string;
  quota_defined: number;
  quota_used: number;
  quota_available: number;
  status: "scheduled" | "completed" | "cancelled";
  google_maps_url?: string;
  cancellation_reason?: "rain";
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
  const sessionCreated = sp.status === "session_created";
  const sessionUpdated = sp.status === "session_updated";
  const sessionCancelled = sp.status === "session_cancelled";
  const sessionRainCancelled = sp.status === "session_rain_cancelled";
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

    const locationZh = (formData.get("location_zh") as string | null)?.trim() ?? "";
    const locationEn = (formData.get("location_en") as string | null)?.trim() || undefined;
    const endTime = (formData.get("end_time") as string | null)?.trim() || undefined;
    const date = (formData.get("date") as string | null)?.trim() ?? "";
    const time = (formData.get("time") as string | null)?.trim() ?? "";
    const quotaRaw = formData.get("quota_defined") as string | null;
    const quotaDefined = quotaRaw ? parseInt(quotaRaw, 10) : NaN;
    const googleMapsUrl = (formData.get("google_maps_url") as string | null)?.trim() || undefined;

    if (!locationZh || !date || !time || isNaN(quotaDefined) || quotaDefined < 1) {
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
          location_zh: locationZh,
          location_en: locationEn,
          end_time: endTime,
          date,
          time,
          quota_defined: quotaDefined,
          admin_username: adminUsername,
          google_maps_url: googleMapsUrl,
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

  async function editSessionAction(formData: FormData) {
    "use server";

    const sessionId = (formData.get("session_id") as string | null)?.trim() ?? "";
    const locationZh = (formData.get("location_zh") as string | null)?.trim() ?? "";
    const locationEn = (formData.get("location_en") as string | null)?.trim() || undefined;
    const endTime = (formData.get("end_time") as string | null)?.trim() || undefined;
    const date = (formData.get("date") as string | null)?.trim() ?? "";
    const time = (formData.get("time") as string | null)?.trim() ?? "";
    const quotaRaw = formData.get("quota_defined") as string | null;
    const quotaDefined = quotaRaw ? parseInt(quotaRaw, 10) : NaN;
    const googleMapsUrl = (formData.get("google_maps_url") as string | null)?.trim() || undefined;

    if (
      !sessionId ||
      !locationZh ||
      !date ||
      !time ||
      isNaN(quotaDefined) ||
      quotaDefined < 1
    ) {
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(
          "Session ID, location, date, time, and valid quota are required."
        )}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(
        makeFunctionReference<"mutation">("adminSessions:updateSession"),
        {
          session_id: sessionId,
          location_zh: locationZh,
          location_en: locationEn,
          end_time: endTime,
          date,
          time,
          quota_defined: quotaDefined,
          admin_username: adminUsername,
          google_maps_url: googleMapsUrl,
        }
      );
    } catch {
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(
          "Failed to update session. Please try again."
        )}`
      );
    }

    redirect(`/admin/classes/${classId}/sessions?status=session_updated`);
  }

  async function cancelSessionAction(formData: FormData) {
    "use server";

    const sessionId = (formData.get("session_id") as string | null)?.trim() ?? "";
    if (!sessionId) {
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(
          "Session ID is required."
        )}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(
        makeFunctionReference<"mutation">("adminSessions:cancelSession"),
        {
          session_id: sessionId,
          admin_username: adminUsername,
        }
      );
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("enrolled participants")
          ? "This session has enrolled participants and cannot be cancelled."
          : "Failed to cancel session. Please try again.";
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(message)}`
      );
    }

    redirect(`/admin/classes/${classId}/sessions?status=session_cancelled`);
  }

  async function rainCancelSessionAction(formData: FormData) {
    "use server";

    const sessionId = (formData.get("session_id") as string | null)?.trim() ?? "";
    if (!sessionId) {
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(
          "Session ID is required."
        )}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(
        makeFunctionReference<"mutation">("adminSessions:markSessionRainCancelled"),
        {
          session_id: sessionId,
          admin_username: adminUsername,
        }
      );
    } catch {
      redirect(
        `/admin/classes/${classId}/sessions?error=${encodeURIComponent(
          "Failed to mark session as rain-cancelled. Please try again."
        )}`
      );
    }

    redirect(`/admin/classes/${classId}/sessions?status=session_rain_cancelled`);
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
            success={sessionCreated}
          />
        ) : null}
      </section>

      {errorMessage && !sessionCreated ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {sessionUpdated ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Session updated successfully.
        </p>
      ) : null}
      {sessionCancelled ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Session cancelled successfully.
        </p>
      ) : null}
      {sessionRainCancelled ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Session marked as rain-cancelled. Participants can now change to another session.
        </p>
      ) : null}

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
                <th className="px-4 py-3">Participants</th>
                {isSuperAdmin ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {pageData.sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className={s.status === "cancelled" ? "bg-zinc-50 text-zinc-500" : "hover:bg-zinc-50"}
                >
                  <td className="px-4 py-3 text-zinc-900">
                    {s.location_zh}{s.location_en ? ` (${s.location_en})` : ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{s.date}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {s.end_time ? `${s.time}–${s.end_time}` : s.time}
                  </td>
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
                            : s.cancellation_reason === "rain"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {s.cancellation_reason === "rain" ? "cancelled (rain)" : s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sessions/${s.session_id}/participants`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      View Participants
                    </Link>
                  </td>
                  {isSuperAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <EditSessionModal
                          sessionId={s.session_id}
                          initialLocation={s.location_zh}
                          initialLocationEn={s.location_en}
                          initialEndTime={s.end_time}
                          initialDate={s.date}
                          initialTime={s.time}
                          initialQuotaDefined={s.quota_defined}
                          initialGoogleMapsUrl={s.google_maps_url}
                          submitAction={editSessionAction}
                        />
                        <CancelSessionButton
                          sessionId={s.session_id}
                          disabled={s.status === "cancelled"}
                          submitAction={cancelSessionAction}
                        />
                        {s.status === "scheduled" ? (
                          <RainCancelSessionButton
                            sessionId={s.session_id}
                            submitAction={rainCancelSessionAction}
                          />
                        ) : null}
                      </div>
                    </td>
                  ) : null}
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
