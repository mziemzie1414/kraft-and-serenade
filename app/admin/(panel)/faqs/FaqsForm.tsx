"use client";

import { useActionState } from "react";
import type { FaqContent } from "@/lib/faq";
import { IDLE } from "@/components/admin/form-state";
import { Field, Fieldset, PrimaryButton, StatusMessage, inputClass } from "@/components/admin/ui";
import { saveFaqs } from "./actions";

/** Blank rows appended so a new question can always be added without JavaScript. */
const SPARE_ROWS = 2;

export function FaqsForm({
  content,
  version,
}: {
  content: FaqContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveFaqs, IDLE);

  const rows = [
    ...content.faqs,
    ...Array.from({ length: SPARE_ROWS }, () => ({
      question: "",
      answer: "",
      showOnHome: false,
    })),
  ];

  const onHome = content.faqs.filter((faq) => faq.showOnHome).length;

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset
        title="Home page section"
        description="The FAQ block partway down the home page."
      >
        <Field label="Eyebrow" hint="The small line above the title.">
          <input
            name="eyebrow"
            defaultValue={content.eyebrow}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Title">
          <input
            name="title"
            defaultValue={content.title}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Intro">
          <textarea
            name="lede"
            defaultValue={content.lede}
            rows={3}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="FAQ page"
        description="The heading on /faqs, which always lists every question."
      >
        <Field label="Page title">
          <input
            name="pageTitle"
            defaultValue={content.pageTitle}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Page intro">
          <textarea
            name="pageLede"
            defaultValue={content.pageLede}
            rows={3}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Button"
        description="Shown in both places, for people whose question is not listed."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label">
            <input
              name="ctaLabel"
              defaultValue={content.ctaLabel}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Link" hint="Use /#contact so it works from the FAQ page too.">
            <input
              name="ctaHref"
              defaultValue={content.ctaHref}
              className={inputClass}
              required
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        title="Questions"
        description={`Every question appears on /faqs. Tick "show on home page" for the ones worth putting on the front — ${onHome} of ${content.faqs.length} currently are. Clear a question to delete it; fill a blank row to add one.`}
      >
        <ul className="space-y-4">
          {rows.map((faq, index) => (
            <li
              key={index}
              className="space-y-2 rounded-lg border border-canvas-deep px-3 py-3"
            >
              <input
                name="faqQuestion"
                defaultValue={faq.question}
                placeholder="Question"
                aria-label={`Question ${index + 1}`}
                className={inputClass}
              />
              <textarea
                name="faqAnswer"
                defaultValue={faq.answer}
                rows={3}
                placeholder="Answer"
                aria-label={`Answer ${index + 1}`}
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  name={`faqShowOnHome-${index}`}
                  defaultChecked={faq.showOnHome}
                  className="h-4 w-4 accent-moss-700"
                />
                Show on home page
              </label>
            </li>
          ))}
        </ul>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : "Save changes"}
        </PrimaryButton>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
