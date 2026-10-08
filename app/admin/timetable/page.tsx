import { makeFunctionReference } from "convex/server";
import { redirect } from "next/navigation";

import { PauseToggle } from "./pause-toggle";
import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

type TimetableEntry = {
  entry_id: string;
  class_name_zh: string;
  venue_name_zh: string;
  cycle_week: number;
  weekday: number;
  weekday_label: string;
  start_time: string;
  end_time: string;
  paused: boolean;
};

type Timetable = {
  cycle_anchor: string;
  cycle_weeks: number;
  window_days: number;
  paused: boolean;
  entries: TimetableEntry[];
} | null;

type TimetablePageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function AdminTimetablePage({ searchParams }: TimetablePageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const sp = await searchParams;
  const isSuperAdmin = session.user.role === "super_admin";
  const adminUsername = session.user.username;

  const client = createConvexHttpClient();
  const timetable = (await client.query(
    makeFunctionReference<"query">("timetable:getTimetable"),
    {}
  )) as Timetable;

  async function setPausedAction(formData: FormData) {
    "use server";

    const entryId = (formData.get("entry_id") as string | null)?.trim() ?? "";
    const paused = formData.get("paused") === "true";

    try {
      const convex = createConvexHttpClient();
      if (entryId) {
        await convex.mutation(
          makeFunctionReference<"mutation">("timetable:setTimetableEntryPaused"),
          { entry_id: entryId, paused, admin_username: adminUsername }
        );
      } else {
        await convex.mutation(
          makeFunctionReference<"mutation">("timetable:setTimetablePaused"),
          { paused, admin_username: adminUsername }
        );
      }
    } catch {
      redirect(
        `/admin/timetable?error=${encodeURIComponent("Failed to update the Timetable. Please try again.")}`
      );
    }

    redirect(`/admin/timetable?status=${paused ? "paused" : "resumed"}`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Timetable</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Sessions are opened from this pattern automatically, {timetable?.window_days ?? 28} days
            ahead. Once opened, a Session stands on its own: cancel, hide or edit it from its Class.
            Changing the pattern itself is done in code.
          </p>
        </div>
        {timetable && isSuperAdmin ? (
          <PauseToggle paused={timetable.paused} label="whole Timetable" submitAction={setPausedAction} />
        ) : null}
      </section>

      {sp.status ? (
        <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          {sp.status === "paused" ? "Paused." : "Resumed."} Sessions already open are unchanged.
        </p>
      ) : null}
      {sp.error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{sp.error}</p> : null}

      {!timetable ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">There is no Timetable yet.</p>
      ) : (
        <>
          <p className="text-sm text-zinc-700">
            {timetable.cycle_weeks}-week cycle; week 1 starts on {timetable.cycle_anchor}.
            {timetable.paused ? (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Paused — no new Sessions are being opened
              </span>
            ) : null}
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Week</th>
                  <th className="px-4 py-2 font-medium">Day</th>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Class</th>
                  <th className="px-4 py-2 font-medium">Venue</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  {isSuperAdmin ? <th className="px-4 py-2 font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {timetable.entries.map((entry) => (
                  <tr key={entry.entry_id} data-entry-id={entry.entry_id}>
                    <td className="px-4 py-2">{entry.cycle_week}</td>
                    <td className="px-4 py-2">星期{entry.weekday_label}</td>
                    <td className="px-4 py-2">
                      {entry.start_time}–{entry.end_time}
                    </td>
                    <td className="px-4 py-2">{entry.class_name_zh}</td>
                    <td className="px-4 py-2">{entry.venue_name_zh}</td>
                    <td className="px-4 py-2">{entry.paused ? "Paused" : "Active"}</td>
                    {isSuperAdmin ? (
                      <td className="px-4 py-2">
                        <PauseToggle
                          paused={entry.paused}
                          entryId={entry.entry_id}
                          label="this entry"
                          submitAction={setPausedAction}
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
