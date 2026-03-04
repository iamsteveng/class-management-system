import { ConvexHttpClient } from "convex/browser";

export function createConvexHttpClient() {
  const deploymentUrl = resolveConvexDeploymentUrl();
  return new ConvexHttpClient(deploymentUrl, { logger: false });
}

function resolveConvexDeploymentUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL ??
    process.env.NEXT_CONVEX_URL;

  if (!fromEnv) {
    throw new Error(
      "Missing Convex URL. Set NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) to your deployment URL."
    );
  }

  return fromEnv.trim().replace(/\/+$/, "");
}
