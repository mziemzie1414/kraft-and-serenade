"use client";

import { useActionState, useState, useTransition } from "react";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  PrimaryButton,
  StatusMessage,
  inputClass,
  labelClass,
} from "@/components/admin/ui";
import {
  EMPTY_LOCATION,
  LocationPicker,
  type LocationValue,
} from "@/components/ui/LocationPicker";
import type { ShippingContent, ShippingRateRow } from "@/lib/shipping";
import { deleteShippingRate, saveShipping } from "./actions";

/**
 * One saved rate: its label, an editable fee, and a delete button.
 *
 * The fee input belongs to the surrounding form and is saved with everything else.
 * Delete is immediate and independent — but it cannot be its own `<form>`, because
 * this row is already inside one and nested forms are invalid HTML. So the button
 * is `type="button"` and calls the Server Action directly, which also means it can
 * send exactly this row's id rather than relying on input order.
 */
function RateRow({ rate }: { rate: ShippingRateRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    // Cheap to undo — the rate can be re-added — but one click is sharp for
    // something that silently changes what customers are charged.
    if (!window.confirm(`Remove the delivery rate for ${rate.label}?`)) return;

    startTransition(async () => {
      const data = new FormData();
      data.set("rateId", rate.id);

      const result = await deleteShippingRate(IDLE, data);

      // On success the action revalidates and this row goes away with the page.
      setError(result.status === "error" ? (result.message ?? "Failed") : null);
    });
  }

  return (
    <li className="rounded-lg border border-canvas-deep px-3 py-2.5">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-center">
        <input type="hidden" name="rateId" value={rate.id} />

        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">
            {rate.label}
          </span>
          <span className="block font-mono text-xs text-ink-faint">
            {rate.psgcCode}
          </span>
        </span>

        <input
          name="rateFee"
          type="number"
          min={0}
          step={1}
          defaultValue={rate.fee}
          aria-label={`Fee for ${rate.label}`}
          className={inputClass}
        />

        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label={`Remove the rate for ${rate.label}`}
          className="justify-self-start rounded-full border border-blush-500 px-4 py-1.5 text-xs font-semibold text-blush-600 transition-colors hover:bg-blush-50 disabled:opacity-60 sm:justify-self-end"
        >
          {pending ? "Removing…" : "Remove"}
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-blush-600">{error}</p> : null}
    </li>
  );
}

export function ShippingForm({
  shipping,
  version,
}: {
  shipping: ShippingContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveShipping, IDLE);
  const [scope, setScope] = useState<"REGION" | "CITY">("REGION");
  const [location, setLocation] = useState<LocationValue>(EMPTY_LOCATION);

  // A region rate keys off the region; a city rate needs the city chosen.
  const newCode = scope === "CITY" ? location.cityCode : location.regionCode;
  const newLabel = scope === "CITY" ? location.cityName : location.regionName;

  const regionRates = shipping.rates.filter((rate) => rate.scope === "REGION");
  const cityRates = shipping.rates.filter((rate) => rate.scope === "CITY");

  /**
   * The fee inputs are paired to their ids by position, so `rateId` and `rateFee`
   * must be emitted together on every row and in one consistent order.
   *
   * Removal is not part of this form — see `RateRow`.
   */
  function rateRows(rows: ShippingContent["rates"]) {
    return rows.map((rate) => <RateRow key={rate.id} rate={rate} />);
  }

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset
        title="Delivery charge"
        description="Switch this off to stop adding a delivery charge at checkout entirely."
      >
        <label className="flex items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="isEnabled"
            defaultChecked={shipping.isEnabled}
            className="h-4 w-4 accent-moss-700"
          />
          Charge for delivery
        </label>

        <Field
          label="Flat rate"
          hint="Whole pesos. Used when no city or region rate matches the address."
        >
          <input
            name="flatRate"
            type="number"
            min={0}
            step={1}
            defaultValue={shipping.flatRate}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Rates by location"
        description="A city rate beats a region rate, and the flat rate covers anything left over. So you can price a whole region and then correct individual cities. Changed fees are saved with the button at the bottom; Remove takes effect straight away."
      >
        {shipping.rates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-canvas-deep px-3 py-6 text-center text-sm text-ink-soft">
            No location rates yet — every address pays the flat rate.
          </p>
        ) : (
          <>
            {regionRates.length > 0 ? (
              <div>
                <span className={labelClass}>Regions</span>
                <ul className="mt-2 space-y-2">{rateRows(regionRates)}</ul>
              </div>
            ) : null}

            {cityRates.length > 0 ? (
              <div>
                <span className={labelClass}>Cities and municipalities</span>
                <ul className="mt-2 space-y-2">{rateRows(cityRates)}</ul>
              </div>
            ) : null}
          </>
        )}
      </Fieldset>

      <Fieldset
        title="Add a rate"
        description="Pick a location and a fee, then save. Leave this empty to change only the rates above."
      >
        <div>
          <span className={labelClass}>Applies to</span>
          <div className="mt-1.5 flex gap-4">
            {(["REGION", "CITY"] as const).map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 text-sm text-ink-soft"
              >
                <input
                  type="radio"
                  name="newScope"
                  value={option}
                  checked={scope === option}
                  onChange={() => setScope(option)}
                  className="h-4 w-4 accent-moss-700"
                />
                {option === "REGION" ? "A whole region" : "One city or municipality"}
              </label>
            ))}
          </div>
        </div>

        {/* Not required: this section is empty most of the time, and marking the
            selects required made an untouched picker block every save on the page.
            The action ignores the section unless a location was actually picked. */}
        <LocationPicker
          value={location}
          onChange={setLocation}
          idPrefix="shipping-new"
          required={false}
          inputClassName={inputClass}
          labelClassName={labelClass}
        />

        {/* The picker submits its own hidden fields; these are the ones the
            action reads, narrowed to the chosen scope. */}
        <input type="hidden" name="newPsgcCode" value={newCode} />
        <input type="hidden" name="newLabel" value={newLabel} />

        <Field label="Fee" hint="Whole pesos.">
          <input
            name="newFee"
            type="number"
            min={0}
            step={1}
            defaultValue=""
            placeholder="0"
            className={inputClass}
          />
        </Field>

        {newLabel ? (
          <p className="text-sm text-ink-soft">
            Will add a rate for <strong className="text-ink">{newLabel}</strong>.
          </p>
        ) : null}
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : "Save shipping"}
        </PrimaryButton>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
