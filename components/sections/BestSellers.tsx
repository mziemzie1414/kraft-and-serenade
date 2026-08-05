import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { Rating } from "@/components/ui/Rating";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { listBestSellers } from "@/lib/catalog-queries";
import { formatPrice } from "@/lib/data";

export async function BestSellers() {
  // Ordered by the rank set in the admin panel: the first is the lead tile, the
  // rest fill the compact list beside it.
  const [lead, ...rest] = await listBestSellers();

  if (!lead) return null;

  return (
    <section
      id="best-sellers"
      className="scroll-mt-24 border-y border-canvas-deep/60 bg-canvas-alt py-20 sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="Best sellers"
          title="What Manila keeps ordering"
          lede="The designs that leave the bench most often, ranked. Every one is built to order on the morning it ships."
          align="left"
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Editorial lead tile for the top-ranked design */}
          <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-moss-900 text-canvas">
            <div className="relative aspect-4/3 overflow-hidden lg:aspect-auto lg:min-h-[26rem] lg:flex-1">
              <Image
                src={lead.imageUrl}
                alt={lead.imageAlt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-moss-900 via-moss-900/40 to-transparent" />

              {lead.badge ? (
                <span className="absolute top-5 left-5 rounded-full bg-blush-500 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.12em] text-white uppercase">
                  {lead.badge}
                </span>
              ) : null}
            </div>

            <div className="relative p-6 sm:p-8 lg:absolute lg:inset-x-0 lg:bottom-0">
              <p className="text-[0.68rem] font-medium tracking-[0.18em] text-blush-300 uppercase">
                {lead.category.name}
              </p>
              <h3 className="mt-2 font-display text-2xl leading-tight font-medium sm:text-3xl">
                <Link
                  href={`/products/${lead.slug}`}
                  className="after:absolute after:inset-0 after:content-['']"
                >
                  {lead.name}
                </Link>
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-canvas/70">
                {lead.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-display text-2xl font-semibold">
                  {formatPrice(lead.price)}
                </span>
                <span className="flex items-center gap-2 text-sm text-canvas/70">
                  <Rating value={lead.rating} size="md" showValue={false} />
                  {lead.rating.toFixed(1)} ({lead.reviewCount})
                </span>
              </div>
            </div>
          </article>

          {/* Compact ranked list for the places below the top */}
          {rest.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {rest.map((product, index) => (
                <li key={product.id} className="flex-1">
                  <article className="group relative flex h-full items-stretch gap-4 overflow-hidden rounded-2xl border border-canvas-deep bg-canvas p-3 transition-all duration-500 hover:border-moss-100 hover:shadow-soft sm:gap-5 sm:p-4">
                    <div className="relative w-28 shrink-0 overflow-hidden rounded-xl bg-canvas-deep sm:w-36">
                      <Image
                        src={product.imageUrl}
                        alt={product.imageAlt}
                        fill
                        sizes="(min-width: 640px) 144px, 112px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-semibold text-blush-500">
                          #{index + 2}
                        </span>
                        <p className="truncate text-[0.66rem] font-medium tracking-[0.16em] text-ink-faint uppercase">
                          {product.category.name}
                        </p>
                      </div>

                      <h3 className="mt-1.5 font-display text-lg leading-snug font-medium text-ink">
                        <Link
                          href={`/products/${product.slug}`}
                          className="after:absolute after:inset-0 after:content-['']"
                        >
                          {product.name}
                        </Link>
                      </h3>

                      <div className="mt-2">
                        <Rating
                          value={product.rating}
                          reviewCount={product.reviewCount}
                        />
                      </div>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-display text-lg font-semibold text-ink">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice ? (
                          <span className="text-sm text-ink-faint line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <ArrowRightIcon className="mt-auto mb-1 h-4 w-4 shrink-0 text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-moss-700" />
                  </article>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
