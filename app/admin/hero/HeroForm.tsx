"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  TRUST_POINT_ICONS,
  TRUST_POINT_ICON_LABELS,
  type HeroContent,
} from "@/lib/hero";
import { saveHero, type HeroFormState } from "./actions";

const INITIAL_STATE: HeroFormState = { status: "idle" };

/** Reviewer photo slots shown, so an empty one can always be filled. */
const AVATAR_SLOTS = 4;

/** Blank trust bar rows appended for adding new items. */
const SPARE_TRUST_ROWS = 2;

const inputClass =
  "w-full rounded-lg border border-canvas-deep bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-moss-400 focus:outline-none";

const labelClass = "block text-xs font-semibold tracking-wide text-ink-soft uppercase";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {hint ? <span className="mt-1 block text-xs text-ink-faint">{hint}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function Fieldset({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-canvas-deep bg-canvas p-5">
      <legend className="px-1 font-display text-base font-medium text-ink">
        {title}
      </legend>
      {description ? (
        <p className="mb-4 text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

/**
 * An image field. The current URL travels in a hidden input so the action can
 * keep it when no replacement file is chosen.
 */
function ImageField({
  name,
  label,
  currentUrl,
  previewClassName,
}: {
  name: string;
  label: string;
  currentUrl: string;
  previewClassName: string;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <input type="hidden" name={name} value={currentUrl} />
      <div className="mt-1.5 flex flex-wrap items-center gap-4">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt=""
            width={160}
            height={160}
            className={`rounded-lg border border-canvas-deep object-cover ${previewClassName}`}
            unoptimized
          />
        ) : null}
        <input
          type="file"
          name={`${name}File`}
          accept="image/jpeg,image/png,image/webp,image/avif"
          aria-label={`Replace ${label.toLowerCase()}`}
          className="text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-moss-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-canvas hover:file:bg-moss-700"
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        Leave empty to keep the current image. Uploads are compressed to WebP.
      </p>
    </div>
  );
}

export function HeroForm({
  hero,
  version,
}: {
  hero: HeroContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveHero, INITIAL_STATE);

  const avatarSlots = Array.from(
    { length: Math.max(hero.reviewAvatarUrls.length, AVATAR_SLOTS) },
    (_, index) => hero.reviewAvatarUrls[index] ?? "",
  );

  const trustRows = [
    ...hero.trustPoints,
    ...Array.from({ length: SPARE_TRUST_ROWS }, () => ({
      label: "",
      icon: "leaf",
      desktopOnly: false,
    })),
  ];

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset title="Headline">
        <Field label="Eyebrow" hint="The small pill above the headline.">
          <input
            name="eyebrow"
            defaultValue={hero.eyebrow}
            className={inputClass}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline, first line">
            <input
              name="headingLead"
              defaultValue={hero.headingLead}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Headline, italic line">
            <input
              name="headingAccent"
              defaultValue={hero.headingAccent}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            name="description"
            defaultValue={hero.description}
            rows={4}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset title="Buttons">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary label">
            <input
              name="primaryCtaLabel"
              defaultValue={hero.primaryCtaLabel}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Primary link" hint="A path like /shop or an anchor like #featured.">
            <input
              name="primaryCtaHref"
              defaultValue={hero.primaryCtaHref}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Secondary label">
            <input
              name="secondaryCtaLabel"
              defaultValue={hero.secondaryCtaLabel}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Secondary link">
            <input
              name="secondaryCtaHref"
              defaultValue={hero.secondaryCtaHref}
              className={inputClass}
              required
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Background photo">
        <ImageField
          name="backgroundImageUrl"
          label="Image"
          currentUrl={hero.backgroundImageUrl}
          previewClassName="h-24 w-40"
        />
        <Field
          label="Image description"
          hint="Read aloud by screen readers. Describe what is in the photo."
        >
          <input
            name="backgroundImageAlt"
            defaultValue={hero.backgroundImageAlt}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Social proof"
        description="The rating badge and reviewer photos beneath the buttons."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rating out of 5">
            <input
              name="ratingValue"
              type="number"
              min={0}
              max={5}
              step={0.1}
              defaultValue={hero.ratingValue}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Caption">
            <input
              name="ratingCaption"
              defaultValue={hero.ratingCaption}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <div>
          <span className={labelClass}>Reviewer photos</span>
          <ul className="mt-2 space-y-3">
            {avatarSlots.map((url, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-canvas-deep px-3 py-2"
              >
                <input type="hidden" name="reviewAvatarUrl" value={url} />
                {url ? (
                  <Image
                    src={url}
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
                  aria-label={`Replace reviewer photo ${index + 1}`}
                  className="flex-1 text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-canvas-alt file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-canvas-deep"
                />
                {url ? (
                  <label className="flex items-center gap-2 text-xs text-ink-soft">
                    <input
                      type="checkbox"
                      name={`reviewAvatarRemove-${index}`}
                      className="h-4 w-4 accent-moss-700"
                    />
                    Remove
                  </label>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </Fieldset>

      <Fieldset
        title="Accent card"
        description="The small tilted card in the bottom right, shown on wide screens only."
      >
        <ImageField
          name="accentImageUrl"
          label="Image"
          currentUrl={hero.accentImageUrl}
          previewClassName="h-24 w-20"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input
              name="accentTitle"
              defaultValue={hero.accentTitle}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Caption">
            <input
              name="accentCaption"
              defaultValue={hero.accentCaption}
              className={inputClass}
              required
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        title="Trust bar"
        description="The strip pinned to the bottom of the hero. Clear a label to delete that item; fill a blank row to add one."
      >
        <ul className="space-y-3">
          {trustRows.map((point, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-lg border border-canvas-deep px-3 py-3 sm:grid-cols-[1fr_11rem_auto] sm:items-center"
            >
              <input
                name="trustPointLabel"
                defaultValue={point.label}
                placeholder="Label"
                aria-label={`Trust bar item ${index + 1} label`}
                className={inputClass}
              />
              <select
                name="trustPointIcon"
                defaultValue={point.icon}
                aria-label={`Trust bar item ${index + 1} icon`}
                className={inputClass}
              >
                {TRUST_POINT_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {TRUST_POINT_ICON_LABELS[icon]}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  name={`trustPointDesktopOnly-${index}`}
                  defaultChecked={point.desktopOnly}
                  className="h-4 w-4 accent-moss-700"
                />
                Wide screens only
              </label>
            </li>
          ))}
        </ul>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-moss-900 px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>

        {state.status !== "idle" && state.message ? (
          <p
            role="status"
            className={
              state.status === "error"
                ? "text-sm font-medium text-blush-600"
                : "text-sm font-medium text-moss-600"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
