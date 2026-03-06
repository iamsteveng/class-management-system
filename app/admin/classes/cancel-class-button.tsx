"use client";

import { useFormStatus } from "react-dom";

type CancelClassButtonProps = {
  classId: string;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function CancelClassButton({
  classId,
  submitAction,
}: CancelClassButtonProps) {
  return (
    <form
      action={submitAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Cancel this class? This will mark it as cancelled."
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="class_id" value={classId} />
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
      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
    >
      {pending ? "Cancelling..." : "Cancel"}
    </button>
  );
}
