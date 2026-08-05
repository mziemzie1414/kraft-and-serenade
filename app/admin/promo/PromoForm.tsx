"use client";

import { useActionState } from "react";
import type { PromoContent } from "@/lib/promo";
import { IDLE } from "../form-state";
import {
  Field,
  Fieldset,
  ImageField,
  PrimaryButton,
  StatusMessage,
  inputClass,
} from "../ui";
import { savePromo } from "./actions";

export function PromoForm({
  promo,
  version,
}: {
  promo: PromoContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(savePromo, IDLE);

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset
        title="Visibility"
        description="Turn the banner off between promotions. The copy is kept either way."
      >
        <label className="flex items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={promo.isPublished}
            className="h-4 w-4 accent-moss-700"
          />
          Show the promo banner on the home page
        </label>
      </Fieldset>

      <Fieldset title="Copy">
        <Field label="Badge" hint="The small pill above the headline.">
          <input
            name="badge"
            defaultValue={promo.badge}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Headline">
          <input
            name="title"
            defaultValue={promo.title}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Description">
          <textarea
            name="body"
            defaultValue={promo.body}
            rows={3}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset title="Background photo">
        <ImageField
          name="imageUrl"
          label="Image"
          currentUrl={promo.imageUrl}
          previewClassName="h-24 w-40"
        />
        <Field
          label="Image description"
          hint="Read aloud by screen readers. Describe what is in the photo."
        >
          <input
            name="imageAlt"
            defaultValue={promo.imageAlt}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Buttons"
        description="The second button is optional. Leave both of its fields blank to hide it."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First button label">
            <input
              name="primaryCtaLabel"
              defaultValue={promo.primaryCtaLabel}
              className={inputClass}
              required
            />
          </Field>
          <Field label="First button link">
            <input
              name="primaryCtaHref"
              defaultValue={promo.primaryCtaHref}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Second button label">
            <input
              name="secondaryCtaLabel"
              defaultValue={promo.secondaryCtaLabel ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Second button link">
            <input
              name="secondaryCtaHref"
              defaultValue={promo.secondaryCtaHref ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        title="Discount code"
        description="The card beside the copy. Clear the code to hide the whole card."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Caption" hint='Above the code, e.g. "Use code".'>
            <input
              name="codeLabel"
              defaultValue={promo.codeLabel}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Code">
            <input
              name="code"
              defaultValue={promo.code ?? ""}
              placeholder="No code"
              spellCheck={false}
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>
        <Field label="Terms" hint="The small print below the code.">
          <textarea
            name="codeNote"
            defaultValue={promo.codeNote}
            rows={2}
            className={inputClass}
            required
          />
        </Field>
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
