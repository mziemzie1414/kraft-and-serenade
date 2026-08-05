import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { getPromoContent } from "@/lib/promo";

export async function PromoBanner() {
  const promo = await getPromoContent();

  // Promos are seasonal, so the section can be switched off in the admin panel.
  if (!promo.isPublished) return null;

  const hasSecondaryCta = Boolean(promo.secondaryCtaLabel && promo.secondaryCtaHref);

  return (
    <section
      id="promo"
      aria-labelledby="promo-heading"
      className="scroll-mt-24 bg-canvas py-16 sm:py-20"
    >
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src={promo.imageUrl}
            alt={promo.imageAlt}
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover object-center"
          />
          {/* Scrim so the copy stays legible against the photograph. */}
          <div className="absolute inset-0 bg-gradient-to-r from-moss-900/95 via-moss-900/80 to-moss-900/35" />

          <div className="relative flex flex-col gap-8 px-6 py-14 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-20">
            <div className="max-w-xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blush-500 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-white uppercase">
                {promo.badge}
              </p>

              <h2
                id="promo-heading"
                className="font-display text-3xl leading-[1.12] font-medium text-balance text-canvas sm:text-4xl lg:text-[2.75rem]"
              >
                {promo.title}
              </h2>

              <p className="mt-4 text-base leading-relaxed text-canvas/75">
                {promo.body}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={promo.primaryCtaHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-canvas px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-blush-100"
                >
                  {promo.primaryCtaLabel}
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                {hasSecondaryCta ? (
                  <Link
                    href={promo.secondaryCtaHref!}
                    className="inline-flex items-center justify-center rounded-full border border-canvas/35 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors duration-300 hover:border-canvas hover:bg-canvas/10"
                  >
                    {promo.secondaryCtaLabel}
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Promo code card. Hidden when there is no code to show. */}
            {promo.code ? (
              <div className="shrink-0 rounded-2xl border border-canvas/20 bg-canvas/10 p-6 backdrop-blur-md lg:w-64">
                <p className="text-[0.66rem] font-semibold tracking-[0.2em] text-canvas/60 uppercase">
                  {promo.codeLabel}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-wide text-canvas">
                  {promo.code}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-canvas/60">
                  {promo.codeNote}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
