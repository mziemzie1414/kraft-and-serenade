"use client";

import { useActionState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/customer";
import { Field, FormMessage, inputClass } from "@/components/ui/form";
import { changePassword, updateProfile } from "../actions";
import { ACCOUNT_IDLE } from "../form-state";

/**
 * Two separate forms rather than one.
 *
 * Changing a password signs the account's other devices out, so it should not be a
 * side effect of correcting a typo in a phone number — and mixing them means one
 * submit button whose consequences depend on which fields happen to be filled.
 */
export function ProfileForm({
  customer,
  version,
}: {
  customer: { name: string; email: string; phone: string };
  /**
   * Remounts the form after saving. React does not update `defaultValue` on an
   * already-mounted input, so without this a saved change would still show the old
   * value if the customer edited it again. Same pattern as the admin forms.
   */
  version: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DetailsForm key={version} customer={customer} />
      <PasswordForm />
    </div>
  );
}

function DetailsForm({
  customer,
}: {
  customer: { name: string; email: string; phone: string };
}) {
  const [state, formAction, pending] = useActionState(updateProfile, ACCOUNT_IDLE);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-canvas-deep bg-canvas-alt p-6"
    >
      <div>
        <h2 className="font-display text-lg font-medium text-ink">Your details</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Both the email and the phone number can be used to sign in.
        </p>
      </div>

      <Field label="Full name" htmlFor="profile-name">
        <input
          id="profile-name"
          name="name"
          autoComplete="name"
          defaultValue={customer.name}
          required
          aria-invalid={state.field === "name"}
          className={inputClass}
        />
      </Field>

      <Field label="Email" htmlFor="profile-email">
        <input
          id="profile-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={customer.email}
          required
          aria-invalid={state.field === "email"}
          className={inputClass}
        />
      </Field>

      <Field label="Phone number" htmlFor="profile-phone">
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={customer.phone}
          required
          aria-invalid={state.field === "phone"}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-moss-900 px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
      </div>

      <FormMessage status={state.status} message={state.message} />
    </form>
  );
}

function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, ACCOUNT_IDLE);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-canvas-deep bg-canvas-alt p-6"
    >
      <div>
        <h2 className="font-display text-lg font-medium text-ink">Password</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Changing this signs you out everywhere else, but not here.
        </p>
      </div>

      <Field label="Current password" htmlFor="currentPassword">
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.field === "currentPassword"}
          className={inputClass}
        />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
      >
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          aria-invalid={state.field === "newPassword"}
          className={inputClass}
        />
      </Field>

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-canvas-deep px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-60"
        >
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>

      <FormMessage status={state.status} message={state.message} />
    </form>
  );
}
