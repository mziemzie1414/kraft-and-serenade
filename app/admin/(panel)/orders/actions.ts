"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { canTransition, isOrderStatus, ORDER_STATUS_LABELS } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/components/admin/form-state";

/**
 * Moves an order to another status.
 *
 * The move is checked against `ORDER_TRANSITIONS`, not merely against "is this a
 * valid status". A Server Action is a POST endpoint that never loads the admin
 * layout, so both the sign-in check and the transition check have to live here —
 * the buttons on the page only decide what is *offered*.
 */
export async function setOrderStatus(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireAdmin();

    const orderId = String(formData.get("orderId") ?? "").trim();
    const next = String(formData.get("status") ?? "").trim();

    if (!orderId) throw new Error("Which order?");
    if (!isOrderStatus(next)) throw new Error("That is not a valid status.");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true, paidAt: true },
    });

    if (!order) throw new Error("That order no longer exists.");

    if (order.status === next) {
      return {
        status: "saved",
        message: `${order.orderNumber} is already ${ORDER_STATUS_LABELS[next].toLowerCase()}.`,
      };
    }

    if (!canTransition(order.status, next)) {
      throw new Error(
        `${order.orderNumber} cannot go from ${ORDER_STATUS_LABELS[order.status].toLowerCase()} to ${ORDER_STATUS_LABELS[next].toLowerCase()}.`,
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: next,
        /**
         * `paidAt` records when the money actually arrived, so it is set once and
         * never moved by a later status change. Only stepping back to awaiting
         * payment clears it — which is the one case where the payment is being
         * declared not to have happened.
         */
        ...(next === "PAID" && !order.paidAt ? { paidAt: new Date() } : {}),
        ...(next === "PENDING_PAYMENT" ? { paidAt: null } : {}),
        /**
         * A QR code outlives its usefulness the moment an order stops awaiting
         * payment, and leaving a spent one on the row would have the confirmation
         * page offer it again.
         */
        ...(next !== "PENDING_PAYMENT"
          ? { qrCodeImage: null, qrExpiresAt: null }
          : {}),
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);

    return {
      status: "saved",
      message: `${order.orderNumber} is now ${ORDER_STATUS_LABELS[next].toLowerCase()}.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
