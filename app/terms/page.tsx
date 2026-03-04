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
    location: string;
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
  const alreadyAccepted = pageData.purchase_status === "terms_accepted";

  async function submitTerms(formData: FormData) {
    "use server";

    const selectedSessionId = formData.get("session_id");
    const accepted = formData.get("accepted") === "on";

    if (typeof selectedSessionId !== "string" || selectedSessionId.length === 0) {
      redirect(
        `/terms?token=${encodeURIComponent(tokenValue)}&error=${encodeURIComponent("Please select a session.")}`
      );
    }

    const client = createConvexHttpClient();
    const result = await client.mutation(
      makeFunctionReference<"mutation">("terms:acceptTermsByToken"),
      {
        token: tokenValue,
        session_id: selectedSessionId,
        accepted,
      }
    );

    if (!result.success) {
      redirect(
        `/terms?token=${encodeURIComponent(tokenValue)}&error=${encodeURIComponent(
          result.error_message ?? "Unable to accept terms."
        )}`
      );
    }

    redirect(`/terms?token=${encodeURIComponent(tokenValue)}&status=success`);
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
