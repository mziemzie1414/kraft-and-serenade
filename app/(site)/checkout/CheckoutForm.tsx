"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { HydratedCart } from "@/lib/cart-server";
import { formatPrice } from "@/lib/data";
import { resolveShippingFee, type ShippingContent } from "@/lib/shipping";
import {
  EMPTY_LOCATION,
  LocationPicker,
  type LocationValue,
} from "@/components/ui/LocationPicker";
import { placeOrder, type CheckoutState } from "./actions";

const IDLE: CheckoutState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-canvas-deep bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-moss-400 focus:outline-none";

const labelClass = "block text-xs font-semibold tracking-wide text-ink-soft uppercase";

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function CheckoutForm({
  cart,
  shipping,
  hasPaymentQr,
  qrPhAvailable,
}: {
  cart: HydratedCart;
  shipping: ShippingContent;
  hasPaymentQr: boolean;
  qrPhAvailable: boolean;
}) {
  const [state, formAction, pending] = useActionState(placeOrder, IDLE);
  const [location, setLocation] = useState<LocationValue>(EMPTY_LOCATION);
  // Prefilled from PSGC when it knows the code, but always editable.
  const [postalCode, setPostalCode] = useState("");
  const [postalTouched, setPostalTouched] = useState(false);

  /**
   * The live figure, from the same pure function the server uses when the order
   * is created — so the number here and the number charged come from one place.
   */
  const resolved = location.cityCode
    ? resolveShippingFee(shipping, {
        regionCode: location.regionCode,
        cityCode: location.cityCode,
      })
    : null;

  const total = cart.subtotal + (resolved?.fee ?? 0);

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
      <div className="space-y-8">
        <fieldset>
          <legend className="font-display text-lg font-medium text-ink">
            Contact
          </legend>
          <p className="mt-1 text-sm text-ink-soft">
            So we can confirm the order and let you know when it is on the way.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Full name" htmlFor="customerName">
              <input
                id="customerName"
                name="customerName"
                autoComplete="name"
                required
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="customerEmail">
                <input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={state.field === "customerEmail"}
                  className={inputClass}
                />
              </Field>
              <Field label="Phone number" htmlFor="customerPhone">
                <input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                  required
                  aria-invalid={state.field === "customerPhone"}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-lg font-medium text-ink">
            Delivery address
          </legend>
          <p className="mt-1 text-sm text-ink-soft">
            The delivery charge depends on the city, so pick that first.
          </p>

          <div className="mt-5 space-y-4">
            <LocationPicker
              value={location}
              onChange={(next) => {
                setLocation(next);

                // Fill the postal code from PSGC unless it has been edited by hand.
                if (!postalTouched) setPostalCode(next.zipCode);
              }}
              idPrefix="checkout"
              inputClassName={inputClass}
              labelClassName={labelClass}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Barangay" htmlFor="barangay">
                <input
                  id="barangay"
                  name="barangay"
                  autoComplete="address-level4"
                  required
                  className={inputClass}
                />
              </Field>
              <Field
                label="Postal code"
                htmlFor="postalCode"
                hint="Filled in automatically where we know it."
              >
                <input
                  id="postalCode"
                  name="postalCode"
                  value={postalCode}
                  onChange={(event) => {
                    setPostalCode(event.target.value);
                    setPostalTouched(true);
                  }}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Street address"
              htmlFor="street"
              hint="House or unit number, building and street."
            >
              <input
                id="street"
                name="street"
                autoComplete="address-line1"
                required
                className={inputClass}
              />
            </Field>

            <Field
              label="Delivery notes"
              htmlFor="deliveryNotes"
              hint="Optional. Landmarks, gate instructions, or what to write on the card."
            >
              <textarea
                id="deliveryNotes"
                name="deliveryNotes"
                rows={3}
                className={inputClass}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-lg font-medium text-ink">Payment</legend>

          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-canvas-deep p-4 transition-colors hover:border-moss-400">
              <input
                type="radio"
                name="paymentMethod"
                value="MANUAL"
                defaultChecked
                required
                className="mt-1 h-4 w-4 accent-moss-700"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  {hasPaymentQr ? "Pay by QR code" : "Arrange payment with us"}
                </span>
                <span className="mt-0.5 block text-xs text-ink-soft">
                  {hasPaymentQr
                    ? "Scan our QR code, then send us your order number to confirm."
                    : "Send us your order number on Facebook and we will confirm how to pay."}
                </span>
              </span>
            </label>

            <label
              className={`flex gap-3 rounded-xl border border-canvas-deep p-4 transition-colors ${
                qrPhAvailable ? "cursor-pointer hover:border-moss-400" : "opacity-50"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="PAYMONGO_QRPH"
                disabled={!qrPhAvailable}
                className="mt-1 h-4 w-4 accent-moss-700"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">QR Ph</span>
                <span className="mt-0.5 block text-xs text-ink-soft">
                  {qrPhAvailable
                    ? "Pay straight away from any QR Ph banking or e-wallet app."
                    : "Not available — card payments are not configured."}
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-canvas-deep bg-canvas-alt p-6">
          <h2 className="font-display text-lg font-medium text-ink">Your order</h2>

          <ul className="mt-4 space-y-3 border-b border-canvas-deep pb-4">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
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
                    {item.name}
                  </span>
                  <span className="block text-xs text-ink-faint">
                    {item.quantity} &times; {formatPrice(item.price)}
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
              <dd className="text-ink">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">
                Delivery
                {resolved ? (
                  <span className="block text-xs text-ink-faint">
                    {resolved.label}
                  </span>
                ) : null}
              </dt>
              <dd className="text-ink">
                {resolved ? (
                  resolved.fee === 0 ? (
                    "Free"
                  ) : (
                    formatPrice(resolved.fee)
                  )
                ) : (
                  <span className="text-ink-faint">Pick a city</span>
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-canvas-deep pt-3">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-display text-xl font-semibold text-ink">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-full bg-moss-900 px-6 py-4 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-moss-700 disabled:opacity-60"
          >
            {pending ? "Placing your order…" : "Place order"}
          </button>

          {/* Announced politely so the error is heard without stealing focus. */}
          <div aria-live="polite" className="min-h-6 pt-3">
            {state.status === "error" && state.message ? (
              <p className="text-sm text-blush-600">{state.message}</p>
            ) : null}
          </div>

          <Link
            href="/cart"
            className="mt-1 block text-center text-xs font-semibold text-ink-faint underline-offset-4 hover:text-ink hover:underline"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </form>
  );
}
