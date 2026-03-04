import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Admin Dashboard</h1>
      <p className="text-sm text-zinc-700">
        Signed in as <span className="font-medium">{session.user.username}</span> ({session.user.role})
      </p>
      <Link
        href="/admin/login"
        className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
      >
        Back to Login
      </Link>
    </main>
  );
}
