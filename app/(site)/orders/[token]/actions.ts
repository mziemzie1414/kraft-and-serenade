"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createQrPhPayment, getPaymentIntentStatus } from "@/lib/paymongo";
import { prisma } from "@/lib/prisma";

export type PaymentState = {
  status: "idle" | "info" | "error";
  message?: string;
};

/**
 * Knowing the token is what authorises these actions — it is the same secret the
 * confirmation URL is keyed on, and it is unguessable.
 */
async function findOrder(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  if (!token) throw new Error("Missing order reference.");

  const order = await prisma.order.findUnique({ where: { accessToken: token } });

  if (!order) throw new Error("That order could not be found.");

  return order;
}

/** Issues a fresh QR code, for when the last one expired or never appeared. */
export async function refreshQr(
  _prevState: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  try {
    const order = await findOrder(formData);

    if (order.status !== "PENDING_PAYMENT") {
      return { status: "info", message: "This order has already been paid." };
    }

    const payment = await createQrPhPayment({
      amountPesos: order.total,
      description: order.orderNumber,
      /**
       * A new key on purpose. Reusing the original would return the original
       * intent, and its code is expired — which is the reason we are here.
       */
      idempotencyKey: randomUUID(),
      metadata: { orderNumber: order.orderNumber, orderId: order.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymongoPaymentIntentId: payment.paymentIntentId,
        qrCodeImage: payment.qrImage,
        qrExpiresAt: payment.expiresAt,
      },
    });

    revalidatePath(`/orders/${order.accessToken}`);

    return { status: "info", message: "Here is a fresh QR code." };
  } catch (error) {
    console.error("Could not refresh the QR code", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not create a QR code just now.",
    };
  }
}

/**
 * Asks PayMongo whether the intent has been paid.
 *
 * The webhook is the authoritative path, but it cannot reach a local machine
 * without a tunnel and can be delayed in production. This gives the customer a way
 * to move on rather than staring at a spent QR code.
 */
export async function checkPayment(
  _prevState: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  try {
    const order = await findOrder(formData);

    if (order.status !== "PENDING_PAYMENT") {
      return { status: "info", message: "This order is already marked as paid." };
    }

    if (!order.paymongoPaymentIntentId) {
      return {
        status: "error",
        message: "There is no payment to check yet. Generate a QR code first.",
      };
    }

    const intent = await getPaymentIntentStatus(order.paymongoPaymentIntentId);

    if (intent.status !== "succeeded") {
      return {
        status: "info",
        message:
          "We cannot see the payment yet. If you have just paid, give it a moment and check again.",
      };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymongoPaymentId: intent.paymentId,
        qrCodeImage: null,
        qrExpiresAt: null,
      },
    });

    revalidatePath(`/orders/${order.accessToken}`);

    return { status: "info", message: "Payment received. Thank you." };
  } catch (error) {
    console.error("Could not check the payment", error);

    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not check the payment.",
    };
  }
}
