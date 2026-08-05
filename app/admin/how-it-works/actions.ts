"use server";

import { revalidatePath } from "next/cache";
import { HOW_IT_WORKS_ID } from "@/lib/how-it-works";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "../form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

export async function saveHowItWorks(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const titles = formData.getAll("stepTitle");
    const labels = formData.getAll("stepLabel");
    const bodies = formData.getAll("stepBody");

    // A cleared title deletes the step, which is also how the spare blank rows
    // stay out of the way.
    const steps = titles
      .map((title, index) => ({
        title: typeof title === "string" ? title.trim() : "",
        label: String(labels[index] ?? "").trim(),
        body: String(bodies[index] ?? "").trim(),
      }))
      .filter((step) => step.title.length > 0)
      .map((step, position) => ({ ...step, position }));

    for (const step of steps) {
      if (!step.label) throw new Error(`"${step.title}" needs a number.`);
      if (!step.body) throw new Error(`"${step.title}" needs a description.`);
    }

    const section = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      title: requireText(formData, "title", "Title"),
      lede: requireText(formData, "lede", "Intro"),
      calloutTitle: requireText(formData, "calloutTitle", "Callout heading"),
      calloutBody: requireText(formData, "calloutBody", "Callout text"),
      calloutCtaLabel: requireText(formData, "calloutCtaLabel", "Button label"),
      calloutCtaHref: requireText(formData, "calloutCtaHref", "Button link"),
    };

    await prisma.$transaction([
      prisma.howItWorksSection.upsert({
        where: { id: HOW_IT_WORKS_ID },
        create: { id: HOW_IT_WORKS_ID, ...section },
        update: section,
      }),
      prisma.howItWorksStep.deleteMany({ where: { sectionId: HOW_IT_WORKS_ID } }),
      prisma.howItWorksStep.createMany({
        data: steps.map((step) => ({ ...step, sectionId: HOW_IT_WORKS_ID })),
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
