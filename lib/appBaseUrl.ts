export function resolveAppBaseUrl(baseUrlFromEnv: string | undefined): string {
  const raw = baseUrlFromEnv?.trim();
  if (!raw) {
    throw new Error("APP_BASE_URL is not configured");
  }

  const candidate = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  const parsed = new URL(candidate);

  if (!parsed.hostname) {
    throw new Error(`APP_BASE_URL is invalid: ${raw}`);
  }

  // Keep links canonical and absolute regardless of APP_BASE_URL input shape.
  return `https://${parsed.host}`;
}

export function buildTermsUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/terms?token=${encodeURIComponent(token)}`;
}
