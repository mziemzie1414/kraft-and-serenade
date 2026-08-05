"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORY_IMAGE_WIDTH, isSlug, slugify } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import type { AdminFormState } from "../form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

/** Occasion tiles only appear on the landing page. */
function revalidateStorefront() {
  revalidatePath("/");
}

type Outcome = { state: AdminFormState; redirectTo?: string };

async function handle(id: string | null, formData: FormData): Promise<Outcome> {
  if (formData.get("intent") === "delete") {
    if (!id) throw new Error("Nothing to delete.");

    await prisma.occasion.delete({ where: { id } });
    revalidateStorefront();

    return {
      state: { status: "saved", message: "Occasion deleted." },
      redirectTo: "/admin/occasions",
    };
  }

  const name = requireText(formData, "name", "Name");
  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);

  if (!isSlug(slug)) {
    throw new Error(
      `"${slug}" is not a valid URL slug. Use lowercase letters, numbers and hyphens.`,
    );
  }

  const clash = await prisma.occasion.findUnique({ where: { slug } });

  if (clash && clash.id !== id) {
    throw new Error(`Another occasion already uses the slug "${slug}".`);
  }

  const position = Number(String(formData.get("position") ?? "").trim());

  if (!Number.isInteger(position) || position < 0) {
    throw new Error("Position must be a whole number, 0 or higher.");
  }

  // Blank means the tile links to the full catalogue instead.
  const rawCategoryId = String(formData.get("categoryId") ?? "").trim();
  const categoryId = rawCategoryId || null;

  if (categoryId) {
    const exists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!exists) throw new Error("That category no longer exists.");
  }

  const file = formData.get("imageUrlFile");
  let imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    const upload = await uploadImage(file, "occasions", CATEGORY_IMAGE_WIDTH);

    if ("error" in upload) throw new Error(`Image: ${upload.error}`);

    imageUrl = upload.url;
  }

  if (!imageUrl) throw new Error("An image is required.");

  const data = {
    slug,
    name,
    blurb: requireText(formData, "blurb", "Blurb"),
    imageAlt: requireText(formData, "imageAlt", "Image description"),
    imageUrl,
    position,
    categoryId,
  };

  if (id) {
    await prisma.occasion.update({ where: { id }, data });
    revalidateStorefront();

    return { state: { status: "saved", message: "Occasion updated." } };
  }

  const created = await prisma.occasion.create({ data });
  revalidateStorefront();

  return {
    state: { status: "saved", message: "Occasion created." },
    redirectTo: `/admin/occasions/${created.id}`,
  };
}

/**
 * Creates, updates or deletes an occasion. `redirect()` works by throwing, so it
 * is called after the error handling rather than inside it.
 */
export async function saveOccasion(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const idValue = formData.get("id");
  const id = typeof idValue === "string" && idValue ? idValue : null;

  let outcome: Outcome;

  try {
    outcome = await handle(id, formData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  if (outcome.redirectTo) redirect(outcome.redirectTo);

  return outcome.state;
}
