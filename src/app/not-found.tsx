import type { Metadata } from "next";
import { AppStatusPage } from "@/components/ui/app-status-page";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <AppStatusPage
      code="404"
      title="Page not found"
      description="That link does not match anything on Meridian. Check the address, or sign in to continue."
      primaryHref="/login"
      primaryLabel="Go to sign in"
      secondaryHref="/dashboard"
      secondaryLabel="Open dashboard"
    />
  );
}
