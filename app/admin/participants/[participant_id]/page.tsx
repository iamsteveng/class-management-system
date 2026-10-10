import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
  email?: string;
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
  riding_experience?: string;
  health_notes?: string;
  photo_consent?: boolean;
  terms_accepted_by?: string;
  past_change_cutoff: boolean;
};

type HistoryItem = {
  kind: "scan" | "move";
  at: number;
  admin_username?: string;
  session_label: string;
  to_session_label?: string;
  past_cutoff?: boolean;
  reason?: string;
};

const RIDING_EXPERIENCE_LABELS: Record<string, string> = {
  never: "Never ridden",
  training_wheels: "Used training wheels",
  short_distance: "Can ride a short distance",
};

type AvailableSession = {
  session_id: string;
  date: string;
  time: string;
  location_zh: string;
  location_en?: string;
  quota_available: number;
  hidden: boolean;
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

  const history = await loadParticipantHistory(participantId);

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
    const reason = (formData.get("reason") as string | null)?.trim() || undefined;

    if (!pId || !sessionId) {
      redirect(
        `/admin/participants/${pId || participantId}?error=${encodeURIComponent("Session selection is required.")}`
      );
    }

    try {
      const client = createConvexHttpClient();
      const result = await client.mutation(
        makeFunctionReference<"mutation">("adminParticipants:changeParticipantSession"),
        { participant_id: pId, session_id: sessionId, admin_username: adminUsername, reason }
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
            <dt className="font-medium text-zinc-600">Email</dt>
            <dd className="mt-0.5 text-zinc-900">{details.email?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Height</dt>
            <dd className="mt-0.5 text-zinc-900">{details.height ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Age</dt>
            <dd className="mt-0.5 text-zinc-900">{details.age != null ? `${details.age} years` : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Riding Experience</dt>
            <dd className="mt-0.5 text-zinc-900">
              {details.riding_experience
                ? (RIDING_EXPERIENCE_LABELS[details.riding_experience] ?? details.riding_experience)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Health Notes</dt>
            <dd className="mt-0.5 whitespace-pre-line text-zinc-900">{details.health_notes?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-600">Photo Consent</dt>
            <dd className="mt-0.5 text-zinc-900">
              {details.photo_consent === undefined ? "—" : details.photo_consent ? "Yes" : "No"}
            </dd>
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
          <div>
            <dt className="font-medium text-zinc-600">Accepted By</dt>
            <dd className="mt-0.5 text-zinc-900">
              {details.terms_accepted_by === "customer"
                ? "The Customer, on the participant's behalf"
                : details.terms_accepted_by === "participant"
                  ? "The participant"
                  : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 p-5" data-testid="participant-history">
        <h2 className="text-lg font-medium text-zinc-900">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-600">No scans or session changes yet.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {history.map((item, i) => (
              <li key={i} className="rounded-lg bg-zinc-50 p-3">
                <span className="text-zinc-500">{new Date(item.at).toLocaleString("en-GB", { timeZone: "Asia/Hong_Kong" })}</span>{" "}
                {item.kind === "scan" ? (
                  <span className="text-zinc-900">
                    Scanned at <b>{item.session_label}</b>
                    {item.admin_username ? ` by ${item.admin_username}` : ""}
                  </span>
                ) : (
                  <span className="text-zinc-900">
                    Moved from <b>{item.session_label}</b> to <b>{item.to_session_label}</b>
                    {item.admin_username ? ` by ${item.admin_username}` : " by the participant"}
                    {item.past_cutoff ? (
                      <span className="mt-1 block text-amber-900">Past the Change Cutoff — reason: {item.reason}</span>
                    ) : null}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
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
            pastCutoff={details.past_change_cutoff}
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

async function loadParticipantHistory(participantId: string): Promise<HistoryItem[]> {
  try {
    return await createConvexHttpClient().query(
      makeFunctionReference<"query">("adminParticipants:getParticipantHistory"),
      { participant_id: participantId }
    );
  } catch {
    return [];
  }
}
