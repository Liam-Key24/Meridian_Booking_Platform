"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  filterBusinessSettingsNav,
  settingsHref,
} from "@/lib/admin/business-settings-nav";
import { cn } from "@/lib/cn";
import type { DashboardMode } from "@/types/database";

export function BusinessSettingsNav({
  businessId,
  mode,
}: {
  businessId: string;
  mode: DashboardMode;
}) {
  const pathname = usePathname();
  const groups = filterBusinessSettingsNav(mode);

  return (
    <nav className="space-y-5" aria-label="Business settings">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="px-2 text-[11px] font-semibold tracking-wide text-meridian-text-muted uppercase">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const href = settingsHref(businessId, item.slug);
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "block rounded-meridian-sm px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-meridian-accent/10 text-meridian-accent"
                        : "text-meridian-text hover:bg-meridian-surface-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
