"use client";

import { useActionState, useState } from "react";
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
import type { ShippingContent } from "@/lib/shipping";
import { saveShipping } from "./actions";

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

  /**
   * Regions render above cities, and the `rateRemove-N` checkboxes have to line
   * up with the order the `rateId` inputs are submitted in. So the combined list
   * is built once, in render order, and each row carries its own index.
   */
  const ordered = [
    ...shipping.rates.filter((rate) => rate.scope === "REGION"),
    ...shipping.rates.filter((rate) => rate.scope === "CITY"),
  ].map((rate, index) => ({ rate, index }));

  const regionRates = ordered.filter((row) => row.rate.scope === "REGION");
  const cityRates = ordered.filter((row) => row.rate.scope === "CITY");

  function rateRows(rows: typeof ordered) {
    return rows.map(({ rate, index }) => {
      return (
        <li
          key={rate.id}
          className="grid gap-3 rounded-lg border border-canvas-deep px-3 py-2.5 sm:grid-cols-[1fr_8rem_auto] sm:items-center"
        >
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
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              name={`rateRemove-${index}`}
              className="h-4 w-4 accent-moss-700"
            />
            Remove
          </label>
        </li>
      );
    });
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
        description="A city rate beats a region rate, and the flat rate covers anything left over. So you can price a whole region and then correct individual cities."
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

        <LocationPicker
          value={location}
          onChange={setLocation}
          idPrefix="shipping-new"
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
