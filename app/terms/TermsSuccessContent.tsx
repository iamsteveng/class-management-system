"use client";

import { AttendanceQrCard } from "../components/AttendanceQrCard";
import { useLanguage } from "../contexts/LanguageContext";
import { termsTranslations } from "../i18n/termsTranslations";

type Props = {
  participantId?: string;
  attendanceQr: {
    qrCodeDataUrl: string;
    classNameZh: string;
    classNameEn?: string;
  } | null;
  hasOtherTickets: boolean;
};

export function TermsSuccessContent({ participantId, attendanceQr, hasOtherTickets }: Props) {
  const { language } = useLanguage();
  const tr = termsTranslations[language];
  const className = attendanceQr
    ? language === "en"
      ? (attendanceQr.classNameEn ?? attendanceQr.classNameZh)
      : attendanceQr.classNameZh
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
      {attendanceQr ? (
        <AttendanceQrCard qrCodeDataUrl={attendanceQr.qrCodeDataUrl} className={className} />
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
