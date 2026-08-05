"use client";

import { useActionState } from "react";
import type { AboutContent } from "@/lib/about";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  ImageField,
  PrimaryButton,
  StatusMessage,
  inputClass,
} from "@/components/admin/ui";
import { saveAbout } from "./actions";

export function AboutForm({
  about,
  version,
}: {
  about: AboutContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveAbout, IDLE);

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset title="Header">
        <Field label="Eyebrow" hint="Small text above the headline.">
          <input
            name="eyebrow"
            defaultValue={about.eyebrow}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Title">
          <input
            name="title"
            defaultValue={about.title}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset title="Body">
        <Field label="Content" hint="Use blank lines to separate paragraphs.">
          <textarea
            name="body"
            defaultValue={about.body}
            rows={8}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset title="Image">
        <ImageField
          name="imageUrl"
          label="About page photo"
          currentUrl={about.imageUrl}
          previewClassName="h-40 w-56"
        />

        <Field label="Image description" hint="Describes the photo for screen readers.">
          <input
            name="imageAlt"
            defaultValue={about.imageAlt}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <div className="flex items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving..." : "Save changes"}
        </PrimaryButton>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
