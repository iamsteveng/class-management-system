"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type AddSessionModalProps = {
  submitAction: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  success: boolean;
};

export function AddSessionModal({
  submitAction,
  errorMessage,
  success,
}: AddSessionModalProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        Add Session
      </button>

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
          Session created successfully.
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Add Session</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Fill in the details to create a new session.
            </p>

            <form action={submitAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-zinc-900"
                >
                  Location <span className="text-red-600">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  placeholder="e.g. Studio A, East Wing"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-zinc-900"
                  >
                    Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-zinc-900"
                  >
                    Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="time"
                    name="time"
                    type="time"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="quota_defined"
                  className="block text-sm font-medium text-zinc-900"
                >
                  Quota <span className="text-red-600">*</span>
                </label>
                <input
                  id="quota_defined"
                  name="quota_defined"
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 20"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
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
      {pending ? "Creating..." : "Create"}
    </button>
  );
}
