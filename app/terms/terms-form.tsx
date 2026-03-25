"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { termsTranslations } from "../i18n/termsTranslations";

type SessionOption = {
  session_id: string;
  class_name: string;
  name_zh: string;
  name_en?: string;
  location_zh: string;
  location_en?: string;
  end_time?: string;
  date: string;
  time: string;
  available_quota: number;
};

type TermsFormProps = {
  sessions: SessionOption[];
  submitAction: (formData: FormData) => void | Promise<void>;
  locked: boolean;
  errorMessage?: string;
  success: boolean;
};

export function TermsForm({
  sessions,
  submitAction,
  locked,
  errorMessage,
  success,
}: TermsFormProps) {
  const { language } = useLanguage();
  const tr = termsTranslations[language];
  const isEn = language === 'en';

  const [sessionId, setSessionId] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const noAvailableSessions = sessions.length === 0;
  const disableForm = locked || noAvailableSessions || success;

  const canSubmit =
    sessionId.length > 0 &&
    accepted &&
    height.trim().length > 0 &&
    age.trim().length > 0 &&
    emergencyContactName.trim().length > 0 &&
    emergencyContactPhone.trim().length > 0;

  const helperMessage = useMemo(() => {
    if (success) {
      return tr.successHelper;
    }

    if (locked) {
      return tr.lockedHelper;
    }

    if (noAvailableSessions) {
      return tr.noSessionsHelper;
    }

    return undefined;
  }, [locked, noAvailableSessions, success, tr]);

  function formatSessionOption(session: SessionOption): string {
    const className = isEn ? (session.name_en ?? session.name_zh) : session.name_zh;
    const location = isEn ? (session.location_en ?? session.location_zh) : session.location_zh;
    const timeDisplay = session.end_time
      ? `${session.time}–${session.end_time}`
      : session.time;
    return `${className} — ${location} (${session.date} ${timeDisplay})`;
  }

  return (
    <form action={submitAction} className="space-y-4 rounded-xl border border-zinc-200 p-5">
      <h2 className="text-lg font-semibold text-zinc-900">{tr.pageTitle}</h2>
      <p className="text-sm text-zinc-600">{tr.pageSubtitle}</p>

      <div className="space-y-2">
        <label htmlFor="session_id" className="block text-sm font-medium text-zinc-900">
          {tr.selectSession}
        </label>
        <select
          id="session_id"
          name="session_id"
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          disabled={disableForm}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          required
        >
          <option value="">{tr.chooseSession}</option>
          {sessions.map((session) => (
            <option key={session.session_id} value={session.session_id}>
              {formatSessionOption(session)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-900">{tr.participantDetails}</h3>

        <div className="space-y-1">
          <label htmlFor="height" className="block text-sm font-medium text-zinc-900">
            {tr.heightLabel}
          </label>
          <input
            id="height"
            type="text"
            name="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            disabled={disableForm}
            placeholder={tr.heightPlaceholder}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="age" className="block text-sm font-medium text-zinc-900">
            {tr.ageLabel}
          </label>
          <input
            id="age"
            type="number"
            name="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={disableForm}
            placeholder={tr.agePlaceholder}
            min={1}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-zinc-900">
            {tr.emergencyContactNameLabel}
          </label>
          <input
            id="emergency_contact_name"
            type="text"
            name="emergency_contact_name"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            disabled={disableForm}
            placeholder={tr.emergencyContactNamePlaceholder}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-zinc-900">
            {tr.emergencyContactPhoneLabel}
          </label>
          <input
            id="emergency_contact_phone"
            type="tel"
            name="emergency_contact_phone"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            disabled={disableForm}
            placeholder={tr.emergencyContactPhonePlaceholder}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-900">
        <input
          type="checkbox"
          name="accepted"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          disabled={disableForm}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300"
        />
        <span>{tr.checkboxLabel}</span>
      </label>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      {helperMessage ? (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{helperMessage}</p>
      ) : null}

      <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm italic text-blue-800">
        {tr.qrCodeNote}
      </p>

      <SubmitButton
        canSubmit={canSubmit}
        disabled={disableForm}
        submitLabel={tr.submitButton}
        submittingLabel={tr.submittingButton}
      />
    </form>
  );
}

function SubmitButton({
  canSubmit,
  disabled,
  submitLabel,
  submittingLabel,
}: {
  canSubmit: boolean;
  disabled: boolean;
  submitLabel: string;
  submittingLabel: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled || !canSubmit;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? submittingLabel : submitLabel}
    </button>
  );
}
