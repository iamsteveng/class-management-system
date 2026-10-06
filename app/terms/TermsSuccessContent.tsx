"use client";

import { AttendanceQrCard } from "../components/AttendanceQrCard";
import { useLanguage } from "../contexts/LanguageContext";
import { termsTranslations } from "../i18n/termsTranslations";
import { SessionChangeModal } from "../participant/[participant_id]/session-change-modal";

export type SuccessParticipant = {
  qrCodeDataUrl: string;
  class_name: string;
  class_name_en?: string;
  session_date: string;
  session_time: string;
  session_end_time?: string;
  session_location: string;
  session_location_en?: string;
  session_google_maps_url?: string;
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

type Props = {
  participantId?: string;
  participant: SuccessParticipant | null;
  hasOtherTickets: boolean;
  changeSessionAction: (formData: FormData) => void | Promise<void>;
  sessionChanged: boolean;
  errorMessage?: string;
};

export function TermsSuccessContent({
  participantId,
  participant,
  hasOtherTickets,
  changeSessionAction,
  sessionChanged,
  errorMessage,
}: Props) {
  const { language } = useLanguage();
  const tr = termsTranslations[language];
  const className = participant
    ? language === "en"
      ? (participant.class_name_en ?? participant.class_name)
      : participant.class_name
    : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center space-y-6 px-4 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-12 w-12"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 011.04-.207z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">{tr.successHeading}</h1>
      {participant ? (
        <>
          <AttendanceQrCard
            qrCodeDataUrl={participant.qrCodeDataUrl}
            className={className}
            session={{
              date: participant.session_date,
              time: participant.session_time,
              endTime: participant.session_end_time,
              locationZh: participant.session_location,
              locationEn: participant.session_location_en,
              googleMapsUrl: participant.session_google_maps_url,
            }}
            sessionChanged={sessionChanged}
          />
          {participant.can_change_session ? (
            <div className="w-full text-left">
              <SessionChangeModal
                sessionOptions={participant.session_options}
                submitAction={changeSessionAction}
                errorMessage={errorMessage}
                success={sessionChanged}
              />
            </div>
          ) : null}
        </>
      ) : null}
      {hasOtherTickets ? (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-700">{tr.otherTicketsNote}</p>
      ) : null}
      {participantId ? (
        <a
          href={`/participant/${encodeURIComponent(participantId)}`}
          className="text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
        >
          {tr.viewDetailsLink}
        </a>
      ) : null}
    </main>
  );
}
