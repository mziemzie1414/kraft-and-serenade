"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAX_QUANTITY } from "@/lib/cart";
import { ArrowRightIcon, BagIcon, CheckIcon } from "@/components/ui/Icons";
import { addToCart } from "./useCart";

/** Quantity stepper plus an add button, for the product page. */
export function AddToCart({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Let the confirmation fade rather than stick around forever.
  useEffect(() => {
    if (!added) return;

    const timer = setTimeout(() => setAdded(false), 4000);

    return () => clearTimeout(timer);
  }, [added]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex items-center rounded-full border border-canvas-deep">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-13 w-12 items-center justify-center rounded-l-full text-lg text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            &minus;
          </button>
          <span
            aria-live="polite"
            aria-label={`Quantity: ${quantity}`}
            className="w-10 text-center text-sm font-semibold text-ink"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(MAX_QUANTITY, value + 1))}
            disabled={quantity >= MAX_QUANTITY}
            aria-label="Increase quantity"
            className="flex h-13 w-12 items-center justify-center rounded-r-full text-lg text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            addToCart(productId, quantity);
            setAdded(true);
          }}
          className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-moss-900 px-7 py-4 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-moss-700 disabled:opacity-60"
        >
          <BagIcon className="h-4 w-4" />
          Add to cart
        </button>
      </div>

      {/* Announced politely so a screen reader hears it without losing focus. */}
      <div aria-live="polite" className="min-h-6 pt-3">
        {added ? (
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-moss-700">
            <CheckIcon className="h-4 w-4" />
            {productName} added.
            <Link
              href="/cart"
              className="group inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              View cart
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
