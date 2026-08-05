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
import { saveCategory } from "./actions";

export type CategoryDraft = {
  id: string | null;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  position: number;
};

export function CategoryForm({
  category,
  version,
}: {
  category: CategoryDraft;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveCategory, IDLE);
  const router = useRouter();
  const isNew = category.id === null;

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      {category.id ? <input type="hidden" name="id" value={category.id} /> : null}

      <Fieldset title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" hint="Shown in full on category cards.">
            <input
              name="name"
              defaultValue={category.name}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Short name" hint="For filter chips and menus.">
            <input
              name="shortName"
              defaultValue={category.shortName}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field
            label="URL slug"
            hint={
              isNew
                ? "Leave blank to build one from the name."
                : "Changing this changes the category's URL."
            }
          >
            <input
              name="slug"
              defaultValue={category.slug}
              placeholder="rose-bouquets"
              spellCheck={false}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Position" hint="Low to high.">
            <input
              name="position"
              type="number"
              min={0}
              step={1}
              defaultValue={category.position}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="Description" hint="One or two lines, shown on the category card.">
          <textarea
            name="description"
            defaultValue={category.description}
            rows={3}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset title="Photo">
        <ImageField
          name="imageUrl"
          label="Image"
          currentUrl={category.imageUrl}
          previewClassName="h-24 w-24"
        />
        <Field
          label="Image description"
          hint="Read aloud by screen readers. Describe what is in the photo."
        >
          <input
            name="imageAlt"
            defaultValue={category.imageAlt}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : isNew ? "Create category" : "Save changes"}
        </PrimaryButton>

        {category.id ? (
          <SecondaryButton
            type="submit"
            name="intent"
            value="delete"
            pending={pending}
            /* A category is not recoverable once deleted, so confirm first. */
            onClick={(event) => {
              if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) {
                event.preventDefault();
              }
            }}
          >
            Delete
          </SecondaryButton>
        ) : null}

        <SecondaryButton type="button" onClick={() => router.push("/admin/categories")}>
          Back to list
        </SecondaryButton>

        <StatusMessage state={state} />
      </div>
    </form>
  );
}
