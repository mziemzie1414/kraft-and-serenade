"use server";

import { revalidatePath } from "next/cache";
import { ABOUT_ID } from "@/lib/about";
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

export async function saveAbout(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireAdmin();

    const file = formData.get("imageUrlFile");
    let imageUrl = String(formData.get("imageUrl") ?? "").trim();

    if (file instanceof File && file.size > 0) {
      const upload = await uploadImage(file, "about", 1600);

      if ("error" in upload) throw new Error(`Image: ${upload.error}`);

      imageUrl = upload.url;
    }

    if (!imageUrl) throw new Error("An image is required.");

    const about = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      title: requireText(formData, "title", "Title"),
      body: requireText(formData, "body", "Body"),
      imageUrl,
      imageAlt: requireText(formData, "imageAlt", "Image description"),
    };

    await prisma.aboutSection.upsert({
      where: { id: ABOUT_ID },
      create: { id: ABOUT_ID, ...about },
      update: about,
    });

    revalidatePath("/about");

    return { status: "saved", message: "About page updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
