"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type EditSessionModalProps = {
  sessionId: string;
  initialLocation: string;
  initialDate: string;
  initialTime: string;
  initialQuotaDefined: number;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function EditSessionModal({
  sessionId,
  initialLocation,
  initialDate,
  initialTime,
  initialQuotaDefined,
  submitAction,
}: EditSessionModalProps) {
  const [open, setOpen] = useState(false);
  const fieldId = useMemo(
    () => sessionId.replace(/[^a-zA-Z0-9_-]/g, "_"),
    [sessionId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
      >
        Edit
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Edit Session</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Update details for session <span className="font-mono">{sessionId}</span>.
            </p>

            <form action={submitAction} className="mt-4 space-y-4">
              <input type="hidden" name="session_id" value={sessionId} />

              <div className="space-y-2">
                <label
                  htmlFor={`edit-location-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Location <span className="text-red-600">*</span>
                </label>
                <input
                  id={`edit-location-${fieldId}`}
                  name="location"
                  type="text"
                  required
                  defaultValue={initialLocation}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor={`edit-date-${fieldId}`}
                    className="block text-sm font-medium text-zinc-900"
                  >
                    Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={`edit-date-${fieldId}`}
                    name="date"
                    type="date"
                    required
                    defaultValue={initialDate}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={`edit-time-${fieldId}`}
                    className="block text-sm font-medium text-zinc-900"
                  >
                    Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={`edit-time-${fieldId}`}
                    name="time"
                    type="time"
                    required
                    defaultValue={initialTime}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`edit-quota-defined-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Quota <span className="text-red-600">*</span>
                </label>
                <input
                  id={`edit-quota-defined-${fieldId}`}
                  name="quota_defined"
                  type="number"
                  required
                  min={1}
                  defaultValue={initialQuotaDefined}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <SubmitButton onComplete={() => setOpen(false)} />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SubmitButton({ onComplete }: { onComplete: () => void }) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!pending) {
      return;
    }
    onComplete();
  }, [pending, onComplete]);

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}
