"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRODUCT_IMAGE_WIDTH, isSlug, slugify } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import type { AdminFormState } from "../form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

/** Optional text: an empty field is stored as null, not an empty string. */
function optionalText(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

function wholePesos(formData: FormData, name: string, label: string): number {
  const value = Number(String(formData.get(name) ?? "").trim());

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a whole number of pesos, 0 or higher.`);
  }

  return value;
}

/**
 * Refreshes the storefront pages that show products. The landing page counts
 * too, now that Featured Bouquets and Best Sellers read from the database.
 */
function revalidateStorefront(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/products/${slug}`);
}

type Outcome = { state: AdminFormState; redirectTo?: string };

async function handle(id: string | null, formData: FormData): Promise<Outcome> {
  if (formData.get("intent") === "delete") {
    if (!id) throw new Error("Nothing to delete.");

    const deleted = await prisma.product.delete({ where: { id } });
    revalidateStorefront(deleted.slug);

    return {
      state: { status: "saved", message: "Product deleted." },
      redirectTo: "/admin/products",
    };
  }

  const name = requireText(formData, "name", "Name");
  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);

  if (!isSlug(slug)) {
    throw new Error(
      `"${slug}" is not a valid URL slug. Use lowercase letters, numbers and hyphens.`,
    );
  }

  const clash = await prisma.product.findUnique({ where: { slug } });

  if (clash && clash.id !== id) {
    throw new Error(`Another product already uses the slug "${slug}".`);
  }

  const categoryId = requireText(formData, "categoryId", "Category");
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) throw new Error("That category no longer exists.");

  const price = wholePesos(formData, "price", "Price");
  const compareAtRaw = optionalText(formData, "compareAtPrice");
  const compareAtPrice =
    compareAtRaw === null ? null : wholePesos(formData, "compareAtPrice", "Compare-at price");

  if (compareAtPrice !== null && compareAtPrice <= price) {
    throw new Error(
      "Compare-at price should be higher than the price, or left blank.",
    );
  }

  const rating = Number(String(formData.get("rating") ?? "").trim());

  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw new Error("Rating must be a number between 0 and 5.");
  }

  const reviewCount = Number(String(formData.get("reviewCount") ?? "").trim());

  if (!Number.isInteger(reviewCount) || reviewCount < 0) {
    throw new Error("Review count must be a whole number, 0 or higher.");
  }

  const position = Number(String(formData.get("position") ?? "").trim());

  if (!Number.isInteger(position) || position < 0) {
    throw new Error("Position must be a whole number, 0 or higher.");
  }

  // Blank means "not in the Best Sellers chart".
  const rankRaw = optionalText(formData, "bestSellerRank");
  const bestSellerRank = rankRaw === null ? null : Number(rankRaw);

  if (bestSellerRank !== null && (!Number.isInteger(bestSellerRank) || bestSellerRank < 1)) {
    throw new Error(
      "Best seller rank must be a whole number of 1 or higher, or left blank.",
    );
  }

  const file = formData.get("imageUrlFile");
  let imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    const upload = await uploadImage(file, "products", PRODUCT_IMAGE_WIDTH);

    if ("error" in upload) throw new Error(`Image: ${upload.error}`);

    imageUrl = upload.url;
  }

  if (!imageUrl) throw new Error("An image is required.");

  const data = {
    slug,
    name,
    description: requireText(formData, "description", "Description"),
    categoryId,
    price,
    compareAtPrice,
    imageUrl,
    imageAlt: requireText(formData, "imageAlt", "Image description"),
    rating,
    reviewCount,
    badge: optionalText(formData, "badge"),
    isFeatured: formData.get("isFeatured") !== null,
    bestSellerRank,
    position,
  };

  if (id) {
    const previous = await prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });

    await prisma.product.update({ where: { id }, data });
    revalidateStorefront(slug);
    // A renamed slug leaves the old URL behind, so refresh that too.
    if (previous && previous.slug !== slug) revalidateStorefront(previous.slug);

    return { state: { status: "saved", message: "Product updated." } };
  }

  const created = await prisma.product.create({ data });
  revalidateStorefront(slug);

  return {
    state: { status: "saved", message: "Product created." },
    redirectTo: `/admin/products/${created.id}`,
  };
}

/**
 * Creates, updates or deletes a product. `redirect()` works by throwing, so it
 * is called after the error handling rather than inside it.
 */
export async function saveProduct(
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
