type BuildIcsInput = {
  uid: string;
  title: string;
  description: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM or HH:MM:SS
  durationMinutes: number;
  timezone: string;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalStamp(date: string, time: string): string {
  const t = time.length === 5 ? `${time}:00` : time;
  const [y, m, d] = date.split("-");
  const [hh, mm, ss] = t.split(":");
  return `${y}${m}${d}T${hh}${mm}${ss ?? "00"}`;
}

function addMinutes(
  date: string,
  time: string,
  minutes: number,
): { date: string; time: string } {
  const t = time.length === 5 ? `${time}:00` : time;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss] = t.split(":").map(Number);
  const startMs = Date.UTC(y, m - 1, d, hh, mm, ss || 0);
  const end = new Date(startMs + minutes * 60_000);
  return {
    date: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    time: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}:${pad(end.getUTCSeconds())}`,
  };
}

function utcStamp(date = new Date()): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Build a METHOD:REQUEST .ics calendar invitation. */
export function buildBookingIcs(input: BuildIcsInput): string {
  const end = addMinutes(
    input.startDate,
    input.startTime,
    input.durationMinutes,
  );
  const dtStart = toLocalStamp(input.startDate, input.startTime);
  const dtEnd = toLocalStamp(end.date, end.time);
  const tzid = input.timezone || "Europe/London";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meridian//Booking Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${utcStamp()}`,
    `DTSTART;TZID=${tzid}:${dtStart}`,
    `DTEND;TZID=${tzid}:${dtEnd}`,
    `SUMMARY:${escapeText(input.title)}`,
    `DESCRIPTION:${escapeText(input.description)}`,
    input.location ? `LOCATION:${escapeText(input.location)}` : null,
    `ORGANIZER;CN=${escapeText(input.organizerName)}:mailto:${input.organizerEmail}`,
    `ATTENDEE;CN=${escapeText(input.attendeeName)};RSVP=TRUE:mailto:${input.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return `${lines.join("\r\n")}\r\n`;
}
