import { makeFunctionReference } from "convex/server";
import { type GenericId } from "convex/values";
import { redirect } from "next/navigation";

import { FaqManagementPanel } from "./faq-management-panel";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type SearchParamValue = string | string[] | undefined;

type AdminFaqPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type FaqItem = {
  _id: string;
  question: string;
  answer: string;
  order: number;
  created_at: number;
  updated_at: number;
};

export default async function AdminFaqPage({ searchParams }: AdminFaqPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const isSuperAdmin = session.user.role === "super_admin";
  const adminUsername = session.user.username;

  const sp = await searchParams;
  const successMessage = readSingleParam(sp.success);
  const errorMessage = readSingleParam(sp.error);

  const faqs = await loadFaqs();

  async function createFaqAction(formData: FormData) {
    "use server";

    const question = (formData.get("question") as string | null)?.trim() ?? "";
    const answer = (formData.get("answer") as string | null)?.trim() ?? "";
    const orderRaw = formData.get("order") as string | null;
    const order = orderRaw ? parseInt(orderRaw, 10) : NaN;

    if (!question || !answer || isNaN(order)) {
      redirect(
        `/admin/faq?error=${encodeURIComponent("Question, answer, and order are required.")}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(makeFunctionReference<"mutation">("faqs:createFaq"), {
        question,
        answer,
        order,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create FAQ.";
      redirect(`/admin/faq?error=${encodeURIComponent(message)}`);
    }

    redirect(`/admin/faq?success=${encodeURIComponent("FAQ created successfully.")}`);
  }

  async function updateFaqAction(formData: FormData) {
    "use server";

    const id = (formData.get("faq_id") as string | null) ?? "";
    const question = (formData.get("question") as string | null)?.trim() ?? "";
    const answer = (formData.get("answer") as string | null)?.trim() ?? "";
    const orderRaw = formData.get("order") as string | null;
    const order = orderRaw ? parseInt(orderRaw, 10) : NaN;

    if (!id || !question || !answer || isNaN(order)) {
      redirect(
        `/admin/faq?error=${encodeURIComponent("All fields are required.")}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(makeFunctionReference<"mutation">("faqs:updateFaq"), {
        id: id as GenericId<"faqs">,
        question,
        answer,
        order,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update FAQ.";
      redirect(`/admin/faq?error=${encodeURIComponent(message)}`);
    }

    redirect(`/admin/faq?success=${encodeURIComponent("FAQ updated successfully.")}`);
  }

  void adminUsername; // used via closure in server actions above

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-6 px-4 py-8">
      <section>
        <h1 className="text-2xl font-semibold text-zinc-900">FAQ Management</h1>
        <p className="mt-1 text-sm text-zinc-700">
          Manage the frequently asked questions shown on the homepage.
        </p>
      </section>

      {successMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <FaqManagementPanel
        faqs={faqs}
        isSuperAdmin={isSuperAdmin}
        createAction={createFaqAction}
        updateAction={updateFaqAction}
      />
    </main>
  );
}

async function loadFaqs(): Promise<FaqItem[]> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("faqs:listFaqs"),
      {}
    );
    return result as FaqItem[];
  } catch {
    return [];
  }
}

function readSingleParam(value: SearchParamValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return undefined;
}
