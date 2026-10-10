import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type VenueRow = {
  venue: {
    venue_id: string;
    name_zh: string;
    district_zh: string;
    address_zh: string;
    opening_hours?: string;
    mtr_station_zh?: string;
    walk_minutes?: number;
  };
  upcoming_sessions: number;
};

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }
  const sp = await searchParams;
  const isSuperAdmin = session.user.role === "super_admin";
  const rows = (await createConvexHttpClient().query(
    makeFunctionReference<"query">("adminVenues:listVenuesForAdmin"),
    {}
  )) as VenueRow[];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Venues</h1>
          <p className="mt-1 text-sm text-zinc-600">Where Sessions are held. Editing a Venue updates its upcoming Sessions.</p>
        </div>
        {isSuperAdmin ? (
          <Link href="/admin/venues/new" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
            Add Venue
          </Link>
        ) : null}
      </section>

      {sp.status ? (
        <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          {sp.status === "venue_created" ? "Venue added." : "Venue updated."}
        </p>
      ) : null}
      {sp.error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{sp.error}</p> : null}

      {rows.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">No venues yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Venue</th>
                <th className="px-4 py-2 font-medium">District</th>
                <th className="px-4 py-2 font-medium">Address</th>
                <th className="px-4 py-2 font-medium">MTR</th>
                <th className="px-4 py-2 font-medium">Upcoming sessions</th>
                {isSuperAdmin ? <th className="px-4 py-2 font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map(({ venue, upcoming_sessions }) => (
                <tr key={venue.venue_id} data-venue-id={venue.venue_id}>
                  <td className="px-4 py-2 font-medium text-zinc-900">{venue.name_zh}</td>
                  <td className="px-4 py-2">{venue.district_zh}</td>
                  <td className="px-4 py-2">
                    {venue.address_zh}
                    {venue.opening_hours ? <span className="block text-xs text-zinc-500">{venue.opening_hours}</span> : null}
                  </td>
                  <td className="px-4 py-2">
                    {venue.mtr_station_zh ?? "—"}
                    {venue.walk_minutes ? <span className="block text-xs text-zinc-500">{venue.walk_minutes} min walk</span> : null}
                  </td>
                  <td className="px-4 py-2">{upcoming_sessions}</td>
                  {isSuperAdmin ? (
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/venues/${encodeURIComponent(venue.venue_id)}`}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                      >
                        Edit
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
