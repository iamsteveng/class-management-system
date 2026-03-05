"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type EditClassModalProps = {
  classId: string;
  initialName: string;
  initialDescription?: string;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function EditClassModal({
  classId,
  initialName,
  initialDescription,
  submitAction,
}: EditClassModalProps) {
  const [open, setOpen] = useState(false);
  const fieldId = useMemo(() => classId.replace(/[^a-zA-Z0-9_-]/g, "_"), [classId]);

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
            <h3 className="text-lg font-semibold text-zinc-900">Edit Class</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Update class details for <span className="font-mono">{classId}</span>.
            </p>

            <form action={submitAction} className="mt-4 space-y-4">
              <input type="hidden" name="class_id" value={classId} />

              <div className="space-y-2">
                <label
                  htmlFor={`edit-name-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  id={`edit-name-${fieldId}`}
                  name="name"
                  type="text"
                  required
                  defaultValue={initialName}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`edit-description-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Description
                </label>
                <textarea
                  id={`edit-description-${fieldId}`}
                  name="description"
                  rows={3}
                  defaultValue={initialDescription ?? ""}
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
