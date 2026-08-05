"use client";

import { useActionState } from "react";
import { IDLE } from "@/components/admin/form-state";
import { StatusMessage } from "@/components/admin/ui";
import { ORDER_TRANSITIONS, type OrderStatus } from "@/lib/orders";
import { setOrderStatus } from "./actions";

const TONE: Record<"primary" | "neutral" | "danger", string> = {
  primary: "bg-moss-900 text-canvas hover:bg-moss-700",
  neutral:
    "border border-canvas-deep text-ink-soft hover:border-ink-faint hover:text-ink",
  danger: "border border-blush-500 text-blush-600 hover:bg-blush-50",
};

/**
 * The buttons that move an order along.
 *
 * Only the moves `ORDER_TRANSITIONS` allows from the current status are rendered,
 * so there is no button for a step that would be rejected. The action re-checks
 * the same map — this decides what is *offered*, not what is permitted.
 */
export function StatusControls({
  orderId,
  status,
  /** Warns before a manual confirmation on an order PayMongo is meant to settle. */
  isAutomatedPayment,
}: {
  orderId: string;
  status: OrderStatus;
  isAutomatedPayment: boolean;
}) {
  const [state, formAction, pending] = useActionState(setOrderStatus, IDLE);
  const options = ORDER_TRANSITIONS[status];

  return (
    <div className="rounded-xl border border-canvas-deep bg-canvas p-5">
      <h2 className="font-display text-base font-medium text-ink">Status</h2>

      {isAutomatedPayment && status === "PENDING_PAYMENT" ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          This order pays through PayMongo, so the webhook normally marks it paid on
          its own. Only confirm it by hand if you have checked the money arrived.
        </p>
      ) : null}

      {options.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Nothing left to change.</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {options.map((option) => (
            /* A form per button so each posts its own target status. They share the
               one action state, which is what shows the result. */
            <form key={option.to} action={formAction}>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="status" value={option.to} />
              <button
                type="submit"
                disabled={pending}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${TONE[option.tone]}`}
              >
                {option.label}
              </button>
            </form>
          ))}
        </div>
      )}

      <div className="mt-3">
        <StatusMessage state={state} />
      </div>
    </div>
  );
}
