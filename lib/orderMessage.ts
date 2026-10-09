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

/** The ManyChat custom fields the booking confirmation template shows. */
export type OrderFields = {
  booking_class: string;
  booking_when: string;
  booking_venue: string;
  booking_link: string;
};

/**
 * What the Customer's WhatsApp confirmation shows, one value per template variable.
 * WhatsApp template variables can't hold line breaks, so each is a single line; the
 * link opens the booking's page with every Participant's Attendance QR.
 */
export function buildOrderFields(input: OrderFieldsInput): OrderFields {
  const d = new Date(`${input.sessionDate}T00:00:00Z`);
  const date = `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${ZH_WEEKDAYS[d.getUTCDay()]}）`;
  const time = input.sessionEndTime ? `${input.sessionTime}–${input.sessionEndTime}` : input.sessionTime;
  const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();
  return {
    booking_class: oneLine(input.classNameZh),
    booking_when: `${date} ${time}`,
    booking_venue: oneLine(input.locationZh),
    booking_link: `${input.baseUrl}/apply/${encodeURIComponent(input.classId)}/done?hold=${encodeURIComponent(input.holdId)}`,
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
