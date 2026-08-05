import Image from "next/image";
import Link from "next/link";
import { listCategories } from "@/lib/catalog-queries";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Categories</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            The bouquet types customers browse by. Order here is the order shown on
            the site.
          </p>
        </div>

        <Link
          href="/admin/categories/new"
          className="rounded-full bg-moss-900 px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
        >
          New category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-canvas-deep p-8 text-center text-sm text-ink-soft">
          No categories yet. Create one to get started.
        </p>
      ) : (
        <ul className="mt-8 space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/admin/categories/${category.id}`}
                className="flex items-center gap-4 rounded-xl border border-canvas-deep bg-canvas p-3 transition-shadow hover:shadow-soft"
              >
                <Image
                  src={category.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  unoptimized
                />

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-medium text-ink">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-xs text-ink-faint">
                    /products?category={category.slug}
                  </span>
                </span>

                <span className="shrink-0 text-right text-xs text-ink-soft">
                  <span className="block">
                    {category._count.products}{" "}
                    {category._count.products === 1 ? "product" : "products"}
                  </span>
                  <span className="mt-0.5 block text-ink-faint">
                    position {category.position}
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
