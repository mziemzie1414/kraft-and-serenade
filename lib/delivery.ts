/**
 * Delivery dates: which days a customer may pick, and what a rushed one costs.
 *
 * Free of database imports so the checkout calendar can decide what to grey out
 * without a round trip per month, and so the server can re-decide the same way
 * when the order is placed. Reads live in `lib/delivery-queries.ts`.
 *
 * ## Dates are strings here
 *
 * Everything in this module speaks `YYYY-MM-DD`. Not `Date`, deliberately.
 *
 * A `Date` is an instant, and a delivery date is not — it is a day on a calendar
 * hanging in a shop in Pasig City. Mixing the two is how you get a bouquet
 * delivered a day late: the server runs in UTC, the shop is UTC+8, so an order
 * placed at 9pm Manila on the 6th is "the 5th" to a naive `new Date()` reading.
 *
 * So: the current day is derived by formatting the instant *in Manila*, and all
 * arithmetic is done on the string via UTC getters, which are stable everywhere.
 */

/** One row, addressed by a fixed id. */
export const DELIVERY_ID = "delivery";

/**
 * The shop's timezone, not the server's and not the visitor's.
 *
 * A customer in Dubai ordering flowers for their mother in Pasig should see the
 * shop's idea of "tomorrow", not their own.
 */
export const SHOP_TIME_ZONE = "Asia/Manila";

export type DeliveryException = {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `true` opens a day the weekday rules close; `false` blocks an open one. */
  isOpen: boolean;
  note: string | null;
};

export type DeliveryContent = {
  isEnabled: boolean;
  rushFee: number;
  rushWithinDays: number;
  leadTimeDays: number;
  maxAdvanceDays: number;
  /** `0` Sunday through `6` Saturday. */
  closedWeekdays: number[];
  exceptions: DeliveryException[];
};

/**
 * Starting values. ₱50 for same-day or next-day, everything else open.
 *
 * `closedWeekdays` is empty because the shop's posted hours cover all seven days —
 * inventing a closure would quietly refuse orders nobody asked to refuse.
 */
export const DELIVERY_DEFAULTS: Omit<DeliveryContent, "exceptions"> = {
  isEnabled: true,
  rushFee: 50,
  rushWithinDays: 1,
  leadTimeDays: 0,
  maxAdvanceDays: 60,
  closedWeekdays: [],
};

/* ------------------------------------------------------------ date handling */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;

  // Rejects 2026-02-30, which the regex is happy with. Round-tripping is the
  // cheapest real check: JS normalises an impossible day, so it comes back different.
  return toIsoDate(parseIsoDate(value)) === value;
}

/**
 * `YYYY-MM-DD` as a `Date` at **UTC** midnight.
 *
 * UTC, not local: the only thing this is used for afterwards is UTC getters and
 * day arithmetic, both of which then behave identically on every machine.
 */
export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** A `Date`'s UTC calendar day as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * What day it is in the shop's timezone.
 *
 * `formatToParts` rather than string slicing on a locale format, because locale
 * output is not something to parse — `en-CA` happens to produce ISO order today
 * and is not promised to tomorrow.
 */
export function todayInShopZone(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);

  return toIsoDate(date);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();

  return Math.round(ms / 86_400_000);
}

/** `0` Sunday through `6` Saturday. */
export function weekdayOf(isoDate: string): number {
  return parseIsoDate(isoDate).getUTCDay();
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Human-readable, e.g. "Thursday, 6 August 2026". Always in the shop's zone. */
export function formatDeliveryDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    // The value is UTC midnight, so it must be read back as UTC or it slips a day.
    timeZone: "UTC",
  });
}

