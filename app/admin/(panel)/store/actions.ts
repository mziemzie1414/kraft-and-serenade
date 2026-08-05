"use server";

import { revalidatePath } from "next/cache";
import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import { STORE_ID } from "@/lib/store";
import type { AdminFormState } from "@/components/admin/form-state";

function requireText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label} cannot be empty.`);

  return text;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveStore(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    // Authorisation lives next to the write: a Server Action can be POSTed
    // directly, without ever loading the guarded admin layout.
    await requireAdmin();

    const facebookUrl = requireText(formData, "facebookUrl", "Facebook page");

    if (!isHttpUrl(facebookUrl)) {
      throw new Error("The Facebook page needs to be a full https:// address.");
    }

    // One address line per non-empty row of the textarea.
    const addressLines = String(formData.get("addressLines") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (addressLines.length === 0) {
      throw new Error("Store address needs at least one line.");
    }

    const days = formData.getAll("hourDays");
    const hours = formData.getAll("hourHours");

    const businessHours = days
      .map((label, index) => ({
        days: typeof label === "string" ? label.trim() : "",
        hours: String(hours[index] ?? "").trim(),
      }))
      // A cleared label deletes the row, and keeps the spare rows out.
      .filter((row) => row.days.length > 0)
      .map((row, position) => ({ ...row, position }));

    for (const row of businessHours) {
      if (!row.hours) throw new Error(`"${row.days}" needs opening hours.`);
    }

    const file = formData.get("manualPaymentQrUrlFile");
    let manualPaymentQrUrl =
      String(formData.get("manualPaymentQrUrl") ?? "").trim() || null;

    if (formData.get("manualPaymentQrRemove") !== null) {
      manualPaymentQrUrl = null;
    } else if (file instanceof File && file.size > 0) {
      // QR codes must stay crisp, so this is capped larger than a thumbnail.
      const upload = await uploadImage(file, "store", 1000);

      if ("error" in upload) throw new Error(`Payment QR: ${upload.error}`);

      manualPaymentQrUrl = upload.url;
    }

    // Logo upload — same pattern as the QR code.
    const logoFile = formData.get("logoUrlFile");
    let logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;

    if (formData.get("logoRemove") !== null) {
      logoUrl = null;
    } else if (logoFile instanceof File && logoFile.size > 0) {
      const upload = await uploadImage(logoFile, "store/logo", 800);

      if ("error" in upload) throw new Error(`Logo: ${upload.error}`);

      logoUrl = upload.url;
    }

    const rawLogoWidth = String(formData.get("logoWidth") ?? "").trim();
    const rawLogoHeight = String(formData.get("logoHeight") ?? "").trim();
    const logoWidth = rawLogoWidth ? Number(rawLogoWidth) : null;
    const logoHeight = rawLogoHeight ? Number(rawLogoHeight) : null;

    if (logoWidth !== null && (!Number.isFinite(logoWidth) || logoWidth < 20 || logoWidth > 400)) {
      throw new Error("Logo width must be between 20 and 400 pixels.");
    }
    if (logoHeight !== null && (!Number.isFinite(logoHeight) || logoHeight < 16 || logoHeight > 200)) {
      throw new Error("Logo height must be between 16 and 200 pixels.");
    }

    const store = {
      storeName: requireText(formData, "storeName", "Store name"),
      tagline: requireText(formData, "tagline", "Tagline"),
      email: requireText(formData, "email", "Email"),
      phone: requireText(formData, "phone", "Phone"),
      addressLines,
      facebookUrl,
      manualPaymentQrUrl,
      manualPaymentInstructions: requireText(
        formData,
        "manualPaymentInstructions",
        "Manual payment instructions",
      ),
      logoUrl,
      logoWidth,
      logoHeight,
    };

    await prisma.$transaction([
      prisma.storeSettings.upsert({
        where: { id: STORE_ID },
        create: { id: STORE_ID, ...store },
        update: store,
      }),
      prisma.businessHour.deleteMany({ where: { storeId: STORE_ID } }),
      prisma.businessHour.createMany({
        data: businessHours.map((row) => ({ ...row, storeId: STORE_ID })),
      }),
    ]);

    // Store details appear in the footer and page metadata, so every page needs
    // regenerating, not just the home page.
    revalidatePath("/", "layout");

    return { status: "saved", message: "Store details updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/**
 * Changes the signed-in admin's email and/or password.
 *
 * Kept separate from the store details form so a routine copy edit can never
 * touch the credentials, and so the current password can be required here only.
 */
export async function saveCredentials(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const admin = await requireAdmin();

    const currentPassword = String(formData.get("currentPassword") ?? "");

    if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
      return { status: "error", message: "Your current password is not right." };
    }

    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!email.includes("@")) {
      throw new Error("That does not look like an email address.");
    }

    const clash = await prisma.adminUser.findUnique({ where: { email } });

    if (clash && clash.id !== admin.id) {
      throw new Error("Another admin already uses that email.");
    }

    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const data: { email: string; passwordHash?: string } = { email };

    // Leaving both password fields blank changes the email only.
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        throw new Error("The two new passwords do not match.");
      }

      if (newPassword.length < 8) {
        throw new Error("Use at least 8 characters for the new password.");
      }

      data.passwordHash = await hashPassword(newPassword);
    }

    await prisma.adminUser.update({ where: { id: admin.id }, data });

    // A password change should end every other signed-in browser. This one is
    // kept so the admin is not booted out of the form they just submitted.
    if (data.passwordHash) {
      await prisma.adminSession.deleteMany({
        where: { adminId: admin.id, id: { not: admin.sessionId } },
      });
    }

    return {
      status: "saved",
      message: data.passwordHash
        ? "Credentials updated. Other signed-in browsers have been signed out."
        : "Email updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
