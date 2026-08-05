"use server";

import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import type { AccountState } from "../../actions";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function fail(message: string, field?: string): AccountState {
  return { status: "error", message, field };
}

/**
 * Creates or replaces a saved address.
 *
 * One action for both, keyed on whether `addressId` came through, because the
 * fields and the validation are identical and two copies would drift.
 *
 * `requireCustomer()` first, then every query is scoped to that id — so an
 * `addressId` belonging to somebody else matches nothing rather than being
 * edited. A Server Action is a POST endpoint and never loads the account layout,
 * so this is the only check that counts.
 */
export async function saveAddress(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const customer = await requireCustomer();

  const addressId = text(formData, "addressId");

  const regionCode = text(formData, "regionCode");
  const cityCode = text(formData, "cityCode");

  if (!regionCode) return fail("Choose a region.", "regionCode");
  if (!cityCode) return fail("Choose a city or municipality.", "cityCode");

  const barangay = text(formData, "barangay");
  const street = text(formData, "street");

  if (!barangay) return fail("Barangay is required.", "barangay");
  if (!street) return fail("Street address is required.", "street");

  const data = {
    label: text(formData, "label") || null,
    regionCode,
    regionName: text(formData, "regionName"),
    // Absent for regions like NCR, so these stay optional.
    provinceCode: text(formData, "provinceCode"),
    provinceName: text(formData, "provinceName"),
    cityCode,
    cityName: text(formData, "cityName"),
    barangay,
    street,
    postalCode: text(formData, "postalCode"),
    deliveryNotes: text(formData, "deliveryNotes") || null,
  };

  const existingCount = await prisma.customerAddress.count({
    where: { customerId: customer.id },
  });

  // The first address is the default whether or not the box was ticked; there is
  // nothing else for checkout to preselect.
  const wantsDefault = formData.get("isDefault") === "on" || existingCount === 0;

  try {
    await prisma.$transaction(async (tx) => {
      if (wantsDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: customer.id },
          data: { isDefault: false },
        });
      }

      if (addressId) {
        /**
         * `updateMany` with the customer id in the filter, not `update` by id.
         * `update` would need a separate ownership read first, and forgetting it
         * is exactly how one customer ends up editing another's address.
         */
        const result = await tx.customerAddress.updateMany({
          where: { id: addressId, customerId: customer.id },
          data: { ...data, isDefault: wantsDefault },
        });

        if (result.count === 0) throw new NotFound();
      } else {
        await tx.customerAddress.create({
          data: { ...data, isDefault: wantsDefault, customerId: customer.id },
        });
      }
    });
  } catch (error) {
    if (error instanceof NotFound) return fail("That address is no longer saved.");

    console.error("Could not save the address", error);

    return fail("Could not save that address. Please try again.");
  }

  /**
   * The page reads the session so it is dynamic already, but the action still has
   * to say the data changed — otherwise the list the customer is looking at is the
   * one rendered before they saved.
   */
  revalidatePath("/account/addresses");

  return {
    status: "done",
    message: addressId ? "Address updated." : "Address saved.",
  };
}

export async function deleteAddress(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const customer = await requireCustomer();
  const addressId = text(formData, "addressId");

  if (!addressId) return fail("Nothing to delete.");

  const removed = await prisma.customerAddress.deleteMany({
    where: { id: addressId, customerId: customer.id },
  });

  if (removed.count === 0) return fail("That address is no longer saved.");

  /**
   * Deleting the default leaves the account without one, so the next most recent
   * address takes over. Otherwise checkout would preselect nothing while the
   * customer plainly has an address on file.
   */
  const stillHasDefault = await prisma.customerAddress.findFirst({
    where: { customerId: customer.id, isDefault: true },
    select: { id: true },
  });

  if (!stillHasDefault) {
    const fallback = await prisma.customerAddress.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (fallback) {
      await prisma.customerAddress.update({
        where: { id: fallback.id },
        data: { isDefault: true },
      });
    }
  }

  revalidatePath("/account/addresses");

  return { status: "done", message: "Address deleted." };
}

export async function setDefaultAddress(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const customer = await requireCustomer();
  const addressId = text(formData, "addressId");

  if (!addressId) return fail("Nothing to change.");

  const owned = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId: customer.id },
    select: { id: true },
  });

  if (!owned) return fail("That address is no longer saved.");

  await prisma.$transaction([
    prisma.customerAddress.updateMany({
      where: { customerId: customer.id },
      data: { isDefault: false },
    }),
    prisma.customerAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account/addresses");

  return { status: "done", message: "Default address changed." };
}

/** Signals "no row matched" from inside a transaction, so it can be rolled back. */
class NotFound extends Error {}
