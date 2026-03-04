import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

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

        <button
          type="button"
          className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Scan QR Code
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                <th className="px-4 py-3 font-medium">Participant ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Terms Accepted</th>
                <th className="px-4 py-3 font-medium">Terms Version</th>
                <th className="px-4 py-3 font-medium">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {pageData.participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-600">
                    No participants found for this session.
                  </td>
                </tr>
              ) : (
                pageData.participants.map((participant) => (
                  <tr key={participant.participant_id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      {participant.participant_id}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">{participant.name}</td>
                    <td className="px-4 py-3 text-zinc-700">{participant.mobile}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {participant.terms_accepted ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {participant.terms_version ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{participant.attendance_status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
