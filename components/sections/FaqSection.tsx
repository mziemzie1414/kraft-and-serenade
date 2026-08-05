import Link from "next/link";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFaqContent } from "@/lib/faq";

export async function FaqSection() {
  const content = await getFaqContent();

  // The landing page shows a curated subset; /faqs always shows everything.
  const featured = content.faqs.filter((faq) => faq.showOnHome);

  if (featured.length === 0) return null;

  const hasMore = content.faqs.length > featured.length;

  return (
    <section id="faqs" className="scroll-mt-24 bg-canvas py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow={content.eyebrow}
              title={content.title}
              lede={content.lede}
              align="left"
            />

            <div className="mt-7 flex flex-col items-start gap-4">
              <Link
                href={content.ctaHref}
                className="inline-flex items-center justify-center rounded-full border border-moss-700/25 px-6 py-3.5 text-sm font-semibold text-moss-700 transition-colors duration-300 hover:bg-moss-700 hover:text-canvas"
              >
                {content.ctaLabel}
              </Link>

              <Link
                href="/faqs"
                className="text-sm font-semibold text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {hasMore
                  ? `Read all ${content.faqs.length} questions`
                  : "Open the full FAQ page"}
              </Link>
            </div>
          </div>

          <FaqAccordion faqs={featured} />
        </div>
      </div>
    </section>
  );
}
