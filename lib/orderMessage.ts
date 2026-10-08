import { buildParticipantPassUrl } from "./appBaseUrl";

const ZH_WEEKDAYS = "日一二三四五六";

export type OrderSummaryInput = {
  baseUrl: string;
  classNameZh: string;
  sessionDate: string;
  sessionTime: string;
  sessionEndTime?: string;
  locationZh: string;
  googleMapsUrl?: string;
  participants: Array<{ participant_id: string; name: string }>;
};

/**
 * The text the Customer receives on WhatsApp after paying: the Session, where it is, and
 * each Participant's own link (which shows their Attendance QR).
 */
export function buildOrderSummary(input: OrderSummaryInput): string {
  const d = new Date(`${input.sessionDate}T00:00:00Z`);
  const date = `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${ZH_WEEKDAYS[d.getUTCDay()]}）`;
  const time = input.sessionEndTime ? `${input.sessionTime}–${input.sessionEndTime}` : input.sessionTime;

  const lines = [
    input.classNameZh,
    `${date} ${time}`,
    input.locationZh,
    ...(input.googleMapsUrl ? [input.googleMapsUrl] : []),
    "",
    "學員資料及出席 QR Code：",
    ...input.participants.map((p) => `${p.name}：${buildParticipantPassUrl(input.baseUrl, p.participant_id)}`),
  ];
  return lines.join("\n");
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
