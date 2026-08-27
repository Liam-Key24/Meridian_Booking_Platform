import type { DashboardMode } from "@/lib/business/modes";

export type DashboardSearchSuggestion = {
  id: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
  /** When set, only show for this dashboard mode. */
  modes?: DashboardMode[];
  /** When set, only show if this nav href is present in filtered nav. */
  requiresHref?: string;
};

/**
 * Keyword destinations for the dashboard header search.
 * Helps operators find settings/pages without memorising the sidebar.
 */
export const DASHBOARD_SEARCH_SUGGESTIONS: DashboardSearchSuggestion[] = [
  {
    id: "settings",
    label: "Settings",
    description: "Business details, booking mode, and contact",
    href: "/dashboard/settings",
    keywords: [
      "settings",
      "setting",
      "config",
      "configuration",
      "preferences",
      "business",
      "contact",
      "phone",
      "email",
      "notification",
      "timezone",
      "mode",
      "external",
      "url",
    ],
  },
  {
    id: "settings-hours",
    label: "Opening hours",
    description: "Weekly hours and when guests can book",
    href: "/dashboard/settings",
    keywords: [
      "hours",
      "opening",
      "opening hours",
      "times",
      "schedule",
      "open",
      "closed",
      "kitchen",
      "bar",
      "holidays",
      "holiday",
    ],
    modes: ["hospitality"],
  },
  {
    id: "settings-tables",
    label: "Tables & party size",
    description: "Seating layout and max party size",
    href: "/dashboard/settings",
    keywords: [
      "tables",
      "table",
      "seats",
      "seating",
      "party",
      "party size",
      "covers",
      "capacity",
    ],
    modes: ["hospitality"],
  },
  {
    id: "availability",
    label: "Availability",
    description: "Business weekly availability overview",
    href: "/dashboard/availability",
    keywords: [
      "availability",
      "available",
      "hours",
      "opening",
      "schedule",
      "times",
    ],
    modes: ["appointments"],
    requiresHref: "/dashboard/availability",
  },
  {
    id: "staff",
    label: "Staff",
    description: "Team members, toggles, and availability",
    href: "/dashboard/staff",
    keywords: [
      "staff",
      "team",
      "employee",
      "employees",
      "stylist",
      "barber",
      "therapist",
      "practitioner",
      "who",
    ],
    modes: ["appointments"],
    requiresHref: "/dashboard/staff",
  },
  {
    id: "services",
    label: "Services",
    description: "Bookable services and durations",
    href: "/dashboard/services",
    keywords: [
      "services",
      "service",
      "treatment",
      "treatments",
      "menu",
      "duration",
      "offerings",
    ],
    modes: ["appointments"],
    requiresHref: "/dashboard/services",
  },
  {
    id: "customers",
    label: "Customers",
    description: "People who have booked with you",
    href: "/dashboard/customers",
    keywords: ["customers", "customer", "clients", "client", "guests", "guest"],
    modes: ["appointments"],
    requiresHref: "/dashboard/customers",
  },
  {
    id: "bookings",
    label: "Bookings",
    description: "Request queue and booking list",
    href: "/dashboard/bookings",
    keywords: [
      "bookings",
      "booking",
      "requests",
      "request",
      "appointments",
      "appointment",
      "queue",
      "pending",
    ],
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Day and week calendar view",
    href: "/dashboard/calendar",
    keywords: ["calendar", "diary", "week", "day", "schedule"],
    requiresHref: "/dashboard/calendar",
  },
  {
    id: "new-booking",
    label: "New booking",
    description: "Create a manual booking request",
    href: "/dashboard/bookings/new",
    keywords: [
      "new",
      "add",
      "create",
      "manual",
      "new booking",
      "add booking",
      "new appointment",
    ],
    requiresHref: "/dashboard/bookings/new",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview and analytics",
    href: "/dashboard",
    keywords: ["dashboard", "home", "overview", "analytics", "stats"],
  },
];

export type MatchSearchSuggestionsOptions = {
  query: string;
  mode: DashboardMode;
  /** Hrefs from capability-filtered nav (plus settings, always allowed). */
  allowedHrefs: ReadonlySet<string> | readonly string[];
  limit?: number;
};

function allowedSet(
  allowedHrefs: MatchSearchSuggestionsOptions["allowedHrefs"],
): Set<string> {
  return allowedHrefs instanceof Set
    ? allowedHrefs
    : new Set(allowedHrefs);
}

function isVisible(
  suggestion: DashboardSearchSuggestion,
  mode: DashboardMode,
  hrefs: Set<string>,
): boolean {
  if (suggestion.modes && !suggestion.modes.includes(mode)) return false;
  if (suggestion.requiresHref && !hrefs.has(suggestion.requiresHref)) {
    return false;
  }
  if (
    suggestion.href !== "/dashboard/settings" &&
    suggestion.href !== "/dashboard" &&
    suggestion.requiresHref === undefined &&
    !hrefs.has(suggestion.href)
  ) {
    // Bookings list is always useful even if not in nav edge cases
    if (suggestion.href === "/dashboard/bookings") return true;
    return hrefs.has(suggestion.href);
  }
  return true;
}

function scoreSuggestion(
  suggestion: DashboardSearchSuggestion,
  q: string,
): number {
  const label = suggestion.label.toLowerCase();
  const description = suggestion.description.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 90;
  if (label.includes(q)) return 80;
  for (const keyword of suggestion.keywords) {
    if (keyword === q) return 75;
    if (keyword.startsWith(q)) return 65;
    if (keyword.includes(q)) return 55;
  }
  if (description.includes(q)) return 40;
  return 0;
}

/** Match settings/page suggestions by keyword. Empty query → curated defaults. */
export function matchSearchSuggestions(
  options: MatchSearchSuggestionsOptions,
): DashboardSearchSuggestion[] {
  const q = options.query.trim().toLowerCase();
  const hrefs = allowedSet(options.allowedHrefs);
  // Settings is always reachable from the shell footer/account area
  hrefs.add("/dashboard/settings");
  hrefs.add("/dashboard");

  const visible = DASHBOARD_SEARCH_SUGGESTIONS.filter((item) =>
    isVisible(item, options.mode, hrefs),
  );

  const limit = options.limit ?? 6;

  if (q.length === 0) {
    const defaults = [
      "settings",
      "staff",
      "services",
      "availability",
      "bookings",
      "calendar",
    ];
    const ordered: DashboardSearchSuggestion[] = [];
    for (const id of defaults) {
      const hit = visible.find((item) => item.id === id);
      if (hit) ordered.push(hit);
    }
    for (const item of visible) {
      if (!ordered.some((existing) => existing.id === item.id)) {
        ordered.push(item);
      }
    }
    return ordered.slice(0, limit);
  }

  return visible
    .map((item) => ({ item, score: scoreSuggestion(item, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((row) => row.item);
}
