"use client";

import { useActionState } from "react";
import { IDLE } from "@/components/admin/form-state";
import { Field, PrimaryButton, StatusMessage, inputClass } from "@/components/admin/ui";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, IDLE);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />

      <Field label="Email">
        <input
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          className={inputClass}
        />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <PrimaryButton pending={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </PrimaryButton>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
