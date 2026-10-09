import { addDays } from "./timetable";

/**
 * The Change Cutoff: 00:00 Hong Kong time on the day two days before the Session
 * (Thursday 00:00 for a Saturday Session), as a timestamp.
 */
export function changeCutoffAt(sessionDate: string): number {
  return Date.parse(`${addDays(sessionDate, -2)}T00:00:00+08:00`);
}

/** When a Session starts, as a timestamp; Session dates and times are Hong Kong time. */
export function sessionStartsAt(session: { date: string; time: string }): number {
  return Date.parse(`${session.date}T${session.time}:00+08:00`);
}

/** Whether a Participant may still move themselves out of this Session. */
export function canSelfChange(
  session: { date: string; cancellation_reason?: "rain" },
  now: number
): boolean {
  return session.cancellation_reason === "rain" || now < changeCutoffAt(session.date);
}

/** A Super Admin moving someone past the cutoff must say why, in at least this many characters. */
export const OVERRIDE_REASON_MIN = 5;
