import { AdminBusinessesList } from "@/components/admin/admin-businesses-list";
import { requireMeridianAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBusinessesPage() {
  await requireMeridianAdmin();
  const supabase = await createClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, status, business_type, dashboard_mode, subscription_status, created_at",
    )
    .order("name");

  return (
    <AdminBusinessesList
      businesses={businesses ?? []}
      loadError={Boolean(error)}
    />
  );
}
