import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

export const seedInitialData = mutationGeneric({
  args: {},
  returns: v.object({
    classes_created: v.number(),
    sessions_created: v.number(),
    terms_created: v.number(),
    admins_created: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    let classesCreated = 0;
    let sessionsCreated = 0;
    let termsCreated = 0;
    let adminsCreated = 0;

    const classSeeds = [
      {
        class_id: "class_cycling_fundamentals",
        name: "Cycling Fundamentals",
        description: "Beginner-friendly coached cycling class.",
      },
      {
        class_id: "class_city_guided_tour",
        name: "City Guided Tour",
        description: "Guided outdoor city tour with curated stops.",
      },
    ] as const;

    for (const classSeed of classSeeds) {
      const existingClass = await ctx.db
        .query("classes")
        .withIndex("by_class_id", (q) => q.eq("class_id", classSeed.class_id))
        .first();

      if (!existingClass) {
        await ctx.db.insert("classes", {
          ...classSeed,
          status: "active",
          created_at: now,
        });
        classesCreated += 1;
      }
    }

    const sessionSeeds = [
      {
        session_id: "session_cycling_2026_03_15_0900",
        class_id: "class_cycling_fundamentals",
        location: "Downtown Studio A",
        date: "2026-03-15",
        time: "09:00",
        quota_defined: 20,
      },
      {
        session_id: "session_cycling_2026_03_22_0900",
        class_id: "class_cycling_fundamentals",
        location: "Downtown Studio A",
        date: "2026-03-22",
        time: "09:00",
        quota_defined: 20,
      },
      {
        session_id: "session_tour_2026_03_16_1400",
        class_id: "class_city_guided_tour",
        location: "City Hall Entrance",
        date: "2026-03-16",
        time: "14:00",
        quota_defined: 15,
      },
      {
        session_id: "session_tour_2026_03_23_1400",
        class_id: "class_city_guided_tour",
        location: "City Hall Entrance",
        date: "2026-03-23",
        time: "14:00",
        quota_defined: 15,
      },
    ] as const;

    for (const sessionSeed of sessionSeeds) {
      const existingSession = await ctx.db
        .query("sessions")
        .withIndex("by_session_id", (q) =>
          q.eq("session_id", sessionSeed.session_id)
        )
        .first();

      if (!existingSession) {
        await ctx.db.insert("sessions", {
          ...sessionSeed,
          quota_used: 0,
          status: "scheduled",
          created_at: now,
        });
        sessionsCreated += 1;
      }
    }

    const existingCurrentTerms = await ctx.db
      .query("terms_versions")
      .withIndex("by_is_current", (q) => q.eq("is_current", true))
      .first();

    if (!existingCurrentTerms) {
      await ctx.db.insert("terms_versions", {
        version: "v1.0",
        content:
          "By participating, you agree to follow instructor guidance and acknowledge standard activity risks.",
        is_current: true,
        created_at: now,
      });
      termsCreated += 1;
    }

    const adminSeeds = [
      { username: "admin", role: "super_admin", password: "admin123" },
      { username: "staff", role: "regular_admin", password: "staff123" },
    ] as const;

    for (const adminSeed of adminSeeds) {
      const existingAdmin = await ctx.db
        .query("admins")
        .withIndex("by_username", (q) => q.eq("username", adminSeed.username))
        .first();

      if (!existingAdmin) {
        await ctx.db.insert("admins", {
          username: adminSeed.username,
          role: adminSeed.role,
          password_hash: bcrypt.hashSync(adminSeed.password, 10),
          created_at: now,
        });
        adminsCreated += 1;
      }
    }

    return {
      classes_created: classesCreated,
      sessions_created: sessionsCreated,
      terms_created: termsCreated,
      admins_created: adminsCreated,
    };
  },
});
