"use client";

import { useActionState, useId } from "react";
import { subscribe, type SubscribeState } from "@/app/(site)/newsletter-actions";
import { ArrowRightIcon, CheckIcon, MailIcon } from "@/components/ui/Icons";

const INITIAL: SubscribeState = { status: "idle" };

export function Newsletter() {
  const inputId = useId();
  const messageId = useId();
  const [state, formAction, pending] = useActionState(subscribe, INITIAL);

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="scroll-mt-24 border-t border-canvas-deep/60 bg-canvas-alt py-20 sm:py-24"
    >
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-moss-700 text-canvas"
            aria-hidden
          >
            <MailIcon className="h-5 w-5" />
          </span>

          <h2
            id="newsletter-heading"
            className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance sm:text-4xl"
          >
            One email a week, and it is mostly flowers
          </h2>

          <p className="mt-4 text-base leading-relaxed text-pretty text-ink-soft">
            What came in from the market, what we are building, and first access
            to seasonal stems like peonies and imported tulips. Unsubscribe in
            one click.
          </p>

          {/* React clears an uncontrolled form once the action resolves, so the
              field empties itself on a successful subscribe. */}
          <form action={formAction} noValidate className="mt-9">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor={inputId} className="sr-only">
                Email address
              </label>
              <input
                id={inputId}
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                aria-describedby={state.status === "idle" ? undefined : messageId}
                aria-invalid={state.status === "error"}
                className={`h-14 flex-1 rounded-full border bg-canvas px-6 text-sm text-ink placeholder:text-ink-faint focus:outline-none ${
                  state.status === "error"
                    ? "border-blush-500"
                    : "border-canvas-deep focus:border-moss-400"
                }`}
              />
              <button
                type="submit"
                disabled={pending}
                className="group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-moss-700 px-8 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-moss-900 disabled:opacity-70"
              >
                {pending ? "Adding…" : "Subscribe"}
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Status messages are announced politely rather than interrupting. */}
            <div id={messageId} aria-live="polite" className="min-h-6 pt-3">
              {state.status === "error" ? (
                <p className="text-sm text-blush-600">{state.message}</p>
              ) : null}
              {state.status === "success" ? (
                <p className="inline-flex items-center gap-2 text-sm font-medium text-moss-700">
                  <CheckIcon className="h-4 w-4" />
                  {state.message}
                </p>
              ) : null}
            </div>
          </form>

          <p className="mt-2 text-xs text-ink-faint">
            No spam, no reselling your address. Just flowers.
          </p>
        </div>
      </div>
    </section>
  );
}
