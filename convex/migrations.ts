import { internalMutationGeneric, mutationGeneric } from "convex/server";
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

type ClassCardContent = {
  duration_minutes: number;
  image_url: string;
  description_zh: string;
  description_en: string;
};

/** Card content previously hardcoded in app/i18n/courseConfig.ts, keyed by class_id. */
const CLASS_CARD_CONTENT: Record<string, ClassCardContent> = {
  "class_cycling_fundamentals": {
    duration_minutes: 180,
    image_url: "/images/homepage/30c657383d224670b9671a2f703069965543dc7c.png",
    description_zh: "教你由零出發學識踩單車（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）",
    description_en: "Learn to ride a bike from scratch (includes: bike inspection, handling skills, safety rules, simulation practice)",
  },
  "67261272-c799-4439-9146-4ee12ce51b7c": {
    duration_minutes: 180,
    image_url: "/images/homepage/30c657383d224670b9671a2f703069965543dc7c.png",
    description_zh: "教你由零出發學識踩單車（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）",
    description_en: "Learn to ride a bike from scratch (includes: bike inspection, handling skills, safety rules, simulation practice)",
  },
  "class_city_guided_tour": {
    duration_minutes: 120,
    image_url: "/images/homepage/1b6dde4eac8d4c724b5927af3ad2e95753044659.png",
    description_zh: "帶你探索香港各區美景，享受單車樂趣。導賞團包括：路線規劃、安全講解、景點介紹等",
    description_en: "Explore Hong Kong scenic districts by bike. Tours include route planning, safety briefing, and sightseeing",
  },
  "85714c5b-8b37-4469-bfeb-d60f46129387": {
    duration_minutes: 180,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/teen.jpg",
    description_zh: "專為青少年設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）",
    description_en: "Beginner cycling course designed for teenagers, covering bike inspection, handling skills, safety rules, and simulation practice",
  },
  "9e415878-038b-42ae-b6e6-91873c32dd15": {
    duration_minutes: 180,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/midkid.jpg",
    description_zh: "專為中童（10-12歲）設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）",
    description_en: "Beginner cycling course designed for children aged 10–12, covering bike inspection, handling skills, safety rules, and simulation practice",
  },
  "087ff81e-737a-42f9-957c-192a23de30dc": {
    duration_minutes: 180,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/smallkid.jpg",
    description_zh: "專為幼兒設計的單車入門課程，以趣味方式引導小朋友學習踩單車技巧（包括：平衡感訓練、單車操控技巧、單車安全守則）",
    description_en: "Fun beginner cycling course designed for young children, covering balance training, bike handling skills, and safety rules",
  },
  "a7a53c64-8cf0-4b71-9749-7f1076045f99": {
    duration_minutes: 180,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/teen.jpg",
    description_zh: "專為青少年設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）",
    description_en: "Beginner cycling course designed for teenagers, covering bike inspection, handling skills, safety rules, and simulation practice",
  },
  "a07413ca-9be9-4492-94d3-da01a93a3e04": {
    duration_minutes: 180,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/smallkid.jpg",
    description_zh: "專為幼兒設計的單車入門課程，以趣味方式引導小朋友學習踩單車技巧（包括：平衡感訓練、單車操控技巧、單車安全守則）",
    description_en: "Fun beginner cycling course designed for young children, covering balance training, bike handling skills, and safety rules",
  },
  "a2f45f61-4f3f-4345-84b6-6241c4adb532": {
    duration_minutes: 180,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/midkid.jpg",
    description_zh: "專為中童（10-12歲）設計的單車入門課程，由淺入深學習踩單車技巧（包括：單車檢查、單車操控技巧、單車安全守則、模擬練習，完成後可優先參與單車技術改進課程）",
    description_en: "Beginner cycling course designed for children aged 10–12, covering bike inspection, handling skills, safety rules, and simulation practice",
  },
  "7fe78618-d6c1-4a35-ad01-a0453a943180": {
    duration_minutes: 120,
    image_url: "/images/homepage/1b6dde4eac8d4c724b5927af3ad2e95753044659.png",
    description_zh: "帶你探索香港各區美景，享受單車樂趣。導賞團包括：路線規劃、安全講解、景點介紹等",
    description_en: "Explore Hong Kong scenic districts by bike. Tours include route planning, safety briefing, and sightseeing",
  },
  "ef5da20f-6ee5-4960-96bd-d7c8615e1e8c": {
    duration_minutes: 120,
    image_url: "/images/homepage/fd4d1d8fb6d982eadb491c135a33b2ff72209b94.jpg",
    description_zh: "由保良局李兆基青年綠洲青年見習導賞員帶領，免費參加。踩住單車探索北部都會區美景，一路輕鬆睇風景、享受單車樂趣。",
    description_en: "Led by trainee tour guides from PLK Lee Shau Kee Youth Oasis — free to join. Explore the scenic Northern Metropolis by bike and enjoy a relaxing ride with beautiful views.",
  },
  "7a35a3af-0ce8-4c63-b902-63be721656d0": {
    duration_minutes: 120,
    image_url: "/images/homepage/fd4d1d8fb6d982eadb491c135a33b2ff72209b94.jpg",
    description_zh: "由保良局李兆基青年綠洲青年見習導賞員帶領，免費參加。踩住單車探索北部都會區美景，一路輕鬆睇風景、享受單車樂趣。",
    description_en: "Led by trainee tour guides from PLK Lee Shau Kee Youth Oasis — free to join. Explore the scenic Northern Metropolis by bike and enjoy a relaxing ride with beautiful views.",
  },
  "class_guided_tour_practicum": {
    duration_minutes: 120,
    image_url: "/images/homepage/fd4d1d8fb6d982eadb491c135a33b2ff72209b94.jpg",
    description_zh: "由保良局李兆基青年綠洲青年見習導賞員帶領，免費參加。踩住單車探索北部都會區美景，一路輕鬆睇風景、享受單車樂趣。",
    description_en: "Led by trainee tour guides from PLK Lee Shau Kee Youth Oasis — free to join. Explore the scenic Northern Metropolis by bike and enjoy a relaxing ride with beautiful views.",
  },
  "9a7c48f6-3e1e-4c94-ba8e-7c061c04cf14": {
    duration_minutes: 60,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/balance-bike-toddler.jpg",
    description_zh: "專為 2-5 歲幼兒而設的平衡車課程，從建立安全感開始，逐步加入趣味障礙賽關卡。訓練小朋友專注力、手眼協調與核心肌肉，為將來學踩單車打好基礎。",
    description_en: "A balance bike course designed for toddlers aged 2-5. Starts by building confidence, then adds fun obstacle-course challenges. Trains focus, hand-eye coordination and core strength — the foundation for learning to ride a bicycle.",
  },
  "d8f59165-0a99-4a9d-8ac8-a3cae8be1b3e": {
    duration_minutes: 60,
    image_url: "https://s3.ap-east-1.amazonaws.com/asset.loco.hk/images/academy/balance-bike-toddler.jpg",
    description_zh: "專為 2-5 歲幼兒而設的平衡車課程，從建立安全感開始，逐步加入趣味障礙賽關卡。訓練小朋友專注力、手眼協調與核心肌肉，為將來學踩單車打好基礎。",
    description_en: "A balance bike course designed for toddlers aged 2-5. Starts by building confidence, then adds fun obstacle-course challenges. Trains focus, hand-eye coordination and core strength — the foundation for learning to ride a bicycle.",
  },
};

