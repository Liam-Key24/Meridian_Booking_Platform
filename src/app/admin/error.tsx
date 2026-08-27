"use client";

import { useEffect } from "react";
import { AppStatusPage } from "@/components/ui/app-status-page";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route error", error);
  }, [error]);

  return (
    <AppStatusPage
      code="Error"
      title="Admin problem"
      description="This admin view could not load. Try again, or return to the admin home."
      onPrimaryAction={() => retry()}
      primaryActionLabel="Try again"
      secondaryHref="/admin"
      secondaryLabel="Back to admin"
      digest={error.digest}
      className="py-10"
    />
  );
}
