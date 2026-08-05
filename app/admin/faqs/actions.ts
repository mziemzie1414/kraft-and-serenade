"use server";

import { revalidatePath } from "next/cache";
import { FAQ_ID } from "@/lib/faq";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "../form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

export async function saveFaqs(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const questions = formData.getAll("faqQuestion");
    const answers = formData.getAll("faqAnswer");

    const faqs = questions
      .map((question, index) => ({
        question: typeof question === "string" ? question.trim() : "",
        answer: String(answers[index] ?? "").trim(),
        // Unchecked boxes are not submitted, so each carries its own index.
        showOnHome: formData.get(`faqShowOnHome-${index}`) !== null,
      }))
      // A cleared question deletes the entry, and keeps the spare rows out.
      .filter((faq) => faq.question.length > 0)
      .map((faq, position) => ({ ...faq, position }));

    for (const faq of faqs) {
      if (!faq.answer) throw new Error(`"${faq.question}" needs an answer.`);
    }

    const section = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      title: requireText(formData, "title", "Section title"),
      lede: requireText(formData, "lede", "Section intro"),
      ctaLabel: requireText(formData, "ctaLabel", "Button label"),
      ctaHref: requireText(formData, "ctaHref", "Button link"),
      pageTitle: requireText(formData, "pageTitle", "Page title"),
      pageLede: requireText(formData, "pageLede", "Page intro"),
    };

    await prisma.$transaction([
      prisma.faqSection.upsert({
        where: { id: FAQ_ID },
        create: { id: FAQ_ID, ...section },
        update: section,
      }),
      prisma.faq.deleteMany({ where: { sectionId: FAQ_ID } }),
      prisma.faq.createMany({
        data: faqs.map((faq) => ({ ...faq, sectionId: FAQ_ID })),
      }),
    ]);

    // The landing page is prerendered; /faqs reads the same content.
    revalidatePath("/");
    revalidatePath("/faqs");

    return { status: "saved", message: "FAQs updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
