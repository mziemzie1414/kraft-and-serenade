"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/components/admin/form-state";

/** Only allow relative paths, so `?next=` cannot bounce you off-site. */
function safeNext(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";

  return path.startsWith("/admin") && !path.startsWith("/admin/login")
    ? path
    : "/admin";
}

export async function signIn(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  // Same message either way, so this cannot be used to discover valid emails.
  const invalid: AdminFormState = {
    status: "error",
    message: "That email and password do not match.",
  };

  if (!admin) return invalid;
  if (!(await verifyPassword(password, admin.passwordHash))) return invalid;

  await createAdminSession(admin.id);

  redirect(next);
}

export async function signOut(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
