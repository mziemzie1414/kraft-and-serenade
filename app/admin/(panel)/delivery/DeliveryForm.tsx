"use client";

import { useActionState, useState, useTransition } from "react";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  PrimaryButton,
  StatusMessage,
  inputClass,
  labelClass,
} from "@/components/admin/ui";
import { MonthCalendar, type CalendarDay } from "@/components/ui/MonthCalendar";
import {
  WEEKDAY_NAMES,
  describeDay,
  formatDeliveryDate,
  monthKey,
  type DeliveryContent,
} from "@/lib/delivery";
import { formatPrice } from "@/lib/data";
import {
  clearDeliveryException,
  saveDelivery,
  setDeliveryException,
} from "./actions";

export function DeliveryForm({
  delivery,
  today,
  orderCounts,
  version,
}: {
  delivery: DeliveryContent;
  /** `YYYY-MM-DD` in the shop's timezone, worked out on the server. */
  today: string;
  /** Orders already booked per date, so a day is not closed out from under them. */
  orderCounts: Record<string, number>;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveDelivery, IDLE);

  return (
    <div className="mt-8 space-y-6">
      <form key={version} action={formAction} className="space-y-6">
        <Fieldset
          title="Delivery dates"
          description="Switch this off to stop asking for a date at checkout. Nothing is charged as a rush fee while it is off."
        >
          <label className="flex items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="isEnabled"
              defaultChecked={delivery.isEnabled}
              className="h-4 w-4 accent-moss-700"
            />
            Ask customers to choose a delivery date
          </label>
        </Fieldset>

        <Fieldset
          title="Rush fee"
          description="Charged when the date the customer picks is close enough to disrupt the week."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rush fee" hint="Whole pesos. Set 0 to never charge one.">
              <input
                name="rushFee"
                type="number"
                min={0}
                step={1}
                defaultValue={delivery.rushFee}
                className={inputClass}
                required
              />
            </Field>
            <Field
              label="Counts as rushed within"
              hint="Days from today. 1 means today and tomorrow both carry the fee."
            >
              <input
                name="rushWithinDays"
                type="number"
                min={0}
                max={30}
                step={1}
                defaultValue={delivery.rushWithinDays}
                className={inputClass}
                required
              />
            </Field>
          </div>
        </Fieldset>

        <Fieldset
          title="How far ahead"
          description="The window customers can book inside."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Notice needed"
              hint="Days. 0 lets someone order for today; 1 makes tomorrow the earliest."
            >
              <input
                name="leadTimeDays"
                type="number"
                min={0}
                max={90}
                step={1}
                defaultValue={delivery.leadTimeDays}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Book up to" hint="Days ahead the calendar opens.">
              <input
                name="maxAdvanceDays"
                type="number"
                min={1}
                max={730}
                step={1}
                defaultValue={delivery.maxAdvanceDays}
                className={inputClass}
                required
              />
            </Field>
          </div>
        </Fieldset>

        <Fieldset
          title="Days you never deliver"
          description="The weekly pattern. Use the calendar below for one-off closures and openings."
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {WEEKDAY_NAMES.map((name, day) => (
              <label
                key={name}
                className="flex items-center gap-2 text-sm text-ink-soft"
              >
                <input
                  type="checkbox"
                  name={`closed-${day}`}
                  defaultChecked={delivery.closedWeekdays.includes(day)}
                  className="h-4 w-4 accent-moss-700"
                />
                {name}
              </label>
            ))}
          </div>
        </Fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <PrimaryButton pending={pending}>
            {pending ? "Saving…" : "Save delivery settings"}
          </PrimaryButton>
          <StatusMessage state={state} />
        </div>
      </form>

      {/* Its own form, outside the one above: an exception saves immediately and
          has nothing to do with the settings fields. */}
      <ExceptionCalendar
        delivery={delivery}
        today={today}
        orderCounts={orderCounts}
      />
    </div>
  );
}

