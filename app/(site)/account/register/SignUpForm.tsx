"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { refreshAccount } from "@/components/account/useAccount";
import { PASSWORD_MIN_LENGTH } from "@/lib/customer";
import { Field, FormMessage, PrimaryButton, inputClass } from "@/components/ui/form";
import { signUp } from "../actions";
import { ACCOUNT_IDLE } from "../form-state";

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, ACCOUNT_IDLE);
  const router = useRouter();

  /* Same order as signing in: refresh the navbar's cached session, then move. */
  useEffect(() => {
    if (state.status !== "done") return;

    refreshAccount();
    router.push(next);
  }, [state.status, next, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" htmlFor="name">
        <input
          id="name"
          name="name"
          autoComplete="name"
          autoFocus
          required
          aria-invalid={state.field === "name"}
          className={inputClass}
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={state.field === "email"}
          className={inputClass}
        />
      </Field>

      <Field
        label="Phone number"
        htmlFor="phone"
        hint="You can sign in with this instead of your email."
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="09XX XXX XXXX"
          required
          aria-invalid={state.field === "phone"}
          className={inputClass}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          aria-invalid={state.field === "password"}
          className={inputClass}
        />
      </Field>

      <div className="pt-2">
        <PrimaryButton pending={pending}>
          {pending || state.status === "done" ? "Creating…" : "Create account"}
        </PrimaryButton>
      </div>

      <FormMessage status={state.status} message={state.message} />
    </form>
  );
}
