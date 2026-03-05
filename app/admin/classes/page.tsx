import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddClassModal } from "./add-class-modal";
import { EditClassModal } from "./edit-class-modal";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type ClassRow = {
  class_id: string;
  class_name: string;
  description?: string;
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
  const classCreated = params.status === "class_created";
  const classUpdated = params.status === "class_updated";
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

  async function editClassAction(formData: FormData) {
    "use server";

    const classId = (formData.get("class_id") as string | null)?.trim() ?? "";
    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const description =
      (formData.get("description") as string | null)?.trim() ?? "";

    if (!classId || !name) {
      redirect(
        `/admin/classes?error=${encodeURIComponent("Class ID and name are required.")}`
      );
    }

    try {
      const client = createConvexHttpClient();
      await client.mutation(
        makeFunctionReference<"mutation">("adminClasses:updateClass"),
        {
          class_id: classId,
          name,
          description,
          admin_username: adminUsername,
        }
      );
    } catch {
      redirect(
        `/admin/classes?error=${encodeURIComponent("Failed to update class. Please try again.")}`
      );
    }

    redirect("/admin/classes?status=class_updated");
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
            success={classCreated}
          />
        ) : null}
      </section>

      {!isSuperAdmin && errorMessage ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {classUpdated ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Class updated successfully.
        </p>
      ) : null}

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
                {isSuperAdmin ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {classes.map((cls) => (
                <tr key={cls.class_id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {cls.class_id}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/admin/classes/${cls.class_id}/sessions`}
                      className="hover:underline"
                    >
                      {cls.class_name}
                    </Link>
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
                  {isSuperAdmin ? (
                    <td className="px-4 py-3">
                      <EditClassModal
                        classId={cls.class_id}
                        initialName={cls.class_name}
                        initialDescription={cls.description}
                        submitAction={editClassAction}
                      />
                    </td>
                  ) : null}
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
