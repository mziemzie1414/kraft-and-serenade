import type { Metadata } from "next";
import { formatPrice } from "@/lib/data";
import { getShipping } from "@/lib/shipping-queries";
import { CartContents } from "./CartContents";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const shipping = await getShipping();

  /**
   * The exact fee needs an address, which is collected at checkout. Until then
   * say what it will be based on rather than showing a number that might change.
   *
   * `null` when the shop does not charge for delivery, and the row is then left
   * out entirely rather than reading "Free" — see the note in CheckoutForm.
   */
  const shippingNote = !shipping.isEnabled
    ? null
    : shipping.rates.length > 0
      ? "Calculated at checkout"
      : `${formatPrice(shipping.flatRate)}, added at checkout`;

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-12 sm:pt-36">
        <div className="container-page">
          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-canvas sm:text-4xl">
            Your cart
          </h1>
        </div>
      </header>

      <section className="bg-canvas py-12 sm:py-16">
        <div className="container-page">
          <CartContents shippingNote={shippingNote} />
        </div>
      </section>
    </>
  );
}
