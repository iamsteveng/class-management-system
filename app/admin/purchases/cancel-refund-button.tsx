"use client";

import { useTransition, useState } from "react";
import { cancelAndRefundAction } from "./actions";

type Props = {
  purchaseId: string;
  orderId: string;
  amount: number;
  currency: string;
};

export function CancelRefundButton({ purchaseId, orderId, amount, currency }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setConfirmation("");
    setError(null);
    setOpen(true);
  }

  function handleCancel() {
    if (isPending) return;
    setOpen(false);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAndRefundAction(purchaseId);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error ?? "An unexpected error occurred.");
      }
    });
  }

  const canConfirm = confirmation === "REFUND" && !isPending;

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50"
      >
        Cancel &amp; Refund
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold text-zinc-900">Cancel &amp; Refund</h2>
            <p className="mb-4 text-sm text-zinc-600">
              This will refund{" "}
              <span className="font-medium text-zinc-900">
                {currency} {amount.toFixed(2)}
              </span>{" "}
              for order <span className="font-mono text-xs">{orderId}</span> and remove all
              associated participants from their session.{" "}
              <span className="font-medium text-red-600">This action is irreversible.</span>
            </p>

            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Type <span className="font-mono font-semibold">REFUND</span> to confirm
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="REFUND"
              disabled={isPending}
              className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50"
            />

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? "Processing…" : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
