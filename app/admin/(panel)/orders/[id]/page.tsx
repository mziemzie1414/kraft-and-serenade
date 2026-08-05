import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/data";
import { getOrderById } from "@/lib/order-queries";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders";
import { StatusControls } from "../StatusControls";
import { StatusBadge, formatOrderDateTime } from "../ui";

export default async function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const addressLines = [
    order.street,
    order.barangay,
    [order.cityName, order.provinceName].filter(Boolean).join(", "),
    [order.regionName, order.postalCode].filter(Boolean).join(" "),
  ].filter((line) => line.trim().length > 0);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="text-xs font-semibold text-ink-faint underline-offset-4 hover:text-ink hover:underline"
      >
        &larr; All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-medium tracking-wide text-ink">
          {order.orderNumber}
        </h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Placed {formatOrderDateTime(order.createdAt)}
      </p>

      <div className="mt-6 space-y-4">
        <StatusControls
          orderId={order.id}
          status={order.status}
          isAutomatedPayment={order.paymentMethod === "PAYMONGO_QRPH"}
        />

        <section className="rounded-xl border border-canvas-deep bg-canvas p-5">
          <h2 className="font-display text-base font-medium text-ink">Customer</h2>

          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Name">{order.customerName}</Row>
            <Row label="Email">
              {/* Clickable so the florist can reply without retyping. */}
              <a
                href={`mailto:${order.customerEmail}`}
                className="text-moss-700 underline-offset-4 hover:underline"
              >
                {order.customerEmail}
              </a>
            </Row>
            <Row label="Phone">
              <a
                href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`}
                className="text-moss-700 underline-offset-4 hover:underline"
              >
                {order.customerPhone}
              </a>
            </Row>
            <Row label="Account">
              {order.customer ? (
                <>
                  {order.customer.name}{" "}
                  <span className="text-ink-faint">({order.customer.email})</span>
                </>
              ) : (
                <span className="text-ink-faint">
                  Ordered as a guest, no account
                </span>
              )}
            </Row>
          </dl>
        </section>

        <section className="rounded-xl border border-canvas-deep bg-canvas p-5">
          <h2 className="font-display text-base font-medium text-ink">Deliver to</h2>

          <address className="mt-3 text-sm leading-relaxed text-ink-soft not-italic">
            {addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>

          <p className="mt-3 text-xs text-ink-faint">
            Delivery charged as {order.shippingLabel} ({order.shippingBasis})
          </p>

          {order.deliveryNotes ? (
            <p className="mt-3 rounded-lg border border-canvas-deep bg-canvas-alt px-4 py-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">Notes:</span>{" "}
              {order.deliveryNotes}
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-canvas-deep bg-canvas p-5">
          <h2 className="font-display text-base font-medium text-ink">Payment</h2>

          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Method">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Row>
            <Row label="Paid">
              {order.paidAt ? (
                formatOrderDateTime(order.paidAt)
              ) : (
                <span className="text-ink-faint">Not yet</span>
              )}
            </Row>
            {order.paymongoPaymentIntentId ? (
              <Row label="Intent">
                <code className="text-xs">{order.paymongoPaymentIntentId}</code>
              </Row>
            ) : null}
            {order.paymongoPaymentId ? (
              <Row label="Payment">
                <code className="text-xs">{order.paymongoPaymentId}</code>
              </Row>
            ) : null}
            {order.qrExpiresAt ? (
              <Row label="QR expires">{formatOrderDateTime(order.qrExpiresAt)}</Row>
            ) : null}
          </dl>

          {/* The customer's own view, so the admin can see exactly what they see. */}
          <Link
            href={`/orders/${order.accessToken}`}
            className="mt-4 inline-block text-xs font-semibold text-moss-700 underline-offset-4 hover:underline"
          >
            Open the customer&rsquo;s confirmation page
          </Link>
        </section>

        <section className="rounded-xl border border-canvas-deep bg-canvas p-5">
          <h2 className="font-display text-base font-medium text-ink">
            Items
            <span className="ml-2 text-xs font-normal text-ink-faint">
              as priced when the order was placed
            </span>
          </h2>

          <ul className="mt-3 space-y-3 border-b border-canvas-deep pb-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-canvas-deep">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
                <span className="min-w-0 flex-1">
                  {/* The product may since have been deleted, which nulls the
                      relation but never the snapshot on the line. */}
                  {item.productId ? (
                    <Link
                      href={`/admin/products/${item.productId}`}
                      className="block truncate text-sm font-medium text-ink underline-offset-4 hover:underline"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-medium text-ink">
                      {item.productName}{" "}
                      <span className="text-xs font-normal text-ink-faint">
                        (deleted)
                      </span>
                    </span>
                  )}
                  <span className="block text-xs text-ink-faint">
                    {item.quantity} &times; {formatPrice(item.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="text-ink">
                {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-canvas-deep pt-2">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-display text-lg font-semibold text-ink">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <dt className="w-24 shrink-0 text-xs text-ink-faint">{label}</dt>
      <dd className="min-w-0 flex-1 text-ink">{children}</dd>
    </div>
  );
}
