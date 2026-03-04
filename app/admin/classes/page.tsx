import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddClassModal } from "./add-class-modal";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type ClassRow = {
  class_id: string;
  class_name: string;
  total_sessions: number;
  status: "active" | "inactive";
};

type AdminClassesPageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function AdminClassesPage({
  searchParams,
}: AdminClassesPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const params = await searchParams;
  const errorMessage = params.error ?? undefined;
  const success = params.status === "class_created";
  const isSuperAdmin = session.user.role === "super_admin";
  const adminUsername = session.user.username;

  const classes = await loadClassListPageData();

  async function addClassAction(formData: FormData) {
    "use server";

    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const description =
      (formData.get("description") as string | null)?.trim() || undefined;

    if (!name) {
      redirect(
        `/admin/classes?error=${encodeURIComponent("Class name is required.")}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(
        makeFunctionReference<"mutation">("adminClasses:createClass"),
        { name, description, admin_username: adminUsername }
      );
    } catch {
      redirect(
        `/admin/classes?error=${encodeURIComponent("Failed to create class. Please try again.")}`
      );
    }

    redirect("/admin/classes?status=class_created");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Classes</h1>
          <p className="text-sm text-zinc-700">
            Signed in as{" "}
            <span className="font-medium">{session.user.username}</span> (
            {session.user.role})
          </p>
        </div>

        {isSuperAdmin ? (
          <AddClassModal
            submitAction={addClassAction}
            errorMessage={errorMessage}
            success={success}
          />
        ) : null}
      </section>

      {classes.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          No classes found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3">Class ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Total Sessions</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {classes.map((cls) => (
                <tr key={cls.class_id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {cls.class_id}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {cls.class_name}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {cls.total_sessions}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        cls.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {cls.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/admin/dashboard"
        className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}

async function loadClassListPageData(): Promise<ClassRow[]> {
  try {
    const client = createConvexHttpClient();
    const result = await client.query(
      makeFunctionReference<"query">("adminClasses:getClassListPageData"),
      {}
    );
    return result;
  } catch {
    return [];
  }
}
