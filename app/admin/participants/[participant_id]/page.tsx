import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChangeSessionPanel } from "./change-session-panel";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type ParticipantDetailPageProps = {
  params: Promise<{ participant_id: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
};

type ParticipantDetails = {
  participant_id: string;
  name?: string;
  mobile?: string;
  session_id: string;
  class_id: string;
  session_location: string;
  session_date: string;
  session_time: string;
  class_name: string;
  terms_accepted_at?: number;
  terms_version?: string;
  height?: number;
  age?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
};

type AvailableSession = {
  session_id: string;
  date: string;
  time: string;
  location_zh: string;
  location_en?: string;
  quota_available: number;
};

export default async function ParticipantDetailPage({ params, searchParams }: ParticipantDetailPageProps) {
  const authSession = await getServerAuthSession();
  if (!authSession?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const { participant_id: participantId } = await params;
  const sp = await searchParams;
  const errorMessage = sp.error ?? undefined;
  const sessionChanged = sp.status === "session_changed";
  const isSuperAdmin = authSession.user.role === "super_admin";
  const adminUsername = authSession.user.username;

  const details = await loadParticipantDetails(participantId);

  if (!details) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Participant not found.
        </p>
        <Link
          href="/admin/participants"
          className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Back to Participants
        </Link>
      </main>
    );
  }

  let availableSessions: AvailableSession[] = [];
  if (isSuperAdmin) {
    availableSessions = await loadAvailableSessionsForChange(
      details.class_id,
      details.session_id
    );
  }

  async function changeSessionAction(formData: FormData) {
    "use server";

    const pId = (formData.get("participant_id") as string | null)?.trim() ?? "";
    const sessionId = (formData.get("session_id") as string | null)?.trim() ?? "";

    if (!pId || !sessionId) {
      redirect(
        `/admin/participants/${pId || participantId}?error=${encodeURIComponent("Session selection is required.")}`
      );
    }

    try {
      const client = createConvexHttpClient();
      const result = await client.mutation(
        makeFunctionReference<"mutation">("participants:changeParticipantSession"),
        { participant_id: pId, session_id: sessionId }
      );
      if (!result.success) {
        redirect(
          `/admin/participants/${pId}?error=${encodeURIComponent(result.error_message ?? "Failed to change session.")}`
        );
      }
    } catch {
      redirect(
        `/admin/participants/${pId}?error=${encodeURIComponent("Failed to change session. Please try again.")}`
      );
    }

    redirect(`/admin/participants/${pId}?status=session_changed`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
      <section>
        <h1 className="text-2xl font-semibold text-zinc-900">Participant Details</h1>
        <p className="mt-1 font-mono text-sm text-zinc-500">{details.participant_id}</p>
      </section>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {sessionChanged ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Session changed successfully.
        </p>
      ) : null}

      <section className="rounded-xl border border-zinc-200 p-5 space-y-4">
        <h2 className="text-lg font-medium text-zinc-900">Personal Information</h2>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-medium text-zinc-600">Name</dt>
            <dd className="mt-0.5 text-zinc-900">{details.name?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Mobile</dt>
            <dd className="mt-0.5 text-zinc-900">{details.mobile?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Height</dt>
            <dd className="mt-0.5 text-zinc-900">{details.height ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Age</dt>
            <dd className="mt-0.5 text-zinc-900">{details.age != null ? `${details.age} years` : "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5 space-y-4">
        <h2 className="text-lg font-medium text-zinc-900">Emergency Contact</h2>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-medium text-zinc-600">Name</dt>
            <dd className="mt-0.5 text-zinc-900">{details.emergency_contact_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Phone</dt>
            <dd className="mt-0.5 text-zinc-900">{details.emergency_contact_phone ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5 space-y-4">
        <h2 className="text-lg font-medium text-zinc-900">Session</h2>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-medium text-zinc-600">Class</dt>
            <dd className="mt-0.5 text-zinc-900">{details.class_name}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Location</dt>
            <dd className="mt-0.5 text-zinc-900">{details.session_location}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Date & Time</dt>
            <dd className="mt-0.5 text-zinc-900">
              {details.session_date} {details.session_time}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Terms Accepted</dt>
            <dd className="mt-0.5 text-zinc-900">
              {details.terms_accepted_at
                ? new Date(details.terms_accepted_at).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Terms Version</dt>
            <dd className="mt-0.5 text-zinc-900">{details.terms_version ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/admin/sessions/${details.session_id}/participants`}
          className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Back to Session Participants
        </Link>

        {isSuperAdmin ? (
          <ChangeSessionPanel
            participantId={details.participant_id}
            availableSessions={availableSessions}
            changeSessionAction={changeSessionAction}
          />
        ) : null}
      </div>
    </main>
  );
}

async function loadParticipantDetails(
  participantId: string
): Promise<ParticipantDetails | null> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">(
        "adminParticipants:getParticipantAdminDetails"
      ),
      { participant_id: participantId }
    );
    return result;
  } catch {
    return null;
  }
}

async function loadAvailableSessionsForChange(
  classId: string,
  currentSessionId: string
): Promise<AvailableSession[]> {
  try {
    const client = createConvexHttpClient();
    return await client.query(
      makeFunctionReference<"query">(
        "adminParticipants:getAvailableSessionsForClassChange"
      ),
      { class_id: classId, current_session_id: currentSessionId }
    );
  } catch {
    return [];
  }
}
