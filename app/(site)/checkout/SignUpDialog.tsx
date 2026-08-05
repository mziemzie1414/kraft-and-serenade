"use client";

import { useActionState, useEffect, useRef } from "react";
import { signUp } from "@/app/(site)/account/actions";
import { ACCOUNT_IDLE } from "@/app/(site)/account/form-state";
import { refreshAccount } from "@/components/account/useAccount";
import { Field, FormMessage, inputClass } from "@/components/ui/form";
import { PASSWORD_MIN_LENGTH } from "@/lib/customer";

/**
 * Sign-up offered mid-checkout, prefilled from what has already been typed.
 *
 * Deliberately a native `<dialog>` opened with `showModal()`. That gives the focus
 * trap, the Escape handling, the inert background and the backdrop for free —
 * all the parts of a modal that are easy to build and easy to build wrong.
 *
 * It has to be rendered **outside** the checkout `<form>`. `showModal` moves the
 * element to the top layer visually but not in the DOM, and a form inside a form
 * is invalid HTML that browsers resolve by dropping the inner one.
 *
 * `signUp` does not redirect, which is what makes this workable: the account is
 * created and signed in without navigating, so the half-filled order behind the
 * dialog survives.
 */
export function SignUpDialog({
  open,
  onClose,
  onCreated,
  name,
  email,
  phone,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  name: string;
  email: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState(signUp, ACCOUNT_IDLE);
  const dialogRef = useRef<HTMLDialogElement>(null);

  /* Drive the native dialog from the `open` prop. */
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /* Escape and the backdrop close it natively, so tell the parent when they do. */
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    const onCloseEvent = () => onClose();

    dialog.addEventListener("close", onCloseEvent);
    return () => dialog.removeEventListener("close", onCloseEvent);
  }, [onClose]);

  const created = state.status === "done";

  useEffect(() => {
    if (!created) return;

    // The navbar caches who is signed in; it has to be told before this closes.
    refreshAccount();
    onCreated();
  }, [created, onCreated]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="signup-dialog-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-canvas-deep bg-canvas p-0 text-ink backdrop:bg-ink/50"
    >
      <form action={formAction} className="space-y-4 p-6">
        <div>
          <h2
            id="signup-dialog-title"
            className="font-display text-xl font-medium text-ink"
          >
            Save your details
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Pick a password and we will keep this address for next time. Your order
            carries on where you left it.
          </p>
        </div>

        {/* Prefilled from the checkout form, and editable — a typo in either is
            better caught here than after the account exists. */}
        <Field label="Full name" htmlFor="signup-name">
          <input
            id="signup-name"
            name="name"
            autoComplete="name"
            defaultValue={name}
            required
            aria-invalid={state.field === "name"}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="signup-email">
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={email}
              required
              aria-invalid={state.field === "email"}
              className={inputClass}
            />
          </Field>
          <Field label="Phone number" htmlFor="signup-phone">
            <input
              id="signup-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={phone}
              required
              aria-invalid={state.field === "phone"}
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Password"
          htmlFor="signup-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters. You can sign in with either the email or the phone number.`}
        >
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            aria-invalid={state.field === "password"}
            className={inputClass}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-moss-900 px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create account"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-ink-faint underline-offset-4 hover:text-ink hover:underline"
          >
            Not now
          </button>
        </div>

        <FormMessage status={state.status} message={state.message} />
      </form>
    </dialog>
  );
}