/**
 * Migration: move homepage Class card content into the Class record.
 * Copies the legacy `description` into `description_zh` and clears it, then fills
 * description_zh/en, duration_minutes and image_url from CLASS_CARD_CONTENT where not
 * already set. Safe to run more than once.
 */
export const backfillClassCardContent = internalMutationGeneric({
  args: {},
  returns: v.object({
    classes_updated: v.number(),
    classes_without_content: v.array(v.string()),
  }),
  handler: async (ctx) => {
    let classesUpdated = 0;
    const classesWithoutContent: string[] = [];

    const classes = await ctx.db.query("classes").collect();
    for (const cls of classes) {
      const content = CLASS_CARD_CONTENT[cls.class_id];
      if (!content) {
        classesWithoutContent.push(cls.class_id);
      }

      const legacyDescription = cls.description?.trim() || undefined;
      const patch: Record<string, unknown> = {
        description_zh: cls.description_zh ?? legacyDescription ?? content?.description_zh,
        description_en: cls.description_en ?? content?.description_en,
        duration_minutes: cls.duration_minutes ?? content?.duration_minutes,
        image_url: cls.image_url ?? content?.image_url,
      };
      if (cls.description !== undefined) {
        patch.description = undefined;
      }

      const changed = Object.entries(patch).some(
        ([key, value]) => (cls as Record<string, unknown>)[key] !== value
      );
      if (changed) {
        await ctx.db.patch(cls._id, patch);
        classesUpdated += 1;
      }
    }

    return { classes_updated: classesUpdated, classes_without_content: classesWithoutContent };
  },
});
