"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type SessionOption = {
  session_id: string;
  class_name: string;
  location: string;
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
      return "Terms accepted successfully.";
    }

    if (locked) {
      return "Terms have already been accepted for this purchase.";
    }

    if (noAvailableSessions) {
      return "No sessions currently have available quota.";
    }

    return undefined;
  }, [locked, noAvailableSessions, success]);

  return (
    <form action={submitAction} className="space-y-4 rounded-xl border border-zinc-200 p-5">
      <div className="space-y-2">
        <label htmlFor="session_id" className="block text-sm font-medium text-zinc-900">
          Select session
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
          <option value="">Choose a session</option>
          {sessions.map((session) => (
            <option key={session.session_id} value={session.session_id}>
              {session.class_name} - {session.location} ({session.date} {session.time}) | Available:{" "}
              {session.available_quota}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-900">Participant details</h3>

        <div className="space-y-1">
          <label htmlFor="height" className="block text-sm font-medium text-zinc-900">
            Height
          </label>
          <input
            id="height"
            type="text"
            name="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            disabled={disableForm}
            placeholder="e.g. 170cm"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="age" className="block text-sm font-medium text-zinc-900">
            Age (years)
          </label>
          <input
            id="age"
            type="number"
            name="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={disableForm}
            placeholder="e.g. 30"
            min={1}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-zinc-900">
            Emergency Contact Name
          </label>
          <input
            id="emergency_contact_name"
            type="text"
            name="emergency_contact_name"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            disabled={disableForm}
            placeholder="Full name"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-zinc-900">
            Emergency Contact Phone
          </label>
          <input
            id="emergency_contact_phone"
            type="tel"
            name="emergency_contact_phone"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            disabled={disableForm}
            placeholder="Phone number"
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
        <span>I have read and accept the terms</span>
      </label>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      {helperMessage ? (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{helperMessage}</p>
      ) : null}

      <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm italic text-blue-800">
        After confirming your class session and accepting the terms, you will receive a QR code via a WhatsApp message.
      </p>

      <SubmitButton
        canSubmit={canSubmit}
        disabled={disableForm}
      />
    </form>
  );
}

function SubmitButton({
  canSubmit,
  disabled,
}: {
  canSubmit: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled || !canSubmit;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Submitting..." : "Accept Terms"}
    </button>
  );
}
