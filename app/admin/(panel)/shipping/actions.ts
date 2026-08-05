"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SHIPPING_ID } from "@/lib/shipping";
import type { AdminFormState } from "@/components/admin/form-state";

function wholePesos(raw: string, label: string): number {
  const value = Number(raw.trim());

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a whole number of pesos, 0 or higher.`);
  }

  return value;
}

export async function saveShipping(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    // Authorisation lives next to the write: a Server Action can be POSTed
    // directly, without ever loading the guarded admin layout.
    await requireAdmin();

    const isEnabled = formData.get("isEnabled") !== null;
    const flatRate = wholePesos(
      String(formData.get("flatRate") ?? ""),
      "Flat rate",
    );

    /**
     * Existing rates: each row submits its id and its fee, positionally paired.
     *
     * Removal is not handled here. It used to be a `rateRemove-<index>` checkbox
     * that had to line up with the order the `rateId` inputs were submitted in —
     * fragile, and it meant deleting a rate required saving the whole form. It is
     * `deleteShippingRate` below now.
     */
    const ids = formData.getAll("rateId");
    const fees = formData.getAll("rateFee");
    const kept: { id: string; fee: number }[] = [];

    for (let index = 0; index < ids.length; index += 1) {
      const id = String(ids[index] ?? "");

      if (!id) continue;

      kept.push({
        id,
        fee: wholePesos(String(fees[index] ?? ""), "Rate"),
      });
    }

    // Optional new rate appended from the "add" fields.
    const newScope = String(formData.get("newScope") ?? "");
    const newCode = String(formData.get("newPsgcCode") ?? "").trim();
    const newLabel = String(formData.get("newLabel") ?? "").trim();
    const newFeeRaw = String(formData.get("newFee") ?? "").trim();

    const addition =
      newCode && newLabel
        ? {
            scope: newScope === "CITY" ? ("CITY" as const) : ("REGION" as const),
            psgcCode: newCode,
            label: newLabel,
            fee: wholePesos(newFeeRaw || "0", "New rate"),
          }
        : null;

    if (addition) {
      const clash = await prisma.shippingRate.findUnique({
        where: { scope_psgcCode: { scope: addition.scope, psgcCode: addition.psgcCode } },
      });

      if (clash) {
        throw new Error(
          `There is already a rate for ${clash.label}. Edit that one instead.`,
        );
      }
    }

    await prisma.$transaction([
      prisma.shippingSettings.upsert({
        where: { id: SHIPPING_ID },
        create: { id: SHIPPING_ID, isEnabled, flatRate },
        update: { isEnabled, flatRate },
      }),
      ...kept.map((rate) =>
        prisma.shippingRate.update({
          where: { id: rate.id },
          data: { fee: rate.fee },
        }),
      ),
      ...(addition
        ? [
            prisma.shippingRate.create({
              data: { ...addition, settingsId: SHIPPING_ID },
            }),
          ]
        : []),
    ]);

    return {
      status: "saved",
      message: addition
        ? `Shipping updated, and a rate added for ${addition.label}.`
        : "Shipping updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/**
 * Deletes one location rate, immediately.
 *
 * Its own action rather than part of `saveShipping`, because removing a rate is a
 * single decision and should not require saving the rest of the page — and because
 * the old checkbox approach paired removals to rows by array index, which only
 * worked as long as the render order and the submission order agreed.
 */
export async function deleteShippingRate(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireAdmin();

    const id = String(formData.get("rateId") ?? "").trim();

    if (!id) throw new Error("Which rate?");

    // `deleteMany` rather than `delete`, so a rate already gone is not an error —
    // two tabs open on this page should not produce a crash.
    const removed = await prisma.shippingRate.deleteMany({ where: { id } });

    if (removed.count === 0) {
      return { status: "saved", message: "That rate had already been removed." };
    }

    revalidatePath("/admin/shipping");

    return { status: "saved", message: "Rate removed." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
