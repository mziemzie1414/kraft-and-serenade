/**
 * The shape every customer account Server Action returns to its form.
 *
 * In its own module rather than beside the actions, because a `"use server"` file
 * may only export async functions — everything it exports becomes a callable
 * server reference, and an object cannot be one. Exporting `ACCOUNT_IDLE` from
 * there fails at runtime with "a 'use server' file can only export async
 * functions, found object".
 *
 * `components/admin/form-state.ts` is split out for the same reason.
 */
export type AccountState = {
  status: "idle" | "error" | "done";
  message?: string;
  /** Which field to point at, when it is one field's fault. */
  field?: string;
};

export const ACCOUNT_IDLE: AccountState = { status: "idle" };
