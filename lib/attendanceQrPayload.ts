/**
 * The participant ID inside a scanned Attendance QR. Current QRs encode the full
 * Participant Link (https://…/participant/<id>), on whichever domain issued them; QRs
 * issued before that encoded the bare ID. Both must keep scanning.
 */
export function extractParticipantId(payload: string): string | null {
  const raw = payload.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const participantSegmentIndex = segments.findIndex((segment) => segment === "participant");
    if (participantSegmentIndex >= 0 && segments[participantSegmentIndex + 1]) {
      return decodeURIComponent(segments[participantSegmentIndex + 1]);
    }
  } catch {
    // payload is not a URL, continue
  }

  return raw;
}
