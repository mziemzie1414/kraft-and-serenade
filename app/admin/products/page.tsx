import Image from "next/image";
import Link from "next/link";
import { listCategories, listProducts } from "@/lib/catalog-queries";
import { formatPrice } from "@/lib/data";

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const { category: categorySlug } = await searchParams;
  const selectedSlug = typeof categorySlug === "string" ? categorySlug : undefined;

  const categories = await listCategories();
  const selected = categories.find((row) => row.slug === selectedSlug);
  const products = await listProducts(
    selected ? { categoryId: selected.id } : undefined,
  );

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Products</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Every bouquet design in the shop.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-full bg-moss-900 px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
        >
          New product
        </Link>
      </div>

      {/* Category filter. Plain links so this needs no client JavaScript. */}
      <nav aria-label="Filter by category" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/admin/products"
              aria-current={selected ? undefined : "page"}
              className={`inline-block rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "border-canvas-deep text-ink-soft hover:border-ink-faint hover:text-ink"
                  : "border-moss-900 bg-moss-900 text-canvas"
              }`}
            >
              All
            </Link>
          </li>
          {categories.map((category) => {
            const active = selected?.id === category.id;

            return (
              <li key={category.id}>
                <Link
                  href={`/admin/products?category=${category.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-moss-900 bg-moss-900 text-canvas"
                      : "border-canvas-deep text-ink-soft hover:border-ink-faint hover:text-ink"
                  }`}
                >
                  {category.shortName}{" "}
                  <span className="text-[0.65rem] opacity-70">
                    {category._count.products}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {categories.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-canvas-deep p-8 text-center text-sm text-ink-soft">
          Create a{" "}
          <Link
            href="/admin/categories/new"
            className="text-moss-700 underline-offset-4 hover:underline"
          >
            category
          </Link>{" "}
          first — every product needs one.
        </p>
      ) : products.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-canvas-deep p-8 text-center text-sm text-ink-soft">
          No products {selected ? `in ${selected.name}` : "yet"}.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex items-center gap-4 rounded-xl border border-canvas-deep bg-canvas p-3 transition-shadow hover:shadow-soft"
              >
                <Image
                  src={product.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  unoptimized
                />

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-medium text-ink">
                      {product.name}
                    </span>
                    {product.isFeatured ? (
                      <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-blush-600 uppercase">
                        Featured
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">
                    {product.category.name}
                  </span>
                </span>

                <span className="shrink-0 text-right text-xs text-ink-soft">
                  <span className="block font-medium text-ink">
                    {formatPrice(product.price)}
                  </span>
                  <span className="mt-0.5 block text-ink-faint">
                    position {product.position}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
