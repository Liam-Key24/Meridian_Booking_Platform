import { LoadingState } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-[var(--meridian-space-page)] py-12">
      <LoadingState label="Loading dashboard…" />
    </main>
  );
}
