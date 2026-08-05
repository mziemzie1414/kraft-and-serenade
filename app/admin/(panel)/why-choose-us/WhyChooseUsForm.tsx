"use client";

import { useActionState } from "react";
import type { WhyChooseUsContent } from "@/lib/why-choose-us";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  ImageField,
  PrimaryButton,
  StatusMessage,
  inputClass,
} from "@/components/admin/ui";
import { saveWhyChooseUs } from "./actions";

/** Blank rows appended so a new item can always be added without JavaScript. */
const SPARE_ROWS = 2;

export function WhyChooseUsForm({
  content,
  version,
}: {
  content: WhyChooseUsContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveWhyChooseUs, IDLE);

  const pointRows = [
    ...content.points,
    ...Array.from({ length: SPARE_ROWS }, () => ({ title: "", body: "" })),
  ];

  const statRows = [
    ...content.stats,
    ...Array.from({ length: SPARE_ROWS }, () => ({ value: "", label: "" })),
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
        title="Photos"
        description="A large photograph with a smaller one overlapping its corner."
      >
        <ImageField
          name="primaryImageUrl"
          label="Main image"
          currentUrl={content.primaryImageUrl}
          previewClassName="h-24 w-32"
        />
        <Field
          label="Main image description"
          hint="Read aloud by screen readers. Describe what is in the photo."
        >
          <input
            name="primaryImageAlt"
            defaultValue={content.primaryImageAlt}
            className={inputClass}
            required
          />
        </Field>
        <ImageField
          name="secondaryImageUrl"
          label="Inset image"
          currentUrl={content.secondaryImageUrl}
          previewClassName="h-24 w-24"
        />
        <p className="text-xs text-ink-faint">
          The inset image is decorative and hidden from screen readers, so it needs
          no description.
        </p>
      </Fieldset>

      <Fieldset
        title="Badge"
        description="The small tile over the top-left corner of the collage, shown on wide screens."
      >
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Field label="Figure">
            <input
              name="badgeValue"
              defaultValue={content.badgeValue}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Label" hint="Line breaks here are kept when rendered.">
            <textarea
              name="badgeLabel"
              defaultValue={content.badgeLabel}
              rows={2}
              className={inputClass}
              required
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        title="Selling points"
        description="The check-marked list. Clear a heading to delete that point; fill a blank row to add one."
      >
        <ul className="space-y-3">
          {pointRows.map((point, index) => (
            <li
              key={index}
              className="space-y-2 rounded-lg border border-canvas-deep px-3 py-3"
            >
              <input
                name="pointTitle"
                defaultValue={point.title}
                placeholder="Heading"
                aria-label={`Point ${index + 1} heading`}
                className={inputClass}
              />
              <textarea
                name="pointBody"
                defaultValue={point.body}
                rows={2}
                placeholder="Description"
                aria-label={`Point ${index + 1} description`}
                className={inputClass}
              />
            </li>
          ))}
        </ul>
      </Fieldset>

      <Fieldset
        title="Stat strip"
        description="The row of figures below the photos. Four fit across on wide screens. Clear a figure to delete it."
      >
        <ul className="space-y-3">
          {statRows.map((stat, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-lg border border-canvas-deep px-3 py-3 sm:grid-cols-[10rem_1fr]"
            >
              <input
                name="statValue"
                defaultValue={stat.value}
                placeholder="1,240+"
                aria-label={`Stat ${index + 1} figure`}
                className={inputClass}
              />
              <input
                name="statLabel"
                defaultValue={stat.label}
                placeholder="Orders delivered"
                aria-label={`Stat ${index + 1} label`}
                className={inputClass}
              />
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
