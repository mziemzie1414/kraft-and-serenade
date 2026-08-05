"use client";

import { useState } from "react";
import { MonthCalendar, type CalendarDay } from "@/components/ui/MonthCalendar";
import { formatPrice } from "@/lib/data";
import {
  addDays,
  describeDay,
  formatDeliveryDate,
  monthKey,
  type DeliveryContent,
} from "@/lib/delivery";

/**
 * The delivery date step at checkout.
 *
 * Every rule comes from `describeDay`, the same function the server calls when the
 * order is placed — so a day the calendar offers is a day the order action will
 * accept, and the surcharge shown is the surcharge charged.
 *
 * `today` is passed in from the server rather than read from the browser. A
 * customer with a wrong clock, or one sitting in another timezone, must still see
 * the shop's idea of today; otherwise the calendar and the server would disagree
 * about which dates are past and the order would be refused after submission.
 */
export function DeliveryDatePicker({
  delivery,
  today,
  value,
  onChange,
  invalid,
}: {
  delivery: DeliveryContent;
  today: string;
  /** `YYYY-MM-DD`, or empty for nothing chosen yet. */
  value: string;
  onChange: (isoDate: string) => void;
  invalid?: boolean;
}) {
  const [view, setView] = useState(() => {
    const start = value || today;

    return { year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) };
  });

  const lastDate = addDays(today, delivery.maxAdvanceDays);

  function dayState(iso: string): CalendarDay {
    const state = describeDay(delivery, iso, today);

    return {
      disabled: !state.selectable,
      selected: value === iso,
      // The surcharge is on the day itself, so the customer sees the cost before
      // choosing rather than watching the total jump afterwards.
      note: state.selectable && state.isRush ? `+${delivery.rushFee}` : undefined,
      title: state.selectable
        ? state.isRush
          ? `Rush delivery, adds ${formatPrice(delivery.rushFee)}`
          : "Available"
        : state.reason,
      tone: state.isRush ? "rush" : "default",
    };
  }

  const chosen = value ? describeDay(delivery, value, today) : null;

  return (
    <div className="space-y-3">
      <MonthCalendar
        year={view.year}
        month={view.month}
        onMonthChange={setView}
        dayState={dayState}
        onSelectDate={onChange}
        minMonth={monthKey(today)}
        maxMonth={monthKey(lastDate)}
      />

      {/* The value the form actually submits. The calendar is buttons, which post
          nothing on their own. */}
      <input type="hidden" name="deliveryDate" value={value} />

      <div aria-live="polite" className="min-h-10">
        {chosen && chosen.selectable ? (
          <div className="rounded-lg border border-canvas-deep bg-canvas-alt px-4 py-3">
            <p className="text-sm font-medium text-ink">
              {formatDeliveryDate(value)}
            </p>
            {chosen.isRush && delivery.rushFee > 0 ? (
              <p className="mt-0.5 text-xs text-ink-soft">
                A rush date, so {formatPrice(delivery.rushFee)} is added.
              </p>
            ) : null}
          </div>
        ) : (
          <p
            className={`text-xs ${invalid ? "font-medium text-blush-600" : "text-ink-faint"}`}
          >
            {invalid
              ? "Choose a delivery date to carry on."
              : delivery.rushFee > 0
                ? `Days marked +${delivery.rushFee} are rush dates and cost ${formatPrice(delivery.rushFee)} more. Greyed-out days are unavailable.`
                : "Greyed-out days are unavailable."}
          </p>
        )}
      </div>
    </div>
  );
}
