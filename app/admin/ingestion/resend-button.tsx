"use client";

import { useFormStatus } from "react-dom";

type ResendButtonProps = {
  purchaseId: string;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function ResendButton({ purchaseId, submitAction }: ResendButtonProps) {
  return (
    <form action={submitAction}>
      <input type="hidden" name="purchase_id" value={purchaseId} />
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
      className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
    >
      {pending ? "Sending..." : "Resend"}
    </button>
  );
}
