import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getHowItWorksContent } from "@/lib/how-it-works";

export async function HowItWorks() {
  const content = await getHowItWorksContent();

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-moss-900 py-20 text-canvas sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          lede={content.lede}
          tone="light"
        />

        <ol className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {content.steps.map((step, index) => (
            <li key={step.label} className="relative">
              {/* Connector line between steps on desktop. Decorative. */}
              {index < content.steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-6 left-14 hidden h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-canvas/25 to-transparent lg:block"
                />
              ) : null}

              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-canvas/25 bg-moss-700 font-display text-sm font-semibold text-blush-300">
                {step.label}
              </span>

              <h3 className="mt-5 font-display text-lg leading-snug font-medium text-canvas">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-canvas/65">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-canvas/15 bg-canvas/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="font-display text-xl font-medium text-canvas">
              {content.calloutTitle}
            </h3>
            <p className="mt-1.5 text-sm text-canvas/65">{content.calloutBody}</p>
          </div>
          <Link
            href={content.calloutCtaHref}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-canvas px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-blush-100"
          >
            {content.calloutCtaLabel}
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
