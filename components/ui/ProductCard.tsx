import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/data";
import { BagIcon } from "./Icons";
import { Rating } from "./Rating";

/**
 * Product tile used by both Featured Bouquets and Best Sellers.
 *
 * There is no cart in this frontend-only build, so the action is a link to the
 * relevant category rather than a button that pretends to add to a basket.
 */
export function ProductCard({
  product,
  priority = false,
  layout = "grid",
}: {
  product: Product;
  /** Set on above-the-fold tiles so Next preloads them instead of lazy-loading. */
  priority?: boolean;
  layout?: "grid" | "wide";
}) {
  const href = "#shop-by-category";
  const isWide = layout === "wide";

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-canvas-deep/70 bg-white transition-all duration-500 hover:-translate-y-1 hover:border-moss-100 hover:shadow-lift ${
        isWide ? "sm:flex-row" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden bg-canvas-alt ${
          isWide ? "aspect-4/3 sm:aspect-auto sm:w-2/5" : "aspect-3/4"
        }`}
      >
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          priority={priority}
          sizes={
            isWide
              ? "(min-width: 640px) 40vw, 100vw"
              : "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 90vw"
          }
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {product.badge ? (
          <span className="absolute top-3 left-3 rounded-full bg-canvas/95 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-moss-700 shadow-sm backdrop-blur">
            {product.badge}
          </span>
        ) : null}

        {product.compareAtPrice ? (
          <span className="absolute top-3 right-3 rounded-full bg-blush-500 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-white shadow-sm">
            Save {formatPrice(product.compareAtPrice - product.price)}
          </span>
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col p-5 ${isWide ? "sm:justify-center sm:p-7" : ""}`}>
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink-faint">
          {product.category}
        </p>

        <h3 className="mt-2 font-display text-lg leading-snug font-medium text-ink">
          {/* The stretched link makes the whole card clickable without nesting
              interactive elements, which keeps the tab order to one stop. */}
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2.5">
          <Rating value={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 pt-1">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-ink">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="text-sm text-ink-faint line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </p>

          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-alt text-moss-700 transition-colors duration-300 group-hover:bg-moss-700 group-hover:text-canvas"
            aria-hidden
          >
            <BagIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
