const ZH_WEEKDAYS = "日一二三四五六";

export type OrderFieldsInput = {
  baseUrl: string;
  classId: string;
  holdId: string;
  classNameZh: string;
  sessionDate: string;
  sessionTime: string;
  sessionEndTime?: string;
  locationZh: string;
};

import type { OrderMessageFields, RainMessageFields } from "./manychat";
import { buildParticipantPassUrl } from "./appBaseUrl";

export type OrderFields = OrderMessageFields;

/** "10月24日（六） 14:00–15:00", from a Session's date and times. */
function sessionWhen(date: string, time: string, endTime?: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${ZH_WEEKDAYS[d.getUTCDay()]}） ${endTime ? `${time}–${endTime}` : time}`;
}

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * What the Customer's WhatsApp confirmation shows, one value per template variable.
 * WhatsApp template variables can't hold line breaks, so each is a single line; the
 * link opens the booking's page with every Participant's Attendance QR.
 */
export function buildOrderFields(input: OrderFieldsInput): OrderFields {
  return {
    booking_class: oneLine(input.classNameZh),
    booking_when: sessionWhen(input.sessionDate, input.sessionTime, input.sessionEndTime),
    booking_venue: oneLine(input.locationZh),
    booking_link: `${input.baseUrl}/apply/${encodeURIComponent(input.classId)}/done?hold=${encodeURIComponent(input.holdId)}`,
  };
}

/**
 * What a Participant's rain-cancellation WhatsApp shows: the cancelled Session, and their
 * Participant Link, where they can move to another Session (the Change Cutoff is lifted).
 */
export function buildRainFields(input: {
  baseUrl: string;
  participantId: string;
  classNameZh: string;
  sessionDate: string;
  sessionTime: string;
  sessionEndTime?: string;
  locationZh: string;
}): RainMessageFields {
  return {
    rain_class: oneLine(input.classNameZh),
    rain_when: sessionWhen(input.sessionDate, input.sessionTime, input.sessionEndTime),
    rain_venue: oneLine(input.locationZh),
    rain_link: buildParticipantPassUrl(input.baseUrl, input.participantId),
  };
}

/** An .ics calendar file for one Session (Hong Kong time has no daylight saving: UTC+8). */
export function buildSessionIcs(input: {
  uid: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  location: string;
  description?: string;
}): string {
  const toUtc = (date: string, time: string, addMinutes = 0) => {
    const ms = Date.parse(`${date}T${time}:00+08:00`) + addMinutes * 60_000;
    return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };
  const start = toUtc(input.date, input.startTime);
  const end = input.endTime
    ? toUtc(input.date, input.endTime)
    : toUtc(input.date, input.startTime, input.durationMinutes ?? 60);
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LocoBike//Class Booking//ZH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escape(input.title)}`,
    `LOCATION:${escape(input.location)}`,
    ...(input.description ? [`DESCRIPTION:${escape(input.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
