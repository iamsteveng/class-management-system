import { makeFunctionReference } from "convex/server";
import { redirect } from "next/navigation";

import { VenueForm, readVenueForm, type VenueFormValues } from "../venue-form";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

export default async function EditVenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ venue_id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }
  if (session.user.role !== "super_admin") {
    redirect("/admin/venues?error=Only%20super%20admins%20can%20edit%20venues.");
  }
  const { venue_id: venueId } = await params;
  const sp = await searchParams;
  const adminUsername = session.user.username;

  const venue = (await createConvexHttpClient().query(makeFunctionReference<"query">("adminVenues:getVenue"), {
    venue_id: venueId,
  })) as VenueFormValues | null;
  if (!venue) {
    redirect("/admin/venues?error=Venue%20not%20found.");
  }

  async function updateVenueAction(formData: FormData) {
    "use server";
    try {
      await createConvexHttpClient().mutation(makeFunctionReference<"mutation">("adminVenues:updateVenue"), {
        ...readVenueForm(formData),
        venue_id: venueId,
        admin_username: adminUsername,
      });
    } catch (err) {
      const message = err instanceof Error && /required|range/.test(err.message) ? err.message : "Failed to update venue.";
      redirect(`/admin/venues/${encodeURIComponent(venueId)}?error=${encodeURIComponent(message)}`);
    }
    redirect("/admin/venues?status=venue_updated");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Venue</h1>
        <p className="mt-1 text-sm text-zinc-600">Upcoming Sessions at this Venue take the new name and map position.</p>
      </div>
      {sp.error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{sp.error}</p> : null}
      <VenueForm values={venue} submitAction={updateVenueAction} submitLabel="Save" />
    </main>
  );
}
