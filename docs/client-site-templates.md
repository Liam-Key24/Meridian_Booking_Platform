# Client-site template rollout

Controlled Meridian client-site templates: registry in Postgres, React layouts in code, branding from future `client_site_settings` (when merged).

## Template catalog (6 layouts — not built yet)

| Slug | Mode | Sections | Purpose |
|------|------|----------|---------|
| `hospitality-classic` | hospitality | hero, menu, gallery, booking_widget, contact | Full restaurant/pub site |
| `hospitality-minimal` | hospitality | hero, booking_widget | Booking-first landing |
| `hospitality-editorial` | hospitality | hero, menu, contact, gallery, booking_widget | Menu/story-led layout |
| `appointments-classic` | appointments | hero, services, booking_widget, contact | Salon/barber standard |
| `appointments-minimal` | appointments | hero, booking_widget | Fast book flow |
| `appointments-studio` | appointments | hero, services, staff, booking_widget | Staff-forward studio |

Legacy seeds `meridian-classic` / `meridian-minimal` are retired in favour of mode-specific slugs.

## Scaffold branch commits (this branch)

Each step is one commit, pushed to `feature/client-site-template-scaffold`.

1. **Plan** — this document.
2. **Catalog constants** — `src/lib/templates/sections.ts`, `catalog.ts` (section keys + six slug definitions).
3. **DB migration** — `dashboard_mode` on `site_templates`, retire legacy rows, seed six `draft` templates.
4. **Payload loader** — `getClientSitePagePayload()` merges template gate + public booking data + default branding.
5. **Section stubs + renderer** — `src/components/client-site/sections/*`, `renderClientSiteSections`.
6. **Layout registry (pending shell)** — slug → shared `TemplatePendingShell` (not final layouts).
7. **Preview wiring** — `/preview/[businessSlug]` renders registry output.
8. **Tests + admin mode filter** — catalog/registry coverage; assign only templates matching business `dashboard_mode`.

**Stop here.** No styled layout implementations on this branch.

## Layout commits (next — one template per commit, push each)

After scaffold merges to `main`, build real layouts on a follow-up branch (`feature/client-site-layouts`):

| Commit | Template | File |
|--------|----------|------|
| L1 | `hospitality-classic` | `src/components/client-site/layouts/hospitality-classic.tsx` |
| L2 | `hospitality-minimal` | `…/hospitality-minimal.tsx` |
| L3 | `hospitality-editorial` | `…/hospitality-editorial.tsx` |
| L4 | `appointments-classic` | `…/appointments-classic.tsx` |
| L5 | `appointments-minimal` | `…/appointments-minimal.tsx` |
| L6 | `appointments-studio` | `…/appointments-studio.tsx` |

Each layout commit should:

1. Replace the pending shell entry in `src/lib/templates/layouts.ts`.
2. Set the matching `site_templates` row to `active` (new migration or admin SQL).
3. Add a snapshot or render test for allowed sections.
4. Push before starting the next layout.

## Wiring model

```text
site_templates.slug          →  TEMPLATE_LAYOUTS[slug]  (React layout)
site_templates.allowed_sections  →  SECTION_COMPONENTS[key]  (ordered sections)
client_site_settings (future)  →  ClientSitePayload.branding
getPublicBookingPage           →  ClientSitePayload.booking
```

Preview/publish gate: assigned template + `status = active` (`publish-rules.ts`).

## Admin assignment

- List templates where `status = active` **and** `dashboard_mode` matches the business mode.
- Assignment action rejects mode mismatches server-side.

## Activation checklist (per template)

- [ ] Layout component implemented and registered
- [ ] `site_templates.status` set to `active`
- [ ] Preview verified at `/preview/[businessSlug]`
- [ ] Public route decision documented (`/book` vs `/site`) before go-live
