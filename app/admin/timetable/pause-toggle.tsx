"use client";

import { useFormStatus } from "react-dom";

type PauseToggleProps = {
  paused: boolean;
  entryId?: string;
  label: string;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function PauseToggle({ paused, entryId, label, submitAction }: PauseToggleProps) {
  const nextPaused = !paused;

  return (
    <form
      action={submitAction}
      onSubmit={(event) => {
        const message = nextPaused
          ? `Pause ${label}? No new Sessions will be opened from it. Sessions already open are unaffected.`
          : `Resume ${label}? Sessions will be opened from it again.`;
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {entryId ? <input type="hidden" name="entry_id" value={entryId} /> : null}
      <input type="hidden" name="paused" value={nextPaused ? "true" : "false"} />
      <SubmitButton nextPaused={nextPaused} label={label} />
    </form>
  );
}

function SubmitButton({ nextPaused, label }: { nextPaused: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${nextPaused ? "Pause" : "Resume"} ${label}`}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 ${
        nextPaused
          ? "border-amber-300 text-amber-800 hover:bg-amber-50"
          : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      }`}
    >
      {pending ? "Saving..." : nextPaused ? "Pause" : "Resume"}
    </button>
  );
}
