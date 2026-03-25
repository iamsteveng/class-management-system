import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Migration: copy name → name_zh for all classes, location → location_zh for all sessions.
 * Run once after deploying the bilingual schema changes.
 */
export const migrateToNameZhLocationZh = mutationGeneric({
  args: {},
  returns: v.object({
    classes_migrated: v.number(),
    sessions_migrated: v.number(),
  }),
  handler: async (ctx) => {
    let classesMigrated = 0;
    let sessionsMigrated = 0;

    // Migrate classes: copy raw `name` field (not in schema, but present in existing docs) to name_zh
    const classes = await ctx.db.query("classes").collect();
    for (const cls of classes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawName = (cls as any).name as string | undefined;
      if (rawName && !cls.name_zh) {
        await ctx.db.patch(cls._id, { name_zh: rawName });
        classesMigrated += 1;
      }
    }

    // Migrate sessions: copy raw `location` field to location_zh
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawLocation = (session as any).location as string | undefined;
      if (rawLocation && !session.location_zh) {
        await ctx.db.patch(session._id, { location_zh: rawLocation });
        sessionsMigrated += 1;
      }
    }

    return { classes_migrated: classesMigrated, sessions_migrated: sessionsMigrated };
  },
});
