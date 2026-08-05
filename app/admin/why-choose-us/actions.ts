"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import { WHY_CHOOSE_US_ID } from "@/lib/why-choose-us";
import type { AdminFormState } from "../form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

/**
 * Resolves an image field to a URL: the newly uploaded file if one was picked,
 * otherwise the URL already on the record, carried in a hidden input.
 */
async function resolveImage(
  formData: FormData,
  name: string,
  label: string,
): Promise<string> {
  const file = formData.get(`${name}File`);

  if (file instanceof File && file.size > 0) {
    const upload = await uploadImage(file, "why-choose-us", 1600);

    if ("error" in upload) throw new Error(`${label}: ${upload.error}`);

    return upload.url;
  }

  const current = String(formData.get(name) ?? "").trim();

  if (!current) throw new Error(`${label} is required.`);

  return current;
}

/**
 * Pairs up repeatable rows, dropping any whose first field was cleared. That is
 * how the admin deletes a row, and how the spare blank rows stay ignored.
 */
function rows(formData: FormData, firstField: string, secondField: string) {
  const firsts = formData.getAll(firstField);
  const seconds = formData.getAll(secondField);

  return firsts
    .map((first, index) => ({
      first: typeof first === "string" ? first.trim() : "",
      second: String(seconds[index] ?? "").trim(),
    }))
    .filter((row) => row.first.length > 0)
    .map((row, position) => ({ ...row, position }));
}

export async function saveWhyChooseUs(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const points = rows(formData, "pointTitle", "pointBody");
    const stats = rows(formData, "statValue", "statLabel");

    for (const point of points) {
      if (!point.second) {
        throw new Error(`"${point.first}" needs a description.`);
      }
    }

    for (const stat of stats) {
      if (!stat.second) throw new Error(`The "${stat.first}" figure needs a label.`);
    }

    const section = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      title: requireText(formData, "title", "Title"),
      lede: requireText(formData, "lede", "Intro"),
      primaryImageAlt: requireText(
        formData,
        "primaryImageAlt",
        "Main image description",
      ),
      badgeValue: requireText(formData, "badgeValue", "Badge figure"),
      badgeLabel: requireText(formData, "badgeLabel", "Badge label"),
      primaryImageUrl: await resolveImage(formData, "primaryImageUrl", "Main image"),
      secondaryImageUrl: await resolveImage(
        formData,
        "secondaryImageUrl",
        "Inset image",
      ),
    };

    await prisma.$transaction([
      prisma.whyChooseUsSection.upsert({
        where: { id: WHY_CHOOSE_US_ID },
        create: { id: WHY_CHOOSE_US_ID, ...section },
        update: section,
      }),
      prisma.whyChooseUsPoint.deleteMany({ where: { sectionId: WHY_CHOOSE_US_ID } }),
      prisma.whyChooseUsPoint.createMany({
        data: points.map((point) => ({
          title: point.first,
          body: point.second,
          position: point.position,
          sectionId: WHY_CHOOSE_US_ID,
        })),
      }),
      prisma.whyChooseUsStat.deleteMany({ where: { sectionId: WHY_CHOOSE_US_ID } }),
      prisma.whyChooseUsStat.createMany({
        data: stats.map((stat) => ({
          value: stat.first,
          label: stat.second,
          position: stat.position,
          sectionId: WHY_CHOOSE_US_ID,
        })),
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
