import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ShopByCategory() {
  return (
    <section
      id="shop-by-category"
      className="scroll-mt-24 border-y border-canvas-deep/60 bg-canvas-alt py-20 sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="Shop by category"
          title="Every bouquet type we make"
          lede="The same ten categories you will find in the Products menu. Counts are live designs, not archived ones."
        />

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CATEGORIES.map((category) => (
            <li
              key={category.slug}
              /* Anchor target for the Products dropdown links. */
              id={`category-${category.slug}`}
              className="scroll-mt-28"
            >
              <Link
                href="#featured"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-canvas-deep bg-canvas transition-all duration-500 hover:-translate-y-1 hover:border-moss-100 hover:shadow-lift"
              >
                <div className="relative aspect-square overflow-hidden bg-canvas-deep">
                  <Image
                    src={category.image}
                    alt={category.imageAlt}
                    fill
                    sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span className="absolute top-3 right-3 rounded-full bg-canvas/95 px-2.5 py-1 text-[0.65rem] font-semibold text-moss-700 backdrop-blur">
                    {category.itemCount}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-base leading-snug font-medium text-ink">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-soft">
                    {category.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-moss-700">
                    Shop now
                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
