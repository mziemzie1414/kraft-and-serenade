"use server";

import { revalidatePath } from "next/cache";
import { CONTACT_ID } from "@/lib/contact";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/components/admin/form-state";

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

export async function saveContact(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireAdmin();

    const contact = {
      eyebrow: requireText(formData, "eyebrow", "Eyebrow"),
      title: requireText(formData, "title", "Title"),
      body: requireText(formData, "body", "Body"),
      address: requireText(formData, "address", "Address"),
      phone: requireText(formData, "phone", "Phone"),
      mapEmbedUrl: optionalText(formData, "mapEmbedUrl"),
    };

    await prisma.contactSection.upsert({
      where: { id: CONTACT_ID },
      create: { id: CONTACT_ID, ...contact },
      update: contact,
    });

    revalidatePath("/contact");

    return { status: "saved", message: "Contact page updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
