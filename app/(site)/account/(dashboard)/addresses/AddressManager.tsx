"use client";

import { useActionState, useEffect, useState } from "react";
import {
  EMPTY_LOCATION,
  LocationPicker,
  type LocationValue,
} from "@/components/ui/LocationPicker";
import { Field, FormMessage, inputClass, labelClass } from "@/components/ui/form";
import { formatAddressLine, type SavedAddress } from "@/lib/customer";
import { ACCOUNT_IDLE } from "../../actions";
import { deleteAddress, saveAddress, setDefaultAddress } from "./actions";

/**
 * The saved-address screen.
 *
 * One editor panel shared by "add" and "edit" rather than an inline form inside
 * every card. The form is tall — a cascading region/province/city picker plus five
 * text fields — and repeating that per card makes the list unreadable.
 */
export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [open, setOpen] = useState(addresses.length === 0);

  function startNew() {
    setEditing(null);
    setOpen(true);
  }

  function startEdit(address: SavedAddress) {
    setEditing(address);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          Checkout fills itself in from the default address, and you can pick any of
          these instead.
        </p>

        {addresses.length > 0 ? (
          <button
            type="button"
            onClick={startNew}
            className="rounded-full border border-canvas-deep px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            Add an address
          </button>
        ) : null}
      </div>

      {addresses.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => startEdit(address)}
            />
          ))}
        </ul>
      ) : null}

      {open ? (
        /**
         * Keyed on which address is being edited, so switching from one to another
         * — or to a blank form — remounts. React does not update `defaultValue` on
         * a mounted input, so without this the previous address's details would
         * stay on screen.
         */
        <AddressForm
          key={editing?.id ?? "new"}
          address={editing}
          onDone={() => {
            setOpen(false);
            setEditing(null);
          }}
          canCancel={addresses.length > 0}
        />
      ) : null}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
}: {
  address: SavedAddress;
  onEdit: () => void;
}) {
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteAddress,
    ACCOUNT_IDLE,
  );
  const [defaultState, defaultAction, settingDefault] = useActionState(
    setDefaultAddress,
    ACCOUNT_IDLE,
  );

  return (
    <li className="flex flex-col rounded-2xl border border-canvas-deep bg-canvas p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-base font-medium text-ink">
          {address.label || address.cityName}
        </p>
        {address.isDefault ? (
          <span className="shrink-0 rounded-full border border-moss-100 bg-moss-50 px-2.5 py-1 text-[0.65rem] font-semibold text-moss-700 uppercase">
            Default
          </span>
        ) : null}
      </div>

      <address className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft not-italic">
        <span className="block">{formatAddressLine(address)}</span>
        <span className="block">
          {[address.regionName, address.postalCode].filter(Boolean).join(" ")}
        </span>
      </address>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-canvas-alt pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-moss-700 underline-offset-4 hover:underline"
        >
          Edit
        </button>

        {!address.isDefault ? (
          <form action={defaultAction}>
            <input type="hidden" name="addressId" value={address.id} />
            <button
              type="submit"
              disabled={settingDefault}
              className="text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
            >
              {settingDefault ? "Setting…" : "Make default"}
            </button>
          </form>
        ) : null}

        <form action={deleteAction} className="ml-auto">
          <input type="hidden" name="addressId" value={address.id} />
          <button
            type="submit"
            disabled={deleting}
            className="text-sm font-semibold text-blush-600 underline-offset-4 hover:underline disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </form>
      </div>

      {/* Only failures need saying: a success is visible in the list itself. */}
      {deleteState.status === "error" || defaultState.status === "error" ? (
        <FormMessage
          status="error"
          message={deleteState.message ?? defaultState.message}
        />
      ) : null}
    </li>
  );
}

function AddressForm({
  address,
  onDone,
  canCancel,
}: {
  address: SavedAddress | null;
  onDone: () => void;
  canCancel: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveAddress, ACCOUNT_IDLE);

  /**
   * Close the panel once the save lands. The revalidated list above is the
   * confirmation, and leaving the form open would sit a filled-in copy of an
   * address directly underneath the card that now shows it.
   */
  const saved = state.status === "done";

  useEffect(() => {
    if (saved) onDone();
  }, [saved, onDone]);

  const [location, setLocation] = useState<LocationValue>(
    address
      ? {
          regionCode: address.regionCode,
          regionName: address.regionName,
          provinceCode: address.provinceCode,
          provinceName: address.provinceName,
          cityCode: address.cityCode,
          cityName: address.cityName,
          zipCode: address.postalCode,
        }
      : EMPTY_LOCATION,
  );
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");
  // An existing postal code counts as edited, so re-picking a city cannot wipe it.
  const [postalTouched, setPostalTouched] = useState(Boolean(address?.postalCode));

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-canvas-deep bg-canvas-alt p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-medium text-ink">
          {address ? "Edit address" : "New address"}
        </h2>
        {canCancel ? (
          <button
            type="button"
            onClick={onDone}
            className="text-sm font-semibold text-ink-faint underline-offset-4 hover:text-ink hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </div>

      {address ? <input type="hidden" name="addressId" value={address.id} /> : null}

      <Field
        label="Name for this address"
        htmlFor="label"
        hint="Optional, e.g. Home or Mum's place. The city is used if you leave it blank."
      >
        <input
          id="label"
          name="label"
          defaultValue={address?.label ?? ""}
          className={inputClass}
        />
      </Field>

      <LocationPicker
        value={location}
        onChange={(next) => {
          setLocation(next);

          if (!postalTouched) setPostalCode(next.zipCode);
        }}
        idPrefix="address"
        inputClassName={inputClass}
        labelClassName={labelClass}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Barangay" htmlFor="barangay">
          <input
            id="barangay"
            name="barangay"
            autoComplete="address-level4"
            defaultValue={address?.barangay ?? ""}
            required
            aria-invalid={state.field === "barangay"}
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
          defaultValue={address?.street ?? ""}
          required
          aria-invalid={state.field === "street"}
          className={inputClass}
        />
      </Field>

      <Field
        label="Delivery notes"
        htmlFor="deliveryNotes"
        hint="Optional. Landmarks or gate instructions."
      >
        <textarea
          id="deliveryNotes"
          name="deliveryNotes"
          rows={2}
          defaultValue={address?.deliveryNotes ?? ""}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="h-4 w-4 accent-moss-700"
        />
        Use this at checkout by default
      </label>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-moss-900 px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : address ? "Save changes" : "Save address"}
        </button>
      </div>

      <FormMessage status={state.status} message={state.message} />
    </form>
  );
}
