import { NextResponse } from "next/server";
import { getCart } from "@/lib/cart-server";

/**
 * The cart, priced from the database.
 *
 * Reads the cart cookie that the browser sends automatically, so the client never
 * has to post its contents — and never gets to suggest a price.
 */
export async function GET() {
  const cart = await getCart();

  return NextResponse.json(cart, {
    // Per-visitor and changes constantly.
    headers: { "cache-control": "no-store" },
  });
}
