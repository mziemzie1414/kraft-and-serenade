"use client";

import { useSyncExternalStore } from "react";
import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  addLine,
  cartCount,
  decodeCart,
  encodeCart,
  removeLine,
  setLineQuantity,
  type CartLine,
} from "@/lib/cart";

/**
 * The cart as an external store backed by a cookie.
 *
 * A store rather than React state for two reasons. It is genuinely external — the
 * cookie is the source of truth and travels with every request, which is how
 * checkout re-prices it on the server. And reading it on mount with an effect
 * means calling `setState` in an effect body, which the React Compiler rejects;
 * `useSyncExternalStore` is the supported way to subscribe to something outside
 * React.
 *
 * Client-owned rather than read in a layout, because a layout that reads cookies
 * forces every page to render per-request and the landing page is prerendered.
 */

const EMPTY: CartLine[] = [];

const listeners = new Set<() => void>();

/** Snapshots must be referentially stable, so the parse is cached by raw value. */
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function rawCookie(): string {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CART_COOKIE}=`));

  return match?.slice(CART_COOKIE.length + 1) ?? "";
}

function getSnapshot(): CartLine[] {
  const raw = rawCookie();

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = decodeCart(raw);
  }

  return cachedLines;
}

/** The server cannot know the cart without making every page dynamic. */
function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
  };
}

function commit(next: CartLine[]) {
  document.cookie = `${CART_COOKIE}=${encodeCart(next)}; path=/; max-age=${CART_COOKIE_MAX_AGE}; samesite=lax`;

  // Force the next snapshot to re-read rather than trust the cache.
  cachedRaw = null;

  for (const listener of listeners) listener();
}

/* Module-level so the identities stay stable without memoisation. */

export function addToCart(productId: string, quantity = 1) {
  commit(addLine(getSnapshot(), productId, quantity));
}

export function setCartQuantity(productId: string, quantity: number) {
  commit(setLineQuantity(getSnapshot(), productId, quantity));
}

export function removeFromCart(productId: string) {
  commit(removeLine(getSnapshot(), productId));
}

export function clearCart() {
  commit(EMPTY);
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    lines,
    count: cartCount(lines),
    /**
     * Changes only when the contents change, so views can use it as an effect
     * dependency without refetching on every render.
     */
    key: lines.map((line) => `${line.productId}:${line.quantity}`).join(","),
    add: addToCart,
    setQuantity: setCartQuantity,
    remove: removeFromCart,
    clear: clearCart,
  };
}
