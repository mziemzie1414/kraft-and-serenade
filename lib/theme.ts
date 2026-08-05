/**
 * The site colour palette.
 *
 * `app/globals.css` declares the palette in an `@theme` block, which Tailwind
 * compiles into `--color-*` custom properties on `:root`. Every utility — solid
 * ones like `bg-moss-900` and translucent ones like `bg-moss-900/45`, which go
 * through `color-mix` — reads those properties at runtime. Re-declaring them on
 * `html:root` therefore recolours the entire site without rebuilding the CSS.
 *
 * Kept free of database imports so the admin form can share it. Reads live in
 * `lib/theme-queries.ts`.
 */

/** One row, addressed by a fixed id. */
export const THEME_ID = "theme";

export type ThemeGroup = "Surfaces" | "Text" | "Primary" | "Accent" | "Highlight";

type TokenDefinition = {
  /** Column on the `theme` table, and field name in the admin form. */
  key: string;
  /** The custom property Tailwind generated for it. */
  cssVar: string;
  label: string;
  hint: string;
  group: ThemeGroup;
};

/**
 * The palette, in the order it appears in `globals.css`. This is the single
 * source of truth: the style tag, the admin form and validation all derive
 * from it.
 */
export const THEME_TOKENS = [
  {
    key: "canvas",
    cssVar: "--color-canvas",
    label: "Page background",
    hint: "Warm paper behind everything.",
    group: "Surfaces",
  },
  {
    key: "canvasAlt",
    cssVar: "--color-canvas-alt",
    label: "Raised surface",
    hint: "Alternating section backgrounds.",
    group: "Surfaces",
  },
  {
    key: "canvasDeep",
    cssVar: "--color-canvas-deep",
    label: "Borders and dividers",
    hint: "Hairlines on cards and inputs.",
    group: "Surfaces",
  },
  {
    key: "ink",
    cssVar: "--color-ink",
    label: "Body text",
    hint: "Headings and primary copy.",
    group: "Text",
  },
  {
    key: "inkSoft",
    cssVar: "--color-ink-soft",
    label: "Secondary text",
    hint: "Supporting paragraphs.",
    group: "Text",
  },
  {
    key: "inkFaint",
    cssVar: "--color-ink-faint",
    label: "Muted text",
    hint: "Captions and placeholders.",
    group: "Text",
  },
  {
    key: "moss50",
    cssVar: "--color-moss-50",
    label: "Primary 50",
    hint: "Lightest tint.",
    group: "Primary",
  },
  {
    key: "moss100",
    cssVar: "--color-moss-100",
    label: "Primary 100",
    hint: "Light tint for panels.",
    group: "Primary",
  },
  {
    key: "moss400",
    cssVar: "--color-moss-400",
    label: "Primary 400",
    hint: "Mid tone, focused inputs.",
    group: "Primary",
  },
  {
    key: "moss600",
    cssVar: "--color-moss-600",
    label: "Primary 600",
    hint: "Success and confirmation text.",
    group: "Primary",
  },
  {
    key: "moss700",
    cssVar: "--color-moss-700",
    label: "Primary 700",
    hint: "Button hover and focus rings.",
    group: "Primary",
  },
  {
    key: "moss900",
    cssVar: "--color-moss-900",
    label: "Primary 900",
    hint: "Dark buttons, footer, hero scrim.",
    group: "Primary",
  },
  {
    key: "blush50",
    cssVar: "--color-blush-50",
    label: "Accent 50",
    hint: "Lightest accent wash.",
    group: "Accent",
  },
  {
    key: "blush100",
    cssVar: "--color-blush-100",
    label: "Accent 100",
    hint: "Button hover fill.",
    group: "Accent",
  },
  {
    key: "blush300",
    cssVar: "--color-blush-300",
    label: "Accent 300",
    hint: "Hero italics, icons, dots.",
    group: "Accent",
  },
  {
    key: "blush500",
    cssVar: "--color-blush-500",
    label: "Accent 500",
    hint: "Links and emphasis.",
    group: "Accent",
  },
  {
    key: "blush600",
    cssVar: "--color-blush-600",
    label: "Accent 600",
    hint: "Sale prices and error text.",
    group: "Accent",
  },
  {
    key: "gold",
    cssVar: "--color-gold",
    label: "Star rating",
    hint: "Review stars and small flourishes.",
    group: "Highlight",
  },
] as const satisfies readonly TokenDefinition[];

export type ThemeTokenKey = (typeof THEME_TOKENS)[number]["key"];

/** A full palette: one CSS colour per token. */
export type ThemeContent = Record<ThemeTokenKey, string>;

export const THEME_GROUPS: ThemeGroup[] = [
  "Surfaces",
  "Text",
  "Primary",
  "Accent",
  "Highlight",
];

/** The palette the site shipped with, matching `@theme` in globals.css. */
export const THEME_DEFAULTS: ThemeContent = {
  canvas: "#fbf9f6",
  canvasAlt: "#f3ede5",
  canvasDeep: "#ebe3d8",
  ink: "#1a1715",
  inkSoft: "#6c625a",
  inkFaint: "#9a9088",
  moss50: "#f2f5f3",
  moss100: "#dde5df",
  moss400: "#6b8a77",
  moss600: "#3f5a4a",
  moss700: "#33473b",
  moss900: "#1e2b24",
  blush50: "#fdf6f6",
  blush100: "#f6e4e5",
  blush300: "#e3aeb4",
  blush500: "#c9707c",
  blush600: "#b25a66",
  gold: "#b08d57",
};

/**
 * Colours are only ever accepted as `#rgb` or `#rrggbb`. Narrow on purpose: the
 * values are interpolated into a `<style>` tag, and anything that cannot contain
 * a brace or a closing tag cannot break out of it.
 */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

/**
 * Builds the CSS that overrides the compiled palette.
 *
 * `html:root` is used rather than `:root` so the rule outranks Tailwind's own
 * declarations no matter which order the browser sees the two stylesheets in.
 * Values that somehow are not valid hex are dropped rather than emitted.
 */
export function themeCss(theme: ThemeContent): string {
  const declarations = THEME_TOKENS.filter((token) => isHexColor(theme[token.key]))
    .map((token) => `${token.cssVar}:${theme[token.key]}`)
    .join(";");

  return `html:root{${declarations}}`;
}
