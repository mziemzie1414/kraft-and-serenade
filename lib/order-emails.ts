/**
 * The two emails an order sends: a confirmation to the customer and an alert to
 * the shop.
 *
 * Kept apart from `lib/email.ts`, which only knows how to put a message on the
 * wire. This module knows what the messages say.
 *
 * Three constraints shape the markup:
 *
 * - **Inline styles only, and a table for the outer frame.** Mail clients strip
 *   `<style>` blocks and Outlook still lays out with tables.
 * - **Every interpolated value is escaped.** All of it comes from a customer —
 *   name, street, delivery notes — and the store's alert is read in the owner's
 *   mail client, which makes a delivery note a natural place to try a script tag.
 * - **A plain-text alternative is always built.** Some clients prefer it, and a
 *   message with no text part scores worse with spam filters.
 *
 * The palette is hard-coded from `THEME_DEFAULTS` rather than read from the
 * `Theme` row. Email cannot use custom properties, and re-reading the palette per
 * send to inline it would couple a mail to a database round trip for very little.
 * Recolouring the site therefore does not recolour these.
 */
import { formatPrice } from "./data";
import { formatDeliveryDate, formatDeliveryDateShort } from "./delivery";
import { escapeHtml, isEmailConfigured, sendEmails, storeInbox } from "./email";
import type { Message } from "./email";
import { absoluteUrl } from "./site-url";
import type { StoreContent } from "./store";

const COLOR = {
  canvas: "#fbf9f6",
  canvasAlt: "#f3ede5",
  border: "#ebe3d8",
  ink: "#1a1715",
  inkSoft: "#6c625a",
  inkFaint: "#9a9088",
  moss50: "#f2f5f3",
  moss100: "#dde5df",
  moss700: "#33473b",
  moss900: "#1e2b24",
} as const;

/**
 * What these emails need from an order.
 *
 * Structurally what `prisma.order.create` returns with its items included, so the
 * created row can be passed straight in — but written out here so this module does
 * not depend on Prisma's generated types, and so a test can build one by hand.
 */
