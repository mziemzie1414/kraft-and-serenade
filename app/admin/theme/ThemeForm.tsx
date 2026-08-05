"use client";

import { useActionState, useState } from "react";
import {
  THEME_GROUPS,
  THEME_TOKENS,
  isHexColor,
  type ThemeContent,
  type ThemeTokenKey,
} from "@/lib/theme";
import { IDLE } from "../form-state";
import { PrimaryButton, SecondaryButton, StatusMessage } from "../ui";
import { saveTheme } from "./actions";

/** `<input type="color">` only accepts `#rrggbb`, so widen shorthand hex. */
function toPickerValue(value: string): string {
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }

  return isHexColor(value) ? value : "#000000";
}

export function ThemeForm({
  theme,
  version,
}: {
  theme: ThemeContent;
  version: string;
}) {
  const [state, formAction, pending] = useActionState(saveTheme, IDLE);
  const [colors, setColors] = useState<ThemeContent>(theme);

  function update(key: ThemeTokenKey, value: string) {
    setColors((current) => ({ ...current, [key]: value }));
  }

  return (
    <form key={version} action={formAction} className="mt-8 space-y-6">
      {THEME_GROUPS.map((group) => (
        <fieldset
          key={group}
          className="rounded-xl border border-canvas-deep bg-canvas p-5"
        >
          <legend className="px-1 font-display text-base font-medium text-ink">
            {group}
          </legend>

          <ul className="space-y-2">
            {THEME_TOKENS.filter((token) => token.group === group).map((token) => {
              const value = colors[token.key];
              const valid = isHexColor(value);

              return (
                <li
                  key={token.key}
                  className="grid gap-3 sm:grid-cols-[3rem_1fr_9rem] sm:items-center"
                >
                  <input
                    type="color"
                    value={toPickerValue(value)}
                    onChange={(event) => update(token.key, event.target.value)}
                    aria-label={`${token.label} colour picker`}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-canvas-deep bg-canvas p-1"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">
                      {token.label}
                    </span>
                    <span className="block text-xs text-ink-faint">{token.hint}</span>
                  </span>

                  <input
                    name={token.key}
                    value={value}
                    onChange={(event) => update(token.key, event.target.value)}
                    spellCheck={false}
                    aria-label={`${token.label} hex value`}
                    aria-invalid={!valid}
                    className={`w-full rounded-lg border bg-canvas px-3 py-2 font-mono text-sm text-ink focus:outline-none ${
                      valid
                        ? "border-canvas-deep focus:border-moss-400"
                        : "border-blush-600"
                    }`}
                  />
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      {/* Preview. The swatches above are hard to judge in isolation, so the
          unsaved values are applied to a few representative elements. */}
      <section
        aria-label="Preview"
        className="overflow-hidden rounded-xl border border-canvas-deep"
        style={Object.fromEntries(
          THEME_TOKENS.filter((token) => isHexColor(colors[token.key])).map(
            (token) => [token.cssVar, colors[token.key]],
          ),
        ) as React.CSSProperties}
      >
        <div className="bg-moss-900 px-6 py-8">
          <p className="text-xs font-medium tracking-wide text-canvas/80">
            Cut at 4am. On your doorstep by lunch.
          </p>
          <p className="mt-2 font-display text-2xl font-medium text-canvas">
            Flowers that say it{" "}
            <span className="italic text-blush-300">without saying much</span>
          </p>
          <span className="mt-4 inline-block rounded-full bg-canvas px-5 py-2.5 text-sm font-semibold text-ink">
            Shop the bouquets
          </span>
        </div>
        <div className="bg-canvas-alt px-6 py-5">
          <p className="font-display text-base font-medium text-ink">
            Blush Peony Serenade
          </p>
          <p className="mt-0.5 text-sm text-ink-soft">Mixed Flower Bouquets</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-ink">₱2,480</span>{" "}
            <span className="text-blush-600 line-through">₱2,900</span>{" "}
            <span className="text-gold">★★★★★</span>{" "}
            <span className="text-ink-faint">(128)</span>
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>
          {pending ? "Saving…" : "Save colours"}
        </PrimaryButton>

        <SecondaryButton type="submit" name="intent" value="reset" pending={pending}>
          Reset to original
        </SecondaryButton>

        <StatusMessage state={state} />
      </div>
    </form>
  );
}
