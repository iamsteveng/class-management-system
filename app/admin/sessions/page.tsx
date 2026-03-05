import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";

export default async function AdminSessionsPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Sessions</h1>
        <p className="text-sm text-zinc-700">
          Open a class to manage its sessions, attendance, and participant list.
        </p>
      </section>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-700">
          Session management is organized under each class.
        </p>
        <Link
          href="/admin/classes"
          className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Go to Classes
        </Link>
      </div>
    </main>
  );
}
