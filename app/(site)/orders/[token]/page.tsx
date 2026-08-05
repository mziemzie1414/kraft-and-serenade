import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/data";
import { getOrderByToken } from "@/lib/order-queries";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { getStore } from "@/lib/store";
import { ClearCart } from "./ClearCart";
import { QrPhPanel } from "./QrPhPanel";

export const metadata: Metadata = {
  title: "Your order",
  // Confirmation pages carry a name, phone number and address.
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: PageProps<"/orders/[token]">) {
  const { token } = await params;

  /**
   * Looked up by the unguessable token, never by the order number. The number is
   * short so it can be read aloud, which also makes it guessable — and this page
   * shows a home address.
   */
  const order = await getOrderByToken(token);

  if (!order) notFound();

  const store = await getStore();
  const isManual = order.paymentMethod === "MANUAL";

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-12 sm:pt-36">
        <div className="container-page">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-canvas/10 px-3.5 py-1.5 text-xs font-medium text-canvas/90">
            <CheckIcon className="h-3.5 w-3.5 text-blush-300" />
            Order received
          </p>
          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-canvas sm:text-4xl">
            Thank you, {order.customerName.split(" ")[0]}
          </h1>
          <p className="mt-3 text-sm text-canvas/70">
            We have emailed nothing yet — this page is your receipt, so keep the
            link. Your order number is below.
          </p>
        </div>
      </header>

      {/* The order owns these items now, so empty the browser's cart. */}
      <ClearCart />

      <section className="bg-canvas py-12 sm:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <div className="space-y-8">
            {/* Order number, given prominence because it is what the customer has
                to quote when paying manually. */}
            <div className="rounded-2xl border border-moss-100 bg-moss-50 p-6">
              <p className="text-xs font-semibold tracking-[0.18em] text-moss-700 uppercase">
                Order number
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-wide text-moss-900 sm:text-4xl">
                {order.orderNumber}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Status: {ORDER_STATUS_LABELS[order.status]}
              </p>
            </div>

            {order.status === "PAID" ? (
              <div className="rounded-2xl border border-moss-100 bg-canvas p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-medium text-moss-700">
                  <CheckIcon className="h-4 w-4" />
                  Payment received
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Nothing more to do. We will start building your bouquet and let you
                  know when it is on its way.
                </p>
              </div>
            ) : order.paymentMethod === "PAYMONGO_QRPH" ? (
              <QrPhPanel
                token={order.accessToken}
                total={order.total}
                qrCodeImage={order.qrCodeImage}
                expiresAt={order.qrExpiresAt?.toISOString() ?? null}
                expired={order.qrExpired}
              />
            ) : null}

            {order.status !== "PAID" && isManual ? (
              <div className="rounded-2xl border border-canvas-deep p-6">
                <h2 className="font-display text-lg font-medium text-ink">
                  How to pay
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {store.manualPaymentInstructions}
                </p>

                {store.manualPaymentQrUrl ? (
                  <div className="mt-5">
                    <Image
                      src={store.manualPaymentQrUrl}
                      alt="Payment QR code"
                      width={220}
                      height={220}
                      className="rounded-xl border border-canvas-deep bg-white p-3"
                    />
                  </div>
                ) : null}

                <ol className="mt-5 space-y-2 text-sm text-ink-soft">
                  <li>
                    1. Pay {formatPrice(order.total)}
                    {store.manualPaymentQrUrl ? " using the QR code above" : ""}.
                  </li>
                  <li>
                    2. Send us <strong className="text-ink">{order.orderNumber}</strong>{" "}
                    on Facebook with a screenshot of the receipt.
                  </li>
                  <li>3. We confirm and start building your bouquet.</li>
                </ol>

                <a
                  href={store.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-moss-900 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
                >
                  Message us on Facebook
                </a>
              </div>
            ) : null}

            <div>
              <h2 className="font-display text-lg font-medium text-ink">
                Delivering to
              </h2>
              <address className="mt-3 text-sm leading-relaxed text-ink-soft not-italic">
                <span className="block font-medium text-ink">
                  {order.customerName}
                </span>
                <span className="block">{order.street}</span>
                <span className="block">Barangay {order.barangay}</span>
                <span className="block">
                  {[order.cityName, order.provinceName].filter(Boolean).join(", ")}
                </span>
                <span className="block">
                  {[order.regionName, order.postalCode].filter(Boolean).join(" ")}
                </span>
                <span className="mt-2 block">{order.customerPhone}</span>
                <span className="block">{order.customerEmail}</span>
              </address>

              {order.deliveryNotes ? (
                <p className="mt-4 rounded-lg border border-canvas-deep bg-canvas-alt px-4 py-3 text-sm text-ink-soft">
                  <span className="font-medium text-ink">Notes:</span>{" "}
                  {order.deliveryNotes}
                </p>
              ) : null}
            </div>
          </div>

          {/* Receipt */}
          <div>
            <div className="rounded-2xl border border-canvas-deep bg-canvas-alt p-6">
              <h2 className="font-display text-lg font-medium text-ink">
                What you ordered
              </h2>

              <ul className="mt-4 space-y-3 border-b border-canvas-deep pb-4">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-canvas-deep">
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {item.productName}
                      </span>
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

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-soft">
                    Delivery
                    <span className="block text-xs text-ink-faint">
                      {order.shippingLabel}
                    </span>
                  </dt>
                  <dd className="text-ink">
                    {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-canvas-deep pt-3">
                  <dt className="font-semibold text-ink">Total</dt>
                  <dd className="font-display text-xl font-semibold text-ink">
                    {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>
            </div>

            <Link
              href="/products"
              className="mt-4 block text-center text-sm font-semibold text-moss-700 underline-offset-4 hover:underline"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
