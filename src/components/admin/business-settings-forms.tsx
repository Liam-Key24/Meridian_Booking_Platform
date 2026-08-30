"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  updateAdminHospitalityHours,
  updateAdminHospitalityTables,
  updateBusinessDetails,
  type AdminActionState,
} from "@/lib/admin/actions";
import {
  updateBusinessBranding,
  updateBusinessContent,
  updateBusinessMenuPdfs,
  type SiteSettingsActionState,
} from "@/lib/admin/site-settings-actions";
import { ColorCirclePicker } from "@/components/admin/color-circle-picker";
import { ImageDropField } from "@/components/admin/image-drop-field";
import {
  assetFileName,
  publicAssetUrl,
  type BusinessMenuPdfs,
  type MenuPdfDocument,
} from "@/lib/admin/site-settings";
import {
  GALLERY_SLOT_LABELS,
  TEMPLATE_SECTION_LABELS,
} from "@/lib/templates/catalog";
import type { SiteSectionCopy } from "@/lib/templates/section-copy";
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  type CustomTable,
  type HolidayEntry,
  type KitchenCloseTimes,
  type WeeklyHours,
  type Weekday,
} from "@/lib/dashboard/hospitality-settings";

const adminInitial: AdminActionState = { status: "idle", message: null };
const siteInitial: SiteSettingsActionState = { status: "idle", message: null };

function Feedback({
  state,
}: {
  state: AdminActionState | SiteSettingsActionState;
}) {
  if (state.status === "idle") return null;
  return (
    <p
      className={
        state.status === "error"
          ? "text-sm text-meridian-status-declined"
          : "text-sm text-meridian-accent"
      }
      role="status"
    >
      {state.message}
    </p>
  );
}

function OnOffToggle({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-meridian border border-meridian-border bg-meridian-surface px-4 py-3 select-none">
      {label ? (
        <span className="text-sm font-medium text-meridian-text">{label}</span>
      ) : null}
      <span className="inline-flex items-center gap-2.5">
        <span
          className={
            checked
              ? "text-sm font-medium text-meridian-text"
              : "text-sm text-meridian-text-muted"
          }
        >
          {checked ? "On" : "Off"}
        </span>
        <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
          <input
            type="checkbox"
            name={name}
            value="on"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="pointer-events-none h-7 w-full rounded-full border border-meridian-border bg-meridian-surface-subtle transition-colors peer-checked:border-meridian-accent peer-checked:bg-meridian-accent peer-focus-visible:shadow-[var(--meridian-focus-ring)]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-0.5 left-0.5 size-6 rounded-full bg-meridian-surface shadow-sm transition-transform peer-checked:translate-x-5"
          />
        </span>
      </span>
    </label>
  );
}

