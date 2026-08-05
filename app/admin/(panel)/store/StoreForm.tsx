"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  Field,
  Fieldset,
  PrimaryButton,
  StatusMessage,
  inputClass,
  labelClass,
} from "@/components/admin/ui";
import { IDLE } from "@/components/admin/form-state";
import type { StoreContent } from "@/lib/store";
import { saveStore } from "./actions";

/** Blank rows appended so a new line can always be added without JavaScript. */
const SPARE_ROWS = 2;

export function StoreForm({
  store,
  version,
}: {
  store: StoreContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveStore, IDLE);

  const hourRows = [
    ...store.businessHours,
    ...Array.from({ length: SPARE_ROWS }, () => ({ days: "", hours: "" })),
  ];

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" hint="Used in the logo, footer and page titles.">
            <input
              name="storeName"
              defaultValue={store.storeName}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Tagline">
            <input
              name="tagline"
              defaultValue={store.tagline}
              className={inputClass}
              required
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        title="Logo"
        description="Upload a custom logo to replace the default text logo in the navbar and footer. Leave empty to keep the built-in one."
      >
        <div>
          <span className={labelClass}>Logo image</span>
          <input type="hidden" name="logoUrl" value={store.logoUrl ?? ""} />
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt="Current logo"
                width={store.logoWidth ?? 160}
                height={store.logoHeight ?? 48}
                className="rounded-lg border border-canvas-deep object-contain p-2"
                unoptimized
              />
            ) : (
              <span className="flex h-12 w-40 items-center justify-center rounded-lg border border-dashed border-canvas-deep text-xs text-ink-faint">
                Using default
              </span>
            )}
            <input
              type="file"
              name="logoUrlFile"
              accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
              aria-label="Upload logo"
              className="text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-moss-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-canvas hover:file:bg-moss-700"
            />
            {store.logoUrl ? (
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  name="logoRemove"
                  className="h-4 w-4 accent-moss-700"
                />
                Remove
              </label>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-ink-faint">
            Optional. Accepts PNG, JPEG, WebP, AVIF or SVG.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display width (px)" hint="How wide the logo renders in the navbar.">
            <input
              name="logoWidth"
              type="number"
              min={20}
              max={400}
              defaultValue={store.logoWidth ?? ""}
              placeholder="e.g. 160"
              className={inputClass}
            />
          </Field>
          <Field label="Display height (px)" hint="How tall the logo renders in the navbar.">
            <input
              name="logoHeight"
              type="number"
              min={16}
              max={200}
              defaultValue={store.logoHeight ?? ""}
              placeholder="e.g. 48"
              className={inputClass}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input
              name="email"
              type="email"
              defaultValue={store.email}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Phone">
            <input
              name="phone"
              defaultValue={store.phone}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="Store address" hint="One line per row.">
          <textarea
            name="addressLines"
            defaultValue={store.addressLines.join("\n")}
            rows={3}
            className={inputClass}
            required
          />
        </Field>

        <Field
          label="Facebook page"
          hint="Manual-payment customers are told to message this page with their order number."
        >
          <input
            name="facebookUrl"
            type="url"
            defaultValue={store.facebookUrl}
            placeholder="https://facebook.com/yourpage"
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Opening hours"
        description="Shown in the footer. Clear a label to delete that row; fill a blank row to add one."
      >
        <ul className="space-y-2">
          {hourRows.map((row, index) => (
            <li key={index} className="grid gap-2 sm:grid-cols-2">
              <input
                name="hourDays"
                defaultValue={row.days}
                placeholder="Monday – Friday"
                aria-label={`Row ${index + 1} days`}
                className={inputClass}
              />
              <input
                name="hourHours"
                defaultValue={row.hours}
                placeholder="8:00 AM – 7:00 PM"
                aria-label={`Row ${index + 1} hours`}
                className={inputClass}
              />
            </li>
          ))}
        </ul>
      </Fieldset>

      <Fieldset
        title="Manual payment"
        description="Customers scan this QR code, then send their order number to your Facebook page. Without a QR code, manual payment is not offered at checkout."
      >
        <div>
          <span className={labelClass}>Payment QR code</span>
          <input
            type="hidden"
            name="manualPaymentQrUrl"
            value={store.manualPaymentQrUrl ?? ""}
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            {store.manualPaymentQrUrl ? (
              <Image
                src={store.manualPaymentQrUrl}
                alt=""
                width={112}
                height={112}
                className="h-28 w-28 rounded-lg border border-canvas-deep object-contain"
                unoptimized
              />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-canvas-deep text-xs text-ink-faint">
                None yet
              </span>
            )}
            <input
              type="file"
              name="manualPaymentQrUrlFile"
              accept="image/jpeg,image/png,image/webp,image/avif"
              aria-label="Upload payment QR code"
              className="text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-moss-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-canvas hover:file:bg-moss-700"
            />
            {store.manualPaymentQrUrl ? (
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  name="manualPaymentQrRemove"
                  className="h-4 w-4 accent-moss-700"
                />
                Remove
              </label>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-ink-faint">
            Optional. Leave empty to keep the current code.
          </p>
        </div>

        <Field label="Instructions" hint="Shown next to the QR code and order number.">
          <textarea
            name="manualPaymentInstructions"
            defaultValue={store.manualPaymentInstructions}
            rows={3}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : "Save store details"}
        </PrimaryButton>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
