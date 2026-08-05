/**
 * Form furniture for the storefront.
 *
 * Separate from `components/admin/ui.tsx` because the two are sized differently —
 * customer-facing inputs are roomier than the admin panel's — and because the
 * admin module imports `AdminFormState`, which has nothing to do with the shop.
 * Presentational only: every form owns its own action state.
 */

export const inputClass =
  "w-full rounded-lg border border-canvas-deep bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-moss-400 focus:outline-none";

export const labelClass =
  "block text-xs font-semibold tracking-wide text-ink-soft uppercase";

/**
 * A labelled field. `htmlFor` is required rather than wrapping the control in the
 * label, because several of these hold a `LocationPicker` select whose id is
 * built from a prefix.
 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/** The storefront's primary action. Matches the checkout submit button. */
export function PrimaryButton({
  children,
  pending,
  ...props
}: React.ComponentProps<"button"> & { pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-moss-900 px-6 py-3.5 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-moss-700 disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * An error or confirmation line, announced politely so it is heard without
 * stealing focus from whatever the customer is typing in.
 */
export function FormMessage({
  status,
  message,
}: {
  status: "idle" | "error" | "done";
  message?: string;
}) {
  return (
    <div aria-live="polite" className="min-h-6">
      {status !== "idle" && message ? (
        <p
          className={
            status === "error"
              ? "text-sm text-blush-600"
              : "text-sm font-medium text-moss-600"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
