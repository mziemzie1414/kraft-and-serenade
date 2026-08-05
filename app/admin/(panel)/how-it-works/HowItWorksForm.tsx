"use client";

import { useActionState } from "react";
import type { HowItWorksContent } from "@/lib/how-it-works";
import { IDLE } from "@/components/admin/form-state";
import { Field, Fieldset, PrimaryButton, StatusMessage, inputClass } from "@/components/admin/ui";
import { saveHowItWorks } from "./actions";

/** Blank rows appended so a new step can always be added without JavaScript. */
const SPARE_ROWS = 2;

export function HowItWorksForm({
  content,
  version,
}: {
  content: HowItWorksContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveHowItWorks, IDLE);

  const stepRows = [
    ...content.steps,
    ...Array.from({ length: SPARE_ROWS }, () => ({
      label: "",
      title: "",
      body: "",
    })),
  ];

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset title="Heading">
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
        title="Steps"
        description="Four fit across on wide screens. Clear a heading to delete that step; fill a blank row to add one."
      >
        <ul className="space-y-3">
          {stepRows.map((step, index) => (
            <li
              key={index}
              className="space-y-2 rounded-lg border border-canvas-deep px-3 py-3"
            >
              <div className="grid gap-2 sm:grid-cols-[6rem_1fr]">
                <input
                  name="stepLabel"
                  defaultValue={step.label}
                  placeholder="01"
                  aria-label={`Step ${index + 1} number`}
                  className={`${inputClass} text-center font-mono`}
                />
                <input
                  name="stepTitle"
                  defaultValue={step.title}
                  placeholder="Heading"
                  aria-label={`Step ${index + 1} heading`}
                  className={inputClass}
                />
              </div>
              <textarea
                name="stepBody"
                defaultValue={step.body}
                rows={2}
                placeholder="Description"
                aria-label={`Step ${index + 1} description`}
                className={inputClass}
              />
            </li>
          ))}
        </ul>
      </Fieldset>

      <Fieldset
        title="Callout"
        description="The panel below the steps, with the button."
      >
        <Field label="Heading">
          <input
            name="calloutTitle"
            defaultValue={content.calloutTitle}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Text">
          <textarea
            name="calloutBody"
            defaultValue={content.calloutBody}
            rows={2}
            className={inputClass}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button label">
            <input
              name="calloutCtaLabel"
              defaultValue={content.calloutCtaLabel}
              className={inputClass}
              required
            />
          </Field>
          <Field
            label="Button link"
            hint="A path like /products or an anchor like #featured."
          >
            <input
              name="calloutCtaHref"
              defaultValue={content.calloutCtaHref}
              className={inputClass}
              required
            />
          </Field>
        </div>
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
