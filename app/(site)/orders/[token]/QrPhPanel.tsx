"use client";

import { useActionState } from "react";
import { formatPrice } from "@/lib/data";
import { checkPayment, refreshQr, type PaymentState } from "./actions";

const IDLE: PaymentState = { status: "idle" };

function Message({ state }: { state: PaymentState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      role="status"
      className={
        state.status === "error"
          ? "text-sm text-blush-600"
          : "text-sm font-medium text-moss-700"
      }
    >
      {state.message}
    </p>
  );
}

/**
 * QR Ph payment panel.
 *
 * Two separate forms because they are two separate actions, and each needs its own
 * pending state — a customer pressing "check" should not see the refresh button
 * spin.
 */
export function QrPhPanel({
  token,
  total,
  qrCodeImage,
  expiresAt,
  expired,
}: {
  token: string;
  total: number;
  qrCodeImage: string | null;
  /** Serialised, because this is a Client Component. */
  expiresAt: string | null;
  /**
   * Decided on the server. Reading the clock during render is impure, and the
   * page is server-rendered per request anyway, so it already knows.
   */
  expired: boolean;
}) {
  const [checkState, checkAction, checking] = useActionState(checkPayment, IDLE);
  const [refreshState, refreshAction, refreshing] = useActionState(refreshQr, IDLE);

  const showCode = Boolean(qrCodeImage) && !expired;

  return (
    <div className="rounded-2xl border border-canvas-deep p-6">
      <h2 className="font-display text-lg font-medium text-ink">
        Pay {formatPrice(total)} with QR Ph
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Scan this with any QR Ph banking or e-wallet app. The code is for this order
        only and already has the amount in it.
      </p>

      {showCode && qrCodeImage ? (
        <>
          {/* A base64 data URL from PayMongo, so next/image would only get in the
              way — there is nothing to optimise or proxy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeImage}
            alt="QR Ph code for this order"
            width={240}
            height={240}
            className="mt-5 rounded-xl border border-canvas-deep bg-white p-3"
          />
          {expiresAt ? (
            <p className="mt-2 text-xs text-ink-faint">
              Expires at{" "}
              {new Date(expiresAt).toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
              })}
              .
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-canvas-deep px-4 py-6 text-center text-sm text-ink-soft">
          {qrCodeImage
            ? "This QR code has expired. Generate a new one below."
            : "No QR code yet. Generate one below to pay."}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <form action={checkAction}>
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            disabled={checking}
            className="w-full rounded-full bg-moss-900 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700 disabled:opacity-60 sm:w-auto"
          >
            {checking ? "Checking…" : "I have paid — check now"}
          </button>
        </form>

        <form action={refreshAction}>
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            disabled={refreshing}
            className="w-full rounded-full border border-canvas-deep px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-moss-400 disabled:opacity-60 sm:w-auto"
          >
            {refreshing ? "Generating…" : showCode ? "New QR code" : "Generate QR code"}
          </button>
        </form>
      </div>

      <div aria-live="polite" className="min-h-6 pt-3">
        <Message state={checkState} />
        <Message state={refreshState} />
      </div>

      <p className="mt-1 text-xs text-ink-faint">
        We confirm automatically once your bank tells us. The button is just there if
        you would rather not wait.
      </p>
    </div>
  );
}
