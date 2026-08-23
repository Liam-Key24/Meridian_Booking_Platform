import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Full booking page removed — open the floating panel from the list instead. */
export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/bookings?open=${encodeURIComponent(id)}&period=custom`);
}
