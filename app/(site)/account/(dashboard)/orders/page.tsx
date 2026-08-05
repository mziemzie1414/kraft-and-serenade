import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { requireCustomer } from "@/lib/customer-auth";
import { listCustomerOrders } from "@/lib/customer-queries";
import { ORDER_STATUS_LABELS } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

/** Enough of a hint to read at a glance without inventing a second colour system. */
const STATUS_CLASS: Record<string, string> = {
  PENDING_PAYMENT: "border-blush-300 bg-blush-50 text-blush-600",
  PAID: "border-moss-100 bg-moss-50 text-moss-700",
  FULFILLED: "border-moss-100 bg-moss-50 text-moss-700",
  CANCELLED: "border-canvas-deep bg-canvas-alt text-ink-faint",
};

export default async function AccountOrdersPage() {
  const customer = await requireCustomer();
  const orders = await listCustomerOrders(customer.id);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-canvas-deep p-12 text-center">
        <p className="font-display text-lg text-ink">No orders yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Orders you place while signed in show up here. Anything you ordered as a
          guest stays on its own confirmation link.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-moss-900 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
        >
          Browse bouquets
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-2xl border border-canvas-deep bg-canvas p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-semibold tracking-wide text-ink">
                {order.orderNumber}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {order.createdAt.toLocaleDateString("en-PH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  // Fixed so the server and the browser agree; otherwise the date
                  // can differ between the two renders and React complains.
                  timeZone: "Asia/Manila",
                })}
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                STATUS_CLASS[order.status] ?? STATUS_CLASS.CANCELLED
              }`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-canvas-deep">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
                <span className="text-xs text-ink-soft">
                  {item.productName}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4 border-t border-canvas-alt pt-4">
            <p className="font-display text-lg font-semibold text-ink">
              {formatPrice(order.total)}
            </p>

            {/* The confirmation page is the receipt, so it is what this links to
                rather than a second copy of it built for signed-in customers. */}
            <Link
              href={`/orders/${order.accessToken}`}
              className="text-sm font-semibold text-moss-700 underline-offset-4 hover:underline"
            >
              View order
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
