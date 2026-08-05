import { NextResponse, type NextRequest } from "next/server";
import { isTestMode, verifyWebhookSignature } from "@/lib/paymongo";
import { prisma } from "@/lib/prisma";

/**
 * PayMongo webhook.
 *
 * Order of operations matters here:
 *
 * 1. Read the **raw** body. Parsing first would change the bytes and break the
 *    signature check.
 * 2. Verify the signature. An unsigned or mis-signed request is discarded.
 * 3. Record the event id. PayMongo retries up to 12 times, so the same event will
 *    arrive again; inserting the id first and treating a duplicate key as "already
 *    handled" is what stops an order being marked paid twice.
 * 4. Only then act.
 *
 * PayMongo's guidance is to acknowledge immediately and process in a background
 * worker. There is no queue in this project, and the work here is a single indexed
 * update, so it runs inline — comfortably inside the 30-second window. If this
 * ever grows, that is the thing to revisit.
 */

/** Anything other than 2xx makes PayMongo retry, so unknowns are acknowledged. */
function ack(note: string) {
  return NextResponse.json({ received: true, note });
}

function pick(source: unknown, ...path: string[]): unknown {
  let current: unknown = source;

  for (const key of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export async function POST(request: NextRequest) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!secret) {
    console.error("PAYMONGO_WEBHOOK_SECRET is not set; refusing the webhook.");

    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature");

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    // Not from PayMongo, so do not acknowledge it either.
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const eventId = pick(payload, "data", "id");
  const eventType = pick(payload, "data", "attributes", "type");
  const livemode = pick(payload, "data", "attributes", "livemode");

  if (typeof eventId !== "string" || typeof eventType !== "string") {
    return ack("unrecognised shape");
  }

  // Test keys should never act on live events, or the other way round.
  if (typeof livemode === "boolean" && livemode === isTestMode()) {
    return ack("wrong mode");
  }

  try {
    // Fails on the second delivery of the same event, which is the point.
    await prisma.webhookEvent.create({ data: { id: eventId, type: eventType } });
  } catch {
    return ack("already handled");
  }

  if (eventType !== "payment.paid" && eventType !== "payment.failed") {
    return ack(`ignoring ${eventType}`);
  }

  const resource = pick(payload, "data", "attributes", "data");
  const paymentId = pick(resource, "id");
  const intentId = pick(resource, "attributes", "payment_intent_id");
  const amount = pick(resource, "attributes", "amount");

  if (typeof intentId !== "string") {
    return ack("no payment intent on the event");
  }

  const order = await prisma.order.findUnique({
    where: { paymongoPaymentIntentId: intentId },
  });

  if (!order) return ack("no matching order");

  if (eventType === "payment.failed") {
    console.warn(`Payment failed for order ${order.orderNumber}`);

    return ack("payment failed, order left awaiting payment");
  }

  /**
   * Guard against being told a cheaper amount was paid. PayMongo works in
   * centavos and the order total is whole pesos.
   */
  if (typeof amount === "number" && amount !== order.total * 100) {
    console.error(
      `Order ${order.orderNumber} expected ${order.total * 100} centavos but the payment was ${amount}`,
    );

    return ack("amount mismatch, not marking as paid");
  }

  // Already paid: nothing to do, and never move a fulfilled order backwards.
  if (order.status !== "PENDING_PAYMENT") {
    return ack(`order already ${order.status}`);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymongoPaymentId: typeof paymentId === "string" ? paymentId : null,
      // The code is single-use and spent now.
      qrCodeImage: null,
      qrExpiresAt: null,
    },
  });

  return ack(`order ${order.orderNumber} marked paid`);
}
