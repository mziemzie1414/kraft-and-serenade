import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, LeafIcon, TruckIcon, SparkleIcon } from "@/components/ui/Icons";
import { Rating } from "@/components/ui/Rating";

const TRUST_POINTS = [
  { icon: LeafIcon, label: "Market-fresh daily" },
  { icon: TruckIcon, label: "Same-day in Metro Manila" },
  { icon: SparkleIcon, label: "Hand-tied to order" },
];

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-dvh flex-col justify-end overflow-hidden">
      {/* Background image. `priority` because this is the largest element
          above the fold and drives the Largest Contentful Paint. */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero/hero-bouquet.jpg"
          alt="Florist holding a large hand-tied bouquet of roses, ranunculus and eucalyptus"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Layered scrims keep the headline readable over a busy photograph. */}
        <div className="absolute inset-0 bg-gradient-to-t from-moss-900/92 via-moss-900/55 to-moss-900/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-moss-900/60 to-transparent" />
      </div>

      <div className="container-page relative pt-32 pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-3xl animate-fade-up">
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-canvas/25 bg-canvas/10 px-4 py-1.5 text-xs font-medium tracking-wide text-canvas/90 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-blush-300" aria-hidden />
            Cut at 4am. On your doorstep by lunch.
          </p>

          <h1 className="font-display text-4xl leading-[1.05] font-medium tracking-tight text-balance text-canvas sm:text-5xl lg:text-7xl">
            Flowers that say it
            <span className="block italic text-blush-300">without saying much</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-canvas/75 sm:text-lg">
            A small Pasig studio making hand-tied bouquets for graduations,
            birthdays, weddings and ordinary Tuesdays. Ten designs on the shelf,
            or tell us the colours and we will build it.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="#featured"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-canvas px-7 py-4 text-sm font-semibold text-ink transition-all duration-300 hover:bg-blush-100 hover:shadow-lift"
            >
              Shop the bouquets
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#shop-by-category"
              className="inline-flex items-center justify-center rounded-full border border-canvas/35 px-7 py-4 text-sm font-semibold text-canvas transition-colors duration-300 hover:border-canvas hover:bg-canvas/10"
            >
              Browse categories
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3 rounded-full border border-canvas/20 bg-canvas/10 py-2 pr-5 pl-2 backdrop-blur-md">
              <div className="flex -space-x-2.5">
                {["01", "02", "03", "04"].map((n) => (
                  <span
                    key={n}
                    className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-canvas/80"
                  >
                    <Image
                      src={`/images/reviews/avatar-${n}.jpg`}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
              <div className="text-canvas">
                <Rating value={4.9} size="sm" showValue={false} />
                <p className="mt-0.5 text-xs text-canvas/70">
                  4.9 from 1,240+ local orders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating accent card, desktop only. Decorative, so it is hidden
            from assistive tech and from small screens. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[clamp(1.25rem,4vw,2.5rem)] bottom-24 hidden w-56 rotate-3 overflow-hidden rounded-2xl bg-canvas p-2.5 shadow-lift xl:block"
        >
          <div className="relative aspect-4/5 overflow-hidden rounded-xl">
            <Image
              src="/images/hero/hero-accent.jpg"
              alt=""
              fill
              sizes="224px"
              className="object-cover"
            />
          </div>
          <div className="px-1.5 pt-3 pb-1.5">
            <p className="font-display text-sm font-medium text-ink">
              Blush Peony Serenade
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">Most gifted this month</p>
          </div>
        </div>
      </div>

      {/* Trust bar pinned to the bottom of the viewport */}
      <div className="relative border-t border-canvas/15 bg-moss-900/45 backdrop-blur-md">
        <ul className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4 sm:justify-between">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 text-xs font-medium tracking-wide text-canvas/80 sm:text-sm"
            >
              <Icon className="h-4 w-4 text-blush-300" />
              {label}
            </li>
          ))}
          <li className="hidden items-center gap-2.5 text-sm font-medium tracking-wide text-canvas/80 lg:flex">
            <span className="text-blush-300">₱</span>
            Free delivery over ₱3,500
          </li>
        </ul>
      </div>
    </section>
  );
}
