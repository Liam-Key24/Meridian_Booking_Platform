"use client";

import { useEffect } from "react";
import { AppStatusPage } from "@/components/ui/app-status-page";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error", error);
  }, [error]);

  return (
    <AppStatusPage
      code="Error"
      title="Something went wrong"
      description="We could not load this page. Try again. If it keeps happening, contact Meridian support."
      onPrimaryAction={() => retry()}
      primaryActionLabel="Try again"
      secondaryHref="/login"
      secondaryLabel="Go to sign in"
      digest={error.digest}
    />
  );
}