export type OrderEmailData = {
  /** Only used to build the admin link in the store's copy. */
  id: string;
  orderNumber: string;
  accessToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  regionName: string;
  provinceName: string;
  cityName: string;
  barangay: string;
  street: string;
  postalCode: string;
  deliveryNotes: string | null;
  /** `YYYY-MM-DD`, or `null` on an order placed before dates were asked for. */
  deliveryDate: string | null;
  subtotal: number;
  shippingFee: number;
  rushFee: number;
  total: number;
  shippingBasis: string;
  shippingLabel: string;
  paymentMethod: "MANUAL" | "PAYMONGO_QRPH";
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

/* ------------------------------------------------------------------ helpers */

/** The address as display lines, blanks dropped. */
function addressLines(order: OrderEmailData): string[] {
  return [
    order.street,
    order.barangay,
    [order.cityName, order.provinceName].filter(Boolean).join(", "),
    [order.regionName, order.postalCode].filter(Boolean).join(" "),
  ].filter((line) => line.trim().length > 0);
}

function shell(bodyHtml: string, storeName: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:${COLOR.canvasAlt};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.canvasAlt};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:${COLOR.canvas};border:1px solid ${COLOR.border};border-radius:14px;">
<tr><td style="padding:26px 28px;font-family:Georgia,'Times New Roman',serif;">
${bodyHtml}
<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${COLOR.border};font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:${COLOR.inkFaint};">
${escapeHtml(storeName)}
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

function itemRows(order: OrderEmailData): string {
  return order.items
    .map(
      (item) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid ${COLOR.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLOR.ink};">
${escapeHtml(item.productName)}
<span style="display:block;color:${COLOR.inkFaint};font-size:12px;">${item.quantity} &times; ${escapeHtml(formatPrice(item.unitPrice))}</span>
</td>
<td align="right" style="padding:8px 0;border-bottom:1px solid ${COLOR.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${COLOR.ink};white-space:nowrap;">
${escapeHtml(formatPrice(item.lineTotal))}
</td></tr>`,
    )
    .join("");
}

function totalsRows(order: OrderEmailData): string {
  const line = (label: string, value: string, bold = false) =>
    `<tr>
<td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${bold ? COLOR.ink : COLOR.inkSoft};${bold ? "font-weight:bold;" : ""}">${escapeHtml(label)}</td>
<td align="right" style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:${bold ? "15px" : "13px"};color:${COLOR.ink};${bold ? "font-weight:bold;" : ""}white-space:nowrap;">${escapeHtml(value)}</td>
</tr>`;

  return [
    line("Subtotal", formatPrice(order.subtotal)),
    // Left out when delivery was not charged, rather than reading "Free".
    order.shippingBasis === "DISABLED"
      ? ""
      : line(
          `Delivery — ${order.shippingLabel}`,
          order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee),
        ),
    order.rushFee > 0 ? line("Rush date", formatPrice(order.rushFee)) : "",
    line("Total", formatPrice(order.total), true),
  ].join("");
}

function itemsText(order: OrderEmailData): string {
  return order.items
    .map(
      (item) =>
        `  ${item.quantity} x ${item.productName} — ${formatPrice(item.lineTotal)}`,
    )
    .join("\n");
}

function totalsText(order: OrderEmailData): string {
  return [
    `  Subtotal: ${formatPrice(order.subtotal)}`,
    order.shippingBasis === "DISABLED"
      ? null
      : `  Delivery (${order.shippingLabel}): ${order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}`,
    order.rushFee > 0 ? `  Rush date: ${formatPrice(order.rushFee)}` : null,
    `  Total: ${formatPrice(order.total)}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/**
 * The requested delivery day as a block, or nothing when the order has no date.
 *
 * Given its own heading in both emails rather than tucked beside the address,
 * because it is the one thing the florist schedules around and the one thing a
 * customer will re-open the email to check.
 */
function deliveryDateHtml(order: OrderEmailData): string {
  if (!order.deliveryDate) return "";

  return `<h2 style="margin:24px 0 8px;font-size:15px;font-weight:normal;color:${COLOR.ink};">Arriving on</h2>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${COLOR.inkSoft};">
${escapeHtml(formatDeliveryDate(order.deliveryDate))}${order.rushFee > 0 ? " &middot; rush date" : ""}
</p>`;
}

/* --------------------------------------------------------- customer receipt */

/**
 * The customer's confirmation.
 *
 * The link is to `/orders/<accessToken>`, the same unguessable URL the
 * confirmation page uses — never the order number, because the page shows a home
 * address and the number is short enough to guess.
 */
export function buildCustomerOrderEmail(
  order: OrderEmailData,
  store: StoreContent,
): Message {
  const orderUrl = absoluteUrl(`/orders/${order.accessToken}`);
  const firstName = order.customerName.split(" ")[0] || order.customerName;

  const payingHtml =
    order.paymentMethod === "MANUAL"
      ? `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${COLOR.inkSoft};">${escapeHtml(store.manualPaymentInstructions)}</p>
${store.facebookUrl ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;"><a href="${escapeHtml(store.facebookUrl)}" style="color:${COLOR.moss700};">Message us on Facebook</a></p>` : ""}`
      : `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${COLOR.inkSoft};">Open your order to scan the QR Ph code. Codes expire after 30 minutes, and you can generate a fresh one from that page.</p>`;

  const html = shell(
    `<h1 style="margin:0 0 10px;font-size:23px;font-weight:normal;color:${COLOR.ink};">Thank you, ${escapeHtml(firstName)}</h1>
<p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${COLOR.inkSoft};">
We have your order and will start on it shortly. Keep this email — the link below is how you check on it and pay.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.moss50};border:1px solid ${COLOR.moss100};border-radius:10px;">
<tr><td style="padding:16px 18px;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR.moss700};">Order number</p>
<p style="margin:0;font-size:25px;letter-spacing:1px;font-weight:bold;color:${COLOR.moss900};">${escapeHtml(order.orderNumber)}</p>
</td></tr></table>

<p style="margin:20px 0 24px;">
<a href="${escapeHtml(orderUrl)}" style="display:inline-block;background-color:${COLOR.moss900};color:${COLOR.canvas};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;padding:13px 26px;border-radius:999px;">View your order</a>
</p>

<h2 style="margin:0 0 8px;font-size:15px;font-weight:normal;color:${COLOR.ink};">How to pay</h2>
${payingHtml}

${deliveryDateHtml(order)}

<h2 style="margin:24px 0 8px;font-size:15px;font-weight:normal;color:${COLOR.ink};">What you ordered</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemRows(order)}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">${totalsRows(order)}</table>

<h2 style="margin:24px 0 8px;font-size:15px;font-weight:normal;color:${COLOR.ink};">Delivering to</h2>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${COLOR.inkSoft};">
${addressLines(order).map(escapeHtml).join("<br>")}
</p>
${
  order.deliveryNotes
    ? `<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${COLOR.inkSoft};"><strong style="color:${COLOR.ink};">Notes:</strong> ${escapeHtml(order.deliveryNotes)}</p>`
    : ""
}`,
    store.storeName,
  );

  const text = [
    `Thank you, ${firstName}`,
    "",
    "We have your order and will start on it shortly.",
    "",
    `Order number: ${order.orderNumber}`,
    `View your order: ${orderUrl}`,
    "",
    "How to pay",
    order.paymentMethod === "MANUAL"
      ? `  ${store.manualPaymentInstructions}${store.facebookUrl ? `\n  Facebook: ${store.facebookUrl}` : ""}`
      : "  Open your order to scan the QR Ph code. Codes expire after 30 minutes.",
    "",
    order.deliveryDate
      ? `Arriving on\n  ${formatDeliveryDate(order.deliveryDate)}${order.rushFee > 0 ? " (rush date)" : ""}\n`
      : "",
    "What you ordered",
    itemsText(order),
    "",
    totalsText(order),
    "",
    "Delivering to",
    addressLines(order)
      .map((line) => `  ${line}`)
      .join("\n"),
    order.deliveryNotes ? `  Notes: ${order.deliveryNotes}` : "",
    "",
    store.storeName,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    to: order.customerEmail,
    subject: `Your order ${order.orderNumber} — ${store.storeName}`,
    html,
    text,
    // So a reply reaches a person rather than the void.
    replyTo: store.email || undefined,
  };
}

/* ------------------------------------------------------------- store alert */

/**
 * The shop's own notification. Contact details first, because that is what the
 * florist needs to act, and a link straight to the order in the admin panel.
 */
export function buildStoreOrderEmail(
  order: OrderEmailData,
  store: StoreContent,
  to: string,
  adminPath: string,
): Message {
  const adminUrl = absoluteUrl(adminPath);
  const method =
    order.paymentMethod === "MANUAL" ? "Manual payment (QR)" : "PayMongo QR Ph";

  const detail = (label: string, value: string) =>
    `<tr>
<td style="padding:5px 12px 5px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLOR.inkFaint};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLOR.ink};">${escapeHtml(value)}</td>
</tr>`;

  const html = shell(
    `<h1 style="margin:0 0 6px;font-size:21px;font-weight:normal;color:${COLOR.ink};">New order ${escapeHtml(order.orderNumber)}</h1>
<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${COLOR.inkSoft};">
${escapeHtml(formatPrice(order.total))} &middot; ${escapeHtml(method)} &middot; awaiting payment
</p>

${
  order.deliveryDate
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${order.rushFee > 0 ? "#fdf6f6" : COLOR.moss50};border:1px solid ${order.rushFee > 0 ? "#e3aeb4" : COLOR.moss100};border-radius:10px;margin-bottom:20px;">
<tr><td style="padding:14px 16px;">
<p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${order.rushFee > 0 ? "#b25a66" : COLOR.moss700};">Needed by${order.rushFee > 0 ? " &mdash; rush" : ""}</p>
<p style="margin:0;font-size:17px;font-weight:bold;color:${COLOR.ink};">${escapeHtml(formatDeliveryDate(order.deliveryDate))}</p>
</td></tr></table>`
    : ""
}

<p style="margin:0 0 22px;">
<a href="${escapeHtml(adminUrl)}" style="display:inline-block;background-color:${COLOR.moss900};color:${COLOR.canvas};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px;">Open in the admin panel</a>
</p>

<h2 style="margin:0 0 6px;font-size:15px;font-weight:normal;color:${COLOR.ink};">Customer</h2>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
${detail("Name", order.customerName)}
${detail("Email", order.customerEmail)}
${detail("Phone", order.customerPhone)}
</table>

<h2 style="margin:22px 0 6px;font-size:15px;font-weight:normal;color:${COLOR.ink};">Deliver to</h2>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${COLOR.inkSoft};">
${addressLines(order).map(escapeHtml).join("<br>")}
</p>
${
  order.deliveryNotes
    ? `<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${COLOR.inkSoft};"><strong style="color:${COLOR.ink};">Notes:</strong> ${escapeHtml(order.deliveryNotes)}</p>`
    : ""
}

<h2 style="margin:22px 0 6px;font-size:15px;font-weight:normal;color:${COLOR.ink};">Items</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemRows(order)}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">${totalsRows(order)}</table>`,
    store.storeName,
  );

  const text = [
    `New order ${order.orderNumber}`,
    `${formatPrice(order.total)} · ${method} · awaiting payment`,
    "",
    order.deliveryDate
      ? `Needed by: ${formatDeliveryDate(order.deliveryDate)}${order.rushFee > 0 ? " (RUSH)" : ""}\n`
      : "",
    `Open in the admin panel: ${adminUrl}`,
    "",
    "Customer",
    `  ${order.customerName}`,
    `  ${order.customerEmail}`,
    `  ${order.customerPhone}`,
    "",
    "Deliver to",
    addressLines(order)
      .map((line) => `  ${line}`)
      .join("\n"),
    order.deliveryNotes ? `  Notes: ${order.deliveryNotes}` : "",
    "",
    "Items",
    itemsText(order),
    "",
    totalsText(order),
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    to,
    // The date is in the subject so the shop can triage an inbox without opening
    // anything, and a rush order is obvious at a glance.
    subject: order.deliveryDate
      ? `${order.rushFee > 0 ? "RUSH — " : ""}New order ${order.orderNumber} for ${formatDeliveryDateShort(order.deliveryDate)} — ${formatPrice(order.total)}`
      : `New order ${order.orderNumber} — ${formatPrice(order.total)}`,
    html,
    text,
    // Replying goes to the customer, which is almost always what is wanted.
    replyTo: order.customerEmail,
  };
}

/* --------------------------------------------------------------- despatch */

/**
 * Sends both emails for a newly placed order.
 *
 * Called from `after()` in `placeOrder`, so it runs once the customer already has
 * their confirmation page — nobody waits on a mail provider to be told their order
 * went through.
 *
 * Returns a summary instead of throwing. The two messages are independent, and in
 * the default sandbox configuration the customer's genuinely does fail while the
 * store's succeeds; that must not be reported as a broken order.
 */
export async function sendOrderPlacedEmails(
  order: OrderEmailData,
  store: StoreContent,
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!isEmailConfigured()) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const messages: Message[] = [buildCustomerOrderEmail(order, store)];

  const inbox = storeInbox();

  // No CONTACT_TO_EMAIL means nobody has said where the shop's copy should go.
  if (inbox) {
    messages.push(
      buildStoreOrderEmail(order, store, inbox, `/admin/orders/${order.id}`),
    );
  }

  const summary = await sendEmails(messages);

  if (summary.failed > 0) {
    console.error(
      `Order ${order.orderNumber}: ${summary.sent} email(s) sent, ${summary.failed} failed.`,
    );
  }

  return summary;
}
