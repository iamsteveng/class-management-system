"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type SessionOption = {
  session_id: string;
  location: string;
  date: string;
  time: string;
  available_quota: number;
};

type SessionChangeModalProps = {
  sessionOptions: SessionOption[];
  submitAction: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  success: boolean;
};

export function SessionChangeModal({
  sessionOptions,
  submitAction,
  errorMessage,
  success,
}: SessionChangeModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(success);

  useEffect(() => {
    setShowSuccessToast(success);
  }, [success]);

  useEffect(() => {
    if (!showSuccessToast) {
      return;
    }

    const timeoutId = setTimeout(() => setShowSuccessToast(false), 3500);
    return () => clearTimeout(timeoutId);
  }, [showSuccessToast]);

  const noOptions = sessionOptions.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={noOptions}
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
      >
        Change Session
      </button>

      {noOptions ? (
        <p className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          No alternate sessions with available quota are currently available.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {showSuccessToast ? (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          Session changed successfully.
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Change Session</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Select an available session for the same class.
            </p>

            <form action={submitAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="new_session_id"
                  className="block text-sm font-medium text-zinc-900"
                >
                  New session
                </label>
                <select
                  id="new_session_id"
                  name="new_session_id"
                  value={selectedSessionId}
                  onChange={(event) => setSelectedSessionId(event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  required
                >
                  <option value="">Choose a session</option>
                  {sessionOptions.map((option) => (
                    <option key={option.session_id} value={option.session_id}>
                      {option.location} ({option.date} {option.time}) | Available:{" "}
                      {option.available_quota}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <SubmitButton
                  disabled={selectedSessionId.length === 0}
                  onComplete={() => setOpen(false)}
                />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SubmitButton({
  disabled,
  onComplete,
}: {
  disabled: boolean;
  onComplete: () => void;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  useEffect(() => {
    if (!pending) {
      return;
    }

    onComplete();
  }, [pending, onComplete]);

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}
