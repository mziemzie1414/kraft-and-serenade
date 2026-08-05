"use client";

import { useEffect } from "react";
import { clearCart } from "@/components/cart/useCart";

/**
 * Empties the browser's cart once the order exists.
 *
 * The action that placed the order already deleted the cookie, but the in-memory
 * store does not know that, so the header count would stay stale until the next
 * full load. Writing an empty cart is idempotent, which makes a re-visit harmless.
 */
export function ClearCart() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
