/**
 * Transactional email, through Resend's REST API.
 *
 * One `fetch` to one endpoint rather than the SDK, matching how `lib/paymongo.ts`
 * talks to PayMongo — the whole surface used here is a single POST, so a
 * dependency would buy nothing and add a supply-chain edge.
 *
 * Two rules this module holds to:
 *
 * - **It never throws into its caller.** Every function returns a result. An
 *   order that has been placed and paid for must not be lost because a mail
 *   provider had a bad minute, and `placeOrder` is the main caller.
 * - **It never blocks indefinitely.** Requests are bounded by `TIMEOUT_MS`, so a
 *   hanging Resend call cannot stall a customer's checkout.
 *
 * ## Configuration
 *
 * | Variable            | Purpose                                        |
 * | ------------------- | ---------------------------------------------- |
 * | `RESEND_API_KEY`    | Required. Without it, sending is skipped.      |
 * | `EMAIL_FROM`        | Sender. Defaults to Resend's testing address.  |
 * | `CONTACT_TO_EMAIL`  | Where the store's own order alert goes.        |
 *
 * ## The sandbox limit, which will bite
 *
 * Resend sends from a domain you own, and until one is verified the only
 * recipient it will accept is the address on the Resend account itself. So with
 * `EMAIL_FROM` left at the default, the store alert to `CONTACT_TO_EMAIL` arrives
 * and the customer's confirmation is **rejected** — visible as a failure in the
 * server log and nowhere else, by design.
 *
 * Verify a domain and set `EMAIL_FROM` to an address on it before this is any use
 * to customers. See https://resend.com/docs/add-a-domain.
 */

const API = "https://api.resend.com/emails";

/** Long enough for a slow API, short enough not to hold up a checkout. */
const TIMEOUT_MS = 8000;

/**
 * Resend's shared testing sender. Deliverable without owning a domain, but only
 * to the account's own address — see the note above.
 */
const DEFAULT_FROM = "Kraft & Serenade <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

/** Where the store's own notifications go, or `null` if nobody has said. */
export function storeInbox(): string | null {
  return process.env.CONTACT_TO_EMAIL?.trim() || null;
}

export type SendResult =
  | { ok: true; id: string | null }
  /** `skipped` means not configured, which is not a failure worth shouting about. */
  | { ok: false; skipped: true }
  | { ok: false; skipped: false; error: string };

export type Message = {
  to: string;
  subject: string;
  html: string;
  /**
   * Plain-text alternative. Always supplied here: some clients prefer it, and a
   * mail with no text part scores worse with spam filters.
   */
  text: string;
  /** So a customer can just hit reply and reach the shop. */
  replyTo?: string;
};

/**
 * Sends one message. Resolves to a result rather than throwing, including on a
 * network error or a timeout.
 */
export async function sendEmail(message: Message): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;

  if (!key) return { ok: false, skipped: true };

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        (payload as { message?: string } | null)?.message ??
        `HTTP ${response.status}`;

      return { ok: false, skipped: false, error: `Resend: ${detail}` };
    }

    return { ok: true, id: (payload as { id?: string } | null)?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Unknown mail error",
    };
  }
}

/**
 * Sends several messages and logs whatever failed.
 *
 * `allSettled`, so one rejected recipient cannot stop the others — the customer's
 * confirmation and the store's alert are independent, and in the default sandbox
 * configuration the first genuinely does fail while the second succeeds.
 */
export async function sendEmails(
  messages: Message[],
): Promise<{ sent: number; failed: number; skipped: number }> {
  const results = await Promise.allSettled(messages.map(sendEmail));

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  results.forEach((result, index) => {
    const to = messages[index].to;

    if (result.status === "rejected") {
      failed += 1;
      console.error(`Email to ${to} threw unexpectedly`, result.reason);
      return;
    }

    if (result.value.ok) {
      sent += 1;
      return;
    }

    if (result.value.skipped) {
      skipped += 1;
      return;
    }

    failed += 1;
    console.error(`Email to ${to} failed: ${result.value.error}`);
  });

  return { sent, failed, skipped };
}

/**
 * Escapes text for interpolation into an HTML email body.
 *
 * Every value in these mails comes from a customer — their name, street and
 * delivery notes — so none of it can go into markup raw. The store's own alert is
 * the dangerous one: it is read in the shop owner's mail client, which makes it a
 * natural target for someone typing a script tag into a delivery note.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
