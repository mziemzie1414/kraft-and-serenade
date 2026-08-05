/**
 * Customer account rules: what a valid email, phone number and password look
 * like, and how a phone number is normalised for sign-in.
 *
 * Free of database imports, so the checkout form and the sign-up modal can
 * validate before submitting and the server can validate the same way. Reads and
 * sessions live in `lib/customer-auth.ts`.
 */

/** Short enough not to annoy, long enough to be worth hashing. */
export const PASSWORD_MIN_LENGTH = 8;

/** What the browser sees of a signed-in customer. Nothing sensitive. */
export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

/** Loose on purpose — the real test of an address is whether a mail reaches it. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

/** Accepts the shapes Filipino numbers are actually written in. */
export function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Reduces a phone number to the one form sign-in looks it up by.
 *
 * `0917 123 4567`, `+63 917 123 4567` and `9171234567` are the same number, and
 * a customer will not remember which shape they typed when they signed up. So
 * the digits are stripped out, an international `63` prefix is turned back into
 * the local `0`, and a bare 10-digit mobile gets its missing `0` put back.
 *
 * The number as typed is kept separately on `Customer.phone` for display; this
 * is only the lookup key.
 */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  // +63 9XX XXX XXXX → 09XX XXX XXXX
  if (digits.length === 12 && digits.startsWith("63")) {
    return `0${digits.slice(2)}`;
  }

  // 9XX XXX XXXX, typed without the trunk prefix.
  if (digits.length === 10 && digits.startsWith("9")) {
    return `0${digits}`;
  }

  return digits;
}

/** Whether a sign-in identifier should be looked up as an email or a phone number. */
export function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

/**
 * Why a password is unacceptable, or `null` when it is fine.
 *
 * Only a length floor. Composition rules push people towards `Password1!` and
 * the storage is already salted scrypt, so length is the part worth enforcing.
 */
export function checkPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`;
  }

  if (password.length > 200) {
    return "That password is too long.";
  }

  return null;
}

/** A saved address as the storefront renders it. */
export type SavedAddress = {
  id: string;
  label: string | null;
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  barangay: string;
  street: string;
  postalCode: string;
  deliveryNotes: string | null;
  isDefault: boolean;
};

/** One line, for a summary or a select option. */
export function formatAddressLine(address: SavedAddress): string {
  return [address.street, address.barangay, address.cityName, address.provinceName]
    .filter(Boolean)
    .join(", ");
}
