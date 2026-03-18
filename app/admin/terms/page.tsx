import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type SearchParamValue = string | string[] | undefined;

type AdminTermsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type CurrentTermsVersion = {
  version: string;
  content: string;
  created_at: number;
} | null;

export default async function AdminTermsPage({ searchParams }: AdminTermsPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const isSuperAdmin = session.user.role === "super_admin";
  const adminUsername = session.user.username;

  const sp = await searchParams;
  const successVersion = readSingleParam(sp.success);
  const errorMessage = readSingleParam(sp.error);

  const currentTerms = await loadCurrentTerms();

  async function createTermsAction(formData: FormData) {
    "use server";

    const version = (formData.get("version") as string | null)?.trim() ?? "";
    const content = (formData.get("content") as string | null)?.trim() ?? "";

    if (!version || !content) {
      redirect(
        `/admin/terms?error=${encodeURIComponent("Version and content are required.")}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(
        makeFunctionReference<"mutation">("adminTerms:createTermsVersion"),
        { version, content, admin_username: adminUsername }
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create terms version.";
      redirect(`/admin/terms?error=${encodeURIComponent(message)}`);
    }

    redirect(`/admin/terms?success=${encodeURIComponent(version)}`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Terms</h1>
        <p className="text-sm text-zinc-700">
          Manage the terms and conditions that participants must accept.
        </p>
      </section>

      {successVersion ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Terms version &quot;{successVersion}&quot; created and set as current.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {currentTerms ? (
        <section className="rounded-xl border border-zinc-200 p-5 space-y-3">
          <h2 className="text-lg font-medium text-zinc-900">Current Terms Version</h2>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="font-medium text-zinc-600">Version</dt>
              <dd className="mt-0.5 text-zinc-900">{currentTerms.version}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-600">Created</dt>
              <dd className="mt-0.5 text-zinc-900">
                {new Date(currentTerms.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-600">Content</dt>
              <dd className="mt-1 whitespace-pre-line rounded-lg bg-zinc-50 px-3 py-2 text-zinc-700">
                {currentTerms.content}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          No terms version exists yet.
        </p>
      )}

      {isSuperAdmin ? (
        <section className="rounded-xl border border-zinc-200 p-5 space-y-4">
          <h2 className="text-lg font-medium text-zinc-900">Create New Terms Version</h2>
          <p className="text-sm text-zinc-600">
            Creating a new version will replace the current terms. New participants will see the new version.
          </p>
          <form action={createTermsAction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="version" className="block text-sm font-medium text-zinc-900">
                Version <span className="text-red-600">*</span>
              </label>
              <input
                id="version"
                name="version"
                type="text"
                required
                placeholder="e.g. v2, 2026-03, 1.1"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="content" className="block text-sm font-medium text-zinc-900">
                Terms Content <span className="text-red-600">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={10}
                placeholder="Enter the full terms and conditions text..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Create & Activate
            </button>
          </form>
        </section>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-700">
            Only super admins can create new terms versions.
          </p>
          <Link
            href="/terms"
            className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
          >
            Open Public Terms Page
          </Link>
        </div>
      )}
    </main>
  );
}

async function loadCurrentTerms(): Promise<CurrentTermsVersion> {
  try {
    const client = createConvexHttpClient();
    return await client.query(
      makeFunctionReference<"query">("adminTerms:getCurrentTermsVersion"),
      {}
    );
  } catch {
    return null;
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
