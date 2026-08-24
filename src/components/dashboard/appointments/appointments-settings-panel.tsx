import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";

/**
 * Appointments settings surface — no hospitality table/kitchen/bar/allergy UI.
 */
export function AppointmentsSettingsPanel({
  businessName,
  notificationEmail,
  contactPhone,
  timezone,
  bookingMode,
  externalBookingUrl,
}: {
  businessName: string;
  notificationEmail: string | null;
  contactPhone: string | null;
  timezone: string | null;
  bookingMode: string | null;
  externalBookingUrl: string | null;
}) {
  return (
    <div className="space-y-6">
      <Card title="Business contact">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-meridian-text-muted">Business name</dt>
            <dd className="font-medium text-meridian-text">{businessName}</dd>
          </div>
          <div>
            <dt className="text-meridian-text-muted">Notification email</dt>
            <dd className="font-medium break-all text-meridian-text">
              {notificationEmail?.trim() || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-meridian-text-muted">Phone</dt>
            <dd className="font-medium text-meridian-text">
              {contactPhone?.trim() || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-meridian-text-muted">Timezone</dt>
            <dd className="font-medium text-meridian-text">
              {timezone?.trim() || "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Appointment booking mode">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-meridian-text-muted">Mode</dt>
            <dd className="font-medium text-meridian-text capitalize">
              {bookingMode ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-meridian-text-muted">External booking link</dt>
            <dd className="font-medium break-all text-meridian-text">
              {externalBookingUrl ? (
                <a
                  href={externalBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-meridian-accent hover:underline"
                >
                  {externalBookingUrl}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-meridian-text-muted">
          Ask a Meridian admin to update contact details or booking mode. Full
          appointment settings editing lands in a later phase.
        </p>
        <Link
          href="/dashboard/availability"
          className="mt-3 inline-block text-sm font-semibold text-meridian-accent hover:underline"
        >
          View availability
        </Link>
      </Card>

      <Card title="Not shown in appointments mode">
        <EmptyState
          title="Hospitality settings hidden"
          description="Tables, party size, kitchen hours, bar hours, and allergy settings stay available only in hospitality mode."
        />
      </Card>
    </div>
  );
}
