"use client";

import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import { participantTranslations } from "../../i18n/participantTranslations";
import { SessionChangeModal } from "./session-change-modal";

type SessionOption = {
  session_id: string;
  location_zh: string;
  location_en?: string;
  end_time?: string;
  date: string;
  time: string;
  available_quota: number;
};

type ParticipantPageData = {
  participant_id: string;
  participant_name: string;
  mobile?: string;
  email?: string;
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
  is_rain_cancelled?: boolean;
  session_options: SessionOption[];
  terms_version?: string;
  terms_content?: string;
};

type Props = {
  pageData: ParticipantPageData;
  qrCodeDataUrl: string;
  submitAction: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  changeSucceeded: boolean;
};

export function ParticipantPageContent({
  pageData,
  qrCodeDataUrl,
  submitAction,
  errorMessage,
  changeSucceeded,
}: Props) {
  const { language } = useLanguage();
  const tr = participantTranslations[language];
  const isEn = language === 'en';

  const className = isEn ? (pageData.class_name_en ?? pageData.class_name) : pageData.class_name;
  const location = isEn ? (pageData.session_location_en ?? pageData.session_location) : pageData.session_location;
  const timeDisplay = pageData.session_end_time
    ? `${pageData.session_time}–${pageData.session_end_time}`
    : pageData.session_time;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">{tr.pageTitle}</h1>
        <p className="text-sm text-zinc-700">{tr.pageSubtitle}</p>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-medium text-zinc-900">{tr.participantDetailsSection}</h2>
        <dl className="mt-3 grid gap-2 text-sm text-zinc-700">
          <div>
            <dt className="font-medium text-zinc-900">{tr.participantIdLabel}</dt>
            <dd className="break-all">{pageData.participant_id}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">{tr.nameLabel}</dt>
            <dd>{pageData.participant_name}</dd>
          </div>
          {pageData.mobile ? (
            <div>
              <dt className="font-medium text-zinc-900">{tr.mobileLabel}</dt>
              <dd>{pageData.mobile}</dd>
            </div>
          ) : null}
          {pageData.email ? (
            <div>
              <dt className="font-medium text-zinc-900">{tr.emailLabel}</dt>
              <dd>{pageData.email}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-zinc-900">{tr.classLabel}</dt>
            <dd>{className}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">{tr.sessionLabel}</dt>
            <dd>
              {location} ({pageData.session_date} {timeDisplay})
            </dd>
          </div>
          {pageData.session_google_maps_url ? (
            <div>
              <dt className="font-medium text-zinc-900">{tr.directionsLabel}</dt>
              <dd>
                <a
                  href={pageData.session_google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  {tr.directionsLink}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-medium text-zinc-900">{tr.qrCodeSection}</h2>
        <div className="mt-4 flex justify-center">
          <Image
            src={qrCodeDataUrl}
            alt={`${tr.qrCodeAlt} ${pageData.participant_id}`}
            width={360}
            height={360}
            className="h-[min(80vw,360px)] w-[min(80vw,360px)] rounded-lg border border-zinc-300 bg-white p-2"
          />
        </div>
      </section>

      {pageData.is_rain_cancelled ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-900">{tr.rainCancelledBannerTitle}</h2>
          <p className="mt-1 text-sm text-amber-800">{tr.rainCancelledBannerMessage}</p>
        </section>
      ) : null}

      {pageData.can_change_session ? (
        <section>
          <SessionChangeModal
            sessionOptions={pageData.session_options}
            submitAction={submitAction}
            errorMessage={errorMessage}
            success={changeSucceeded}
          />
        </section>
      ) : null}

      {pageData.terms_version && pageData.terms_content ? (
        <section className="rounded-xl border border-zinc-200 p-5">
          <h2 className="text-lg font-medium text-zinc-900">{tr.acceptedTermsSection}</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">{pageData.terms_version}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{pageData.terms_content}</p>
        </section>
      ) : null}
    </main>
  );
}
