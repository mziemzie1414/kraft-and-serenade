"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REVIEWS_ID } from "@/lib/reviews";
import { uploadImage } from "@/lib/storage";
import type { AdminFormState } from "@/components/admin/form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

function text(value: FormDataEntryValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveReviews(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    // Authorisation lives next to the write: a Server Action can be POSTed
    // directly, without ever loading the guarded admin layout.
    await requireAdmin();

    const names = formData.getAll("reviewName");
    const locations = formData.getAll("reviewLocation");
    const quotes = formData.getAll("reviewQuote");
    const ratings = formData.getAll("reviewRating");
    const purchased = formData.getAll("reviewPurchased");
    const avatars = formData.getAll("reviewAvatarUrl");

    const reviews: {
      name: string;
      location: string;
      quote: string;
      rating: number;
      purchased: string;
      avatarUrl: string;
      position: number;
    }[] = [];

    for (let index = 0; index < names.length; index += 1) {
      const name = text(names[index]);

      // A cleared name deletes the review, and keeps the spare blank rows out.
      if (!name) continue;

      const quote = text(quotes[index]);
      if (!quote) throw new Error(`"${name}" needs a quote.`);

      const rating = Number(text(ratings[index]));
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error(`"${name}" needs a whole star rating between 1 and 5.`);
      }

      let avatarUrl = text(avatars[index]);
      const file = formData.get(`reviewAvatarFile-${index}`);

      if (file instanceof File && file.size > 0) {
        const upload = await uploadImage(file, "reviews", 256);

        if ("error" in upload) throw new Error(`${name}'s photo: ${upload.error}`);

        avatarUrl = upload.url;
      }

      if (!avatarUrl) throw new Error(`"${name}" needs a photo.`);

      reviews.push({
        name,
        location: text(locations[index]),
        quote,
        rating,
        purchased: text(purchased[index]),
        avatarUrl,
        position: reviews.length,
      });
    }

    const section = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      title: requireText(formData, "title", "Title"),
      lede: requireText(formData, "lede", "Intro"),
    };

    await prisma.$transaction([
      prisma.reviewsSection.upsert({
        where: { id: REVIEWS_ID },
        create: { id: REVIEWS_ID, ...section },
        update: section,
      }),
      prisma.review.deleteMany({ where: { sectionId: REVIEWS_ID } }),
      prisma.review.createMany({
        data: reviews.map((review) => ({ ...review, sectionId: REVIEWS_ID })),
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
