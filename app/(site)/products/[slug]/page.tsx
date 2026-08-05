import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/AddToCart";
import { ArrowRightIcon, LeafIcon, SparkleIcon, TruckIcon } from "@/components/ui/Icons";
import { ProductCard } from "@/components/ui/ProductCard";
import { Rating } from "@/components/ui/Rating";
import {
  getProductBySlug,
  listRelatedProducts,
  toProductCardData,
} from "@/lib/catalog-queries";
import { formatPrice } from "@/lib/data";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Bouquet not found" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.imageUrl }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await listRelatedProducts(product.categoryId, product.id);
  const saving = product.compareAtPrice
    ? product.compareAtPrice - product.price
    : null;

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-10 sm:pt-36">
        <div className="container-page">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-canvas/60">
              <li>
                <Link href="/products" className="hover:text-canvas">
                  All bouquets
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-canvas"
                >
                  {product.category.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-canvas/90" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </header>

      <article className="bg-canvas py-12 sm:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-canvas-alt">
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />

            {product.badge ? (
              <span className="absolute top-4 left-4 rounded-full bg-canvas/95 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] text-moss-700 uppercase shadow-sm backdrop-blur">
                {product.badge}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col">
            <p className="text-[0.68rem] font-medium tracking-[0.16em] text-ink-faint uppercase">
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-moss-700"
              >
                {product.category.name}
              </Link>
            </p>

            <h1 className="mt-3 font-display text-3xl leading-tight font-medium tracking-tight text-balance text-ink sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4">
              <Rating
                value={product.rating}
                reviewCount={product.reviewCount}
                size="md"
              />
            </div>

            <p className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-semibold text-ink">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice ? (
                <>
                  <span className="text-lg text-ink-faint line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="rounded-full bg-blush-500 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-white">
                    Save {formatPrice(saving ?? 0)}
                  </span>
                </>
              ) : null}
            </p>

            <p className="mt-6 text-base leading-relaxed text-pretty text-ink-soft">
              {product.description}
            </p>

            <ul className="mt-8 space-y-3 border-t border-canvas-deep pt-6">
              <li className="flex items-start gap-3 text-sm text-ink-soft">
                <LeafIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-400" />
                Built the morning it ships, from stems bought at 4am.
              </li>
              <li className="flex items-start gap-3 text-sm text-ink-soft">
                <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-400" />
                Same-day across Metro Manila for orders placed before 1:00 PM.
              </li>
              <li className="flex items-start gap-3 text-sm text-ink-soft">
                <SparkleIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-400" />
                Wrap, water carrier and a handwritten gift note are included.
              </li>
            </ul>

            <AddToCart productId={product.id} productName={product.name} />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#contact"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-canvas-deep px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-moss-400"
              >
                Ask about this bouquet
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="inline-flex items-center justify-center rounded-full border border-canvas-deep px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-moss-400"
              >
                More {product.category.shortName.toLowerCase()} bouquets
              </Link>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-canvas-deep/60 bg-canvas-alt py-14 sm:py-16">
          <div className="container-page">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              More in {product.category.name}
            </h2>

            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard
                    product={toProductCardData(item)}
                    href={`/products/${item.slug}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
