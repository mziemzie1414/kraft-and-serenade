"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { IDLE } from "../form-state";
import {
  Field,
  Fieldset,
  ImageField,
  PrimaryButton,
  SecondaryButton,
  StatusMessage,
  inputClass,
} from "../ui";
import { saveProduct } from "./actions";

export type ProductDraft = {
  id: string | null;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  price: number | "";
  compareAtPrice: number | "";
  imageUrl: string;
  imageAlt: string;
  rating: number | "";
  reviewCount: number | "";
  badge: string;
  isFeatured: boolean;
  /** Empty string when the product is not in the Best Sellers chart. */
  bestSellerRank: number | "";
  position: number;
};

export function ProductForm({
  product,
  categories,
  version,
}: {
  product: ProductDraft;
  categories: { id: string; name: string }[];
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveProduct, IDLE);
  const router = useRouter();
  const isNew = product.id === null;

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      {product.id ? <input type="hidden" name="id" value={product.id} /> : null}

      <Fieldset title="Details">
        <Field label="Name">
          <input
            name="name"
            defaultValue={product.name}
            className={inputClass}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field
            label="URL slug"
            hint={
              isNew
                ? "Leave blank to build one from the name."
                : "Changing this changes the product's URL."
            }
          >
            <input
              name="slug"
              defaultValue={product.slug}
              placeholder="blush-peony-serenade"
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
              defaultValue={product.position}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="Category">
          <select
            name="categoryId"
            defaultValue={product.categoryId}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Choose a category…
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description" hint="Shown on the product page.">
          <textarea
            name="description"
            defaultValue={product.description}
            rows={5}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset title="Price">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price" hint="Whole pesos, no comma or symbol.">
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={product.price}
              className={inputClass}
              required
            />
          </Field>
          <Field
            label="Compare-at price"
            hint="Optional. Shown struck through, with the saving."
          >
            <input
              name="compareAtPrice"
              type="number"
              min={0}
              step={1}
              defaultValue={product.compareAtPrice}
              className={inputClass}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Photo">
        <ImageField
          name="imageUrl"
          label="Image"
          currentUrl={product.imageUrl}
          previewClassName="h-28 w-24"
        />
        <Field
          label="Image description"
          hint="Read aloud by screen readers. Describe what is in the photo."
        >
          <input
            name="imageAlt"
            defaultValue={product.imageAlt}
            className={inputClass}
            required
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Presentation"
        description="Placeholder social proof and shelf labels until real reviews exist."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rating out of 5">
            <input
              name="rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              defaultValue={product.rating}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Review count">
            <input
              name="reviewCount"
              type="number"
              min={0}
              step={1}
              defaultValue={product.reviewCount}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="Badge" hint='Optional corner label, e.g. "New" or "Best value".'>
          <input name="badge" defaultValue={product.badge} className={inputClass} />
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product.isFeatured}
            className="h-4 w-4 accent-moss-700"
          />
          Show in Featured Bouquets on the home page
        </label>

        <Field
          label="Best seller rank"
          hint="1 is the large lead tile. Leave blank to keep it out of the Best Sellers chart."
        >
          <input
            name="bestSellerRank"
            type="number"
            min={1}
            step={1}
            defaultValue={product.bestSellerRank}
            placeholder="Not a best seller"
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </PrimaryButton>

        {product.id ? (
          <SecondaryButton
            type="submit"
            name="intent"
            value="delete"
            pending={pending}
            /* Deleting a product cannot be undone, so confirm first. */
            onClick={(event) => {
              if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
                event.preventDefault();
              }
            }}
          >
            Delete
          </SecondaryButton>
        ) : null}

        <SecondaryButton type="button" onClick={() => router.push("/admin/products")}>
          Back to list
        </SecondaryButton>

        <StatusMessage state={state} />
      </div>
    </form>
  );
}
