import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { listCategories, listFeaturedProducts, toProductCardData } from "@/lib/catalog-queries";

export async function FeaturedBouquets() {
  const [products, categories] = await Promise.all([
    listFeaturedProducts(),
    listCategories(),
  ]);

  // Nothing marked featured means nothing to show, rather than an empty grid.
  if (products.length === 0) return null;

  return (
    <section id="featured" className="scroll-mt-24 bg-canvas py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Featured bouquets"
          title="This week on the bench"
          lede={`${products.length} ${
            products.length === 1 ? "design" : "designs"
          } we are building on repeat right now. Prices include the wrap, the water carrier and a handwritten gift note.`}
          align="left"
          action={
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-moss-700 transition-colors hover:text-moss-900"
            >
              See all {categories.length} categories
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id}>
              {/* The first row is above the fold on most desktops. */}
              <ProductCard
                product={toProductCardData(product)}
                href={`/products/${product.slug}`}
                priority={index < 4}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
