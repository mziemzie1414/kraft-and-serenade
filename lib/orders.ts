import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Alphabet for order numbers, minus the characters people misread when reading
 * one out or typing it from a screenshot: I, L, O, U, 0, 1.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[bytes[index] % ALPHABET.length];
  }

  return code;
}

function datePart(now: Date): string {
  const year = String(now.getUTCFullYear()).slice(2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * A short, readable order number, e.g. `KS-260805-K7F3`.
 *
 * Customers quote this to the store when paying manually, so it has to survive
 * being read aloud. The date makes it easy for the admin to place, and the random
 * tail keeps same-day orders apart. Collisions are checked rather than assumed.
 */
export async function generateOrderNumber(): Promise<string> {
  const prefix = `KS-${datePart(new Date())}`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    // Widen the tail if the short form keeps colliding.
    const candidate = `${prefix}-${randomCode(attempt < 5 ? 4 : 6)}`;
    const clash = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });

    if (!clash) return candidate;
  }

  throw new Error("Could not allocate an order number. Please try again.");
}

/** The token the confirmation URL is keyed on. Unguessable, unlike the number. */
export function generateAccessToken(): string {
  return randomBytes(24).toString("hex");
}

export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
} as const;

export const PAYMENT_METHOD_LABELS = {
  MANUAL: "Manual payment (QR)",
  PAYMONGO_QRPH: "PayMongo QR Ph",
} as const;
