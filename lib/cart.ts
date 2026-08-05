/**
 * Cart storage format.
 *
 * The cart is a cookie holding nothing but product ids and quantities. Prices,
 * names and availability are always read from the database when the cart is
 * shown and again when an order is placed, so a tampered cookie can change what
 * you are buying but never what it costs.
 *
 * Deliberately readable by the browser, unlike the session cookie: the client
 * needs to write it for the count in the header to update without a round trip,
 * and there is nothing secret in it.
 *
 * Pure module — safe to import from both Client and Server Components.
 */

export const CART_COOKIE = "cart";

/** Cookies cap out around 4KB, and nobody orders 30 different bouquets at once. */
export const MAX_LINES = 30;
export const MAX_QUANTITY = 20;

/** How long an abandoned cart survives. */
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type CartLine = {
  productId: string;
  quantity: number;
};

/** Short keys because this has to fit in a cookie. */
type StoredCart = { v: 1; l: { p: string; q: number }[] };

export function encodeCart(lines: CartLine[]): string {
  const payload: StoredCart = {
    v: 1,
    l: lines.map((line) => ({ p: line.productId, q: line.quantity })),
  };

  return encodeURIComponent(JSON.stringify(payload));
}

function clampQuantity(value: unknown): number {
  const quantity = Math.floor(Number(value));

  if (!Number.isFinite(quantity) || quantity < 1) return 0;

  return Math.min(quantity, MAX_QUANTITY);
}

/**
 * Tolerant on purpose. The cookie is client-writable, so anything unparseable,
 * duplicated or out of range is treated as an empty or corrected cart rather than
 * an error — a broken cookie should never take the site down.
 */
export function decodeCart(raw: string | undefined): CartLine[] {
  if (!raw) return [];

  try {
    const decoded: unknown = JSON.parse(decodeURIComponent(raw));
    const list = (decoded as StoredCart)?.l;

    if (!Array.isArray(list)) return [];

    const byId = new Map<string, number>();

    for (const entry of list) {
      const productId = typeof entry?.p === "string" ? entry.p : "";
      const quantity = clampQuantity(entry?.q);

      if (!productId || quantity === 0) continue;

      // Duplicate ids are merged rather than dropped.
      byId.set(
        productId,
        Math.min((byId.get(productId) ?? 0) + quantity, MAX_QUANTITY),
      );
    }

    return [...byId.entries()]
      .slice(0, MAX_LINES)
      .map(([productId, quantity]) => ({ productId, quantity }));
  } catch {
    return [];
  }
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/* ---------- reducers, shared by the client provider ---------- */

export function addLine(
  lines: CartLine[],
  productId: string,
  quantity = 1,
): CartLine[] {
  const existing = lines.find((line) => line.productId === productId);

  if (existing) {
    return lines.map((line) =>
      line.productId === productId
        ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QUANTITY) }
        : line,
    );
  }

  if (lines.length >= MAX_LINES) return lines;

  return [...lines, { productId, quantity: clampQuantity(quantity) || 1 }];
}

export function setLineQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  const clamped = clampQuantity(quantity);

  if (clamped === 0) return removeLine(lines, productId);

  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity: clamped } : line,
  );
}

export function removeLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}
