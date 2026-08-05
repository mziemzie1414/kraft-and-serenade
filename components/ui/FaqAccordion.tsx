"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/faq";
import { PlusIcon } from "./Icons";

/**
 * Shared by the landing section and the /faqs page.
 *
 * Multiple panels can be open at once, which is friendlier than an accordion
 * that snaps others shut while you are still reading one.
 */
export function FaqAccordion({
  faqs,
  /** Opens the first panel so the pattern is obvious without a click. */
  openFirst = true,
}: {
  faqs: FaqItem[];
  openFirst?: boolean;
}) {
  const [openIds, setOpenIds] = useState<string[]>(
    openFirst && faqs.length > 0 ? [faqs[0].id] : [],
  );

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((openId) => openId !== id)
        : [...current, id],
    );
  }

  return (
    <ul className="divide-y divide-canvas-deep border-y border-canvas-deep">
      {faqs.map((faq) => {
        const isOpen = openIds.includes(faq.id);
        const panelId = `faq-${faq.id}-panel`;
        const buttonId = `faq-${faq.id}-button`;

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
              className="pr-12 pb-6"
            >
              <p className="text-sm leading-relaxed text-pretty text-ink-soft">
                {faq.answer}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
