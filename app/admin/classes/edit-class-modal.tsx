"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type EditClassModalProps = {
  classId: string;
  initialName: string;
  initialNameEn?: string;
  initialDescription?: string;
  initialPaymentUrl?: string;
  initialAirwallexPrice?: number;
  initialAirwallexCurrency?: string;
  initialAirwallexGroupPrice?: number;
  initialAirwallexGroupMinQty?: number;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function EditClassModal({
  classId,
  initialName,
  initialNameEn,
  initialDescription,
  initialPaymentUrl,
  initialAirwallexPrice,
  initialAirwallexCurrency,
  initialAirwallexGroupPrice,
  initialAirwallexGroupMinQty,
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
                  htmlFor={`edit-name-zh-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  班級名稱（中文）Class Name (ZH) <span className="text-red-600">*</span>
                </label>
                <input
                  id={`edit-name-zh-${fieldId}`}
                  name="name_zh"
                  type="text"
                  required
                  defaultValue={initialName}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`edit-name-en-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Class Name (EN)
                </label>
                <input
                  id={`edit-name-en-${fieldId}`}
                  name="name_en"
                  type="text"
                  defaultValue={initialNameEn ?? ""}
                  placeholder="e.g. Cycling Crash Course"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
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

              <div className="space-y-2">
                <label
                  htmlFor={`edit-payment-url-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Payment URL
                </label>
                <input
                  id={`edit-payment-url-${fieldId}`}
                  name="payment_url"
                  type="url"
                  defaultValue={initialPaymentUrl ?? ""}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`edit-airwallex-price-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Airwallex Price
                </label>
                <input
                  id={`edit-airwallex-price-${fieldId}`}
                  name="airwallex_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={initialAirwallexPrice ?? ""}
                  placeholder="e.g. 1200"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`edit-airwallex-currency-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Airwallex Currency
                </label>
                <input
                  id={`edit-airwallex-currency-${fieldId}`}
                  name="airwallex_currency"
                  type="text"
                  defaultValue={initialAirwallexCurrency ?? ""}
                  placeholder="e.g. HKD"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`edit-airwallex-group-price-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Group Price (per person)
                </label>
                <input
                  id={`edit-airwallex-group-price-${fieldId}`}
                  name="airwallex_group_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={initialAirwallexGroupPrice ?? ""}
                  placeholder="e.g. 250"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
                <p className="text-xs text-zinc-400">Price per person when buying 2 or more</p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`edit-airwallex-group-min-qty-${fieldId}`}
                  className="block text-sm font-medium text-zinc-900"
                >
                  Min Qty for Group Price
                </label>
                <input
                  id={`edit-airwallex-group-min-qty-${fieldId}`}
                  name="airwallex_group_min_qty"
                  type="number"
                  min="2"
                  step="1"
                  defaultValue={initialAirwallexGroupMinQty ?? ""}
                  placeholder="e.g. 2"
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
      {pending ? "Saving..." : "Save"}
    </button>
  );
}
