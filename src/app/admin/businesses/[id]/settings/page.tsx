import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessSettingsIndexPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/businesses/${id}/settings/details`);
}
