"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { GalleryContent } from "@/lib/gallery";
import { IDLE } from "../form-state";
import { Field, Fieldset, PrimaryButton, StatusMessage, inputClass } from "../ui";
import { saveGallery } from "./actions";

/** Blank slots appended so a new tile can always be added without JavaScript. */
const SPARE_SLOTS = 2;

const EMPTY = { imageUrl: "", alt: "", caption: "", linkUrl: null };

export function GalleryForm({
  content,
  version,
}: {
  content: GalleryContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveGallery, IDLE);

  const slots = [
    ...content.images,
    ...Array.from({ length: SPARE_SLOTS }, () => EMPTY),
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
        <Field label="Title" hint="The handle, shown as the section heading.">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button label">
            <input
              name="ctaLabel"
              defaultValue={content.ctaLabel}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Button link" hint="Point this at the real profile URL.">
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
        title="Tiles"
        description="The first and sixth tiles are shown twice the size. Tick remove to delete one, or fill a blank slot to add one."
      >
        <ul className="space-y-4">
          {slots.map((image, index) => (
            <li
              key={index}
              className="space-y-3 rounded-lg border border-canvas-deep px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="imageUrl" value={image.imageUrl} />
                {image.imageUrl ? (
                  <Image
                    src={image.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="h-14 w-14 rounded-lg border border-dashed border-canvas-deep" />
                )}

                <input
                  type="file"
                  name={`imageFile-${index}`}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  aria-label={`Tile ${index + 1} photo`}
                  className="flex-1 text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-canvas-alt file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-canvas-deep"
                />

                {image.imageUrl ? (
                  <label className="flex items-center gap-2 text-xs text-ink-soft">
                    <input
                      type="checkbox"
                      name={`imageRemove-${index}`}
                      className="h-4 w-4 accent-moss-700"
                    />
                    Remove
                  </label>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  name="imageCaption"
                  defaultValue={image.caption}
                  placeholder="Caption, shown on hover"
                  aria-label={`Tile ${index + 1} caption`}
                  className={inputClass}
                />
                <input
                  name="imageAlt"
                  defaultValue={image.alt}
                  placeholder="Image description, for screen readers"
                  aria-label={`Tile ${index + 1} image description`}
                  className={inputClass}
                />
              </div>

              <input
                name="imageLinkUrl"
                defaultValue={image.linkUrl ?? ""}
                placeholder="Optional link, e.g. the Instagram post"
                aria-label={`Tile ${index + 1} link`}
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
