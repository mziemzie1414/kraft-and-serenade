"use server";

import { revalidatePath } from "next/cache";
import { HERO_ID, isTrustPointIcon } from "@/lib/hero";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";

import type { AdminFormState } from "@/components/admin/form-state";

/** Trims a required text field, or reports the label that was left blank. */
function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new Error(`${label} cannot be empty.`);
  }

  return text;
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Resolves an image field to a URL: the newly uploaded file if one was picked,
 * otherwise the URL already on the record. The current URL rides along in a
 * hidden input so saving stays a single round trip.
 */
async function resolveImage(
  formData: FormData,
  name: string,
  label: string,
  maxWidth: number,
): Promise<string> {
  const file = formData.get(`${name}File`);

  if (file instanceof File && file.size > 0) {
    const result = await uploadImage(file, "hero", maxWidth);

    if ("error" in result) {
      throw new Error(`${label}: ${result.error}`);
    }

    return result.url;
  }

  const currentUrl = readText(formData, name);

  if (!currentUrl) {
    throw new Error(`${label} is required.`);
  }

  return currentUrl;
}

/** Reviewer photos, as a fixed set of slots that can be replaced or cleared. */
async function resolveAvatars(formData: FormData): Promise<string[]> {
  const existing = formData.getAll("reviewAvatarUrl");
  const urls: string[] = [];

  for (let index = 0; index < existing.length; index += 1) {
    if (formData.get(`reviewAvatarRemove-${index}`) !== null) {
      continue;
    }

    const file = formData.get(`reviewAvatarFile-${index}`);

    if (file instanceof File && file.size > 0) {
      const result = await uploadImage(file, "hero/avatars", 128);

      if ("error" in result) {
        throw new Error(`Reviewer photo ${index + 1}: ${result.error}`);
      }

      urls.push(result.url);
      continue;
    }

    const current = existing[index];
    const currentUrl = typeof current === "string" ? current.trim() : "";

    if (currentUrl) {
      urls.push(currentUrl);
    }
  }

  return urls;
}

/** Trust bar rows. A row with a blank label is treated as deleted. */
function resolveTrustPoints(formData: FormData) {
  const labels = formData.getAll("trustPointLabel");
  const icons = formData.getAll("trustPointIcon");

  const points = labels
    .map((label, index) => ({
      label: typeof label === "string" ? label.trim() : "",
      icon: String(icons[index] ?? ""),
      // Unchecked boxes are not submitted, so each one carries its own index
      // rather than relying on position within a `getAll` list.
      desktopOnly: formData.get(`trustPointDesktopOnly-${index}`) !== null,
    }))
    .filter((point) => point.label.length > 0)
    .map((point, position) => ({ ...point, position }));

  for (const point of points) {
    if (!isTrustPointIcon(point.icon)) {
      throw new Error(`"${point.icon}" is not a known trust bar icon.`);
    }
  }

  return points;
}

export async function saveHero(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    // Authorisation lives next to the write: a Server Action can be POSTed
    // directly, without ever loading the guarded admin layout.
    await requireAdmin();

    const ratingValue = Number(readText(formData, "ratingValue"));

    if (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      throw new Error("Rating must be a number between 0 and 5.");
    }

    const trustPoints = resolveTrustPoints(formData);

    const hero = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      headingLead: requireText(formData, "headingLead", "Headline"),
      headingAccent: requireText(formData, "headingAccent", "Headline accent"),
      description: requireText(formData, "description", "Description"),
      primaryCtaLabel: requireText(formData, "primaryCtaLabel", "Primary button label"),
      primaryCtaHref: requireText(formData, "primaryCtaHref", "Primary button link"),
      secondaryCtaLabel: requireText(
        formData,
        "secondaryCtaLabel",
        "Secondary button label",
      ),
      secondaryCtaHref: requireText(
        formData,
        "secondaryCtaHref",
        "Secondary button link",
      ),
      backgroundImageAlt: requireText(
        formData,
        "backgroundImageAlt",
        "Background image description",
      ),
      ratingValue,
      ratingCaption: requireText(formData, "ratingCaption", "Rating caption"),
      accentTitle: requireText(formData, "accentTitle", "Accent card title"),
      accentCaption: requireText(formData, "accentCaption", "Accent card caption"),
      backgroundImageUrl: await resolveImage(
        formData,
        "backgroundImageUrl",
        "Background image",
        2400,
      ),
      accentImageUrl: await resolveImage(
        formData,
        "accentImageUrl",
        "Accent card image",
        640,
      ),
      reviewAvatarUrls: await resolveAvatars(formData),
    };

    await prisma.$transaction([
      prisma.heroSection.upsert({
        where: { id: HERO_ID },
        create: { id: HERO_ID, ...hero },
        update: hero,
      }),
      prisma.heroTrustPoint.deleteMany({ where: { heroSectionId: HERO_ID } }),
      prisma.heroTrustPoint.createMany({
        data: trustPoints.map((point) => ({ ...point, heroSectionId: HERO_ID })),
      }),
    ]);

    // The landing page is prerendered, so it needs an explicit nudge. The admin
    // page is force-dynamic and always reads live.
    revalidatePath("/");

    return { status: "saved", message: "Hero section updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
