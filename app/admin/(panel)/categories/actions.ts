"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORY_IMAGE_WIDTH, isSlug, slugify } from "@/lib/catalog";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import type { AdminFormState } from "@/components/admin/form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

/**
 * Refreshes the storefront pages that list categories. Categories appear in the
 * shared header and footer, so this covers every page under the site layout.
 */
function revalidateStorefront() {
  revalidatePath("/", "layout");
}

/** Where to go after a successful create or delete, if anywhere. */
type Outcome = { state: AdminFormState; redirectTo?: string };

async function handle(id: string | null, formData: FormData): Promise<Outcome> {
  if (formData.get("intent") === "delete") {
    if (!id) throw new Error("Nothing to delete.");

    const count = await prisma.product.count({ where: { categoryId: id } });

    if (count > 0) {
      throw new Error(
        `This category still has ${count} product${count === 1 ? "" : "s"}. ` +
          "Move or delete them first.",
      );
    }

    await prisma.category.delete({ where: { id } });
    revalidateStorefront();

    // The record being edited is gone, so there is no page to stay on.
    return {
      state: { status: "saved", message: "Category deleted." },
      redirectTo: "/admin/categories",
    };
  }

  const name = requireText(formData, "name", "Name");
  // A blank slug is derived from the name, so a new category needs no thought.
  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);

  if (!isSlug(slug)) {
    throw new Error(
      `"${slug}" is not a valid URL slug. Use lowercase letters, numbers and hyphens.`,
    );
  }

  const clash = await prisma.category.findUnique({ where: { slug } });

  if (clash && clash.id !== id) {
    throw new Error(`Another category already uses the slug "${slug}".`);
  }

  const position = Number(formData.get("position"));

  if (!Number.isInteger(position) || position < 0) {
    throw new Error("Position must be a whole number, 0 or higher.");
  }

  const file = formData.get("imageUrlFile");
  let imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    const upload = await uploadImage(file, "categories", CATEGORY_IMAGE_WIDTH);

    if ("error" in upload) throw new Error(`Image: ${upload.error}`);

    imageUrl = upload.url;
  }

  if (!imageUrl) throw new Error("An image is required.");

  const data = {
    slug,
    name,
    shortName: requireText(formData, "shortName", "Short name"),
    description: requireText(formData, "description", "Description"),
    imageAlt: requireText(formData, "imageAlt", "Image description"),
    imageUrl,
    position,
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
    revalidateStorefront();

    return { state: { status: "saved", message: "Category updated." } };
  }

  const created = await prisma.category.create({ data });
  revalidateStorefront();

  return {
    state: { status: "saved", message: "Category created." },
    redirectTo: `/admin/categories/${created.id}`,
  };
}

/**
 * Creates, updates or deletes a category. `redirect()` works by throwing, so it
 * is called after the error handling rather than inside it.
 */
export async function saveCategory(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const idValue = formData.get("id");
  const id = typeof idValue === "string" && idValue ? idValue : null;

  let outcome: Outcome;

  try {
    // Authorisation lives next to the write: a Server Action can be POSTed
    // directly, without ever loading the guarded admin layout.
    await requireAdmin();

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
