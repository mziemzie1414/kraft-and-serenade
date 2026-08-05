"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { ReviewsContent } from "@/lib/reviews";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  PrimaryButton,
  StatusMessage,
  inputClass,
  labelClass,
} from "@/components/admin/ui";
import { saveReviews } from "./actions";

/** Blank rows appended so a new review can always be added without JavaScript. */
const SPARE_ROWS = 2;

const EMPTY = {
  name: "",
  location: "",
  quote: "",
  rating: 5,
  avatarUrl: "",
  purchased: "",
};

export function ReviewsForm({
  content,
  version,
}: {
  content: ReviewsContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveReviews, IDLE);

  const rows = [
    ...content.reviews,
    ...Array.from({ length: SPARE_ROWS }, () => EMPTY),
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
            rows={2}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Reviews"
        description="Three fit across on wide screens, and the first card is widened. Clear a name to delete that review; fill a blank row to add one."
      >
        <ul className="space-y-4">
          {rows.map((review, index) => (
            <li
              key={index}
              className="space-y-3 rounded-lg border border-canvas-deep px-3 py-3"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  name="reviewName"
                  defaultValue={review.name}
                  placeholder="Name"
                  aria-label={`Review ${index + 1} name`}
                  className={inputClass}
                />
                <input
                  name="reviewLocation"
                  defaultValue={review.location}
                  placeholder="Location"
                  aria-label={`Review ${index + 1} location`}
                  className={inputClass}
                />
              </div>

              <textarea
                name="reviewQuote"
                defaultValue={review.quote}
                rows={3}
                placeholder="What they said"
                aria-label={`Review ${index + 1} quote`}
                className={inputClass}
              />

              <div className="grid gap-2 sm:grid-cols-[7rem_1fr]">
                <input
                  name="reviewRating"
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  defaultValue={review.rating}
                  aria-label={`Review ${index + 1} stars`}
                  className={inputClass}
                />
                <input
                  name="reviewPurchased"
                  defaultValue={review.purchased}
                  placeholder="What they bought"
                  aria-label={`Review ${index + 1} purchase`}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="reviewAvatarUrl" value={review.avatarUrl} />
                {review.avatarUrl ? (
                  <Image
                    src={review.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="h-10 w-10 rounded-full border border-dashed border-canvas-deep" />
                )}
                <input
                  type="file"
                  name={`reviewAvatarFile-${index}`}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  aria-label={`Review ${index + 1} photo`}
                  className="flex-1 text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-canvas-alt file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-canvas-deep"
                />
              </div>
            </li>
          ))}
        </ul>

        <p className={labelClass}>
          A new review needs a name, a quote and a photo.
        </p>
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
