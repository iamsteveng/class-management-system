"use client";

import { useFormStatus } from "react-dom";

type ClassStatusToggleProps = {
  classId: string;
  status: "active" | "inactive";
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function ClassStatusToggle({
  classId,
  status,
  submitAction,
}: ClassStatusToggleProps) {
  const nextStatus = status === "active" ? "inactive" : "active";

  return (
    <form
      action={submitAction}
      onSubmit={(event) => {
        const message =
          nextStatus === "inactive"
            ? "Hide this class? It will be removed from the homepage and can no longer be purchased. Existing bookings, links and sessions are unaffected."
            : "Show this class? It will appear on the homepage and become purchasable again.";
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="next_status" value={nextStatus} />
      <SubmitButton nextStatus={nextStatus} />
    </form>
  );
}

function SubmitButton({ nextStatus }: { nextStatus: "active" | "inactive" }) {
  const { pending } = useFormStatus();
  const deactivating = nextStatus === "inactive";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 ${
        deactivating
          ? "border-red-300 text-red-700 hover:bg-red-50"
          : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      }`}
    >
      {pending
        ? deactivating
          ? "Deactivating..."
          : "Activating..."
        : deactivating
          ? "Deactivate"
          : "Activate"}
    </button>
  );
}
