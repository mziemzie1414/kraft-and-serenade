"use client";

import { useId, useState } from "react";
import { ArrowRightIcon, CheckIcon, MailIcon } from "@/components/ui/Icons";

type Status = "idle" | "error" | "success";

export function Newsletter() {
  const inputId = useId();
  const messageId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  /**
   * There is no backend in this build, so the form validates locally and shows
   * a confirmation. Nothing is transmitted anywhere.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);

    if (!looksLikeEmail) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
  };

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

          <p className="mt-4 text-base leading-relaxed text-ink-soft text-pretty">
            What came in from the market, what we are building, and first access
            to seasonal stems like peonies and imported tulips. Unsubscribe in
            one click.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-9">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor={inputId} className="sr-only">
                Email address
              </label>
              <input
                id={inputId}
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                aria-describedby={status === "idle" ? undefined : messageId}
                aria-invalid={status === "error"}
                className={`h-14 flex-1 rounded-full border bg-canvas px-6 text-sm text-ink placeholder:text-ink-faint focus:outline-none ${
                  status === "error"
                    ? "border-blush-500"
                    : "border-canvas-deep focus:border-moss-400"
                }`}
              />
              <button
                type="submit"
                className="group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-moss-700 px-8 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-moss-900"
              >
                Subscribe
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Status messages are announced politely rather than interrupting. */}
            <div id={messageId} aria-live="polite" className="min-h-6 pt-3">
              {status === "error" ? (
                <p className="text-sm text-blush-600">
                  That email does not look right. Mind checking it?
                </p>
              ) : null}
              {status === "success" ? (
                <p className="inline-flex items-center gap-2 text-sm font-medium text-moss-700">
                  <CheckIcon className="h-4 w-4" />
                  You are on the list. Look out for Friday&apos;s email.
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
