"use client";

import { useFormStatus } from "react-dom";

type RainCancelSessionButtonProps = {
  sessionId: string;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function RainCancelSessionButton({
  sessionId,
  submitAction,
}: RainCancelSessionButtonProps) {
  return (
    <form
      action={submitAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Mark this session as cancelled due to rain/typhoon? Participants will be notified and allowed to change to another session."
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
    >
      {pending ? "Cancelling..." : "Cancel (Rain)"}
    </button>
  );
}
