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
      const raw = cls as any;
      const rawName = raw.name as string | undefined;
      const patch: Record<string, unknown> = {};
      if (rawName && !cls.name_zh) {
        patch.name_zh = rawName;
        classesMigrated += 1;
      }
      if (rawName !== undefined) {
        // Remove old name field by setting to undefined (Convex removes undefined fields)
        patch.name = undefined;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(cls._id, patch);
      }
    }

    // Migrate sessions: copy raw `location` field to location_zh and remove old field
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = session as any;
      const rawLocation = raw.location as string | undefined;
      const patch: Record<string, unknown> = {};
      if (rawLocation && !session.location_zh) {
        patch.location_zh = rawLocation;
        sessionsMigrated += 1;
      }
      if (rawLocation !== undefined) {
        patch.location = undefined;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(session._id, patch);
      }
    }

    return { classes_migrated: classesMigrated, sessions_migrated: sessionsMigrated };
  },
});
