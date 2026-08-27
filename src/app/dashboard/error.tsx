"use client";

import { useEffect } from "react";
import { AppStatusPage } from "@/components/ui/app-status-page";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] route error", error);
  }, [error]);

  return (
    <AppStatusPage
      code="Error"
      title="Dashboard problem"
      description="This part of the dashboard could not load. Try again, or go back to the overview."
      onPrimaryAction={() => retry()}
      primaryActionLabel="Try again"
      secondaryHref="/dashboard"
      secondaryLabel="Back to dashboard"
      digest={error.digest}
      className="py-10"
    />
  );
}
