import { makeFunctionReference } from "convex/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { SessionChangeModal } from "./session-change-modal";
import { createConvexHttpClient } from "@/lib/convexHttp";

type ParticipantPageProps = {
  params: Promise<{
    participant_id: string;
  }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type SearchParamValue = string | string[] | undefined;

type ParticipantPageData = {
  participant_id: string;
  participant_name: string;
  session_id: string;
  session_location: string;
  session_date: string;
  session_time: string;
  class_name: string;
  qr_code_data: string;
  can_change_session: boolean;
  session_options: Array<{
    session_id: string;
    location: string;
    date: string;
    time: string;
    available_quota: number;
  }>;
};

export default async function ParticipantPage({
  params,
  searchParams,
}: ParticipantPageProps) {
  const routeParams = await params;
  const queryParams = await searchParams;
  const participantId = routeParams.participant_id;
  const status = readSingleQueryParam(queryParams.status);
  const errorMessage = readSingleQueryParam(queryParams.error);
  const pageData = await loadParticipantPageData(participantId);

  if (!pageData) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          We could not find participant details for this link.
        </p>
      </main>
    );
  }

  const qrCodeDataUrl = await QRCode.toDataURL(pageData.qr_code_data, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const changeSucceeded = status === "session_changed";

  async function changeSession(formData: FormData) {
    "use server";

    const newSessionId = formData.get("new_session_id");
    if (typeof newSessionId !== "string" || newSessionId.length === 0) {
      redirect(
        `/participant/${encodeURIComponent(participantId)}?error=${encodeURIComponent(
          "Please select a session."
        )}`
      );
    }

    const client = createConvexHttpClient();
    const result = await client.mutation(
      makeFunctionReference<"mutation">("participants:changeParticipantSession"),
      {
        participant_id: participantId,
        session_id: newSessionId,
      }
    );

    if (!result.success) {
      redirect(
        `/participant/${encodeURIComponent(participantId)}?error=${encodeURIComponent(
          result.error_message ?? "Unable to change session."
        )}`
      );
    }

    redirect(
      `/participant/${encodeURIComponent(participantId)}?status=session_changed`
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Participant Pass</h1>
        <p className="text-sm text-zinc-700">
          Present this QR code at check-in for attendance.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-medium text-zinc-900">Participant details</h2>
        <dl className="mt-3 grid gap-2 text-sm text-zinc-700">
          <div>
            <dt className="font-medium text-zinc-900">Participant name</dt>
            <dd>{pageData.participant_name}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Participant ID</dt>
            <dd className="break-all">{pageData.participant_id}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Class</dt>
            <dd>{pageData.class_name}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Session</dt>
            <dd>
              {pageData.session_location} ({pageData.session_date} {pageData.session_time})
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-medium text-zinc-900">Check-in QR code</h2>
        <div className="mt-4 flex justify-center">
          <Image
            src={qrCodeDataUrl}
            alt={`QR code for participant ${pageData.participant_id}`}
            width={360}
            height={360}
            className="h-[min(80vw,360px)] w-[min(80vw,360px)] rounded-lg border border-zinc-300 bg-white p-2"
          />
        </div>
      </section>

      {pageData.can_change_session ? (
        <section>
          <SessionChangeModal
            sessionOptions={pageData.session_options}
            submitAction={changeSession}
            errorMessage={errorMessage}
            success={changeSucceeded}
          />
        </section>
      ) : null}
    </main>
  );
}

async function loadParticipantPageData(
  participantId: string
): Promise<ParticipantPageData | null> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("participants:getParticipantPageData"),
      { participant_id: participantId }
    );
    return result;
  } catch {
    return null;
  }
}

function readSingleQueryParam(value: SearchParamValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return undefined;
}
