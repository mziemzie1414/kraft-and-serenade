"use server";

import {
  checkPassword,
  looksLikeEmail,
  looksLikePhone,
  normalizePhone,
} from "@/lib/customer";
import {
  createCustomerSession,
  destroyCustomerSession,
  findCustomerByIdentifier,
  requireCustomer,
} from "@/lib/customer-auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
/**
 * The state shape lives in its own module because everything a `"use server"`
 * file exports becomes a callable server reference, and only async functions can
 * be one. A type is erased so it could stay here; `ACCOUNT_IDLE` could not.
 */
import type { AccountState } from "./form-state";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

/* ------------------------------------------------------------------ sign in */

/**
 * Signs in against either the email or the phone number.
 *
 * Returns rather than redirecting, and every account action here does the same.
 * The navbar caches who is signed in, so the browser has to refresh that cache
 * before it navigates — a `redirect()` from the server would land on the next page
 * with the header still saying "Sign in". The forms handle both, in that order.
 */
export async function signIn(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const identifier = text(formData, "identifier");
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return {
      status: "error",
      message: "Enter your email or phone number, and your password.",
    };
  }

  const customer = await findCustomerByIdentifier(identifier);

  /**
   * One message for a missing account and for a wrong password alike, so this
   * cannot be used to work out which emails and numbers are registered.
   */
  const invalid: AccountState = {
    status: "error",
    message: "Those details do not match an account.",
  };

  if (!customer) return invalid;
  if (!(await verifyPassword(password, customer.passwordHash))) return invalid;

  await createCustomerSession(customer.id);

  return { status: "done", message: "Signed in." };
}

/* ------------------------------------------------------------------ sign up */

/**
 * Creates an account and signs it in.
 *
 * Used by both `/account/register` and the sign-up panel on checkout, which is
 * why it takes the name, email and phone as fields rather than assuming a page:
 * at checkout all three have already been typed once and are passed straight
 * through.
 *
 * Does not redirect, and here that is load-bearing beyond keeping the navbar in
 * step: the checkout panel calls this mid-order, and a navigation would throw away
 * the address the customer has just filled in.
 */
export async function signUp(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");
  const password = String(formData.get("password") ?? "");

  if (!name) return { status: "error", message: "Enter your name.", field: "name" };

  if (!looksLikeEmail(email)) {
    return { status: "error", message: "That email does not look right.", field: "email" };
  }

  if (!looksLikePhone(phone)) {
    return {
      status: "error",
      message: "That phone number does not look right.",
      field: "phone",
    };
  }

  const passwordProblem = checkPassword(password);

  if (passwordProblem) {
    return { status: "error", message: passwordProblem, field: "password" };
  }

  const phoneKey = normalizePhone(phone);

  /**
   * Checked before inserting so the customer gets a useful message rather than a
   * constraint error, and checked again by the unique indexes below — two people
   * registering the same email at once would otherwise both pass this.
   *
   * This does confirm whether an email is registered. That is a deliberate trade:
   * the alternative is telling someone their sign-up worked when it did not.
   */
  const existing = await prisma.customer.findFirst({
    where: { OR: [{ email }, { phoneKey }] },
    select: { email: true },
  });

  if (existing) {
    return {
      status: "error",
      message:
        existing.email === email
          ? "There is already an account with that email. Sign in instead."
          : "There is already an account with that phone number. Sign in instead.",
      field: existing.email === email ? "email" : "phone",
    };
  }

  let customerId: string;

  try {
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        phoneKey,
        passwordHash: await hashPassword(password),
      },
      select: { id: true },
    });

    customerId = customer.id;
  } catch (error) {
    // Lost the race described above; the unique index is what actually held.
    console.error("Could not create the account", error);

    return {
      status: "error",
      message: "Could not create that account. Try signing in instead.",
    };
  }

  await createCustomerSession(customerId);

  return { status: "done", message: "Your account is ready." };
}

/* ----------------------------------------------------------------- sign out */

/**
 * Ends the session without redirecting.
 *
 * The navbar menu is a client component that caches who is signed in, so it needs
 * to refresh that cache and then navigate itself. Redirecting from here would
 * leave it showing a name that is no longer signed in.
 */
export async function signOut(): Promise<void> {
  await destroyCustomerSession();
}

/* ------------------------------------------------------------------ profile */

export async function updateProfile(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const customer = await requireCustomer();

  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");

  if (!name) return { status: "error", message: "Enter your name.", field: "name" };

  if (!looksLikeEmail(email)) {
    return { status: "error", message: "That email does not look right.", field: "email" };
  }

  if (!looksLikePhone(phone)) {
    return {
      status: "error",
      message: "That phone number does not look right.",
      field: "phone",
    };
  }

  const phoneKey = normalizePhone(phone);

  // Both are sign-in identifiers, so both have to stay unique across accounts.
  const clash = await prisma.customer.findFirst({
    where: {
      id: { not: customer.id },
      OR: [{ email }, { phoneKey }],
    },
    select: { email: true },
  });

  if (clash) {
    return {
      status: "error",
      message:
        clash.email === email
          ? "Another account already uses that email."
          : "Another account already uses that phone number.",
      field: clash.email === email ? "email" : "phone",
    };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { name, email, phone, phoneKey },
  });

  return { status: "done", message: "Your details are saved." };
}

export async function changePassword(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const customer = await requireCustomer();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");

  if (!(await verifyPassword(current, customer.passwordHash))) {
    return {
      status: "error",
      message: "That is not your current password.",
      field: "currentPassword",
    };
  }

  const problem = checkPassword(next);

  if (problem) return { status: "error", message: problem, field: "newPassword" };

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: await hashPassword(next) },
  });

  /**
   * Every other browser is signed out, which is the point of changing a password.
   * The current session is kept so the customer is not bounced to the login page
   * by their own success.
   */
  await prisma.customerSession.deleteMany({
    where: { customerId: customer.id, id: { not: customer.sessionId } },
  });

  return {
    status: "done",
    message: "Password changed. Any other device has been signed out.",
  };
}
