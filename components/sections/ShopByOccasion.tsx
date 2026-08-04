import Image from "next/image";
import Link from "next/link";
import { OCCASIONS } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ShopByOccasion() {
  return (
    <section id="occasions" className="scroll-mt-24 bg-canvas py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Shop by occasion"
          title="Start with the moment"
          lede="Not sure which flowers you want? Pick the occasion and we will narrow it down to the designs that suit it."
        />

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          {OCCASIONS.map((occasion) => (
            <li key={occasion.slug}>
              <Link
                href="#shop-by-category"
                className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl bg-canvas-deep p-4 lg:aspect-3/4"
              >
                <Image
                  src={occasion.image}
                  alt={occasion.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 16vw, 45vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-moss-900/90 via-moss-900/25 to-transparent transition-opacity duration-500 group-hover:from-moss-900" />

                <div className="relative">
                  <h3 className="font-display text-base leading-tight font-medium text-canvas sm:text-lg">
                    {occasion.name}
                  </h3>
                  {/* Blurb slides in on hover on pointer devices, and is always
                      visible on touch where hover never fires. */}
                  <p className="mt-1 text-[0.7rem] leading-snug text-canvas/70 transition-all duration-500 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:group-hover:max-h-12 lg:group-hover:opacity-100">
                    {occasion.blurb}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
