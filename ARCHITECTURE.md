# Architecture

How this project is put together right now. This describes the current shape
rather than the history of changes — `git log` already covers the latter, and a
hand-written changelog would only drift out of date.

Keep this file current when you add a table, a route, or an admin page.

## What it is

A storefront for Kraft & Serenade, a florist studio in Pasig City. It started as
a frontend-only build with every value hard-coded, and is being moved onto a
database one section at a time. Some of the landing page still reads from
`lib/data.ts`; see [What is still hard-coded](#what-is-still-hard-coded).

## Stack

| Concern  | Choice                                                       |
| -------- | ------------------------------------------------------------ |
| Framework| Next.js 16 (App Router, Turbopack, React 19, React Compiler)  |
| Styling  | Tailwind CSS v4, configured in `app/globals.css`              |
| Database | Supabase Postgres, reached through Prisma 7                   |
| Files    | Supabase Storage, one public `site-images` bucket             |
| Images   | `sharp`, to compress uploads before they are stored           |

Prisma 7 notes worth knowing before you touch it:

- The client is generated to `lib/generated/prisma` (gitignored, rebuilt by the
  `postinstall` hook). Import it through `lib/prisma.ts`, never directly.
- It needs a driver adapter. `lib/prisma.ts` wires up `@prisma/adapter-pg`.
- Datasource config lives in `prisma.config.ts`, not in `schema.prisma`.

## Environment

`.env` is gitignored, so a fresh deploy needs these set:

| Variable                              | Purpose                                     |
| ------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`                        | Transaction pooler (port 6543), app runtime |
| `MIGRATE_DATABASE_URL`                | Session pooler (port 5432), Prisma CLI only |
| `NEXT_PUBLIC_SUPABASE_URL`            | Project URL                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| Browser-safe key                            |
| `SUPABASE_SECRET_KEY`                 | Server only. Bypasses row level security    |
| `SUPABASE_STORAGE_BUCKET`             | Defaults to `site-images`                   |

Two connection strings because Supabase's transaction pooler cannot run DDL or
hold advisory locks, so migrations and seeding go through the session pooler
instead. `prisma.config.ts` prefers `MIGRATE_DATABASE_URL` for that reason.

## Setup

```bash
npm install                # also runs `prisma generate`
npm run setup:storage      # creates the public site-images bucket, idempotent
npx prisma migrate deploy  # or `migrate dev` when changing the schema
npx prisma db seed         # loads the content the site shipped with
npm run dev
```

`npx prisma db seed` is safe to re-run. It keys on id or slug, so it updates
rows in place and never deletes anything added through the admin panel.

## Routes

```
app/
  layout.tsx              document shell, fonts, and the colour palette <style>
  (site)/                 storefront: reads categories once, renders the chrome
    page.tsx              landing page
    products/             catalogue, filtered by ?category=<slug>
    products/[slug]/      product detail
  admin/                  editing UI, force-dynamic, noindex
    theme/                colour palette
    hero/                 hero section
    categories/           list, new, [id]
    products/             list, new, [id]
    occasions/            list, new, [id]
```

`/` is statically prerendered and revalidated when content changes.
`/products*` is dynamic because it reads search params. Everything under
`/admin` is `force-dynamic`, so it always shows what is actually stored.

The storefront chrome lives in `app/(site)/layout.tsx` rather than the root
layout, so `/admin` does not inherit the navbar and footer. That layout reads the
categories once and passes the same list to both `Navbar` and `Footer`, so the
two can never disagree about what the shop contains.

## Data model

`prisma/schema.prisma`. Five migrations so far: `hero_section`, `theme`,
`catalog`, `best_seller_rank`, `occasion`.

**Singletons.** `Theme` and `HeroSection` each hold exactly one row, addressed by
a fixed id (`"theme"`, `"hero"`). A known id keeps reads and the admin upsert
trivial, with no "which row is live?" question to answer. `HeroTrustPoint` is an
ordered child list of `HeroSection`.

**Catalogue.** `Category` has many `Product`. `Occasion` optionally points at one
`Category`.

Decisions in there that are easy to misread:

- `Product.price` is an integer of whole pesos. Bouquets are never priced in
  centavos, and integers avoid float rounding.
- `Product.isFeatured` drives the Featured Bouquets section.
- `Product.bestSellerRank` is nullable, and `null` keeps a product out of the
  Best Sellers chart. It is deliberately **not** unique: a unique constraint
  would make swapping two ranks fail unless you park one on a temporary value.
  Ties fall back to name order.
- `Product.categoryId` is `onDelete: Restrict`, so deleting a category that still
  has products fails loudly instead of quietly binning them.
- `Occasion.categoryId` is `onDelete: SetNull`, so deleting a category clears the
  shortcut and the tile falls back to the full catalogue.
- Occasions are a way in, not a taxonomy. There is no product-to-occasion
  tagging; if you ever need real occasion filtering, that is a join table and a
  new filter on `/products`.

## How the theme works

`app/globals.css` declares the palette in an `@theme` block, which Tailwind
compiles into `--color-*` custom properties on `:root`. Every colour utility
reads those at runtime — solid ones like `bg-moss-900` directly, and translucent
ones like `bg-moss-900/45` through `color-mix`. So re-declaring the properties
recolours the whole site with no rebuild.

The root layout does exactly that: it reads the `Theme` row and emits one
`<style>` rule. Two details matter:

- The selector is `html:root`, not `:root`. That is one specificity point higher
  than Tailwind's own declaration, so it wins regardless of stylesheet order.
- Values are validated as `#rgb`/`#rrggbb` on write **and** filtered again at
  render, so nothing can break out of the `<style>` tag.

The values in `@theme` still have to exist for Tailwind to know which utilities
to generate. They are the starting point, not the live palette. Keep them in step
with `THEME_DEFAULTS` in `lib/theme.ts`.

## Code layout

Modules are split by whether they can touch the database, because the admin forms
are Client Components and would otherwise pull Prisma into the browser bundle.

| Pure (safe for client)     | Database                  |
| -------------------------- | ------------------------- |
| `lib/hero.ts`              | `lib/hero-queries.ts`     |
| `lib/theme.ts`             | `lib/theme-queries.ts`    |
| `lib/catalog.ts`           | `lib/catalog-queries.ts`  |
| `lib/nav.ts`               |                           |

The pure modules hold types, defaults, validation, and small helpers. If you add
a constant that an admin form needs, it belongs on the left.

`lib/data.ts` is the original hard-coded content. It is still the source for the
sections listed below, and the seed script reads it to populate the database.

## Admin panel

Every editor follows the same three-file shape:

- `page.tsx` — Server Component, loads the record
- `*Form.tsx` — Client Component, `useActionState`
- `actions.ts` — `"use server"`, validates and writes

Shared form furniture is in `app/admin/ui.tsx`, and `app/admin/form-state.ts`
holds the `AdminFormState` every action returns. `app/admin/sections.ts` drives
the sidebar and the index page.

Two patterns to copy rather than reinvent:

**Forms remount after saving.** Each form takes a `version` prop, usually
`updatedAt.toISOString()`, used as its `key`. React does not update
`defaultValue` on an already-mounted input, so without this a freshly uploaded
image URL would still show the old value.

**Redirects happen outside `try`.** `redirect()` works by throwing, so catching
errors around it swallows the navigation. Actions use a `handle()` helper that
returns `{ state, redirectTo }`, and `redirect()` is called after the
`try`/`catch`. This is the approach the Next docs recommend over
`unstable_rethrow`.

Mutations call `revalidatePath`, which matters because `/` is prerendered:

| Changed    | Revalidates                                          |
| ---------- | ---------------------------------------------------- |
| Theme      | `revalidatePath("/", "layout")` — it is in the root layout |
| Hero       | `revalidatePath("/")`                                |
| Categories | `revalidatePath("/", "layout")` — they are in the chrome   |
| Products   | `revalidatePath("/", "layout")` plus the product's own page |
| Occasions  | `revalidatePath("/")`                                |

## Images

Uploads go through `uploadImage` in `lib/storage.ts`: `sharp` honours EXIF
orientation, caps the width, and re-encodes to WebP at quality 82. The bucket
only accepts `image/webp`, and writes need the secret key, which never leaves the
server. `next.config.ts` allows the Supabase hostname for `next/image` and raises
the Server Action body limit to 16 MB, because the default 1 MB rejects most
phone photos.

Seeded records still point at the local files in `public/images/`. Both those and
Supabase URLs work, since `next/image` handles either.

## What is still hard-coded

These sections read `lib/data.ts` and have no admin page yet:

| Section             | Constant         |
| ------------------- | ---------------- |
| `WhyChooseUs`       | `WHY_CHOOSE_US`  |
| `HowItWorks`        | `HOW_IT_WORKS`   |
| `CustomerReviews`   | `REVIEWS`        |
| `InstagramGallery`  | `GALLERY_IMAGES` |
| `FaqSection`        | `FAQS`           |
| `PromoBanner`       | in-component     |
| `Newsletter`        | in-component     |

Also still in `lib/data.ts`: `BRAND` (used by the footer, logo, and metadata) and
`BUSINESS_HOURS`.

## Known gaps

- **`/admin` has no authentication.** Anyone who can reach the URL can rewrite
  the site, and the Server Actions are reachable by direct POST regardless of the
  UI. This needs solving before a public deploy.
- **Replaced images are not deleted from Storage.** Swapping a photo uploads the
  new file and repoints the row, leaving the old object behind.
- **Product descriptions are placeholders.** `lib/data.ts` never had any, so the
  blurbs in `prisma/seed.ts` were written to give the detail pages something to
  render. They are not real copy.
- **Ratings and review counts are decorative.** They are editable numbers with no
  reviews behind them.
- **No cart or checkout.** Product pages link to the contact section instead.
- **Two categories have no products.** Graduation and Money Bouquets, because the
  original hard-coded data had none. They render an empty state.
