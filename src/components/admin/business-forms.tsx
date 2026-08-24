"use client";

import { useActionState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  addBusinessMembership,
  createBusiness,
  updateAdminBookingSettings,
  updateBusinessDashboardMode,
  updateBusinessMembership,
  updateBusinessStatus,
  upsertAdminService,
  type AdminActionState,
} from "@/lib/admin/actions";
import {
  assignBusinessTemplate,
  type TemplateAssignState,
} from "@/lib/templates/actions";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  DASHBOARD_MODES,
  DASHBOARD_MODE_LABELS,
} from "@/lib/business/modes";
import type { BookingMode, BusinessType, DashboardMode } from "@/types/database";

const initialState: AdminActionState = { status: "idle", message: null };

function Feedback({ state }: { state: AdminActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      className={
        state.status === "error"
          ? "text-sm text-meridian-status-declined"
          : "text-sm text-meridian-teal"
      }
      role="status"
    >
      {state.message}
    </p>
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
        <input type="checkbox" name="resetCapabilities" className="size-4" />
        Force reset capabilities to mode defaults
      </label>
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Update type and mode"}
      </Button>
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
  templates: Array<{ id: string; name: string; slug: string }>;
}) {
  const [state, action, pending] = useActionState(
    assignBusinessTemplate,
    templateAssignInitial,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <Select
        label="Assigned template"
        name="templateId"
        defaultValue={assignedTemplateId ?? ""}
        options={[
          { value: "", label: "None (no preview/publish)" },
          ...templates.map((template) => ({
            value: template.id,
            label: `${template.name} (${template.slug})`,
          })),
        ]}
      />
      <p className="text-sm text-meridian-text-muted">
        Preview requires an assigned active template.{" "}
        <a
          href={`/preview/${businessSlug}`}
          className="font-semibold text-meridian-teal hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Open preview
        </a>
      </p>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save template assignment"}
      </Button>
    </form>
  );
}
