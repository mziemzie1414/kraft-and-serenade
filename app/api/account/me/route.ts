import { NextResponse } from "next/server";
import { getCustomerSummary } from "@/lib/customer-auth";

/**
 * Who is signed in, if anyone.
 *
 * The navbar asks for this from the browser rather than the site layout reading
 * the session server-side, because a layout that reads cookies makes every page
 * render per-request and the landing page is prerendered. Same trade the cart
 * makes, and the same reason.
 *
 * Returns only a name, email and phone number — never the hash, and never the
 * session.
 */
export async function GET() {
  const customer = await getCustomerSummary();

  return NextResponse.json(
    { customer },
    // Per-visitor. Caching this anywhere would show one customer another's name.
    { headers: { "cache-control": "no-store" } },
  );
}
