"use client";

import { useFormStatus } from "react-dom";

type SessionVisibilityToggleProps = {
  sessionId: string;
  hidden: boolean;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function SessionVisibilityToggle({
  sessionId,
  hidden,
  submitAction,
}: SessionVisibilityToggleProps) {
  const nextHidden = !hidden;

  return (
    <form
      action={submitAction}
      onSubmit={(event) => {
        const message = nextHidden
          ? "Hide this session? It will be removed from the homepage and the class APIs, and customers and participants can no longer pick it. Participants already in it are unaffected."
          : "Show this session? It will appear on the homepage again and customers and participants can pick it.";
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="hidden" value={nextHidden ? "true" : "false"} />
      <SubmitButton nextHidden={nextHidden} />
    </form>
  );
}

function SubmitButton({ nextHidden }: { nextHidden: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 ${
        nextHidden
          ? "border-zinc-400 text-zinc-700 hover:bg-zinc-100"
          : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      }`}
    >
      {pending ? (nextHidden ? "Hiding..." : "Showing...") : nextHidden ? "Hide" : "Show"}
    </button>
  );
}
