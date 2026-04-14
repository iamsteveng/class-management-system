import { makeFunctionReference } from "convex/server";
import { redirect } from "next/navigation";

import { TermsForm } from "./terms-form";
import { TermsSuccessContent } from "./TermsSuccessContent";
import { PurchaseDetailsSection } from "./PurchaseDetailsSection";
import { createConvexHttpClient } from "@/lib/convexHttp";
import { LanguageProvider } from "../components/LanguageProvider";
import { LanguageToggleHeader } from "../components/LanguageToggleHeader";

type SearchParamValue = string | string[] | undefined;

type TermsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type TermsPageData = {
  customer_mobile: string;
  participant_count: number;
  purchase_status: "pending_terms" | "confirmation_sent" | "terms_accepted" | "cancelled";
  participant_id?: string;
  class_name?: string;
  terms_version: string;
  terms_content: string;
  sessions: Array<{
    session_id: string;
    class_id: string;
    class_name: string;
    name_zh: string;
    name_en?: string;
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
      <LanguageProvider>
        <LanguageToggleHeader />
        <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            缺少購買 token。請使用 WhatsApp 確認訊息中的完整連結。<br />
            Missing purchase token. Please use the full link from your WhatsApp confirmation message.
          </p>
        </main>
      </LanguageProvider>
    );
  }
  const tokenValue = token;

  const pageData = await loadTermsData(token);
  if (!pageData) {
    return (
      <LanguageProvider>
        <LanguageToggleHeader />
        <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            找不到此 token 對應的有效訂單。<br />
            We could not find a valid purchase for this token.
          </p>
        </main>
      </LanguageProvider>
    );
  }

  const submissionSucceeded = status === "success";
  const alreadyAccepted = pageData.purchase_status === "terms_accepted";
  const participantId = readSingleQueryParam(params.participant_id) ?? pageData.participant_id;

  async function submitTerms(formData: FormData) {
    "use server";

    const selectedSessionId = formData.get("session_id");
    const accepted = formData.get("accepted") === "on";
    const name = formData.get("name");
    const email = formData.get("email");
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
        name: typeof name === "string" ? name.trim() : "",
        email: typeof email === "string" ? email.trim() : "",
        height: typeof height === "string" && height.trim() ? (parseFloat(height.trim()) || undefined) : undefined,
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

  if (submissionSucceeded || alreadyAccepted) {
    return (
      <LanguageProvider>
        <LanguageToggleHeader />
        <TermsSuccessContent participantId={participantId} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <LanguageToggleHeader />
      <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
        <PurchaseDetailsSection
          customer_mobile={pageData.customer_mobile}
          participant_count={pageData.participant_count}
          class_name={pageData.class_name}
        />

        <section className="rounded-xl border border-zinc-200 p-5">
          <h2 className="text-lg font-medium text-zinc-900">
            條款 / Terms ({pageData.terms_version})
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
    </LanguageProvider>
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
