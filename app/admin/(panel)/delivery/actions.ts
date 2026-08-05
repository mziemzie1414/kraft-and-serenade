"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  DELIVERY_ID,
  WEEKDAY_NAMES,
  formatDeliveryDate,
  isIsoDate,
  todayInShopZone,
} from "@/lib/delivery";
import {
  deleteDeliveryException,
  upsertDeliveryException,
} from "@/lib/delivery-queries";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/components/admin/form-state";

function wholeNumber(raw: string, label: string, max: number): number {
  const value = Number(raw.trim());

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a whole number, 0 or higher.`);
  }

  if (value > max) {
    throw new Error(`${label} cannot be more than ${max}.`);
  }

  return value;
}

export async function saveDelivery(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireAdmin();

    const isEnabled = formData.get("isEnabled") !== null;
    const rushFee = wholeNumber(String(formData.get("rushFee") ?? ""), "Rush fee", 100_000);
    const leadTimeDays = wholeNumber(
      String(formData.get("leadTimeDays") ?? ""),
      "Notice needed",
      90,
    );
    const maxAdvanceDays = wholeNumber(
      String(formData.get("maxAdvanceDays") ?? ""),
      "How far ahead",
      730,
    );
    const rushWithinDays = wholeNumber(
      String(formData.get("rushWithinDays") ?? ""),
      "Rush window",
      30,
    );

    if (maxAdvanceDays < leadTimeDays) {
      throw new Error(
        "The booking window has to reach at least as far as the notice you need, or no date would ever be available.",
      );
    }

    // Checkbox per weekday, so an unticked box is simply absent.
    const closedWeekdays = [0, 1, 2, 3, 4, 5, 6].filter(
      (day) => formData.get(`closed-${day}`) !== null,
    );

    if (closedWeekdays.length === 7) {
      throw new Error(
        "Every day is closed, which would leave no date to pick. Switch delivery dates off instead if that is what you mean.",
      );
    }

    await prisma.deliverySettings.upsert({
      where: { id: DELIVERY_ID },
      create: {
        id: DELIVERY_ID,
        isEnabled,
        rushFee,
        rushWithinDays,
        leadTimeDays,
        maxAdvanceDays,
        closedWeekdays,
      },
      update: {
        isEnabled,
        rushFee,
        rushWithinDays,
        leadTimeDays,
        maxAdvanceDays,
        closedWeekdays,
      },
    });

    revalidatePath("/admin/delivery");

    return {
      status: "saved",
      message: closedWeekdays.length
        ? `Saved. Closed on ${closedWeekdays.map((day) => `${WEEKDAY_NAMES[day]}s`).join(", ")}.`
        : "Saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/**
 * Blocks a date, or opens one the weekday rules would close.
 *
 * Both directions through one action because they write the same row — see the
 * comment on `DeliveryDateException` in the schema.
 */
export async function setDeliveryException(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireAdmin();

    const date = String(formData.get("date") ?? "").trim();
    const isOpen = String(formData.get("isOpen") ?? "") === "true";
    const note = String(formData.get("note") ?? "").trim();

    if (!isIsoDate(date)) throw new Error("That is not a valid date.");

    /**
     * The past is refused. Blocking a day that has already happened does nothing,
     * and it would put clutter in the calendar that no rule ever reads again.
     */
    if (date < todayInShopZone()) {
      throw new Error("That date has already passed.");
    }

    /**
     * Warn rather than refuse when orders already exist. The shop may genuinely
     * need to close a day it has taken orders for — a burst pipe, a typhoon — and
     * refusing would leave them editing the database by hand. But it must not
     * happen silently.
     */
    const booked = !isOpen
      ? await prisma.order.count({
          where: {
            deliveryDate: new Date(`${date}T00:00:00.000Z`),
            status: { not: "CANCELLED" },
          },
        })
      : 0;

    await upsertDeliveryException({ date, isOpen, note: note || null });

    revalidatePath("/admin/delivery");

    const readable = formatDeliveryDate(date);

    if (booked > 0) {
      return {
        status: "saved",
        message: `${readable} is now closed — but ${booked} order${booked === 1 ? "" : "s"} already asked for that day. Contact them to rearrange.`,
      };
    }

    return {
      status: "saved",
      message: isOpen
        ? `${readable} is now open for delivery.`
        : `${readable} is now closed.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/** Removes a ruling, so the weekday pattern applies to that date again. */
export async function clearDeliveryException(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireAdmin();

    const date = String(formData.get("date") ?? "").trim();

    if (!isIsoDate(date)) throw new Error("That is not a valid date.");

    await deleteDeliveryException(date);

    revalidatePath("/admin/delivery");

    return {
      status: "saved",
      message: `${formatDeliveryDate(date)} follows the usual pattern again.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
