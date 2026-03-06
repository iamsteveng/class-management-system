"use client";

import { useFormStatus } from "react-dom";

type CancelSessionButtonProps = {
  sessionId: string;
  disabled?: boolean;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function CancelSessionButton({
  sessionId,
  disabled = false,
  submitAction,
}: CancelSessionButtonProps) {
  return (
    <form
      action={submitAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Cancel this session? This will mark it as cancelled."
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <SubmitButton disabled={disabled} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
    >
      {pending ? "Cancelling..." : "Cancel"}
    </button>
  );
}
