/**
 * Newsletter email capture.
 *
 * Addresses are stored and nothing else happens to them: no sending, no
 * double opt-in, no unsubscribe. Anything built on top of this needs those.
 */

/**
 * Deliberately loose. Real deliverability can only be proven by sending to the
 * address, so this rejects obvious typos rather than pretending to validate.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value);
}

/** Stored form of an address, so the unique index actually catches duplicates. */
export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}
