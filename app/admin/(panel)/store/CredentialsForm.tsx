"use client";

import { useActionState } from "react";
import { IDLE } from "@/components/admin/form-state";
import {
  Field,
  Fieldset,
  PrimaryButton,
  StatusMessage,
  inputClass,
} from "@/components/admin/ui";
import { saveCredentials } from "./actions";

/**
 * Separate from the store details form on purpose: a routine copy edit should not
 * be able to touch the sign-in credentials, and the current password is only
 * needed here.
 */
export function CredentialsForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(saveCredentials, IDLE);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <Fieldset
        title="Sign-in credentials"
        description="Changing the password signs out every other browser."
      >
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={email}
            autoComplete="username"
            className={inputClass}
            required
          />
        </Field>

        <Field
          label="Current password"
          hint="Required to confirm any change here."
        >
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" hint="Leave blank to keep the current one.">
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
        </div>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : "Update credentials"}
        </PrimaryButton>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
