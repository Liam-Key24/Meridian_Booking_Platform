"use client";

import { AsteriskSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import {
  CLIENT_SURFACE_ERROR,
  type SurfaceTheme,
} from "@/lib/templates/client-surface-theme";

export function RequiredMark({
  surface = "meridian",
}: {
  surface?: SurfaceTheme;
}) {
  return (
    <AsteriskSimple
      size={12}
      weight="bold"
      aria-hidden
      className={cn(
        "mb-px ml-0.5 inline-block align-middle",
        surface === "client"
          ? CLIENT_SURFACE_ERROR
          : "text-meridian-status-declined",
      )}
    />
  );
}
