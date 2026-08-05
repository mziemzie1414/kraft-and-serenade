"use client";

import { useActionState } from "react";
import type { ContactContent } from "@/lib/contact";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  PrimaryButton,
  StatusMessage,
  inputClass,
} from "@/components/admin/ui";
import { saveContact } from "./actions";

export function ContactForm({
  contact,
  version,
}: {
  contact: ContactContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveContact, IDLE);

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      <Fieldset title="Header">
        <Field label="Eyebrow" hint="Small text above the headline.">
          <input
            name="eyebrow"
            defaultValue={contact.eyebrow}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Title">
          <input
            name="title"
            defaultValue={contact.title}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Description">
          <textarea
            name="body"
            defaultValue={contact.body}
            rows={4}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset title="Contact details">
        <Field label="Address" hint="Shown on the contact page.">
          <input
            name="address"
            defaultValue={contact.address}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Phone">
          <input
            name="phone"
            defaultValue={contact.phone}
            className={inputClass}
            required
          />
        </Field>

        <Field
          label="Google Maps embed URL"
          hint="Optional. Paste the src from a Google Maps embed iframe. Leave empty to hide the map."
        >
          <input
            name="mapEmbedUrl"
            defaultValue={contact.mapEmbedUrl ?? ""}
            className={inputClass}
            placeholder="https://www.google.com/maps/embed?pb=..."
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
