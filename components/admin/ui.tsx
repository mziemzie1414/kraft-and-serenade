import Image from "next/image";
import type { ReactNode } from "react";
import type { AdminFormState } from "./form-state";

/**
 * Shared form furniture for the admin panel. Presentational only — every form
 * owns its own action state and passes `pending` down.
 */

export const inputClass =
  "w-full rounded-lg border border-canvas-deep bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-moss-400 focus:outline-none";

export const labelClass =
  "block text-xs font-semibold tracking-wide text-ink-soft uppercase";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {hint ? <span className="mt-1 block text-xs text-ink-faint">{hint}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function Fieldset({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-canvas-deep bg-canvas p-5">
      <legend className="px-1 font-display text-base font-medium text-ink">
        {title}
      </legend>
      {description ? (
        <p className="mb-4 text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

/**
 * An image field. The current URL travels in a hidden input so the action can
 * keep it when no replacement file is chosen. On a new record there is nothing
 * to keep, so the file input becomes required.
 */
export function ImageField({
  name,
  label,
  currentUrl,
  previewClassName,
}: {
  name: string;
  label: string;
  currentUrl: string;
  previewClassName: string;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <input type="hidden" name={name} value={currentUrl} />
      <div className="mt-1.5 flex flex-wrap items-center gap-4">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt=""
            width={160}
            height={160}
            className={`rounded-lg border border-canvas-deep object-cover ${previewClassName}`}
            unoptimized
          />
        ) : null}
        <input
          type="file"
          name={`${name}File`}
          accept="image/jpeg,image/png,image/webp,image/avif"
          required={!currentUrl}
          aria-label={`${currentUrl ? "Replace" : "Upload"} ${label.toLowerCase()}`}
          className="text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-moss-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-canvas hover:file:bg-moss-700"
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        {currentUrl
          ? "Leave empty to keep the current image. Uploads are compressed to WebP."
          : "Required. Uploads are compressed to WebP."}
      </p>
    </div>
  );
}

export function StatusMessage({ state }: { state: AdminFormState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      role="status"
      className={
        state.status === "error"
          ? "text-sm font-medium text-blush-600"
          : "text-sm font-medium text-moss-600"
      }
    >
      {state.message}
    </p>
  );
}

export function PrimaryButton({
  children,
  pending,
  ...props
}: React.ComponentProps<"button"> & { pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-moss-900 px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700 disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  pending,
  ...props
}: React.ComponentProps<"button"> & { pending?: boolean }) {
  return (
    <button
      disabled={pending}
      className="rounded-full border border-canvas-deep px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}