function WeeklyHoursFields({
  prefix,
  hours,
}: {
  prefix: string;
  hours: WeeklyHours;
}) {
  return (
    <div className="space-y-2">
      {WEEKDAYS.map((day: Weekday) => {
        const value = hours[day] ?? {
          open: "09:00",
          close: "22:00",
          closed: false,
        };
        return (
          <div
            key={`${prefix}-${day}`}
            className="grid grid-cols-1 gap-2 sm:grid-cols-[7rem_1fr_1fr_4.5rem] sm:items-end"
          >
            <span className="text-sm font-medium text-meridian-text sm:pb-2.5">
              {WEEKDAY_LABELS[day]}
            </span>
            <Input
              label="Opens"
              name={`${prefix}.${day}.open`}
              type="time"
              defaultValue={value.open}
              disabled={value.closed}
            />
            <Input
              label="Closes"
              name={`${prefix}.${day}.close`}
              type="time"
              defaultValue={value.close}
              disabled={value.closed}
            />
            <label className="flex items-center gap-2 pb-2.5 text-sm">
              <input
                type="checkbox"
                name={`${prefix}.${day}.closed`}
                defaultChecked={value.closed}
                className="size-4 rounded border-meridian-border"
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
}

function KitchenCloseFields({ times }: { times: KitchenCloseTimes }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {WEEKDAYS.map((day) => (
        <Input
          key={day}
          label={WEEKDAY_LABELS[day]}
          name={`kitchenClose.${day}`}
          type="time"
          defaultValue={times[day] ?? ""}
        />
      ))}
    </div>
  );
}

export function AdminBusinessDetailsForm({
  businessId,
  name,
  notificationEmail,
  contactPhone,
  timezone,
}: {
  businessId: string;
  name: string;
  notificationEmail: string;
  contactPhone: string;
  timezone: string;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessDetails,
    adminInitial,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <Input label="Business name" name="name" defaultValue={name} required />
      <Input
        label="Notification email"
        name="notificationEmail"
        type="email"
        defaultValue={notificationEmail}
        required
      />
      <Input
        label="Contact phone"
        name="contactPhone"
        type="tel"
        defaultValue={contactPhone}
        placeholder="+44 …"
      />
      <Input
        label="Timezone"
        name="timezone"
        defaultValue={timezone}
        hint="IANA timezone, e.g. Europe/London"
        required
      />
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}

export function AdminHospitalityHoursForm({
  businessId,
  openingHours,
  kitchenCloseEnabled: initialKitchenCloseEnabled,
  kitchenCloseTimes,
  barHoursEnabled: initialBarHoursEnabled,
  barOpeningHours,
  holidays: initialHolidays,
}: {
  businessId: string;
  openingHours: WeeklyHours;
  kitchenCloseEnabled: boolean;
  kitchenCloseTimes: KitchenCloseTimes;
  barHoursEnabled: boolean;
  barOpeningHours: WeeklyHours;
  holidays: HolidayEntry[];
}) {
  const [state, action, pending] = useActionState(
    updateAdminHospitalityHours,
    adminInitial,
  );
  const [kitchenCloseEnabled, setKitchenCloseEnabled] = useState(
    initialKitchenCloseEnabled,
  );
  const [barHoursEnabled, setBarHoursEnabled] = useState(initialBarHoursEnabled);
  const [holidays, setHolidays] = useState<HolidayEntry[]>(
    initialHolidays.length > 0 ? initialHolidays : [{ date: "", label: "" }],
  );

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-meridian-text">
          Opening times
        </h3>
        <WeeklyHoursFields prefix="opening" hours={openingHours} />
      </div>
      <div className="space-y-3">
        <OnOffToggle
          name="kitchenCloseEnabled"
          label="Kitchen close times"
          checked={kitchenCloseEnabled}
          onChange={setKitchenCloseEnabled}
        />
        {kitchenCloseEnabled ? (
          <KitchenCloseFields times={kitchenCloseTimes} />
        ) : null}
      </div>
      <div className="space-y-3">
        <OnOffToggle
          name="barHoursEnabled"
          label="Bar opening times"
          checked={barHoursEnabled}
          onChange={setBarHoursEnabled}
        />
        {barHoursEnabled ? (
          <WeeklyHoursFields prefix="bar" hours={barOpeningHours} />
        ) : null}
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-meridian-text">
          Holidays & closed days
        </h3>
        {holidays.map((holiday, index) => (
          <div
            key={`holiday-${index}`}
            className="grid grid-cols-[1fr_1fr_auto] gap-2"
          >
            <Input
              label={index === 0 ? "Date" : undefined}
              name="holidayDate"
              type="date"
              defaultValue={holiday.date}
            />
            <Input
              label={index === 0 ? "Label" : undefined}
              name="holidayLabel"
              defaultValue={holiday.label}
              placeholder="Closed"
            />
            <Button
              type="button"
              variant="secondary"
              className="mt-auto h-11"
              onClick={() =>
                setHolidays((rows) =>
                  rows.length <= 1
                    ? [{ date: "", label: "" }]
                    : rows.filter((_, i) => i !== index),
                )
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setHolidays((rows) => [...rows, { date: "", label: "" }])
          }
        >
          Add holiday
        </Button>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save hours"}
      </Button>
    </form>
  );
}

export function AdminHospitalityTablesForm({
  businessId,
  tables2Seat,
  tables4Seat,
  tables6Seat,
  customTables: initialCustomTables,
  maxBookingsPerDay,
  maxPartySize,
  bookingSlotMinutes,
}: {
  businessId: string;
  tables2Seat: number;
  tables4Seat: number;
  tables6Seat: number;
  customTables: CustomTable[];
  maxBookingsPerDay: number | null;
  maxPartySize: number | null;
  bookingSlotMinutes: number;
}) {
  const [state, action, pending] = useActionState(
    updateAdminHospitalityTables,
    adminInitial,
  );
  const [customTables, setCustomTables] = useState<CustomTable[]>(
    initialCustomTables.length > 0
      ? initialCustomTables
      : [{ label: "", seats: 8 }],
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="2-seat tables"
          name="tables2Seat"
          type="number"
          min={0}
          defaultValue={tables2Seat}
        />
        <Input
          label="4-seat tables"
          name="tables4Seat"
          type="number"
          min={0}
          defaultValue={tables4Seat}
        />
        <Input
          label="6-seat tables"
          name="tables6Seat"
          type="number"
          min={0}
          defaultValue={tables6Seat}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-meridian-text">Custom tables</p>
        {customTables.map((table, index) => (
          <div
            key={`custom-${index}`}
            className="grid grid-cols-[1fr_7rem_auto] gap-2"
          >
            <Input
              name="customTableLabel"
              defaultValue={table.label}
              placeholder="Booth A"
            />
            <Input
              name="customTableSeats"
              type="number"
              min={1}
              max={100}
              defaultValue={table.seats || ""}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-11"
              onClick={() =>
                setCustomTables((rows) =>
                  rows.length <= 1
                    ? [{ label: "", seats: 0 }]
                    : rows.filter((_, i) => i !== index),
                )
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setCustomTables((rows) => [...rows, { label: "", seats: 0 }])
          }
        >
          Add custom table
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Max bookings per day"
          name="maxBookingsPerDay"
          type="number"
          min={1}
          defaultValue={maxBookingsPerDay ?? ""}
          hint="Leave blank for no cap"
        />
        <Input
          label="Max party size"
          name="maxPartySize"
          type="number"
          min={1}
          defaultValue={maxPartySize ?? ""}
        />
        <Select
          label="Booking slot interval"
          name="bookingSlotMinutes"
          defaultValue={String(bookingSlotMinutes)}
          options={[
            { value: "15", label: "15 minutes" },
            { value: "30", label: "30 minutes" },
            { value: "60", label: "60 minutes" },
          ]}
        />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save tables"}
      </Button>
    </form>
  );
}

export function AdminBrandingForm({
  businessId,
  primaryColor,
  accentColor,
  backgroundColor,
  textColor,
  headingFontPath,
  bodyFontPath,
  previewHref,
}: {
  businessId: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFontPath: string | null;
  bodyFontPath: string | null;
  previewHref?: string;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessBranding,
    siteInitial,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="flex flex-wrap items-start justify-center gap-10">
        <ColorCirclePicker
          label="Primary"
          name="primaryColor"
          defaultValue={primaryColor}
          size="xl"
        />
        <ColorCirclePicker
          label="Accent"
          name="accentColor"
          defaultValue={accentColor}
          size="xl"
        />
        <ColorCirclePicker
          label="Background"
          name="backgroundColor"
          defaultValue={backgroundColor}
          size="xl"
        />
        <ColorCirclePicker
          label="Text"
          name="textColor"
          defaultValue={textColor}
          size="xl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FontUploadField
          label="Heading font"
          name="headingFont"
          clearName="clearHeadingFont"
          currentPath={headingFontPath}
        />
        <FontUploadField
          label="Body font"
          name="bodyFont"
          clearName="clearBodyFont"
          currentPath={bodyFontPath}
        />
      </div>
      <Feedback state={state} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save branding"}
        </Button>
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-meridian border border-meridian-border bg-meridian-surface px-5 text-sm font-semibold text-meridian-text hover:border-meridian-border-strong hover:bg-meridian-surface-subtle"
          >
            Show preview
          </a>
        ) : null}
      </div>
    </form>
  );
}

function FontUploadField({
  label,
  name,
  clearName,
  currentPath,
}: {
  label: string;
  name: string;
  clearName: string;
  currentPath: string | null;
}) {
  const fileName = assetFileName(currentPath);
  return (
    <div className="space-y-2">
      {fileName ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-meridian-text-muted">
          <span>{fileName}</span>
          <label className="flex items-center gap-2 text-sm text-meridian-text">
            <input type="checkbox" name={clearName} className="size-4" />
            Remove
          </label>
        </div>
      ) : null}
      <Input
        label={label}
        name={name}
        type="file"
        accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
      />
    </div>
  );
}

function ContentSection({
  section,
  title,
  description,
  children,
}: {
  section: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-meridian border border-meridian-border p-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-meridian-teal">
          {section}
        </p>
        <h3 className="text-base font-semibold text-meridian-text">{title}</h3>
        <p className="text-sm text-meridian-text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function CurrentAsset({
  src,
  alt,
  wide,
  children,
}: {
  src: string;
  alt: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Image
        src={src}
        alt={alt}
        width={wide ? 320 : 80}
        height={wide ? 120 : 80}
        className={
          wide
            ? "max-h-32 rounded-meridian-sm border border-meridian-border object-cover"
            : "size-20 rounded-meridian-sm border border-meridian-border object-contain"
        }
        unoptimized
      />
      {children}
    </div>
  );
}

export function AdminContentForm({
  businessId,
  logoPath,
  faviconPath,
  heroImagePath,
  galleryPaths,
  copy,
  showHero = true,
  showGallery = true,
  showContact = true,
  assignedTemplateName,
  previewHref,
}: {
  businessId: string;
  logoPath: string | null;
  faviconPath: string | null;
  heroImagePath: string | null;
  galleryPaths: string[];
  copy: SiteSectionCopy;
  showHero?: boolean;
  showGallery?: boolean;
  showContact?: boolean;
  assignedTemplateName?: string | null;
  previewHref?: string;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessContent,
    siteInitial,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  const logoUrl = publicAssetUrl(logoPath);
  const faviconUrl = publicAssetUrl(faviconPath);
  const heroUrl = publicAssetUrl(heroImagePath);
  const galleryUrls = galleryPaths
    .map((path, index) => ({
      path,
      url: publicAssetUrl(path),
      label: GALLERY_SLOT_LABELS[index] ?? `Photo ${index + 1}`,
      note: index === 0 ? "Also used in About" : null,
    }))
    .filter((row): row is typeof row & { url: string } => Boolean(row.url));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="businessId" value={businessId} />
      {assignedTemplateName || previewHref ? (
        <p className="text-sm text-meridian-text-muted">
          {assignedTemplateName ? `${assignedTemplateName}. ` : null}
          {previewHref ? (
            <a
              href={previewHref}
              className="font-medium text-meridian-teal hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Open preview
            </a>
          ) : null}
        </p>
      ) : null}

      <ContentSection
        section="Header"
        title="Logo"
        description="Appears in the site header next to the business name."
      >
        {logoUrl ? (
          <CurrentAsset src={logoUrl} alt="Current logo">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="clearLogo" className="size-4" />
              Remove logo
            </label>
          </CurrentAsset>
        ) : null}
        <ImageDropField name="logo" />
      </ContentSection>

      <ContentSection
        section="Browser tab"
        title="Favicon"
        description="Small icon in the browser tab and bookmarks."
      >
        {faviconUrl ? (
          <CurrentAsset src={faviconUrl} alt="Current favicon">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="clearFavicon" className="size-4" />
              Remove favicon
            </label>
          </CurrentAsset>
        ) : null}
        <ImageDropField
          name="favicon"
          accept=".ico,image/x-icon,image/png,image/svg+xml,image/webp,image/jpeg"
          formatsHint="Supports: ICO, PNG, SVG, JPEG, WEBP"
        />
      </ContentSection>

      {showHero ? (
        <ContentSection
          section={TEMPLATE_SECTION_LABELS.hero}
          title="Hero"
          description="Headline, introduction, buttons, and photo at the top of the homepage."
        >
          <Input
            label="Heading"
            name="heroHeading"
            defaultValue={copy.hero_heading}
          />
          <Textarea
            label="Introduction"
            name="heroBody"
            defaultValue={copy.hero_body}
            rows={4}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Primary button"
              name="heroPrimaryCta"
              defaultValue={copy.hero_primary_cta}
            />
            <Input
              label="Secondary button"
              name="heroSecondaryCta"
              defaultValue={copy.hero_secondary_cta}
            />
          </div>
          {heroUrl ? (
            <CurrentAsset src={heroUrl} alt="Current hero" wide>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="clearHero" className="size-4" />
                Remove hero
              </label>
            </CurrentAsset>
          ) : null}
          <ImageDropField name="heroImage" />
        </ContentSection>
      ) : null}

      {showHero ? (
        <ContentSection
          section="About"
          title="About"
          description="Story section below the hero. The first gallery photo sits beside this text."
        >
          <Textarea
            label="Heading"
            name="aboutHeading"
            defaultValue={copy.about_heading}
            rows={2}
            hint="Use a new line to split the heading."
          />
          <Textarea
            label="Story"
            name="aboutBody"
            defaultValue={copy.about_body}
            rows={6}
            hint="Leave a blank line between paragraphs."
          />
        </ContentSection>
      ) : null}

      {showGallery ? (
        <ContentSection
          section={TEMPLATE_SECTION_LABELS.gallery}
          title="Gallery"
          description="Heading and photos for the Gallery section. The first photo is also used in About."
        >
          <Input
            label="Heading"
            name="galleryHeading"
            defaultValue={copy.gallery_heading}
          />
          <Textarea
            label="Introduction"
            name="galleryBody"
            defaultValue={copy.gallery_body}
            rows={3}
          />
          {galleryUrls.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {galleryUrls.map(({ path, url, label, note }) => (
                <li key={path} className="space-y-2">
                  <p className="text-sm font-medium text-meridian-text">
                    {label}
                  </p>
                  {note ? (
                    <p className="text-xs text-meridian-text-muted">{note}</p>
                  ) : null}
                  <Image
                    src={url}
                    alt={label}
                    width={160}
                    height={120}
                    className="h-28 w-full rounded-meridian-sm border border-meridian-border object-cover"
                    unoptimized
                  />
                  <label className="flex items-center gap-2 text-xs text-meridian-text-muted">
                    <input
                      type="checkbox"
                      name="removeGalleryPath"
                      value={path}
                      className="size-3.5"
                    />
                    Remove on save
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
          {galleryUrls.length < GALLERY_SLOT_LABELS.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-meridian-text">
                Next: {GALLERY_SLOT_LABELS[galleryUrls.length]}
              </p>
              <ImageDropField name="galleryImage" />
            </div>
          ) : (
            <p className="text-sm text-meridian-text-muted">
              All {GALLERY_SLOT_LABELS.length} gallery slots are filled.
            </p>
          )}
        </ContentSection>
      ) : null}

      {showHero ? (
        <ContentSection
          section="Testimonials"
          title="Guest experiences"
          description="Quotes shown below the gallery on the homepage."
        >
          <Input
            label="Heading"
            name="testimonialsHeading"
            defaultValue={copy.testimonials_heading}
          />
          {copy.testimonials.map((item, index) => (
            <div key={index} className="space-y-3">
              <Textarea
                label={`Quote ${index + 1}`}
                name={`testimonial${index + 1}Quote`}
                defaultValue={item.quote}
                rows={3}
              />
              <Input
                label="Guest name"
                name={`testimonial${index + 1}Name`}
                defaultValue={item.name}
              />
            </div>
          ))}
        </ContentSection>
      ) : null}

      {showContact ? (
        <ContentSection
          section={TEMPLATE_SECTION_LABELS.contact}
          title="Contact"
          description="Short lines in the site footer. Email and phone come from Booking settings."
        >
          <Textarea
            label="Tagline"
            name="contactTagline"
            defaultValue={copy.contact_tagline}
            rows={3}
          />
          <Textarea
            label="Visit note"
            name="contactVisit"
            defaultValue={copy.contact_visit}
            rows={3}
          />
        </ContentSection>
      ) : null}

      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save content"}
      </Button>
    </form>
  );
}

const EMPTY_MENU_PDF_ROW: MenuPdfDocument = {
  id: "draft",
  title: "",
  path: "",
  visible: true,
};

function newMenuPdfRow(): MenuPdfDocument {
  return {
    id: crypto.randomUUID(),
    title: "",
    path: "",
    visible: true,
  };
}

export function AdminMenuPdfsForm({
  businessId,
  menuPdfs,
}: {
  businessId: string;
  menuPdfs: BusinessMenuPdfs;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessMenuPdfs,
    siteInitial,
  );
  const [documents, setDocuments] = useState<MenuPdfDocument[]>(
    menuPdfs.documents.length > 0
      ? menuPdfs.documents
      : [{ ...EMPTY_MENU_PDF_ROW }],
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="businessId" value={businessId} />
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="space-y-4 rounded-meridian border border-meridian-border p-4"
        >
          <input type="hidden" name="pdfIds" value={doc.id} />
          {doc.path ? (
            <input type="hidden" name={`path-${doc.id}`} value={doc.path} />
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Input
              label="Menu title"
              name={`title-${doc.id}`}
              defaultValue={doc.title}
              placeholder="Lunch menu"
              onChange={(event) =>
                setDocuments((rows) =>
                  rows.map((row) =>
                    row.id === doc.id
                      ? { ...row, title: event.target.value }
                      : row,
                  ),
                )
              }
            />
            <OnOffToggle
              name={`visible-${doc.id}`}
              label="Visible on menu page"
              checked={doc.visible}
              onChange={(visible) =>
                setDocuments((rows) =>
                  rows.map((row) =>
                    row.id === doc.id ? { ...row, visible } : row,
                  ),
                )
              }
            />
          </div>
          {doc.path ? (
            <p className="text-sm text-meridian-text-muted">
              Current file: <code>{doc.path.split("/").pop()}</code>
            </p>
          ) : null}
          <div>
            <label className="mb-2 block text-sm font-medium text-meridian-text">
              {doc.path ? "Replace PDF" : "Upload PDF"}
            </label>
            <input
              type="file"
              name={`file-${doc.id}`}
              accept="application/pdf"
              className="block w-full text-sm text-meridian-text-muted file:mr-4 file:rounded-full file:border-0 file:bg-meridian-surface-subtle file:px-4 file:py-2 file:text-sm file:font-medium file:text-meridian-text"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setDocuments((rows) => rows.filter((row) => row.id !== doc.id))
            }
          >
            Remove menu
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => setDocuments((rows) => [...rows, newMenuPdfRow()])}
      >
        Add menu PDF
      </Button>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save menu PDFs"}
      </Button>
    </form>
  );
}

export function AdminMenusForm({
  businessId,
  menuPdfs,
}: {
  businessId: string;
  menuPdfs: BusinessMenuPdfs;
}) {
  return <AdminMenuPdfsForm businessId={businessId} menuPdfs={menuPdfs} />;
}