function ExceptionCalendar({
  delivery,
  today,
  orderCounts,
}: {
  delivery: DeliveryContent;
  today: string;
  orderCounts: Record<string, number>;
}) {
  const [view, setView] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  }));
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{
    status: "saved" | "error";
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const exceptionFor = (iso: string) =>
    delivery.exceptions.find((entry) => entry.date === iso);

  /**
   * Every day is clickable here, including closed ones — the whole point is to
   * change a day's availability, so greying out the closed ones would hide the
   * days the admin most wants to reach.
   */
  function dayState(iso: string): CalendarDay {
    const exception = exceptionFor(iso);
    const state = describeDay(delivery, iso, today);
    const booked = orderCounts[iso] ?? 0;
    const past = iso < today;

    const noteParts: string[] = [];

    if (booked > 0) noteParts.push(`${booked}★`);
    if (!booked && exception?.isOpen) noteParts.push("open");
    if (!booked && exception && !exception.isOpen) noteParts.push("shut");

    return {
      disabled: past,
      selected: selected === iso,
      note: noteParts[0],
      title: past
        ? "Already passed"
        : booked > 0
          ? `${booked} order${booked === 1 ? "" : "s"} booked${state.selectable ? "" : " — currently closed"}`
          : (state.reason ?? "Open for delivery"),
      tone: past
        ? "blocked"
        : exception?.isOpen
          ? "opened"
          : state.selectable
            ? "default"
            : "blocked",
    };
  }

  function run(
    action: typeof setDeliveryException | typeof clearDeliveryException,
    data: FormData,
  ) {
    startTransition(async () => {
      const result = await action(IDLE, data);

      setMessage(
        result.status === "error"
          ? { status: "error", text: result.message ?? "Failed" }
          : { status: "saved", text: result.message ?? "Saved" },
      );

      if (result.status !== "error") setNote("");
    });
  }

  const selectedException = selected ? exceptionFor(selected) : undefined;
  const selectedState = selected
    ? describeDay(delivery, selected, today)
    : null;
  const selectedBooked = selected ? (orderCounts[selected] ?? 0) : 0;

  return (
    <Fieldset
      title="One-off closures and openings"
      description="Pick a date to close it, or to open it when your weekly pattern would have it shut. A number on a day is how many orders are already booked for it."
    >
      <MonthCalendar
        year={view.year}
        month={view.month}
        onMonthChange={setView}
        dayState={dayState}
        onSelectDate={(iso) => {
          setSelected(iso);
          setNote(exceptionFor(iso)?.note ?? "");
          setMessage(null);
        }}
        minMonth={monthKey(today)}
      />

      {selected ? (
        <div className="rounded-lg border border-canvas-deep bg-canvas-alt p-4">
          <p className="font-display text-sm font-medium text-ink">
            {formatDeliveryDate(selected)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {selectedBooked > 0
              ? `${selectedBooked} order${selectedBooked === 1 ? "" : "s"} booked for this day. `
              : ""}
            {selectedException
              ? selectedException.isOpen
                ? "Currently forced open."
                : "Currently closed."
              : selectedState?.selectable
                ? "Currently open, following the usual pattern."
                : `Currently closed — ${selectedState?.reason?.toLowerCase()}.`}
            {selectedState?.isRush ? " Falls inside the rush window." : ""}
          </p>

          <div className="mt-3">
            <label htmlFor="exception-note" className={labelClass}>
              Note
            </label>
            <input
              id="exception-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Holy Week, fully booked, staff day off…"
              className={`mt-1.5 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-ink-faint">
              Optional, and shown to the customer as the reason the day is
              unavailable.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const data = new FormData();
                data.set("date", selected);
                data.set("isOpen", "false");
                data.set("note", note);
                run(setDeliveryException, data);
              }}
              className="rounded-full border border-blush-500 px-4 py-2 text-xs font-semibold text-blush-600 transition-colors hover:bg-blush-50 disabled:opacity-60"
            >
              Close this day
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const data = new FormData();
                data.set("date", selected);
                data.set("isOpen", "true");
                data.set("note", note);
                run(setDeliveryException, data);
              }}
              className="rounded-full border border-moss-400 px-4 py-2 text-xs font-semibold text-moss-700 transition-colors hover:bg-moss-50 disabled:opacity-60"
            >
              Open this day
            </button>

            {selectedException ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const data = new FormData();
                  data.set("date", selected);
                  run(clearDeliveryException, data);
                }}
                className="rounded-full border border-canvas-deep px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-60"
              >
                Follow the usual pattern
              </button>
            ) : null}
          </div>

          {message ? (
            <p
              role="status"
              className={`mt-3 text-xs font-medium ${
                message.status === "error" ? "text-blush-600" : "text-moss-600"
              }`}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">
          Pick a date above to close or open it.
        </p>
      )}

      {delivery.exceptions.length > 0 ? (
        <div>
          <span className={labelClass}>Dates that break the pattern</span>
          <ul className="mt-2 space-y-1.5">
            {delivery.exceptions
              .filter((entry) => entry.date >= today)
              .map((entry) => (
                <li
                  key={entry.date}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-canvas-deep px-3 py-2 text-sm"
                >
                  <span className="font-medium text-ink">
                    {formatDeliveryDate(entry.date)}
                  </span>
                  <span
                    className={
                      entry.isOpen
                        ? "text-xs font-semibold text-moss-700"
                        : "text-xs font-semibold text-blush-600"
                    }
                  >
                    {entry.isOpen ? "Open" : "Closed"}
                  </span>
                  {entry.note ? (
                    <span className="text-xs text-ink-faint">{entry.note}</span>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setSelected(entry.date);
                      setNote(entry.note ?? "");
                      setMessage(null);
                    }}
                    className="ml-auto text-xs font-semibold text-moss-700 underline-offset-4 hover:underline disabled:opacity-60"
                  >
                    Edit
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {delivery.rushFee > 0 && delivery.isEnabled ? (
        <p className="text-xs text-ink-faint">
          Customers picking a date within {delivery.rushWithinDays === 0 ? "today" : `${delivery.rushWithinDays + 1} days`}{" "}
          pay an extra {formatPrice(delivery.rushFee)}.
        </p>
      ) : null}
    </Fieldset>
  );
}
