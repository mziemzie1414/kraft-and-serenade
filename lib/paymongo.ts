import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * PayMongo QR Ph.
 *
 * Flow, per https://docs.paymongo.com/docs/payment-acceptance-qr-ph-api:
 *
 * 1. Create a Payment Intent with `qrph` in `payment_method_allowed` (secret key).
 * 2. Create a `qrph` Payment Method (public key).
 * 3. Attach the method to the intent (public key).
 * 4. The intent moves to `awaiting_next_action` and the QR image is at
 *    `next_action.code.image_url` as a base64 data URL.
 *
 * Codes are single-use, encode the exact amount, and expire — 30 minutes by
 * default, which is what this uses.
 */

const API = "https://api.paymongo.com/v1";

/** PayMongo works in centavos; everything in this project is whole pesos. */
export function toCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export const QR_EXPIRY_SECONDS = 1800;

function secretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;

  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set.");

  return key;
}

function publicKey(): string {
  const key = process.env.PAYMONGO_PUBLIC_KEY;

  if (!key) throw new Error("PAYMONGO_PUBLIC_KEY is not set.");

  return key;
}

/** True when the configured keys are test keys, used to pick the right signature. */
export function isTestMode(): boolean {
  return (process.env.PAYMONGO_SECRET_KEY ?? "").startsWith("sk_test");
}

export function isPaymongoConfigured(): boolean {
  return Boolean(
    process.env.PAYMONGO_SECRET_KEY && process.env.PAYMONGO_PUBLIC_KEY,
  );
}

/** Basic auth with the key as the username and an empty password. */
function authHeader(key: string): string {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

type Json = Record<string, unknown>;

async function call(
  path: string,
  key: string,
  body: Json,
  idempotencyKey?: string,
): Promise<Json> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: authHeader(key),
      // Retrying the same logical operation returns the original response rather
      // than creating a second intent.
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      (payload as { errors?: { detail?: string }[] })?.errors?.[0]?.detail ??
      `HTTP ${response.status}`;

    throw new Error(`PayMongo: ${detail}`);
  }

  return (payload ?? {}) as Json;
}

function pick(source: unknown, ...path: string[]): unknown {
  let current: unknown = source;

  for (const key of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export type QrPhPayment = {
  paymentIntentId: string;
  /** Base64 data URL, ready for an `<img src>`. */
  qrImage: string;
  expiresAt: Date;
};

/**
 * Creates a Payment Intent, attaches a QR Ph method, and returns the code.
 *
 * `idempotencyKey` should be stable for a given order so a retry cannot leave two
 * intents behind.
 */
export async function createQrPhPayment(options: {
  amountPesos: number;
  description: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}): Promise<QrPhPayment> {
  const intent = await call(
    "/payment_intents",
    secretKey(),
    {
      data: {
        attributes: {
          amount: toCentavos(options.amountPesos),
          currency: "PHP",
          payment_method_allowed: ["qrph"],
          description: options.description,
          ...(options.metadata ? { metadata: options.metadata } : {}),
        },
      },
    },
    options.idempotencyKey,
  );

  const paymentIntentId = pick(intent, "data", "id");
  const clientKey = pick(intent, "data", "attributes", "client_key");

  if (typeof paymentIntentId !== "string" || typeof clientKey !== "string") {
    throw new Error("PayMongo did not return a usable payment intent.");
  }

  const method = await call("/payment_methods", publicKey(), {
    data: {
      attributes: { type: "qrph", expiry_seconds: QR_EXPIRY_SECONDS },
    },
  });

  const methodId = pick(method, "data", "id");

  if (typeof methodId !== "string") {
    throw new Error("PayMongo did not return a usable payment method.");
  }

  const attached = await call(
    `/payment_intents/${paymentIntentId}/attach`,
    publicKey(),
    { data: { attributes: { payment_method: methodId, client_key: clientKey } } },
  );

  const qrImage = pick(
    attached,
    "data",
    "attributes",
    "next_action",
    "code",
    "image_url",
  );

  if (typeof qrImage !== "string") {
    throw new Error("PayMongo did not return a QR code.");
  }

  return {
    paymentIntentId,
    qrImage,
    expiresAt: new Date(Date.now() + QR_EXPIRY_SECONDS * 1000),
  };
}

export type IntentStatus = {
  status: string;
  /** Set once a payment has settled the intent. */
  paymentId: string | null;
};

/**
 * Reads an intent's current status.
 *
 * Webhooks are the authoritative path, but they cannot reach a local machine
 * without a tunnel, and the docs offer polling as the alternative. This also backs
 * the "I have paid" button, so a customer is never stuck staring at a QR code
 * because a webhook was delayed.
 */
export async function getPaymentIntentStatus(
  paymentIntentId: string,
): Promise<IntentStatus> {
  const response = await fetch(`${API}/payment_intents/${paymentIntentId}`, {
    headers: {
      accept: "application/json",
      authorization: authHeader(secretKey()),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PayMongo: could not read the payment (HTTP ${response.status})`);
  }

  const payload: unknown = await response.json();
  const status = pick(payload, "data", "attributes", "status");
  const payments = pick(payload, "data", "attributes", "payments");

  const paymentId =
    Array.isArray(payments) && typeof pick(payments[0], "id") === "string"
      ? (pick(payments[0], "id") as string)
      : null;

  return {
    status: typeof status === "string" ? status : "unknown",
    paymentId,
  };
}

/**
 * Verifies the `Paymongo-Signature` header against the raw request body.
 *
 * PayMongo's own guidance is "compute HMAC-SHA256 of the raw request body with
 * your secret", while the header has historically been sent in Stripe's
 * `t=<ts>,te=<test sig>,li=<live sig>` shape where the signed value is
 * `<ts>.<body>`. Both are accepted here rather than betting on one — every branch
 * still requires a real HMAC with the endpoint secret, so accepting both widens
 * nothing an attacker can use.
 */
export function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header || !secret) return false;

  const digest = (payload: string) =>
    createHmac("sha256", secret).update(payload).digest("hex");

  const matches = (candidate: string, expected: string) => {
    const a = Buffer.from(candidate, "utf8");
    const b = Buffer.from(expected, "utf8");

    return a.length === b.length && timingSafeEqual(a, b);
  };

  // Structured form.
  if (header.includes("=")) {
    const parts = new Map(
      header.split(",").map((part) => {
        const [key, ...rest] = part.trim().split("=");
        return [key, rest.join("=")] as const;
      }),
    );

    const timestamp = parts.get("t");
    // Test keys are checked against `te`, live keys against `li`.
    const signature = parts.get(isTestMode() ? "te" : "li");

    if (timestamp && signature) {
      return matches(digest(`${timestamp}.${rawBody}`), signature);
    }
  }

  // Bare hex digest over the body.
  return matches(digest(rawBody), header.trim());
}
