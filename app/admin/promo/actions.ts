"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PROMO_ID } from "@/lib/promo";
import { uploadImage } from "@/lib/storage";
import type { AdminFormState } from "../form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

function optionalText(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

export async function savePromo(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const secondaryCtaLabel = optionalText(formData, "secondaryCtaLabel");
    const secondaryCtaHref = optionalText(formData, "secondaryCtaHref");

    if (Boolean(secondaryCtaLabel) !== Boolean(secondaryCtaHref)) {
      throw new Error(
        "The second button needs both a label and a link, or neither.",
      );
    }

    const file = formData.get("imageUrlFile");
    let imageUrl = String(formData.get("imageUrl") ?? "").trim();

    if (file instanceof File && file.size > 0) {
      const upload = await uploadImage(file, "promo", 2000);

      if ("error" in upload) throw new Error(`Image: ${upload.error}`);

      imageUrl = upload.url;
    }

    if (!imageUrl) throw new Error("A background image is required.");

    const promo = {
      isPublished: formData.get("isPublished") !== null,
      badge: requireText(formData, "badge", "Badge"),
      title: requireText(formData, "title", "Headline"),
      body: requireText(formData, "body", "Description"),
      imageUrl,
      imageAlt: requireText(formData, "imageAlt", "Image description"),
      primaryCtaLabel: requireText(formData, "primaryCtaLabel", "First button label"),
      primaryCtaHref: requireText(formData, "primaryCtaHref", "First button link"),
      secondaryCtaLabel,
      secondaryCtaHref,
      codeLabel: requireText(formData, "codeLabel", "Code caption"),
      code: optionalText(formData, "code"),
      codeNote: requireText(formData, "codeNote", "Code terms"),
    };

    await prisma.promoBannerSection.upsert({
      where: { id: PROMO_ID },
      create: { id: PROMO_ID, ...promo },
      update: promo,
    });

    // The landing page is prerendered, so it needs an explicit nudge.
    revalidatePath("/");

    return { status: "saved", message: "Section updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
