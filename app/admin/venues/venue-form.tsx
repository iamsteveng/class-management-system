import Link from "next/link";

export type VenueFormValues = {
  name_zh?: string;
  name_en?: string;
  district_zh?: string;
  district_en?: string;
  address_zh?: string;
  address_en?: string;
  opening_hours?: string;
  latitude?: number;
  longitude?: number;
  mtr_station_zh?: string;
  mtr_station_en?: string;
  mtr_line_zh?: string;
  mtr_line_en?: string;
  mtr_latitude?: number;
  mtr_longitude?: number;
  walk_minutes?: number;
  directions_zh?: string;
  directions_en?: string;
};

type Field = {
  name: keyof VenueFormValues;
  label: string;
  required?: boolean;
  kind?: "number" | "textarea";
  step?: string;
};

const SECTIONS: Array<{ title: string; fields: Field[] }> = [
  {
    title: "Venue",
    fields: [
      { name: "name_zh", label: "Name (ZH)", required: true },
      { name: "name_en", label: "Name (EN)" },
      { name: "district_zh", label: "District (ZH)", required: true },
      { name: "district_en", label: "District (EN)" },
      { name: "address_zh", label: "Address (ZH)", required: true },
      { name: "address_en", label: "Address (EN)" },
      { name: "opening_hours", label: "Opening hours" },
      { name: "latitude", label: "Latitude", required: true, kind: "number", step: "any" },
      { name: "longitude", label: "Longitude", required: true, kind: "number", step: "any" },
    ],
  },
  {
    title: "Getting there from the MTR",
    fields: [
      { name: "mtr_station_zh", label: "Station (ZH)" },
      { name: "mtr_station_en", label: "Station (EN)" },
      { name: "mtr_line_zh", label: "Line (ZH)" },
      { name: "mtr_line_en", label: "Line (EN)" },
      { name: "mtr_latitude", label: "Station latitude", kind: "number", step: "any" },
      { name: "mtr_longitude", label: "Station longitude", kind: "number", step: "any" },
      { name: "walk_minutes", label: "Walk (minutes)", kind: "number", step: "1" },
      { name: "directions_zh", label: "Walking directions (ZH)", kind: "textarea" },
      { name: "directions_en", label: "Walking directions (EN)", kind: "textarea" },
    ],
  },
];

const inputClass = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900";

export function VenueForm({
  values,
  submitAction,
  submitLabel,
}: {
  values?: VenueFormValues;
  submitAction: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={submitAction} className="space-y-6">
      {SECTIONS.map((section) => (
        <fieldset key={section.title} className="rounded-xl border border-zinc-200 p-5">
          <legend className="px-1 text-sm font-semibold text-zinc-900">{section.title}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <label
                key={field.name}
                className={`block space-y-1 ${field.kind === "textarea" ? "sm:col-span-2" : ""}`}
              >
                <span className="block text-sm font-medium text-zinc-800">
                  {field.label}
                  {field.required ? <span className="text-red-600"> *</span> : null}
                </span>
                {field.kind === "textarea" ? (
                  <textarea name={field.name} rows={2} defaultValue={values?.[field.name] ?? ""} className={inputClass} />
                ) : (
                  <input
                    name={field.name}
                    type={field.kind === "number" ? "number" : "text"}
                    step={field.step}
                    required={field.required}
                    defaultValue={values?.[field.name] ?? ""}
                    className={inputClass}
                  />
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/venues" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
          Cancel
        </Link>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Reads the venue form into the arguments the venue mutations take. */
export function readVenueForm(formData: FormData) {
  const text = (name: string) => ((formData.get(name) as string | null) ?? "").trim();
  const optionalText = (name: string) => text(name) || undefined;
  const optionalNumber = (name: string) => {
    const raw = text(name);
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    name_zh: text("name_zh"),
    name_en: optionalText("name_en"),
    district_zh: text("district_zh"),
    district_en: optionalText("district_en"),
    address_zh: text("address_zh"),
    address_en: optionalText("address_en"),
    opening_hours: optionalText("opening_hours"),
    // Required on the form; 0 is out of Hong Kong and still fails the server's checks loudly.
    latitude: optionalNumber("latitude") ?? 0,
    longitude: optionalNumber("longitude") ?? 0,
    mtr_station_zh: optionalText("mtr_station_zh"),
    mtr_station_en: optionalText("mtr_station_en"),
    mtr_line_zh: optionalText("mtr_line_zh"),
    mtr_line_en: optionalText("mtr_line_en"),
    mtr_latitude: optionalNumber("mtr_latitude"),
    mtr_longitude: optionalNumber("mtr_longitude"),
    walk_minutes: optionalNumber("walk_minutes"),
    directions_zh: optionalText("directions_zh"),
    directions_en: optionalText("directions_en"),
  };
}
