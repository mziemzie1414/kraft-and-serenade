"use client";

import { buildCalendarMonth, shiftMonth } from "@/lib/delivery";

/**
 * A month grid, shared by the checkout date picker and the admin availability
 * screen.
 *
 * Presentational and unopinionated: it knows how to lay out a month and step
 * between months, and asks the caller what each day looks like. The two screens
 * disagree about almost everything else — checkout greys out what cannot be picked
 * and flags a surcharge, while the admin wants to click a *closed* day to reopen it
 * — so the day state is a function rather than a set of props.
 *
 * Built here rather than pulled from a date-picker library because the hard part is
 * the shop's rules, not the grid, and a library would still need all of them
 * expressed as callbacks.
 */

export type CalendarDay = {
  disabled?: boolean;
  selected?: boolean;
  /** One short line under the number, e.g. "+₱50" or an order count. */
  note?: string;
  tone?: "default" | "rush" | "blocked" | "opened";
  /** Tooltip, used for the reason a day is unavailable. */
  title?: string;
};

const TONE: Record<NonNullable<CalendarDay["tone"]>, string> = {
  default: "border-canvas-deep text-ink hover:border-moss-400",
  rush: "border-gold/50 bg-canvas text-ink hover:border-gold",
  blocked: "border-canvas-deep bg-canvas-alt text-ink-faint",
  opened: "border-moss-400 bg-moss-50 text-moss-700 hover:border-moss-600",
};

/** Sunday-first, matching `buildCalendarMonth`. */
const HEADINGS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendar({
  year,
  month,
  onMonthChange,
  dayState,
  onSelectDate,
  /** Stops the customer paging back through months they cannot order in. */
  minMonth,
  maxMonth,
}: {
  year: number;
  /** 1 to 12. */
  month: number;
  onMonthChange: (next: { year: number; month: number }) => void;
  dayState: (isoDate: string) => CalendarDay;
  onSelectDate: (isoDate: string) => void;
  /** `YYYY-MM`, inclusive. */
  minMonth?: string;
  maxMonth?: string;
}) {
  const calendar = buildCalendarMonth(year, month);
  const current = `${year}-${String(month).padStart(2, "0")}`;

  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const previousKey = `${previous.year}-${String(previous.month).padStart(2, "0")}`;
  const nextKey = `${next.year}-${String(next.month).padStart(2, "0")}`;

  const canGoBack = !minMonth || previousKey >= minMonth;
  const canGoForward = !maxMonth || nextKey <= maxMonth;

  return (
    <div className="rounded-xl border border-canvas-deep bg-canvas p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonthChange(previous)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          &larr;
        </button>

        {/* Announced so a screen reader hears the month change rather than only
            seeing new numbers appear. */}
        <p aria-live="polite" className="font-display text-base font-medium text-ink">
          {calendar.label}
        </p>

        <button
          type="button"
          onClick={() => onMonthChange(next)}
          disabled={!canGoForward}
          aria-label="Next month"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          &rarr;
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {HEADINGS.map((heading, index) => (
          <div
            key={`${heading}-${index}`}
            aria-hidden
            className="pb-1 text-center text-[0.65rem] font-semibold tracking-wide text-ink-faint uppercase"
          >
            {heading}
          </div>
        ))}

        {calendar.weeks.flat().map((iso, index) => {
          if (!iso) {
            // Padding for the neighbouring months. Keeps the columns aligned
            // without rendering a date that is not in view.
            return <div key={`pad-${current}-${index}`} aria-hidden />;
          }

          const state = dayState(iso);
          const tone = TONE[state.tone ?? "default"];
          const dayNumber = Number(iso.slice(8, 10));

          return (
            <button
              key={iso}
              type="button"
              disabled={state.disabled}
              onClick={() => onSelectDate(iso)}
              title={state.title}
              aria-pressed={state.selected}
              aria-label={state.title ? `${iso}: ${state.title}` : iso}
              className={`flex min-h-11 flex-col items-center justify-center rounded-lg border px-0.5 py-1 text-sm transition-colors ${
                state.selected
                  ? "border-moss-900 bg-moss-900 text-canvas"
                  : `${tone} ${state.disabled ? "cursor-not-allowed" : "cursor-pointer"}`
              }`}
            >
              <span className={state.selected ? "font-semibold" : ""}>{dayNumber}</span>
              {state.note ? (
                <span
                  className={`mt-0.5 text-[0.6rem] leading-none ${
                    state.selected ? "text-canvas/80" : "text-ink-faint"
                  }`}
                >
                  {state.note}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
