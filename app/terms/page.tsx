import { makeFunctionReference } from "convex/server";
import { redirect } from "next/navigation";

import { TermsForm } from "./terms-form";
import { createConvexHttpClient } from "@/lib/convexHttp";

type SearchParamValue = string | string[] | undefined;

type TermsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type TermsPageData = {
  customer_mobile: string;
  participant_count: number;
  purchase_status: "pending_terms" | "confirmation_sent" | "terms_accepted" | "cancelled";
  class_name?: string;
  terms_version: string;
  terms_content: string;
  sessions: Array<{
    session_id: string;
    class_id: string;
    class_name: string;
    location_zh: string;
    location_en?: string;
    end_time?: string;
    date: string;
    time: string;
    available_quota: number;
  }>;
};

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const params = await searchParams;
  const token = readSingleQueryParam(params.token);
  const status = readSingleQueryParam(params.status);
  const errorMessage = readSingleQueryParam(params.error);

  if (!token) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Missing purchase token. Please use the full link from your WhatsApp confirmation message.
        </p>
      </main>
    );
  }
  const tokenValue = token;

  const pageData = await loadTermsData(token);
  if (!pageData) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          We could not find a valid purchase for this token.
        </p>
      </main>
    );
  }

  const submissionSucceeded = status === "success";
  const participantId = readSingleQueryParam(params.participant_id);
  const alreadyAccepted = pageData.purchase_status === "terms_accepted";

  async function submitTerms(formData: FormData) {
    "use server";

    const selectedSessionId = formData.get("session_id");
    const accepted = formData.get("accepted") === "on";
    const height = formData.get("height");
    const ageRaw = formData.get("age");
    const emergencyContactName = formData.get("emergency_contact_name");
    const emergencyContactPhone = formData.get("emergency_contact_phone");

    if (typeof selectedSessionId !== "string" || selectedSessionId.length === 0) {
      redirect(
        `/terms?token=${encodeURIComponent(tokenValue)}&error=${encodeURIComponent("Please select a session.")}`
      );
    }

    const ageNumber = ageRaw ? Number(ageRaw) : undefined;

    const client = createConvexHttpClient();
    const result = await client.mutation(
      makeFunctionReference<"mutation">("terms:acceptTermsByToken"),
      {
        token: tokenValue,
        session_id: selectedSessionId,
        accepted,
        height: typeof height === "string" && height.trim() ? height.trim() : undefined,
        age: ageNumber && !isNaN(ageNumber) ? ageNumber : undefined,
        emergency_contact_name:
          typeof emergencyContactName === "string" && emergencyContactName.trim()
            ? emergencyContactName.trim()
            : undefined,
        emergency_contact_phone:
          typeof emergencyContactPhone === "string" && emergencyContactPhone.trim()
            ? emergencyContactPhone.trim()
            : undefined,
      }
    );

    if (!result.success) {
      redirect(
        `/terms?token=${encodeURIComponent(tokenValue)}&error=${encodeURIComponent(
          result.error_message ?? "Unable to accept terms."
        )}`
      );
    }

    const successUrl = result.participant_id
      ? `/terms?token=${encodeURIComponent(tokenValue)}&status=success&participant_id=${encodeURIComponent(result.participant_id)}`
      : `/terms?token=${encodeURIComponent(tokenValue)}&status=success`;
    redirect(successUrl);
  }

  if (submissionSucceeded) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center space-y-6 px-4 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-12 w-12"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 011.04-.207z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Your class application is confirmed</h1>
        {participantId ? (
          <a
            href={`/participant/${encodeURIComponent(participantId)}`}
            className="inline-flex rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Open your QR Code
          </a>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Terms Acceptance</h1>
        <p className="text-sm text-zinc-700">
          Confirm your class session and accept the terms to complete your registration.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-medium text-zinc-900">Purchase details</h2>
        <dl className="mt-3 grid gap-2 text-sm text-zinc-700">
          <div>
            <dt className="font-medium text-zinc-900">Customer mobile</dt>
            <dd>{pageData.customer_mobile}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Participants</dt>
            <dd>{pageData.participant_count}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Class</dt>
            <dd>{pageData.class_name ?? "Will be selected based on your chosen session"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-medium text-zinc-900">
          Terms ({pageData.terms_version})
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-700">
          {pageData.terms_content}
        </p>
      </section>

      <TermsForm
        sessions={pageData.sessions}
        submitAction={submitTerms}
        locked={alreadyAccepted}
        success={submissionSucceeded}
        errorMessage={errorMessage}
      />
    </main>
  );
}

async function loadTermsData(token: string): Promise<TermsPageData | null> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("terms:getTermsPageData"),
      { token }
    );
    return result;
  } catch {
    return null;
  }
}

function readSingleQueryParam(value: SearchParamValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return undefined;
}
