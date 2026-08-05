"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  ImageField,
  PrimaryButton,
  SecondaryButton,
  StatusMessage,
  inputClass,
} from "@/components/admin/ui";
import { saveOccasion } from "./actions";

export type OccasionDraft = {
  id: string | null;
  slug: string;
  name: string;
  blurb: string;
  imageUrl: string;
  imageAlt: string;
  categoryId: string;
  position: number;
};

export function OccasionForm({
  occasion,
  categories,
  version,
}: {
  occasion: OccasionDraft;
  categories: { id: string; name: string }[];
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveOccasion, IDLE);
  const router = useRouter();
  const isNew = occasion.id === null;

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      {occasion.id ? <input type="hidden" name="id" value={occasion.id} /> : null}

      <Fieldset title="Details">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field label="Name" hint="Shown on the tile.">
            <input
              name="name"
              defaultValue={occasion.name}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Position" hint="Low to high.">
            <input
              name="position"
              type="number"
              min={0}
              step={1}
              defaultValue={occasion.position}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field
          label="URL slug"
          hint={isNew ? "Leave blank to build one from the name." : undefined}
        >
          <input
            name="slug"
            defaultValue={occasion.slug}
            placeholder="just-because"
            spellCheck={false}
            className={`${inputClass} font-mono`}
          />
        </Field>

        <Field label="Blurb" hint="One short line, revealed when the tile is hovered.">
          <input
            name="blurb"
            defaultValue={occasion.blurb}
            className={inputClass}
            required
          />
        </Field>

        <Field
          label="Links to"
          hint="Where the tile leads. Leave unset to send visitors to the full catalogue."
        >
          <select
            name="categoryId"
            defaultValue={occasion.categoryId}
            className={inputClass}
          >
            <option value="">All bouquets</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </Fieldset>

      <Fieldset title="Photo">
        <ImageField
          name="imageUrl"
          label="Image"
          currentUrl={occasion.imageUrl}
          previewClassName="h-28 w-24"
        />
        <Field
          label="Image description"
          hint="Read aloud by screen readers. Describe what is in the photo."
        >
          <input
            name="imageAlt"
            defaultValue={occasion.imageAlt}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : isNew ? "Create occasion" : "Save changes"}
        </PrimaryButton>

        {occasion.id ? (
          <SecondaryButton
            type="submit"
            name="intent"
            value="delete"
            pending={pending}
            /* Not recoverable once deleted, so confirm first. */
            onClick={(event) => {
              if (!confirm(`Delete "${occasion.name}"? This cannot be undone.`)) {
                event.preventDefault();
              }
            }}
          >
            Delete
          </SecondaryButton>
        ) : null}

        <SecondaryButton type="button" onClick={() => router.push("/admin/occasions")}>
          Back to list
        </SecondaryButton>

        <StatusMessage state={state} />
      </div>
    </form>
  );
}
