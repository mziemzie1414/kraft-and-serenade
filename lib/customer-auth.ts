/**
 * Storefront customer sessions.
 *
 * Deliberately a mirror of `lib/auth.ts` rather than a generalisation of it. The
 * two sign-ins share the crypto (`lib/password.ts`) but nothing else: a customer
 * session must never be able to satisfy an admin check, and the easiest way to
 * guarantee that is for them to be separate tables, separate cookies and
 * separate functions with no shared branch to get wrong.
 */
import { cookies } from "next/headers";
import { CUSTOMER_COOKIE } from "./auth-cookies";
import {
  isEmailIdentifier,
  normalizePhone,
  type CustomerSummary,
} from "./customer";
import { generateSessionToken, hashToken } from "./password";
import { prisma } from "./prisma";

export { CUSTOMER_COOKIE };

/**
 * Longer than the admin's seven days. A customer signs in to save retyping an
 * address, so being logged out every week defeats the point — and the session
 * grants nothing but their own order history.
 */
const SESSION_DAYS = 60;

/**
 * Signs a customer in: creates a session row and sets the cookie.
 * Must be called from a Server Action or Route Handler.
 */
export async function createCustomerSession(customerId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.customerSession.create({
    data: { tokenHash: hashToken(token), customerId, expiresAt },
  });

  const store = await cookies();

  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Signs the current customer out and removes the session row. */
export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;

  if (token) {
    await prisma.customerSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {
        // Already gone; clearing the cookie below is what matters.
      });
  }

  store.delete(CUSTOMER_COOKIE);
}

/**
 * The signed-in customer and the session it came from, or `null`. Expired
 * sessions are treated as absent and cleaned up as they are encountered.
 */
export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.customerSession
      .delete({ where: { id: session.id } })
      .catch(() => {});

    return null;
  }

  return { customer: session.customer, sessionId: session.id };
}

/** The signed-in customer, or `null`. */
export async function getCustomer() {
  return (await getCustomerSession())?.customer ?? null;
}

/** Just the parts safe to hand to the browser, or `null`. */
export async function getCustomerSummary(): Promise<CustomerSummary | null> {
  const customer = await getCustomer();

  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
}

/**
 * Guard for customer Server Actions.
 *
 * `proxy.ts` bounces anonymous browsers off `/account` and the account layout
 * checks again, but neither protects a Server Action invoked directly by POST.
 * Anything that reads or writes a customer's own data calls this first, so
 * authorisation sits next to the query rather than only in the routing layer.
 */
export async function requireCustomer() {
  const session = await getCustomerSession();

  if (!session) {
    throw new Error("Your session has expired. Sign in again to continue.");
  }

  return { ...session.customer, sessionId: session.sessionId };
}

/**
 * Finds the account behind whatever the customer typed into the one sign-in
 * field, be that an email or a phone number.
 *
 * The `@` test only picks which column to search. It is not validation: a
 * mistyped value simply matches nothing, and the caller reports the same failure
 * either way so this cannot be used to discover which emails are registered.
 */
export async function findCustomerByIdentifier(identifier: string) {
  const value = identifier.trim();

  if (!value) return null;

  if (isEmailIdentifier(value)) {
    return prisma.customer.findUnique({ where: { email: value.toLowerCase() } });
  }

  const phoneKey = normalizePhone(value);

  if (!phoneKey) return null;

  return prisma.customer.findUnique({ where: { phoneKey } });
}
