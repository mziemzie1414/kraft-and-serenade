import Link from "next/link";
import { HOW_IT_WORKS } from "@/lib/data";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-moss-900 py-20 text-canvas sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, no phone tag"
          lede="From picking a bouquet to a photo of it in someone's hands. Most orders take under five minutes to place."
          tone="light"
        />

        <ol className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, index) => (
            <li key={item.step} className="relative">
              {/* Connector line between steps on desktop. Decorative. */}
              {index < HOW_IT_WORKS.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-6 left-14 hidden h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-canvas/25 to-transparent lg:block"
                />
              ) : null}

              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-canvas/25 bg-moss-700 font-display text-sm font-semibold text-blush-300">
                {item.step}
              </span>

              <h3 className="mt-5 font-display text-lg leading-snug font-medium text-canvas">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-canvas/65">
                {item.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-canvas/15 bg-canvas/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="font-display text-xl font-medium text-canvas">
              Need something for tomorrow morning?
            </h3>
            <p className="mt-1.5 text-sm text-canvas/65">
              Order before 1:00 PM for same-day, or any time for next-day delivery.
            </p>
          </div>
          <Link
            href="#featured"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-canvas px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-blush-100"
          >
            Start an order
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
