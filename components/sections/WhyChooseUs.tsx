import Image from "next/image";
import { CheckIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getWhyChooseUsContent } from "@/lib/why-choose-us";

export async function WhyChooseUs() {
  const content = await getWhyChooseUsContent();

  return (
    <section id="about" className="scroll-mt-24 bg-canvas py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image collage */}
          <div className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-canvas-deep">
              <Image
                src={content.primaryImageUrl}
                alt={content.primaryImageAlt}
                fill
                sizes="(min-width: 1024px) 48vw, 90vw"
                className="object-cover"
              />
            </div>

            {/* Overlapping secondary image, decorative */}
            <div
              aria-hidden
              className="absolute -right-4 -bottom-8 hidden w-48 overflow-hidden rounded-2xl border-4 border-canvas bg-canvas-deep shadow-lift sm:block lg:-right-8 lg:w-56"
            >
              <div className="relative aspect-square">
                <Image
                  src={content.secondaryImageUrl}
                  alt=""
                  fill
                  sizes="224px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="absolute -top-4 -left-4 hidden rounded-2xl bg-moss-700 px-5 py-4 text-canvas shadow-lift lg:block">
              <p className="font-display text-2xl leading-none font-semibold">
                {content.badgeValue}
              </p>
              {/* Newlines in the stored label become line breaks. */}
              <p className="mt-1 text-[0.68rem] tracking-[0.16em] whitespace-pre-line text-canvas/70 uppercase">
                {content.badgeLabel}
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <SectionHeading
              eyebrow={content.eyebrow}
              title={content.title}
              lede={content.lede}
              align="left"
            />

            <ul className="mt-9 space-y-6">
              {content.points.map((point) => (
                <li key={point.title} className="flex gap-4">
                  <span
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss-50 text-moss-700"
                    aria-hidden
                  >
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-medium text-ink">
                      {point.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stat strip */}
        {content.stats.length > 0 ? (
          <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-canvas-deep bg-canvas-deep sm:mt-20 lg:grid-cols-4">
            {content.stats.map((stat) => (
              <div key={stat.label} className="bg-canvas px-6 py-7 text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-semibold text-moss-700">
                    {stat.value}
                  </span>
                  <span className="mt-1.5 block text-xs tracking-[0.16em] text-ink-faint uppercase">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
