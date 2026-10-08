import type { Metadata } from "next";
import { makeFunctionReference } from "convex/server";
import { Suspense } from "react";

import { LanguageProvider } from './contexts/LanguageContext';
import { ResponsiveLanding } from './components/homepage/ResponsiveLanding';
import { CyclingLanding, type LandingData } from "./components/landing/CyclingLanding";
import { createConvexHttpClient } from "@/lib/convexHttp";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadLandingData();
  if (!data?.live) return {};
  return {
    title: { absolute: "樂區單車亭單車班 by LocoBike" },
    description: "幼兒班 5–12 歲・常規班 13–60 歲。每堂 1 小時，二人同行更抵。單車及頭盔由樂區單車亭提供。",
  };
}

async function loadLandingData(): Promise<LandingData | null> {
  try {
    return (await createConvexHttpClient().query(
      makeFunctionReference<"query">("landing:getLandingData"),
      {}
    )) as LandingData;
  } catch (err) {
    console.error("[home] landing data failed, showing the old homepage:", err);
    return null;
  }
}

export default async function Home() {
  const data = await loadLandingData();

  // The launch switch: the cycling landing page replaces the old homepage once
  // REVAMP_HOMEPAGE is "on" in Convex and the catalogue is loaded.
  if (data?.live && data.classes.length > 0) {
    return (
      <Suspense>
        <CyclingLanding data={data} />
      </Suspense>
    );
  }

  return (
    <LanguageProvider>
      <ResponsiveLanding />
    </LanguageProvider>
  );
}
