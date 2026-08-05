/**
 * Password hashing and session-token hashing.
 *
 * Shared by the admin (`lib/auth.ts`) and the storefront customer
 * (`lib/customer-auth.ts`) sign-ins, so there is one copy of the crypto rather
 * than two that can drift apart.
 *
 * `scrypt` comes from Node's standard library, so there is no native dependency
 * to build on deploy.
 */
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Hashes a password. Stored as `salt:key`, both hex. */
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

/**
 * Only the hash of a session token is stored, so a leaked database dump cannot
 * be replayed as a login.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A session token. 32 bytes, so guessing one is not worth attempting. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
