"use client";

import Link from "next/link";
import { useState } from "react";
import { FAQS } from "@/lib/data";
import { PlusIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FaqSection() {
  /* Tracks which panels are open by id. Multiple can be open at once, which
     is friendlier than an accordion that snaps others shut while reading. */
  const [openIds, setOpenIds] = useState<string[]>([FAQS[0].id]);

  const toggle = (id: string) =>
    setOpenIds((current) =>
      current.includes(id) ? current.filter((openId) => openId !== id) : [...current, id]
    );

  return (
    <section id="faqs" className="scroll-mt-24 bg-canvas py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="FAQs"
              title="The questions we get most"
              lede="Delivery, freshness, substitutions and custom work. If your question is not here, message us and we will answer it properly."
              align="left"
            />

            <Link
              href="#contact"
              className="mt-7 inline-flex items-center justify-center rounded-full border border-moss-700/25 px-6 py-3.5 text-sm font-semibold text-moss-700 transition-colors duration-300 hover:bg-moss-700 hover:text-canvas"
            >
              Ask us something else
            </Link>
          </div>

          <ul className="divide-y divide-canvas-deep border-y border-canvas-deep">
            {FAQS.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              const panelId = `${faq.id}-panel`;
              const buttonId = `${faq.id}-button`;

              return (
                <li key={faq.id}>
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(faq.id)}
                      className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors duration-200 hover:text-moss-700"
                    >
                      <span className="font-display text-lg leading-snug font-medium text-pretty">
                        {faq.question}
                      </span>
                      <span
                        aria-hidden
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          isOpen
                            ? "rotate-45 border-moss-700 bg-moss-700 text-canvas"
                            : "border-canvas-deep text-ink-soft"
                        }`}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </h3>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="pb-6 pr-12"
                  >
                    <p className="text-sm leading-relaxed text-ink-soft text-pretty">
                      {faq.answer}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
