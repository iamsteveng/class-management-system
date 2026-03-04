import { makeFunctionReference } from "convex/server";
import Image from "next/image";
import QRCode from "qrcode";

import { createConvexHttpClient } from "@/lib/convexHttp";

type ParticipantPageProps = {
  params: Promise<{
    participant_id: string;
  }>;
};

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
};

export default async function ParticipantPage({ params }: ParticipantPageProps) {
  const routeParams = await params;
  const participantId = routeParams.participant_id;
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
          <button
            type="button"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Change Session
          </button>
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
