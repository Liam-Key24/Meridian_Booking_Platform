"use client";

import { useActionState, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import {
  updateBusinessSettings,
  type SettingsActionState,
} from "@/lib/dashboard/settings-actions";
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  type CustomTable,
  type HolidayEntry,
  type KitchenCloseTimes,
  type WeeklyHours,
  type Weekday,
} from "@/lib/dashboard/hospitality-settings";
import type { BookingMode } from "@/types/database";

type SettingsFormProps = {
  businessId: string;
  name: string;
  notificationEmail: string;
  contactPhone: string;
  timezone: string;
  bookingMode: BookingMode;
  externalBookingUrl: string;
  tables2Seat: number;
  tables4Seat: number;
  tables6Seat: number;
  customTables: CustomTable[];
  openingHours: WeeklyHours;
  kitchenCloseEnabled: boolean;
  kitchenCloseTimes: KitchenCloseTimes;
  barHoursEnabled: boolean;
  barOpeningHours: WeeklyHours;
  holidays: HolidayEntry[];
  maxBookingsPerDay: number | null;
  maxPartySize: number | null;
  bookingSlotMinutes: number;
  canEdit: boolean;
};

const initialState: SettingsActionState = {
  status: "idle",
  message: null,
};

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-meridian-border pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-meridian-text">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-meridian-text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function OnOffToggle({
  name,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm select-none">
      <span
        className={
          checked ? "font-medium text-meridian-text" : "text-meridian-text-muted"
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
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="h-7 w-full rounded-full border border-meridian-border bg-meridian-surface-subtle transition-colors peer-checked:border-meridian-teal peer-checked:bg-meridian-teal peer-focus-visible:shadow-[var(--meridian-focus-ring)] peer-disabled:opacity-60"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-0.5 left-0.5 size-6 rounded-full bg-meridian-surface shadow-sm transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}

