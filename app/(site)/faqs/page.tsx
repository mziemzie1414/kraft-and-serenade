import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { getFaqContent } from "@/lib/faq";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getFaqContent();

  return {
    title: content.pageTitle,
    description: content.pageLede,
  };
}

export default async function FaqPage() {
  const content = await getFaqContent();

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-14 sm:pt-36">
        <div className="container-page">
          <p className="mb-4 inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.24em] text-blush-300 uppercase">
            <span className="h-px w-6 bg-blush-300/60" aria-hidden />
            {content.eyebrow}
          </p>

          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance text-canvas sm:text-4xl lg:text-5xl">
            {content.pageTitle}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-canvas/70">
            {content.pageLede}
          </p>
        </div>
      </header>

      <section className="bg-canvas py-14 sm:py-16 lg:py-20">
        <div className="container-page">
          {content.faqs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-canvas-deep p-12 text-center text-sm text-ink-soft">
              No questions answered here yet.
            </p>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-sm leading-relaxed text-ink-soft">
                  {content.faqs.length} questions answered. Still stuck? We would
                  rather you asked than guessed.
                </p>

                <div className="mt-6 flex flex-col items-start gap-4">
                  <Link
                    href={content.ctaHref}
                    className="inline-flex items-center justify-center rounded-full bg-moss-900 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-moss-700"
                  >
                    {content.ctaLabel}
                  </Link>

                  <Link
                    href="/products"
                    className="text-sm font-semibold text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    Browse the bouquets
                  </Link>
                </div>
              </div>

              <FaqAccordion faqs={content.faqs} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
