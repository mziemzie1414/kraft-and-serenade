import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import {
  listCategories,
  listProducts,
  toProductCardData,
} from "@/lib/catalog-queries";

export const metadata: Metadata = {
  title: "All bouquets",
  description:
    "Every hand-tied bouquet we make, from graduation and birthday arrangements to bridal florals and money bouquets. Same-day delivery across Metro Manila.",
};

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const { category: categoryParam } = await searchParams;
  const selectedSlug = typeof categoryParam === "string" ? categoryParam : undefined;

  const categories = await listCategories();
  const selected = categories.find((category) => category.slug === selectedSlug);
  const products = await listProducts(
    selected ? { categoryId: selected.id } : undefined,
  );

  const total = categories.reduce(
    (sum, category) => sum + category._count.products,
    0,
  );

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-14 sm:pt-36">
        <div className="container-page">
          <p className="mb-4 inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.24em] text-blush-300 uppercase">
            <span className="h-px w-6 bg-blush-300/60" aria-hidden />
            {selected ? "Category" : "The full shelf"}
          </p>

          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance text-canvas sm:text-4xl lg:text-5xl">
            {selected ? selected.name : "Every bouquet we make"}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-canvas/70">
            {selected
              ? selected.description
              : "Ten categories, built fresh each morning from whatever passed inspection at the market. Prices include the wrap, the water carrier and a handwritten gift note."}
          </p>
        </div>
      </header>

      <section className="border-b border-canvas-deep/60 bg-canvas-alt py-6">
        <nav aria-label="Filter by category" className="container-page">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/products"
                aria-current={selected ? undefined : "page"}
                className={`inline-block rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  selected
                    ? "border-canvas-deep bg-canvas text-ink-soft hover:border-moss-400 hover:text-ink"
                    : "border-moss-900 bg-moss-900 text-canvas"
                }`}
              >
                All{" "}
                <span className="text-xs opacity-70">{total}</span>
              </Link>
            </li>

            {categories.map((category) => {
              const active = selected?.id === category.id;

              return (
                <li key={category.id}>
                  <Link
                    href={`/products?category=${category.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-block rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                      active
                        ? "border-moss-900 bg-moss-900 text-canvas"
                        : "border-canvas-deep bg-canvas text-ink-soft hover:border-moss-400 hover:text-ink"
                    }`}
                  >
                    {category.shortName}{" "}
                    <span className="text-xs opacity-70">
                      {category._count.products}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>

      <section className="bg-canvas py-14 sm:py-16 lg:py-20">
        <div className="container-page">
          {products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-canvas-deep p-12 text-center text-sm text-ink-soft">
              Nothing on the shelf here yet.{" "}
              <Link
                href="/products"
                className="text-moss-700 underline-offset-4 hover:underline"
              >
                Browse everything instead
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="mb-8 text-sm text-ink-soft">
                {products.length} {products.length === 1 ? "design" : "designs"}
                {selected ? ` in ${selected.name}` : ""}
              </p>

              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard
                      product={toProductCardData(product)}
                      href={`/products/${product.slug}`}
                      /* The first row is above the fold on most desktops. */
                      priority={index < 4}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}
