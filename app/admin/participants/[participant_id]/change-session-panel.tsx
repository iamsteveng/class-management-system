"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type AvailableSession = {
  session_id: string;
  date: string;
  time: string;
  location: string;
  quota_available: number;
};

type ChangeSessionPanelProps = {
  participantId: string;
  availableSessions: AvailableSession[];
  changeSessionAction: (formData: FormData) => void | Promise<void>;
};

export function ChangeSessionPanel({
  participantId,
  availableSessions,
  changeSessionAction,
}: ChangeSessionPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
      >
        Change Session
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Change Session</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Select a new session for this participant. A WhatsApp notification will be sent.
            </p>

            {availableSessions.length === 0 ? (
              <p className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
                No available sessions for this class.
              </p>
            ) : (
              <form action={changeSessionAction} className="mt-4 space-y-4">
                <input type="hidden" name="participant_id" value={participantId} />
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-zinc-900">Available sessions</legend>
                  {availableSessions.map((session) => (
                    <label
                      key={session.session_id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 has-[:checked]:border-zinc-800 has-[:checked]:bg-zinc-50"
                    >
                      <input
                        type="radio"
                        name="session_id"
                        value={session.session_id}
                        required
                        className="mt-0.5"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-zinc-900">
                          {session.date} {session.time}
                        </p>
                        <p className="text-zinc-600">{session.location}</p>
                        <p className="text-zinc-500">{session.quota_available} spot(s) available</p>
                      </div>
                    </label>
                  ))}
                </fieldset>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <SubmitButton />
                </div>
              </form>
            )}

            {availableSessions.length === 0 ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Changing..." : "Confirm Change"}
    </button>
  );
}
