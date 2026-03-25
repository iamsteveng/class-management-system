import { makeFunctionReference } from "convex/server";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { ParticipantPageContent } from "./ParticipantPageContent";
import { createConvexHttpClient } from "@/lib/convexHttp";
import { LanguageProvider } from "../../components/LanguageProvider";
import { LanguageToggleHeader } from "../../components/LanguageToggleHeader";

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
  session_location_en?: string;
  session_end_time?: string;
  session_date: string;
  session_time: string;
  session_google_maps_url?: string;
  class_name: string;
  class_name_en?: string;
  qr_code_data: string;
  can_change_session: boolean;
  session_options: Array<{
    session_id: string;
    location_zh: string;
    location_en?: string;
    end_time?: string;
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
      <LanguageProvider>
        <LanguageToggleHeader />
        <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            找不到此連結對應的參加者資料。<br />
            We could not find participant details for this link.
          </p>
        </main>
      </LanguageProvider>
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
    <LanguageProvider>
      <LanguageToggleHeader />
      <ParticipantPageContent
        pageData={pageData}
        qrCodeDataUrl={qrCodeDataUrl}
        submitAction={changeSession}
        errorMessage={errorMessage}
        changeSucceeded={changeSucceeded}
      />
    </LanguageProvider>
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
    return result as ParticipantPageData | null;
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
