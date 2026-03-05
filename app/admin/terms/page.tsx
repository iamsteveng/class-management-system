import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";

export default async function AdminTermsPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Terms</h1>
        <p className="text-sm text-zinc-700">
          Terms acceptance is available on the public participant flow.
        </p>
      </section>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-700">
          Use the public Terms page to view the latest participant terms experience.
        </p>
        <Link
          href="/terms"
          className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Open Public Terms Page
        </Link>
      </div>
    </main>
  );
}
