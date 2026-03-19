"use client";

import { useEffect, useState } from "react";

type ClassItem = {
  class_id: string;
  name: string;
  description?: string;
  payment_url: string;
};

type FaqItem = {
  _id: string;
  question: string;
  answer: string;
  order: number;
};

export function HomepageClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadClasses() {
      setIsLoadingClasses(true);
      setClassesError(null);

      try {
        const response = await fetch("/api/classes");
        if (!response.ok) {
          throw new Error("Unable to load classes.");
        }

        const data = (await response.json()) as { classes: ClassItem[] };
        if (!isMounted) {
          return;
        }

        setClasses(data.classes);
      } catch {
        if (!isMounted) {
          return;
        }
        setClassesError("Unable to load classes right now.");
      } finally {
        if (isMounted) {
          setIsLoadingClasses(false);
        }
      }
    }

    void loadClasses();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFaqs() {
      try {
        const response = await fetch("/api/faqs");
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { faqs: FaqItem[] };
        if (isMounted) {
          setFaqs(data.faqs);
        }
      } catch {
        // silently ignore — FAQs are optional
      }
    }

    void loadFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-6 px-4 py-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Available Classes</h1>
        <p className="text-sm text-zinc-700">
          Browse our available classes and purchase your ticket below.
        </p>
      </section>

      <section className="space-y-4">
        {isLoadingClasses ? (
          <p className="text-sm text-zinc-600">Loading classes...</p>
        ) : classesError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{classesError}</p>
        ) : classes.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
            No classes available at this time.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((classItem) => (
              <div
                key={classItem.class_id}
                className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-zinc-900">{classItem.name}</h2>
                {classItem.description ? (
                  <p className="mt-1 flex-1 text-sm text-zinc-700">{classItem.description}</p>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="mt-4">
                  <a
                    href={classItem.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                  >
                    Buy Ticket
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {faqs.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq._id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="font-medium text-zinc-900">{faq.question}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
