import { describe, expect, it } from "vitest";
import { buildBookingIcs } from "@/lib/booking/ics";

describe("buildBookingIcs", () => {
  it("builds a METHOD:REQUEST invite with timezone and duration", () => {
    const ics = buildBookingIcs({
      uid: "booking-123@meridian.bookings",
      title: "Consultation — Business A",
      description: "Confirmed booking with Business A",
      startDate: "2026-09-01",
      startTime: "10:30:00",
      durationMinutes: 45,
      timezone: "Europe/London",
      organizerName: "Business A",
      organizerEmail: "owner@business-a.test",
      attendeeName: "Ada Lovelace",
      attendeeEmail: "ada@example.com",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("DTSTART;TZID=Europe/London:20260901T103000");
    expect(ics).toContain("DTEND;TZID=Europe/London:20260901T111500");
    expect(ics).toContain("SUMMARY:Consultation — Business A");
    expect(ics).toContain("ATTENDEE;CN=Ada Lovelace;RSVP=TRUE:mailto:ada@example.com");
    expect(ics).toContain("END:VCALENDAR");
  });
});
