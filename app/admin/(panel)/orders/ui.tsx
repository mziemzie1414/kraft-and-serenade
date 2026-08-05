import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";

/**
 * Shared presentation for the order screens.
 *
 * Status colours reuse the existing palette rather than introducing a semantic
 * one: moss for good, blush for needs-attention, grey for closed. A fifth colour
 * would have to be added to the theme and kept in step with it.
 */
const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "border-blush-300 bg-blush-50 text-blush-600",
  PAID: "border-moss-100 bg-moss-50 text-moss-700",
  FULFILLED: "border-canvas-deep bg-canvas-alt text-ink-soft",
  CANCELLED: "border-canvas-deep bg-canvas-alt text-ink-faint",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase ${STATUS_CLASS[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Dates are formatted in Asia/Manila explicitly.
 *
 * Without a fixed zone the server and the browser can disagree — the server runs
 * in UTC and the shop is UTC+8, so an evening order renders as tomorrow on one
 * side and today on the other, and React reports a hydration mismatch.
 */
const ZONE = "Asia/Manila";

export function formatOrderDate(value: Date): string {
  return value.toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: ZONE,
  });
}

export function formatOrderDateTime(value: Date): string {
  return value.toLocaleString("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: ZONE,
  });
}
