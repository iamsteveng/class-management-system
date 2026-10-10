export type VenueOption = { venue_id: string; name_zh: string };

/** Picks where a Session is held. A Venue's own name and map link replace the typed location. */
export function VenueSelect({
  id,
  venues,
  defaultValue,
}: {
  id: string;
  venues: VenueOption[];
  defaultValue?: string;
}) {
  if (venues.length === 0) return null;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        Venue
      </label>
      <select
        id={id}
        name="venue_id"
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
      >
        <option value="">— None: use the location typed below —</option>
        {venues.map((venue) => (
          <option key={venue.venue_id} value={venue.venue_id}>
            {venue.name_zh}
          </option>
        ))}
      </select>
      <p className="text-xs text-zinc-500">With a Venue picked, the location and Google Maps link come from the Venue.</p>
    </div>
  );
}
