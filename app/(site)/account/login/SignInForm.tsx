"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { refreshAccount } from "@/components/account/useAccount";
import { Field, FormMessage, PrimaryButton, inputClass } from "@/components/ui/form";
import { signIn } from "../actions";
import { ACCOUNT_IDLE } from "../form-state";

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, ACCOUNT_IDLE);
  const router = useRouter();

  /**
   * The action sets the cookie but deliberately does not redirect, so the navbar's
   * cached session can be refreshed before we move. Doing it the other way round
   * lands on `/account` with the header still offering to sign you in.
   */
  useEffect(() => {
    if (state.status !== "done") return;

    refreshAccount();
    router.push(next);
  }, [state.status, next, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Email or phone number"
        htmlFor="identifier"
        hint="Whichever you gave us — either one works."
      >
        <input
          id="identifier"
          name="identifier"
          // Not `type="email"`, because a phone number is just as valid here and
          // the browser would refuse to submit it.
          type="text"
          autoComplete="username"
          autoFocus
          required
          className={inputClass}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>

      <div className="pt-2">
        <PrimaryButton pending={pending}>
          {pending || state.status === "done" ? "Signing in…" : "Sign in"}
        </PrimaryButton>
      </div>

      <FormMessage status={state.status} message={state.message} />
    </form>
  );
}
