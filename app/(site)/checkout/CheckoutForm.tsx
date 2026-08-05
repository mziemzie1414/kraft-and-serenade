"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { HydratedCart } from "@/lib/cart-server";
import {
  formatAddressLine,
  looksLikeEmail,
  looksLikePhone,
  type CustomerSummary,
  type SavedAddress,
} from "@/lib/customer";
import { formatPrice } from "@/lib/data";
import { resolveShippingFee, type ShippingContent } from "@/lib/shipping";
import {
  EMPTY_LOCATION,
  LocationPicker,
  type LocationValue,
} from "@/components/ui/LocationPicker";
import { Field, inputClass, labelClass } from "@/components/ui/form";
import { placeOrder, type CheckoutState } from "./actions";
import { SignUpDialog } from "./SignUpDialog";

const IDLE: CheckoutState = { status: "idle" };

/** Sentinel for the "type it in myself" option in the saved-address select. */
const NEW_ADDRESS = "new";

export function CheckoutForm({
  cart,
  shipping,
  hasPaymentQr,
  qrPhAvailable,
  customer,
  savedAddresses,
}: {
  cart: HydratedCart;
  shipping: ShippingContent;
  hasPaymentQr: boolean;
  qrPhAvailable: boolean;
  /** `null` for a guest, which is still the normal way to order here. */
  customer: CustomerSummary | null;
  savedAddresses: SavedAddress[];
}) {
  const [state, formAction, pending] = useActionState(placeOrder, IDLE);

  /**
   * Contact details are controlled rather than left to the DOM, because the sign-up
   * dialog is prefilled from them. Reading them off refs at the moment the dialog
   * opens would work too, but then the dialog would not follow a later correction.
   */
  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");

  const defaultAddress = savedAddresses.find((address) => address.isDefault);

  const [addressId, setAddressId] = useState(defaultAddress?.id ?? NEW_ADDRESS);

  /* Address fields, controlled so picking a saved address can fill them in. */
  const [location, setLocation] = useState<LocationValue>(
    defaultAddress ? toLocation(defaultAddress) : EMPTY_LOCATION,
  );
  const [barangay, setBarangay] = useState(defaultAddress?.barangay ?? "");
  const [street, setStreet] = useState(defaultAddress?.street ?? "");
  const [deliveryNotes, setDeliveryNotes] = useState(
    defaultAddress?.deliveryNotes ?? "",
  );
  // Prefilled from PSGC when it knows the code, but always editable.
  const [postalCode, setPostalCode] = useState(defaultAddress?.postalCode ?? "");
  const [postalTouched, setPostalTouched] = useState(
    Boolean(defaultAddress?.postalCode),
  );

  const [signUpOpen, setSignUpOpen] = useState(false);
  /**
   * Tracked here as well as on the server, because signing up does not navigate —
   * so the `customer` prop this page was rendered with stays `null` afterwards.
   * The order action reads the real session; this is only for what is on screen.
   */
  const [signedUp, setSignedUp] = useState(false);

  const hasAccount = Boolean(customer) || signedUp;

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

  /* An account needs both, and there is no point offering one before they are typed. */
  const canSignUp = looksLikeEmail(email) && looksLikePhone(phone);

  function chooseAddress(nextId: string) {
    setAddressId(nextId);

    if (nextId === NEW_ADDRESS) {
      setLocation(EMPTY_LOCATION);
      setBarangay("");
      setStreet("");
      setDeliveryNotes("");
      setPostalCode("");
      setPostalTouched(false);
      return;
    }

    const chosen = savedAddresses.find((address) => address.id === nextId);

    if (!chosen) return;

    setLocation(toLocation(chosen));
    setBarangay(chosen.barangay);
    setStreet(chosen.street);
    setDeliveryNotes(chosen.deliveryNotes ?? "");
    setPostalCode(chosen.postalCode);
    // A saved postal code is a deliberate one, so re-resolving the city must not
    // overwrite it.
    setPostalTouched(Boolean(chosen.postalCode));
  }

  return (
    <>
      <form
        action={formAction}
        className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14"
      >
        <div className="space-y-8">
          <fieldset>
            <legend className="font-display text-lg font-medium text-ink">
              Contact
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              So we can confirm the order and let you know when it is on the way.
            </p>

            {!hasAccount ? (
              <p className="mt-3 text-sm text-ink-soft">
                Ordered before?{" "}
                <Link
                  href="/account/login?next=/account"
                  className="font-semibold text-moss-700 underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to fill this in from a saved address.
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <Field label="Full name" htmlFor="customerName">
                <input
                  id="customerName"
                  name="customerName"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
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
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
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
              {savedAddresses.length > 0 ? (
                <Field label="Saved addresses" htmlFor="savedAddress">
                  <select
                    id="savedAddress"
                    value={addressId}
                    onChange={(event) => chooseAddress(event.target.value)}
                    className={inputClass}
                  >
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label
                          ? `${address.label} — ${formatAddressLine(address)}`
                          : formatAddressLine(address)}
                      </option>
                    ))}
                    <option value={NEW_ADDRESS}>Somewhere else…</option>
                  </select>
                </Field>
              ) : null}

              <LocationPicker
                value={location}
                onChange={(next) => {
                  setLocation(next);

                  // Editing the address by hand means it is no longer the saved one.
                  setAddressId(NEW_ADDRESS);

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
                    value={barangay}
                    onChange={(event) => setBarangay(event.target.value)}
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
                  value={street}
                  onChange={(event) => setStreet(event.target.value)}
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
                  value={deliveryNotes}
                  onChange={(event) => setDeliveryNotes(event.target.value)}
                  className={inputClass}
                />
              </Field>

              {hasAccount ? (
                <label className="flex items-center gap-2.5 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    name="saveAddress"
                    defaultChecked
                    className="h-4 w-4 accent-moss-700"
                  />
                  Keep this address on my account
                </label>
              ) : null}
            </div>
          </fieldset>

          {/* Sign-up sits between the address and the payment choice on purpose:
              the details it needs are all above it, and it must not look like a
              step standing between the customer and paying. */}
          {!hasAccount ? (
            <div className="rounded-2xl border border-dashed border-canvas-deep p-5">
              <h2 className="font-display text-base font-medium text-ink">
                Want us to remember this?
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Make an account and this address is saved for next time. Your order
                is not held up either way.
              </p>

              <button
                type="button"
                onClick={() => setSignUpOpen(true)}
                disabled={!canSignUp}
                className="mt-4 rounded-full border border-moss-400 px-5 py-2.5 text-sm font-semibold text-moss-700 transition-colors hover:bg-moss-50 disabled:opacity-50"
              >
                Create an account
              </button>

              {!canSignUp ? (
                <p className="mt-2 text-xs text-ink-faint">
                  Fill in your email and phone number first — we will carry them
                  over.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-2xl border border-moss-100 bg-moss-50 px-5 py-4 text-sm text-moss-700">
              {signedUp
                ? "Your account is ready. This address will be saved with the order."
                : `Signed in as ${customer?.email}. This order will be added to your history.`}
            </p>
          )}

          <fieldset>
            <legend className="font-display text-lg font-medium text-ink">
              Payment
            </legend>

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

      {/* Outside the form above: a form inside a form is invalid HTML. */}
      <SignUpDialog
        open={signUpOpen}
        onClose={() => setSignUpOpen(false)}
        onCreated={() => {
          setSignedUp(true);
          setSignUpOpen(false);
        }}
        name={name}
        email={email}
        phone={phone}
      />
    </>
  );
}

/** A saved address in the shape `LocationPicker` works in. */
function toLocation(address: SavedAddress): LocationValue {
  return {
    regionCode: address.regionCode,
    regionName: address.regionName,
    provinceCode: address.provinceCode,
    provinceName: address.provinceName,
    cityCode: address.cityCode,
    cityName: address.cityName,
    zipCode: address.postalCode,
  };
}
