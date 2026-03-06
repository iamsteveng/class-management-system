import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";

type EditClassPageProps = {
  params: Promise<{ class_id: string }>;
};

export default async function EditClassPage({ params }: EditClassPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const { class_id: classId } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Edit Class</h1>
      <p className="text-sm text-zinc-700">
        Edit workflow for class <span className="font-mono">{classId}</span> will be added in a
        subsequent story.
      </p>
      <Link
        href="/admin/classes"
        className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
      >
        Back to Classes
      </Link>
    </main>
  );
}
