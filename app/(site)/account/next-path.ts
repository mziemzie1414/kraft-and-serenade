/**
 * Where to send someone once they have signed in.
 *
 * `?next=` comes off the URL, so it is attacker-controlled. Only relative paths
 * under `/account` are honoured — anything else, including a protocol-relative
 * `//evil.example`, falls back to the account overview. Sanitised on the server
 * before it reaches the form, so the client never has to be trusted with it.
 */
const DEFAULT = "/account";

export function safeAccountNext(value: string | string[] | undefined): string {
  if (typeof value !== "string") return DEFAULT;

  // `//host` and `/\host` are both read as absolute by browsers.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT;
  }

  if (!value.startsWith("/account")) return DEFAULT;

  // Sending someone back to a sign-in page they have just used is a loop.
  if (value === "/account/login" || value === "/account/register") return DEFAULT;

  return value;
}