function WeeklyHoursFields({
  prefix,
  hours,
  disabled,
}: {
  prefix: string;
  hours: WeeklyHours;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[7rem_1fr_1fr_4.5rem] gap-3 text-xs font-medium uppercase tracking-wide text-meridian-text-muted sm:grid">
        <span>Day</span>
        <span>Opens</span>
        <span>Closes</span>
        <span className="text-center">Closed</span>
      </div>
      {WEEKDAYS.map((day) => {
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
            <label className="flex w-full flex-col gap-1.5 text-sm sm:gap-0">
              <span className="font-medium text-meridian-text sm:sr-only">
                Opens ({WEEKDAY_LABELS[day]})
              </span>
              <input
                name={`${prefix}.${day}.open`}
                type="time"
                defaultValue={value.open}
                disabled={disabled}
                className="h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-meridian-text transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)] disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70"
              />
            </label>
            <label className="flex w-full flex-col gap-1.5 text-sm sm:gap-0">
              <span className="font-medium text-meridian-text sm:sr-only">
                Closes ({WEEKDAY_LABELS[day]})
              </span>
              <input
                name={`${prefix}.${day}.close`}
                type="time"
                defaultValue={value.close}
                disabled={disabled}
                className="h-11 w-full rounded-meridian border border-meridian-border bg-meridian-surface px-4 text-meridian-text transition-[border-color,box-shadow] focus-visible:border-meridian-blue focus-visible:shadow-[var(--meridian-focus-ring)] disabled:cursor-not-allowed disabled:bg-meridian-surface-subtle disabled:opacity-70"
              />
            </label>
            <label className="flex h-11 items-center justify-center gap-2 text-sm text-meridian-text">
              <input
                type="checkbox"
                name={`${prefix}.${day}.closed`}
                defaultChecked={value.closed}
                disabled={disabled}
                className="size-4 rounded border-meridian-border"
              />
              <span className="sm:sr-only">Closed</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}

function KitchenCloseFields({
  times,
  disabled,
}: {
  times: KitchenCloseTimes;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {WEEKDAYS.map((day: Weekday) => (
        <Input
          key={day}
          label={WEEKDAY_LABELS[day]}
          name={`kitchenClose.${day}`}
          type="time"
          defaultValue={times[day] ?? ""}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export function BusinessSettingsForm({
  businessId,
  name,
  notificationEmail,
  contactPhone,
  timezone,
  bookingMode,
  externalBookingUrl,
  tables2Seat,
  tables4Seat,
  tables6Seat,
  customTables: initialCustomTables,
  openingHours,
  kitchenCloseEnabled: initialKitchenCloseEnabled,
  kitchenCloseTimes,
  barHoursEnabled: initialBarHoursEnabled,
  barOpeningHours,
  holidays: initialHolidays,
  maxBookingsPerDay,
  maxPartySize,
  bookingSlotMinutes,
  canEdit,
}: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateBusinessSettings,
    initialState,
  );
  const [kitchenCloseEnabled, setKitchenCloseEnabled] = useState(
    initialKitchenCloseEnabled,
  );
  const [barHoursEnabled, setBarHoursEnabled] = useState(
    initialBarHoursEnabled,
  );
  const [customTables, setCustomTables] = useState<CustomTable[]>(
    initialCustomTables.length > 0
      ? initialCustomTables
      : [{ label: "", seats: 8 }],
  );
  const [holidays, setHolidays] = useState<HolidayEntry[]>(
    initialHolidays.length > 0
      ? initialHolidays
      : [{ date: "", label: "" }],
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="businessId" value={businessId} />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-10">
        <div className="space-y-10">
          <Section
            title="Business contact"
            description="Shown to your team and used for guest follow-up."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Business name"
                  name="name"
                  defaultValue={name}
                  required
                  disabled={!canEdit}
                />
              </div>
              <Input
                label="Email"
                name="notificationEmail"
                type="email"
                defaultValue={notificationEmail}
                required
                disabled={!canEdit}
                hint="Booking notifications go here"
              />
              <Input
                label="Phone number"
                name="contactPhone"
                type="tel"
                defaultValue={contactPhone}
                disabled={!canEdit}
                placeholder="+44 …"
              />
            </div>
          </Section>

          <Section
            title="Table inventory"
            description="How many 2-, 4-, and 6-seat tables you have, plus any custom layouts."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="2-seat tables"
                name="tables2Seat"
                type="number"
                min={0}
                step={1}
                defaultValue={tables2Seat}
                disabled={!canEdit}
              />
              <Input
                label="4-seat tables"
                name="tables4Seat"
                type="number"
                min={0}
                step={1}
                defaultValue={tables4Seat}
                disabled={!canEdit}
              />
              <Input
                label="6-seat tables"
                name="tables6Seat"
                type="number"
                min={0}
                step={1}
                defaultValue={tables6Seat}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-meridian-text">
                Custom tables
              </p>
              <p className="text-sm text-meridian-text-muted">
                e.g. 10 seats on Booth A, or 12 seats on Private dining.
              </p>
              <div className="space-y-2">
                {customTables.map((table, index) => (
                  <div
                    key={`custom-table-${index}`}
                    className="grid grid-cols-[1fr_7rem_auto] gap-2"
                  >
                    <Input
                      label={index === 0 ? "Table name" : undefined}
                      name="customTableLabel"
                      defaultValue={table.label}
                      placeholder="Booth A"
                      disabled={!canEdit}
                      aria-label={`Custom table ${index + 1} name`}
                    />
                    <Input
                      label={index === 0 ? "Seats" : undefined}
                      name="customTableSeats"
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      defaultValue={table.seats || ""}
                      placeholder="8"
                      disabled={!canEdit}
                      aria-label={`Custom table ${index + 1} seats`}
                    />
                    {canEdit ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-auto h-11"
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
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>
              {canEdit ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setCustomTables((rows) => [
                      ...rows,
                      { label: "", seats: 0 },
                    ])
                  }
                >
                  Add custom table
                </Button>
              ) : null}
            </div>
          </Section>

          <Section
            title="Booking limits"
            description="Capacity rules used alongside the calendar and booking form."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Max bookings per day"
                name="maxBookingsPerDay"
                type="number"
                min={1}
                step={1}
                defaultValue={maxBookingsPerDay ?? ""}
                disabled={!canEdit}
                hint="Leave blank for no daily cap"
              />
              <Input
                label="Max party size"
                name="maxPartySize"
                type="number"
                min={1}
                step={1}
                defaultValue={maxPartySize ?? ""}
                disabled={!canEdit}
                hint="Largest guest count you accept"
              />
              <Select
                label="Booking slot interval"
                name="bookingSlotMinutes"
                defaultValue={String(bookingSlotMinutes)}
                disabled={!canEdit}
                options={[
                  { value: "15", label: "15 minutes" },
                  { value: "30", label: "30 minutes" },
                  { value: "60", label: "60 minutes" },
                ]}
              />
              <Input
                label="Timezone"
                name="timezone"
                defaultValue={timezone}
                hint="IANA timezone, e.g. Europe/London"
                required
                disabled={!canEdit}
              />
            </div>
          </Section>

          <Section
            title="Booking mode"
            description="How guests request a table through Meridian."
          >
            <div className="grid gap-4">
              <Select
                label="Booking mode"
                name="bookingMode"
                defaultValue={bookingMode}
                disabled={!canEdit}
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
                hint="Required for external or hybrid mode"
                disabled={!canEdit}
              />
            </div>
          </Section>
        </div>

        <div className="space-y-10">
          <Section
            title="Opening times"
            description="Venue hours that drive calendar day view and time slots."
          >
            <WeeklyHoursFields
              prefix="opening"
              hours={openingHours}
              disabled={!canEdit}
            />
          </Section>

          <Section
            title="Kitchen close times"
            description="Last orders for each day. Leave a day blank if the kitchen follows venue close."
            action={
              <OnOffToggle
                name="kitchenCloseEnabled"
                checked={kitchenCloseEnabled}
                disabled={!canEdit}
                onChange={setKitchenCloseEnabled}
              />
            }
          >
            {kitchenCloseEnabled ? (
              <KitchenCloseFields
                times={kitchenCloseTimes}
                disabled={!canEdit}
              />
            ) : (
              <p className="text-sm text-meridian-text-muted">
                Turn on to set kitchen close times separately from venue hours.
              </p>
            )}
          </Section>

          <Section
            title="Bar opening times"
            description="When the bar is available separately from the dining room."
            action={
              <OnOffToggle
                name="barHoursEnabled"
                checked={barHoursEnabled}
                disabled={!canEdit}
                onChange={setBarHoursEnabled}
              />
            }
          >
            {barHoursEnabled ? (
              <WeeklyHoursFields
                prefix="bar"
                hours={barOpeningHours}
                disabled={!canEdit}
              />
            ) : (
              <p className="text-sm text-meridian-text-muted">
                Turn on to set bar hours separately from venue opening times.
              </p>
            )}
          </Section>

          <Section
            title="Holidays & closed days"
            description="Dates when you are closed or running special hours."
          >
            <div className="space-y-2">
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
                    disabled={!canEdit}
                    aria-label={`Holiday ${index + 1} date`}
                  />
                  <Input
                    label={index === 0 ? "Label" : undefined}
                    name="holidayLabel"
                    defaultValue={holiday.label}
                    placeholder="Christmas Day"
                    disabled={!canEdit}
                    aria-label={`Holiday ${index + 1} label`}
                  />
                  {canEdit ? (
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
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
            {canEdit ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setHolidays((rows) => [...rows, { date: "", label: "" }])
                }
              >
                Add holiday
              </Button>
            ) : null}
          </Section>
        </div>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-meridian-status-declined"
              : "text-sm text-meridian-status-confirmed"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      {canEdit ? (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      ) : (
        <p className="text-sm text-meridian-text-muted">
          Only business owners can change these settings.
        </p>
      )}
    </form>
  );
}
