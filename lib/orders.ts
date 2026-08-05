/**
 * The order status vocabulary and the rules for moving between statuses.
 *
 * **Deliberately import-free.** `StatusControls` is a Client Component and needs
 * `ORDER_TRANSITIONS` as a runtime value, so anything this module touched would
 * end up in the browser bundle — and when it imported Prisma, the build failed
 * trying to resolve `dns`, `fs`, `net` and `tls` for the client. Order numbers,
 * access tokens and the reads all live in `lib/order-queries.ts` for that reason.
 *
 * This is the same split as `lib/shipping.ts` against `lib/shipping-queries.ts`;
 * see the Code layout table in ARCHITECTURE.md.
 */

export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS;

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_LABELS;
}

export const PAYMENT_METHOD_LABELS = {
  MANUAL: "Manual payment (QR)",
  PAYMONGO_QRPH: "PayMongo QR Ph",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD_LABELS;

/**
 * Which status an order may move to next, and what the button should say.
 *
 * An explicit map rather than "the admin may set anything", because a Server
 * Action is a POST endpoint: without this, a crafted request could mark a
 * cancelled order fulfilled, or move an order to `PAID` twice and overwrite the
 * timestamp of a real payment.
 *
 * Every state has a way back, because the common mistake is a mis-click rather
 * than fraud — but backwards moves are one step, not arbitrary.
 */
export const ORDER_TRANSITIONS: Record<
  OrderStatus,
  { to: OrderStatus; label: string; tone: "primary" | "neutral" | "danger" }[]
> = {
  PENDING_PAYMENT: [
    { to: "PAID", label: "Mark as paid", tone: "primary" },
    { to: "CANCELLED", label: "Cancel order", tone: "danger" },
  ],
  PAID: [
    { to: "FULFILLED", label: "Mark as fulfilled", tone: "primary" },
    { to: "PENDING_PAYMENT", label: "Back to awaiting payment", tone: "neutral" },
    { to: "CANCELLED", label: "Cancel order", tone: "danger" },
  ],
  // No cancelling from here: the bouquet has gone out, so the honest correction is
  // to step back to PAID first and decide from there.
  FULFILLED: [{ to: "PAID", label: "Not fulfilled after all", tone: "neutral" }],
  CANCELLED: [{ to: "PENDING_PAYMENT", label: "Reopen order", tone: "neutral" }],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].some((option) => option.to === to);
}
