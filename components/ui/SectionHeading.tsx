import type { ReactNode } from "react";

/** Shared eyebrow + title + optional lede block used by most landing sections. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "center",
  tone = "ink",
  as: Heading = "h2",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: string;
  align?: "center" | "left";
  tone?: "ink" | "light";
  as?: "h2" | "h3";
  action?: ReactNode;
}) {
  const isLight = tone === "light";
  const alignment =
    align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <div
      className={
        action
          ? "flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          : undefined
      }
    >
      <div className={`flex max-w-2xl flex-col ${alignment}`}>
        {eyebrow ? (
          <span
            className={`mb-4 inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] ${
              isLight ? "text-blush-300" : "text-blush-500"
            }`}
          >
            <span
              className={`h-px w-6 ${isLight ? "bg-blush-300/60" : "bg-blush-300"}`}
              aria-hidden
            />
            {eyebrow}
          </span>
        ) : null}

        <Heading
          className={`font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] ${
            isLight ? "text-canvas" : "text-ink"
          }`}
        >
          {title}
        </Heading>

        {lede ? (
          <p
            className={`mt-4 text-base leading-relaxed text-pretty ${
              isLight ? "text-canvas/70" : "text-ink-soft"
            }`}
          >
            {lede}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
