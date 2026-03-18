"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type FaqItem = {
  _id: string;
  question: string;
  answer: string;
  order: number;
};

type FaqManagementPanelProps = {
  faqs: FaqItem[];
  isSuperAdmin: boolean;
  createAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function FaqManagementPanel({
  faqs,
  isSuperAdmin,
  createAction,
  updateAction,
}: FaqManagementPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      {faqs.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          No FAQ items yet.
        </p>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq._id} className="rounded-xl border border-zinc-200 bg-white p-5">
              {editingId === faq._id && isSuperAdmin ? (
                <form action={updateAction} className="space-y-3">
                  <input type="hidden" name="faq_id" value={faq._id} />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-900">
                      Question
                    </label>
                    <input
                      name="question"
                      type="text"
                      required
                      defaultValue={faq.question}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-900">
                      Answer
                    </label>
                    <textarea
                      name="answer"
                      required
                      rows={4}
                      defaultValue={faq.answer}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-900">
                      Order
                    </label>
                    <input
                      name="order"
                      type="number"
                      required
                      defaultValue={faq.order}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <SaveButton />
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-400">Order: {faq.order}</p>
                      <h3 className="mt-0.5 font-medium text-zinc-900">{faq.question}</h3>
                    </div>
                    {isSuperAdmin ? (
                      <button
                        type="button"
                        onClick={() => setEditingId(faq._id)}
                        className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-line text-sm text-zinc-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isSuperAdmin ? (
        <div>
          {showAddForm ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-medium text-zinc-900">Add FAQ</h2>
              <form action={createAction} className="mt-4 space-y-3">
                <div className="space-y-1">
                  <label htmlFor="add-question" className="block text-sm font-medium text-zinc-900">
                    Question <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="add-question"
                    name="question"
                    type="text"
                    required
                    placeholder="What is your question?"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="add-answer" className="block text-sm font-medium text-zinc-900">
                    Answer <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="add-answer"
                    name="answer"
                    required
                    rows={4}
                    placeholder="Provide a clear answer..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="add-order" className="block text-sm font-medium text-zinc-900">
                    Order <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="add-order"
                    name="order"
                    type="number"
                    required
                    defaultValue={faqs.length + 1}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>
                <div className="flex gap-2">
                  <SaveButton />
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Add FAQ
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
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
