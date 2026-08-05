"use server";

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

    // Existing rates: each row carries its id, and a ticked box removes it.
    const ids = formData.getAll("rateId");
    const kept: { id: string; fee: number }[] = [];

    for (let index = 0; index < ids.length; index += 1) {
      const id = String(ids[index] ?? "");
      if (!id) continue;
      if (formData.get(`rateRemove-${index}`) !== null) continue;

      kept.push({
        id,
        fee: wholePesos(String(formData.getAll("rateFee")[index] ?? ""), "Rate"),
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

    const removedIds = ids
      .map((id, index) => ({
        id: String(id ?? ""),
        removed: formData.get(`rateRemove-${index}`) !== null,
      }))
      .filter((row) => row.id && row.removed)
      .map((row) => row.id);

    await prisma.$transaction([
      prisma.shippingSettings.upsert({
        where: { id: SHIPPING_ID },
        create: { id: SHIPPING_ID, isEnabled, flatRate },
        update: { isEnabled, flatRate },
      }),
      ...removedIds.map((id) => prisma.shippingRate.delete({ where: { id } })),
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
