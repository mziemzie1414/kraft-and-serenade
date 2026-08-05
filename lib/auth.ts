import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "./auth-cookies";
import { prisma } from "./prisma";

export { ADMIN_COOKIE };

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** How long a signed-in admin browser stays valid. */
const SESSION_DAYS = 7;

/**
 * Hashes a password with scrypt, which is in Node's standard library — no native
 * dependency to build. Stored as `salt:key`, both hex.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, KEY_LENGTH);

  return `${salt}:${key.toString("hex")}`;
}

/** Constant-time comparison, so a wrong password cannot be timed character by character. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, keyHex] = stored.split(":");

  if (!salt || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Only the hash of a session token is stored, so the table cannot be replayed. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Signs an admin in: creates a session row and sets the cookie.
 * Must be called from a Server Action or Route Handler.
 */
export async function createAdminSession(adminId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: { tokenHash: hashToken(token), adminId, expiresAt },
  });

  const store = await cookies();

  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Signs the current admin out and removes the session row. */
export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;

  if (token) {
    await prisma.adminSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {
        // Already gone; clearing the cookie below is what matters.
      });
  }

  store.delete(ADMIN_COOKIE);
}

/**
 * The signed-in admin and the session it came from, or `null`. Expired sessions
 * are treated as absent and cleaned up as they are encountered.
 */
export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return { admin: session.admin, sessionId: session.id };
}

/** The signed-in admin, or `null`. */
export async function getAdmin() {
  return (await getAdminSession())?.admin ?? null;
}

/**
 * Guard for admin Server Actions.
 *
 * `proxy.ts` redirects unauthenticated browsers and the admin layout checks
 * again, but neither protects a Server Action invoked directly by POST. Every
 * admin action calls this first, so authorisation lives next to the write rather
 * than only in the routing layer.
 */
export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Your session has expired. Sign in again to save changes.");
  }

  return { ...session.admin, sessionId: session.sessionId };
}