/** Short form for tight spaces, e.g. "Thu 6 Aug". */
export function formatDeliveryDateShort(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString("en-PH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/* ------------------------------------------------------------------- rules */

export type DayState = {
  date: string;
  selectable: boolean;
  /** Why not, when `selectable` is false. Written for a customer to read. */
  reason?: string;
  /** True when picking this day adds `rushFee`. */
  isRush: boolean;
};

/**
 * Whether a day can be delivered on, and whether it is rushed.
 *
 * Order matters. A date in the past is refused before anything else, and an
 * explicit exception for the day beats the weekly pattern in both directions —
 * that is the whole point of the exception table. But an exception cannot open a
 * day outside the lead time or the booking window: those are hard limits, not
 * preferences, and letting a one-off opening override them would allow same-day
 * orders the shop said it could not build.
 */
export function describeDay(
  delivery: DeliveryContent,
  isoDate: string,
  today: string,
): DayState {
  const daysAhead = daysBetween(today, isoDate);

  const rushed =
    delivery.isEnabled &&
    delivery.rushFee > 0 &&
    daysAhead >= 0 &&
    daysAhead <= delivery.rushWithinDays;

  if (daysAhead < 0) {
    return { date: isoDate, selectable: false, reason: "In the past", isRush: false };
  }

  if (daysAhead < delivery.leadTimeDays) {
    return {
      date: isoDate,
      selectable: false,
      reason:
        delivery.leadTimeDays === 1
          ? "We need at least a day's notice"
          : `We need at least ${delivery.leadTimeDays} days' notice`,
      isRush: rushed,
    };
  }

  if (daysAhead > delivery.maxAdvanceDays) {
    return {
      date: isoDate,
      selectable: false,
      reason: "Too far ahead to book yet",
      isRush: false,
    };
  }

  const exception = delivery.exceptions.find((entry) => entry.date === isoDate);

  if (exception) {
    return exception.isOpen
      ? { date: isoDate, selectable: true, isRush: rushed }
      : {
          date: isoDate,
          selectable: false,
          reason: exception.note?.trim() || "Not delivering this day",
          isRush: rushed,
        };
  }

  if (delivery.closedWeekdays.includes(weekdayOf(isoDate))) {
    return {
      date: isoDate,
      selectable: false,
      reason: `Closed on ${WEEKDAY_NAMES[weekdayOf(isoDate)]}s`,
      isRush: rushed,
    };
  }

  return { date: isoDate, selectable: true, isRush: rushed };
}

export type ResolvedDelivery =
  | { ok: true; date: string | null; rushFee: number; isRush: boolean }
  | { ok: false; reason: string };

/**
 * Validates a submitted date and works out the surcharge.
 *
 * The single place a rush fee is decided, called by the checkout form for the live
 * figure and again by the order action on the server — so the number shown and the
 * number charged come from one place, and a tampered form cannot lower it.
 *
 * With delivery dates switched off, no date is expected and none is required.
 */
export function resolveDelivery(
  delivery: DeliveryContent,
  isoDate: string,
  today: string,
): ResolvedDelivery {
  if (!delivery.isEnabled) {
    return { ok: true, date: null, rushFee: 0, isRush: false };
  }

  if (!isoDate) return { ok: false, reason: "Choose a delivery date." };

  if (!isIsoDate(isoDate)) return { ok: false, reason: "That date is not valid." };

  const state = describeDay(delivery, isoDate, today);

  if (!state.selectable) {
    return { ok: false, reason: `${formatDeliveryDate(isoDate)} is not available.` };
  }

  return {
    ok: true,
    date: isoDate,
    rushFee: state.isRush ? delivery.rushFee : 0,
    isRush: state.isRush,
  };
}

/** The first day a customer could actually pick, or `null` if the window is empty. */
export function firstSelectableDate(
  delivery: DeliveryContent,
  today: string,
): string | null {
  for (let offset = 0; offset <= delivery.maxAdvanceDays; offset += 1) {
    const candidate = addDays(today, offset);

    if (describeDay(delivery, candidate, today).selectable) return candidate;
  }

  return null;
}

/* ---------------------------------------------------------------- calendar */

export type CalendarMonth = {
  year: number;
  /** 1 to 12. */
  month: number;
  label: string;
  /**
   * Six weeks at most, each seven entries. `null` pads the days belonging to the
   * neighbouring months, so the grid lines up under the weekday headings without
   * rendering dates that are not this month's.
   */
  weeks: (string | null)[][];
};

/** Builds the grid for one month, weeks starting Sunday. */
export function buildCalendarMonth(year: number, month: number): CalendarMonth {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = first.getUTCDay();

  const cells: (string | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toIsoDate(new Date(Date.UTC(year, month - 1, day))));
  }

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return {
    year,
    month,
    label: first.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    weeks,
  };
}

/** Steps a year/month pair by whole months, handling the year boundary. */
export function shiftMonth(
  year: number,
  month: number,
  by: number,
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + by;

  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

/** `YYYY-MM` for the month an ISO date falls in, handy as a comparison key. */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}
