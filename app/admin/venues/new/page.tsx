import { makeFunctionReference } from "convex/server";
import { redirect } from "next/navigation";

import { VenueForm, readVenueForm } from "../venue-form";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

export default async function NewVenuePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }
  if (session.user.role !== "super_admin") {
    redirect("/admin/venues?error=Only%20super%20admins%20can%20add%20venues.");
  }
  const sp = await searchParams;
  const adminUsername = session.user.username;

  async function createVenueAction(formData: FormData) {
    "use server";
    try {
      await createConvexHttpClient().mutation(makeFunctionReference<"mutation">("adminVenues:createVenue"), {
        ...readVenueForm(formData),
        admin_username: adminUsername,
      });
    } catch (err) {
      const message = err instanceof Error && /required|range/.test(err.message) ? err.message : "Failed to add venue.";
      redirect(`/admin/venues/new?error=${encodeURIComponent(message)}`);
    }
    redirect("/admin/venues?status=venue_created");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Add Venue</h1>
      {sp.error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{sp.error}</p> : null}
      <VenueForm submitAction={createVenueAction} submitLabel="Add Venue" />
    </main>
  );
}
