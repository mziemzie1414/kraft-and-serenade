import type { Metadata } from "next";
import Link from "next/link";
import { getCart } from "@/lib/cart-server";
import { getCustomerSummary } from "@/lib/customer-auth";
import { listAddresses } from "@/lib/customer-queries";
import { isPaymongoConfigured } from "@/lib/paymongo";
import { getShipping } from "@/lib/shipping-queries";
import { getStore } from "@/lib/store";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  /**
   * Read on the server from the cart cookie, unlike the cart page which prices
   * client-side. Checkout has to be dynamic anyway, and this way the summary the
   * customer confirms is rendered from the same data the order is built from.
   */
  const [cart, shipping, store, customer] = await Promise.all([
    getCart(),
    getShipping(),
    getStore(),
    /**
     * Read here rather than through the navbar's client store, because the form is
     * server-rendered from it — prefilled contact details and a preselected saved
     * address have to be in the first paint, not fetched afterwards. Checkout is
     * dynamic anyway, so this costs nothing extra.
     */
    getCustomerSummary(),
  ]);

  const savedAddresses = customer ? await listAddresses(customer.id) : [];

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-12 sm:pt-36">
        <div className="container-page">
          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-canvas sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-3 text-sm text-canvas/70">
            {customer
              ? "Your saved address is filled in below. Change anything you need to."
              : "No account needed. You can make one as you go and we will keep this address."}
          </p>
        </div>
      </header>

      <section className="bg-canvas py-12 sm:py-16">
        <div className="container-page">
          {cart.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-canvas-deep p-12 text-center">
              <p className="font-display text-lg text-ink">
                There is nothing to check out
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Your cart is empty, so there is no order to place.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-moss-900 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
              >
                Browse bouquets
              </Link>
            </div>
          ) : (
            <CheckoutForm
              cart={cart}
              shipping={shipping}
              /* The QR is a convenience. Without one, manual payment still works
                 off the order number and the Facebook page. */
              hasPaymentQr={Boolean(store.manualPaymentQrUrl)}
              qrPhAvailable={isPaymongoConfigured()}
              customer={customer}
              savedAddresses={savedAddresses}
            />
          )}
        </div>
      </section>
    </>
  );
}
