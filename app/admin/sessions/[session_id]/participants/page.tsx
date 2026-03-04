import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionParticipantsPanel } from "./session-participants-panel";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type SessionParticipantsPageProps = {
  params: Promise<{
    session_id: string;
  }>;
};

type SessionParticipantsPageData = {
  session_id: string;
  class_name: string;
  session_location: string;
  session_date: string;
  session_time: string;
  participants: Array<{
    participant_id: string;
    name: string;
    mobile: string;
    terms_accepted: boolean;
    terms_version?: string;
    attendance_status: string;
  }>;
};

export default async function SessionParticipantsPage({
  params,
}: SessionParticipantsPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const routeParams = await params;
  const pageData = await loadSessionParticipantsPageData(routeParams.session_id);

  if (!pageData) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Session participants could not be loaded.
        </p>
      </main>
    );
  }
  const adminUsername = session.user.username;
  const sessionId = pageData.session_id;

  async function markAttendanceFromScan(participantId: string) {
    "use server";

    const client = createConvexHttpClient();
    return client.mutation(
      makeFunctionReference<"mutation">("adminSessions:markAttendanceFromScan"),
      {
        session_id: sessionId,
        participant_id: participantId,
        admin_username: adminUsername,
      }
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-zinc-900">Session Participants</h1>
          <p className="text-sm text-zinc-700">
            {pageData.class_name} - {pageData.session_location} ({pageData.session_date}{" "}
            {pageData.session_time})
          </p>
          <p className="text-xs text-zinc-600">Session ID: {pageData.session_id}</p>
        </div>
      </section>
      <SessionParticipantsPanel
        participants={pageData.participants}
        onMarkAttendance={markAttendanceFromScan}
      />

      <Link
        href="/admin/dashboard"
        className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}

async function loadSessionParticipantsPageData(
  sessionId: string
): Promise<SessionParticipantsPageData | null> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("adminSessions:getSessionParticipantsPageData"),
      { session_id: sessionId }
    );
    return result;
  } catch {
    return null;
  }
}
