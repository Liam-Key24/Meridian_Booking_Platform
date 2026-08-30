"use client";

import { useActionState, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  addBusinessMembership,
  createBusiness,
  updateAdminBookingSettings,
  updateBusinessCapabilities,
  updateBusinessDashboardMode,
  updateBusinessMembership,
  updateBusinessStatus,
  updateBusinessSubscription,
  upsertAdminService,
  type AdminActionState,
} from "@/lib/admin/actions";
import { TemplatePickerList } from "@/components/admin/template-picker-list";
import {
  assignBusinessTemplate,
  type TemplateAssignState,
} from "@/lib/templates/actions";
import type { AdminTemplateOption } from "@/lib/templates/catalog";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  CAPABILITY_KEYS,
  CAPABILITY_LABELS,
  DASHBOARD_MODES,
  DASHBOARD_MODE_LABELS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  type CapabilityKey,
  type CapabilityMap,
} from "@/lib/business/modes";
import type {
  BookingMode,
  BusinessType,
  DashboardMode,
  SubscriptionStatus,
} from "@/types/database";

const initialState: AdminActionState = { status: "idle", message: null };

function Feedback({ state }: { state: AdminActionState }) {
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

/** Matches client dashboard settings On/Off control. */
function OnOffToggle({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-meridian border border-meridian-border bg-meridian-surface px-4 py-3 select-none">
      <span className="text-sm font-medium text-meridian-text">{label}</span>
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

export function CreateBusinessForm() {
  const [state, action, pending] = useActionState(createBusiness, initialState);
  return (
    <form action={action} className="space-y-4">
      <Input label="Business name" name="name" required />
      <Input
        label="Slug"
        name="slug"
        hint="Used in /book/[slug]"
        required
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
      />
      <Select
        label="Business type"
        name="businessType"
        required
        defaultValue="restaurant"
        options={BUSINESS_TYPES.map((value) => ({
          value,
          label: BUSINESS_TYPE_LABELS[value],
        }))}
      />
      <Input
        label="Notification email"
        name="notificationEmail"
        type="email"
        required
      />
      <Input
        label="Timezone"
        name="timezone"
        defaultValue="Europe/London"
        required
      />
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create business"}
      </Button>
    </form>
  );
}

export function BusinessStatusForm({
  businessId,
  status,
}: {
  businessId: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessStatus,
    initialState,
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      <Select
        label="Status"
        name="status"
        defaultValue={status}
        options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ]}
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Update status"}
      </Button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function BusinessDashboardModeForm({
  businessId,
  businessType,
  dashboardMode,
}: {
  businessId: string;
  businessType: BusinessType | null;
  dashboardMode: DashboardMode;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessDashboardMode,
    initialState,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <Select
        label="Business type"
        name="businessType"
        defaultValue={businessType ?? "other"}
        options={BUSINESS_TYPES.map((value) => ({
          value,
          label: BUSINESS_TYPE_LABELS[value],
        }))}
      />
      <Select
        label="Dashboard mode"
        name="dashboardMode"
        defaultValue={dashboardMode}
        hint="Effective mode is enforced server-side. Changing mode resets capabilities to mode defaults."
        options={DASHBOARD_MODES.map((value) => ({
          value,
          label: DASHBOARD_MODE_LABELS[value],
        }))}
      />
      <label className="flex items-center gap-2 text-sm text-meridian-text">
        <input
          type="checkbox"
          name="resetCapabilities"
          className="size-4 rounded border-meridian-border"
        />
        Force reset capabilities to mode defaults
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Update type and mode"}
        </Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function BusinessSubscriptionForm({
  businessId,
  subscriptionStatus,
}: {
  businessId: string;
  subscriptionStatus: SubscriptionStatus;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessSubscription,
    initialState,
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      <Select
        label="Subscription status"
        name="subscriptionStatus"
        defaultValue={subscriptionStatus}
        hint="Internal ops metadata only — not a payment integration."
        options={SUBSCRIPTION_STATUSES.map((value) => ({
          value,
          label: SUBSCRIPTION_STATUS_LABELS[value],
        }))}
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Update subscription"}
      </Button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function BusinessCapabilitiesForm({
  businessId,
  capabilities,
}: {
  businessId: string;
  capabilities: CapabilityMap;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessCapabilities,
    initialState,
  );
  const [enabled, setEnabled] = useState<CapabilityMap>(capabilities);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="businessId" value={businessId} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {CAPABILITY_KEYS.map((key: CapabilityKey) => (
          <li key={key}>
            <OnOffToggle
              name={`cap_${key}`}
              label={CAPABILITY_LABELS[key]}
              checked={enabled[key]}
              onChange={(next) =>
                setEnabled((current) => ({ ...current, [key]: next }))
              }
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save capabilities"}
        </Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function AddMembershipForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(
    addBusinessMembership,
    initialState,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <Input label="User email" name="email" type="email" required />
      <Select
        label="Role"
        name="role"
        defaultValue="staff"
        options={[
          { value: "owner", label: "Owner" },
          { value: "staff", label: "Staff" },
        ]}
      />
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add member"}
      </Button>
    </form>
  );
}

export function MembershipRowForm({
  businessId,
  membershipId,
  role,
  status,
}: {
  businessId: string;
  membershipId: string;
  role: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessMembership,
    initialState,
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <Select
        label="Role"
        name="role"
        defaultValue={role}
        options={[
          { value: "owner", label: "Owner" },
          { value: "staff", label: "Staff" },
        ]}
      />
      <Select
        label="Status"
        name="status"
        defaultValue={status}
        options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        Save
      </Button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function AdminSettingsForm({
  businessId,
  notificationEmail,
  timezone,
  bookingMode,
  externalBookingUrl,
}: {
  businessId: string;
  notificationEmail: string;
  timezone: string;
  bookingMode: BookingMode;
  externalBookingUrl: string;
}) {
  const [state, action, pending] = useActionState(
    updateAdminBookingSettings,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <Input
        label="Notification email"
        name="notificationEmail"
        type="email"
        defaultValue={notificationEmail}
        required
      />
      <Input
        label="Timezone"
        name="timezone"
        defaultValue={timezone}
        required
      />
      <Select
        label="Booking mode"
        name="bookingMode"
        defaultValue={bookingMode}
        options={[
          { value: "meridian", label: "Meridian requests" },
          { value: "external", label: "External provider only" },
          { value: "hybrid", label: "Hybrid (both)" },
        ]}
      />
      <Input
        label="External booking URL"
        name="externalBookingUrl"
        type="url"
        defaultValue={externalBookingUrl}
      />
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

export function AdminServiceForm({
  businessId,
  service,
}: {
  businessId: string;
  service?: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    is_active: boolean;
  };
}) {
  const [state, action, pending] = useActionState(
    upsertAdminService,
    initialState,
  );
  return (
    <form action={action} className="space-y-3 border-t border-meridian-border pt-4 first:border-0 first:pt-0">
      <input type="hidden" name="businessId" value={businessId} />
      {service ? (
        <input type="hidden" name="serviceId" value={service.id} />
      ) : null}
      <Input
        label={service ? "Service name" : "New service name"}
        name="name"
        defaultValue={service?.name}
        required
      />
      <Textarea
        label="Description"
        name="description"
        rows={2}
        defaultValue={service?.description ?? undefined}
      />
      <Input
        label="Duration (minutes)"
        name="durationMinutes"
        type="number"
        min={5}
        defaultValue={service?.duration_minutes ?? 60}
        required
      />
      <label className="flex items-center gap-2 text-sm text-meridian-text">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={service?.is_active ?? true}
          className="size-4 rounded border-meridian-border"
        />
        Active
      </label>
      <Feedback state={state} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : service ? "Update service" : "Add service"}
      </Button>
    </form>
  );
}


const templateAssignInitial: TemplateAssignState = {
  status: "idle",
  message: null,
};

export function AdminTemplateAssignForm({
  businessId,
  businessSlug,
  assignedTemplateId,
  templates,
}: {
  businessId: string;
  businessSlug: string;
  assignedTemplateId: string | null;
  templates: AdminTemplateOption[];
}) {
  const [state, action, pending] = useActionState(
    assignBusinessTemplate,
    templateAssignInitial,
  );
  return (
    <TemplatePickerList
      businessId={businessId}
      templates={templates}
      assignedTemplateId={assignedTemplateId}
      businessSlug={businessSlug}
      formAction={action}
      pending={pending}
      stateMessage={state.message}
      stateStatus={state.status}
    />
  );
}
