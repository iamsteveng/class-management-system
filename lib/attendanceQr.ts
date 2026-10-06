import { headers } from "next/headers";
import QRCode from "qrcode";

import { buildParticipantPassUrl, resolveAppBaseUrl } from "./appBaseUrl";

// The Attendance QR encodes the full Participant Link, so a phone camera opens the
// participant's page. The admin scanner extracts the participant ID from the URL path,
// and still accepts older QRs that encoded the bare ID.
export async function buildAttendanceQrDataUrl(participantId: string): Promise<string> {
  const participantLink = buildParticipantPassUrl(await resolveBaseUrl(), participantId);
  return QRCode.toDataURL(participantLink, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

async function resolveBaseUrl(): Promise<string> {
  if (process.env.APP_BASE_URL?.trim()) {
    return resolveAppBaseUrl(process.env.APP_BASE_URL);
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) {
    throw new Error("Unable to resolve the app base URL for the Attendance QR");
  }
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
