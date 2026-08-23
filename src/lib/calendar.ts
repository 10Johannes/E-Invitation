type BuildCalendarLinksInput = {
  title: string;
  detail?: string;
  time: string;
  place: string;
  dateISO: string;
  addressFallback?: string;
  durationHours?: number;
};

export type CalendarLinks = { googleUrl: string; icsUrl: string };

export function isEventStarted(dateISO: string): boolean {
  const timestamp = new Date(dateISO).getTime();
  return Number.isNaN(timestamp) || Date.now() >= timestamp;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

function parseEventStart(dateISO: string, timeText: string): Date | null {
  const base = new Date(dateISO);
  if (Number.isNaN(base.getTime())) return null;
  const start = new Date(base);
  const match = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match) {
    let hours = Number(match[1]) % 12;
    if (match[3].toLowerCase() === "pm") hours += 12;
    start.setHours(hours, match[2] ? Number(match[2]) : 0, 0, 0);
  }
  return start;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildCalendarLinks(
  input: BuildCalendarLinksInput
): CalendarLinks | null {
  const start = parseEventStart(input.dateISO, input.time);
  if (!start) return null;

  const durationMs = (input.durationHours ?? 3) * 60 * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const descriptionParts = [
    input.detail,
    input.time === input.title || input.time.includes(input.detail ?? "") ? "" : input.time,
  ].filter(Boolean);

  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
  });
  if (descriptionParts.length > 0) {
    googleParams.set("details", descriptionParts.join(" · "));
  }
  const location = input.place || input.addressFallback;
  if (location) {
    googleParams.set("location", location);
  }

  const uid = `${slug(input.title) || "event"}-${start.getTime()}@wedding-invite`;
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//wedding-invitation//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(input.title)}`,
  ];
  if (descriptionParts.length > 0) {
    icsLines.push(`DESCRIPTION:${escapeIcs(descriptionParts.join(" · "))}`);
  }
  if (location) {
    icsLines.push(`LOCATION:${escapeIcs(location)}`);
  }
  icsLines.push("END:VEVENT", "END:VCALENDAR");

  const icsRaw = icsLines.join("\r\n");

  return {
    googleUrl: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    icsUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsRaw)}`,
  };
}
