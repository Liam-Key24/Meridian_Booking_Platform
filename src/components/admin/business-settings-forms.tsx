"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  updateAdminHospitalityHours,
  updateAdminHospitalityTables,
  updateBusinessDetails,
  type AdminActionState,
} from "@/lib/admin/actions";
import {
  updateBusinessBranding,
  updateBusinessMenuPdfs,
  type SiteSettingsActionState,
} from "@/lib/admin/site-settings-actions";
import { ColorCirclePicker } from "@/components/admin/color-circle-picker";
import { TemplateBrandingPreview } from "@/components/admin/template-branding-preview";
import {
  DEFAULT_BRAND_COLORS,
  publicAssetUrl,
  type BusinessMenuPdfs,
  type MenuPdfDocument,
} from "@/lib/admin/site-settings";
import type { TemplateBrandingPreset } from "@/lib/templates/catalog";
import {
  syncBusinessTemplateAction,
  type TemplateSyncState,
} from "@/lib/templates/sync";
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
const syncInitial: TemplateSyncState = { status: "idle", message: null };

function Feedback({
  state,
}: {
  state: AdminActionState | SiteSettingsActionState | TemplateSyncState;
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
  logoPath,
  heroImagePath,
  galleryPaths,
  assignedTemplateName,
  assignedTemplateBranding,
}: {
  businessId: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  logoPath: string | null;
  heroImagePath: string | null;
  galleryPaths: string[];
  assignedTemplateName?: string | null;
  assignedTemplateBranding?: TemplateBrandingPreset | null;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessBranding,
    siteInitial,
  );
  const logoUrl = publicAssetUrl(logoPath);
  const heroUrl = publicAssetUrl(heroImagePath);
  const galleryUrls = galleryPaths
    .map((path) => ({ path, url: publicAssetUrl(path) }))
    .filter((row): row is { path: string; url: string } => Boolean(row.url));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="businessId" value={businessId} />
      {assignedTemplateName && assignedTemplateBranding ? (
        <div className="rounded-meridian border border-meridian-border bg-meridian-surface-subtle px-4 py-3">
          <p className="text-sm font-medium text-meridian-text">
            {assignedTemplateName} defaults
          </p>
          <div className="mt-2">
            <TemplateBrandingPreview branding={assignedTemplateBranding} />
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-6">
        <ColorCirclePicker
          label="Primary"
          name="primaryColor"
          defaultValue={primaryColor}
        />
        <ColorCirclePicker
          label="Accent"
          name="accentColor"
          defaultValue={accentColor}
        />
        <ColorCirclePicker
          label="Background"
          name="backgroundColor"
          defaultValue={backgroundColor}
        />
        <ColorCirclePicker
          label="Text"
          name="textColor"
          defaultValue={textColor}
        />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-meridian-text">Logo</label>
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <Image
                src={logoUrl}
                alt="Current logo"
                width={80}
                height={80}
                className="rounded-meridian-sm border border-meridian-border object-contain"
                unoptimized
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="clearLogo" className="size-4" />
                Remove logo
              </label>
            </div>
          ) : null}
          <Input label="Upload logo" name="logo" type="file" accept="image/*" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-meridian-text">
            Hero image
          </label>
          {heroUrl ? (
            <div className="space-y-2">
              <Image
                src={heroUrl}
                alt="Current hero"
                width={320}
                height={120}
                className="max-h-32 rounded-meridian-sm border border-meridian-border object-cover"
                unoptimized
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="clearHero" className="size-4" />
                Remove hero
              </label>
            </div>
          ) : null}
          <Input
            label="Upload hero"
            name="heroImage"
            type="file"
            accept="image/*"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-meridian-text">
            Gallery
          </label>
          {galleryUrls.length > 0 ? (
            <ul className="flex flex-wrap gap-3">
              {galleryUrls.map(({ path, url }) => (
                <li key={path} className="space-y-1">
                  <Image
                    src={url}
                    alt=""
                    width={96}
                    height={96}
                    className="size-24 rounded-meridian-sm border border-meridian-border object-cover"
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
          <Input
            label="Add gallery image"
            name="galleryImage"
            type="file"
            accept="image/*"
          />
        </div>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save branding"}
      </Button>
    </form>
  );
}

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
    menuPdfs.documents.length > 0 ? menuPdfs.documents : [newMenuPdfRow()],
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

export function AdminTemplateSyncForm({
  businessId,
  configVersion,
  syncedAt,
  syncError,
  assignmentSyncVersion,
  lastSyncedAt,
}: {
  businessId: string;
  configVersion: number;
  syncedAt: string | null;
  syncError: string | null;
  assignmentSyncVersion: number | null;
  lastSyncedAt: string | null;
}) {
  const [state, action, pending] = useActionState(
    syncBusinessTemplateAction,
    syncInitial,
  );

  return (
    <div className="space-y-4 border-t border-meridian-border pt-6">
      <div className="space-y-1 text-sm text-meridian-text-muted">
        <p>
          Config version: <strong className="text-meridian-text">{configVersion}</strong>
          {assignmentSyncVersion !== null
            ? ` · Assignment sync v${assignmentSyncVersion}`
            : null}
        </p>
        <p>
          Last synced:{" "}
          {syncedAt ?? lastSyncedAt ?? "Never — assign a template and update."}
        </p>
        {syncError ? (
          <p className="text-meridian-status-declined">Last error: {syncError}</p>
        ) : null}
      </div>
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="businessId" value={businessId} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Updating…" : "Update template"}
        </Button>
        <Feedback state={state} />
      </form>
      <p className="text-sm text-meridian-text-muted">
        Pushes the latest branding, menus, booking, hours, and contact settings
        into the assigned template snapshot.
      </p>
    </div>
  );
}

export { DEFAULT_BRAND_COLORS };
