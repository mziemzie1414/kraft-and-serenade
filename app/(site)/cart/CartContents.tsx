"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/useCart";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { MAX_QUANTITY } from "@/lib/cart";
import type { CartItem, HydratedCart } from "@/lib/cart-server";
import { formatPrice } from "@/lib/data";

/** Priced product details, cached against the set of ids they answer for. */
type Priced = { ids: string; byId: Map<string, CartItem> };

/**
 * The cart.
 *
 * Split responsibilities on purpose:
 *
 * - **Quantities** come from the client store, so the steppers respond instantly
 *   with no network round trip.
 * - **Prices and product details** come from `/api/cart`, which reads the cookie
 *   server-side and prices everything from the database. The same function
 *   prices the order at checkout, so what is shown and what is charged cannot
 *   drift apart.
 *
 * The totals here are display arithmetic over server-supplied prices; the order
 * total is recalculated server-side when it is placed.
 *
 * The previous priced response is kept while a new one loads, so adding or
 * removing a bouquet does not blank the list.
 */
export function CartContents({
  /** `null` when the shop does not charge for delivery, in which case no row shows. */
  shippingNote,
}: {
  shippingNote: string | null;
}) {
  const { lines, setQuantity, remove } = useCart();
  const [priced, setPriced] = useState<Priced | null>(null);
  const [failed, setFailed] = useState(false);

  const ids = lines.map((line) => line.productId).join(",");
  const isFresh = priced?.ids === ids;

  useEffect(() => {
    if (isFresh) return;

    let cancelled = false;

    fetch("/api/cart", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("failed");
        return response.json() as Promise<HydratedCart>;
      })
      .then((data) => {
        if (cancelled) return;
        setPriced({
          ids,
          byId: new Map(data.items.map((item) => [item.productId, item])),
        });
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ids, isFresh]);

  if (failed) {
    return (
      <p className="rounded-2xl border border-blush-500 p-8 text-center text-sm text-blush-600">
        Could not load your cart just now. Please refresh the page.
      </p>
    );
  }

  // Never assume "empty" before the cookie has been read — the server render has
  // no cart, so guessing would flash an empty cart at someone who has one.
  if (!priced) {
    return (
      <p className="py-12 text-center text-sm text-ink-soft">Loading your cart…</p>
    );
  }

  const rows = lines
    .map((line) => {
      const product = priced.byId.get(line.productId);

      return product ? { ...product, quantity: line.quantity } : null;
    })
    .filter((row): row is CartItem => row !== null);

  // Only trustworthy once the priced response covers the current ids.
  const droppedMissing = isFresh && rows.length < lines.length;
  const subtotal = rows.reduce((total, row) => total + row.price * row.quantity, 0);
  const count = rows.reduce((total, row) => total + row.quantity, 0);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-canvas-deep p-12 text-center">
        <p className="font-display text-lg text-ink">Your cart is empty</p>
        <p className="mt-2 text-sm text-ink-soft">
          Have a look at what is on the bench this week.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-moss-900 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
        >
          Browse bouquets
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <div>
        {droppedMissing ? (
          <p className="mb-6 rounded-lg border border-blush-300 bg-blush-50 px-4 py-3 text-sm text-blush-600">
            One or more bouquets in your cart are no longer available and have been
            left out.
          </p>
        ) : null}

        <ul className="divide-y divide-canvas-deep border-y border-canvas-deep">
          {rows.map((item) => (
            <li key={item.productId} className="flex gap-4 py-5 sm:gap-5">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas-alt sm:h-28 sm:w-24"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[0.66rem] font-medium tracking-[0.16em] text-ink-faint uppercase">
                  {item.categoryName}
                </p>
                <h2 className="mt-1 font-display text-base leading-snug font-medium text-ink">
                  <Link
                    href={`/products/${item.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {item.name}
                  </Link>
                </h2>

                <p className="mt-1 flex items-baseline gap-2 text-sm">
                  <span className="font-semibold text-ink">
                    {formatPrice(item.price)}
                  </span>
                  {item.compareAtPrice ? (
                    <span className="text-ink-faint line-through">
                      {formatPrice(item.compareAtPrice)}
                    </span>
                  ) : null}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center rounded-full border border-canvas-deep">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-l-full text-ink-soft transition-colors hover:text-ink"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-ink">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= MAX_QUANTITY}
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-r-full text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="text-xs font-semibold text-ink-faint underline-offset-4 transition-colors hover:text-blush-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 self-center font-display text-base font-semibold text-ink">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <Link
          href="/products"
          className="mt-6 inline-block text-sm font-semibold text-moss-700 underline-offset-4 hover:underline"
        >
          Keep shopping
        </Link>
      </div>

      {/* Summary */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-canvas-deep bg-canvas-alt p-6">
          <h2 className="font-display text-lg font-medium text-ink">Summary</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">
                Subtotal ({count} {count === 1 ? "item" : "items"})
              </dt>
              <dd className="font-semibold text-ink">{formatPrice(subtotal)}</dd>
            </div>
            {shippingNote ? (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="text-ink-faint">{shippingNote}</dd>
              </div>
            ) : null}
          </dl>

          <Link
            href="/checkout"
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-moss-900 px-6 py-4 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-moss-700"
          >
            Checkout
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <p className="mt-3 text-center text-xs text-ink-faint">
            No account needed — you can check out as a guest.
          </p>
        </div>
      </div>
    </div>
  );
}
