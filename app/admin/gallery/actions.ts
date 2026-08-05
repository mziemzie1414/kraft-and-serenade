"use server";

import { revalidatePath } from "next/cache";
import { GALLERY_ID } from "@/lib/gallery";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import type { AdminFormState } from "../form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const result = typeof value === "string" ? value.trim() : "";

  if (!result) throw new Error(`${label} cannot be empty.`);

  return result;
}

function text(value: FormDataEntryValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveGallery(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const existing = formData.getAll("imageUrl");
    const alts = formData.getAll("imageAlt");
    const captions = formData.getAll("imageCaption");
    const links = formData.getAll("imageLinkUrl");

    const images: {
      imageUrl: string;
      alt: string;
      caption: string;
      linkUrl: string | null;
      position: number;
    }[] = [];

    for (let index = 0; index < existing.length; index += 1) {
      // Ticking "remove" drops the tile.
      if (formData.get(`imageRemove-${index}`) !== null) continue;

      let imageUrl = text(existing[index]);
      const file = formData.get(`imageFile-${index}`);

      if (file instanceof File && file.size > 0) {
        const upload = await uploadImage(file, "gallery", 1400);

        if ("error" in upload) {
          throw new Error(`Tile ${index + 1}: ${upload.error}`);
        }

        imageUrl = upload.url;
      }

      // An empty slot with no upload is simply not a tile.
      if (!imageUrl) continue;

      const caption = text(captions[index]);
      const alt = text(alts[index]);

      if (!caption) throw new Error(`Tile ${index + 1} needs a caption.`);
      if (!alt) throw new Error(`Tile ${index + 1} needs an image description.`);

      images.push({
        imageUrl,
        alt,
        caption,
        linkUrl: text(links[index]) || null,
        position: images.length,
      });
    }

    const section = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      title: requireText(formData, "title", "Title"),
      lede: requireText(formData, "lede", "Intro"),
      ctaLabel: requireText(formData, "ctaLabel", "Button label"),
      ctaHref: requireText(formData, "ctaHref", "Button link"),
    };

    await prisma.$transaction([
      prisma.gallerySection.upsert({
        where: { id: GALLERY_ID },
        create: { id: GALLERY_ID, ...section },
        update: section,
      }),
      prisma.galleryImage.deleteMany({ where: { sectionId: GALLERY_ID } }),
      prisma.galleryImage.createMany({
        data: images.map((image) => ({ ...image, sectionId: GALLERY_ID })),
      }),
    ]);

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
