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
| `PAYMONGO_SECRET_KEY`                 | Server only. Payment Intents                |
| `PAYMONGO_PUBLIC_KEY`                 | Payment Methods and attach                  |
| `PAYMONGO_WEBHOOK_SECRET`             | Endpoint secret, `whsk_...`                 |
| `RESEND_API_KEY`                      | Server only. Without it, no mail is sent    |
| `EMAIL_FROM`                          | Sender. Must be on a verified domain        |
| `CONTACT_TO_EMAIL`                    | Where the shop's own order alert goes       |
| `SITE_URL`                            | Absolute base URL, for links inside emails  |

Without `RESEND_API_KEY` the app runs normally and sends nothing — deliberately,
so a missing key is never the reason an order fails. See [Email](#email) for the
sandbox limit on `EMAIL_FROM`, which will surprise you before a domain is verified.

PayMongo keys are mode-scoped. `sk_test_`/`pk_test_` never touch real money;
`sk_live_`/`pk_live_` do. Webhook endpoints are scoped the same way, so register a
separate one per environment.

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
    products/             catalogue, filtered by ?category=<slug> and ?price=<min>-<max>
    products/[slug]/      product detail
    faqs/                 every question, not just the home page selection
    about/                studio story and photograph, editable from admin
    contact/              email (from env), phone, address, map, mailto form
    cart/                 static shell, contents priced client-side
    checkout/             address, shipping fee, order creation, sign-up panel
    orders/[token]/       confirmation, keyed on an unguessable token
    account/              customer accounts
      login/              sign in with either the email or the phone number
      register/           create an account
      (dashboard)/        behind the session guard
        page.tsx          details and password, at /account
        orders/           order history
        addresses/        saved addresses
    newsletter-actions.ts the only Server Action on the public site
  api/cart/               the cart, priced from the database
  api/account/me/         who is signed in, for the navbar
  api/psgc/               location lookups for the cascading address selects
  api/paymongo/webhook/   payment confirmation, signature-verified
  api/search/             product and category search, used by the navbar overlay
  admin/                  force-dynamic, noindex
    login/                sign-in, outside the guarded route group
    (panel)/              everything below is behind the session guard
    orders/               every order, filterable; [id] confirms and fulfils one
    store/                store details, opening hours, admin credentials, logo
    shipping/             delivery toggle, flat rate, per-location rates
    delivery/             which days customers can pick, rush fee, closures
    theme/                colour palette
    hero/                 hero section
    why-choose-us/        studio photos, selling points, stat strip
    how-it-works/         numbered steps and callout
    reviews/              curated customer quotes
    gallery/              studio photo grid
    promo/                seasonal banner, with an on/off switch
    faqs/                 questions for both the home block and /faqs
    about/                about page content and image
    contact/              contact page copy, address, phone, map embed
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

`prisma/schema.prisma`. Sixteen migrations so far: `hero_section`, `theme`,
`catalog`, `best_seller_rank`, `occasion`, `why_choose_us_and_how_it_works`,
`reviews_gallery_promo`, `faq_and_newsletter`,
`store_settings_and_admin_auth`, `shipping`, `orders`, `paymongo`,
`customer_accounts`, `delivery_dates`, `about_and_contact`, `store_logo`.

### Migrating through the Supabase pooler

Two things will bite you, and both did:

- **`migrate dev` prompts** whenever a change could fail against existing data,
  such as adding a unique constraint. Without a TTY it hangs forever rather than
  erroring. Piping `y` does not help.
- **Advisory locks do not survive a pooler.** They are session-scoped, and
  Supavisor can hand Prisma a different backend, so it ends up waiting on its own
  lock and reports `P1002`. A killed run leaves the lock behind and every later
  attempt fails the same way.

When that happens, set `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1` and generate the
migration without the interactive path:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
# save into prisma/migrations/<timestamp>_<name>/migration.sql, then:
npx prisma migrate deploy
```

A third trap, on Windows only: **write that file without a byte order mark.**
PowerShell's `>` and `Out-File -Encoding utf8` both add one, Postgres reads it as
a stray token, and the whole script fails with `42601 syntax error at or near
""` before a single statement runs. Prisma then records the migration as failed
and refuses every later `deploy` with `P3009`. Recovering means confirming
nothing was applied and then:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma migrate deploy
```

If a lock is stuck, terminate the holder:

```sql
select a.pid from pg_locks l join pg_stat_activity a on a.pid = l.pid
 where l.locktype = 'advisory' and a.pid <> pg_backend_pid();
select pg_terminate_backend(<pid>);
```

**Singletons.** Each landing-page section holds exactly one row, addressed by a
fixed id. A known id keeps reads and the admin upsert trivial, with no "which row
is live?" question to answer.

| Model                  | Id               | Ordered children                      |
| ---------------------- | ---------------- | ------------------------------------- |
| `Theme`                | `theme`          | —                                     |
| `HeroSection`          | `hero`           | `HeroTrustPoint`                      |
| `WhyChooseUsSection`   | `why-choose-us`  | `WhyChooseUsPoint`, `WhyChooseUsStat` |
| `HowItWorksSection`    | `how-it-works`   | `HowItWorksStep`                      |
| `ReviewsSection`       | `reviews`        | `Review`                              |
| `GallerySection`       | `gallery`        | `GalleryImage`                        |
| `PromoBannerSection`   | `promo`          | —                                     |
| `FaqSection`           | `faqs`           | `Faq`                                 |
| `StoreSettings`        | `store`          | `BusinessHour`                        |
| `ShippingSettings`     | `shipping`       | `ShippingRate`                        |
| `DeliverySettings`     | `delivery`       | `DeliveryDateException`               |
| `AboutSection`         | `about`          | —                                     |
| `ContactSection`       | `contact`        | —                                     |

Children cascade on delete.

`FaqSection` feeds two places at once: the home page block and the `/faqs` page.
`Faq.showOnHome` decides which questions appear on the home page, while `/faqs`
always lists everything, so shortening the front page never hides an answer from
the site.

**Standalone.** `NewsletterSubscriber` belongs to no section. It is a capture
table for the newsletter form: unique, lowercased email plus a timestamp.

**Customers.** `Customer` has many `CustomerSession`, `CustomerAddress` and
`Order`. The first two cascade on delete; `Order.customerId` is
`onDelete: SetNull`, so closing an account does not destroy a sale.

Child lists are replaced wholesale on save — delete all, then re-create from the
submitted rows inside one transaction — so `position` is always a dense
`0..n` and reordering needs no diffing.

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

| Pure (safe for client)     | Database                                        |
| -------------------------- | ----------------------------------------------- |
| `lib/hero.ts`              | `lib/hero-queries.ts`                           |
| `lib/theme.ts`             | `lib/theme-queries.ts`                          |
| `lib/catalog.ts`           | `lib/catalog-queries.ts`                        |
| `lib/shipping.ts`          | `lib/shipping-queries.ts`                       |
| `lib/cart.ts`              | `lib/cart-server.ts`                            |
| `lib/customer.ts`          | `lib/customer-auth.ts`, `lib/customer-queries.ts` |
| `lib/orders.ts`            | `lib/order-queries.ts`                          |
| `lib/delivery.ts`          | `lib/delivery-queries.ts`                       |
| `lib/about.ts`             | `lib/about-queries.ts`                          |
| `lib/contact.ts`           | `lib/contact-queries.ts`                        |
| `lib/nav.ts`               | `lib/auth.ts`, `lib/password.ts`                |
| `lib/site-url.ts`          | `lib/email.ts`, `lib/order-emails.ts`           |

`lib/customer.ts` earns its place on the left: the checkout form and the sign-up
panel validate an email, a phone number and a password before submitting, and the
server validates the same way from the same module. `lib/auth-cookies.ts` is
stricter still — no imports at all, so `proxy.ts` can use it.

Query logic lives in the `*-queries.ts` modules rather than in `actions.ts` files.
Actions validate and orchestrate; `saveOrderAddress` sits in
`lib/customer-queries.ts` even though only checkout calls it, for that reason.

`lib/orders.ts` was split late and the failure is worth recording, because the
error message points nowhere near the cause. It held both the status labels and
`getOrderByToken`, so it imported Prisma. The moment a Client Component needed
`ORDER_TRANSITIONS` as a **runtime value**, the build failed with
`Module not found: Can't resolve 'dns'`, then `fs`, `net`, `tls` — Prisma being
dragged into the browser bundle. `import type` would have been erased and stayed
invisible; a real value is what exposes it. `lib/orders.ts` is now import-free and
the reads live in `lib/order-queries.ts`.

Note also that `lib/order-queries.ts` carries `generateOrderNumber` and
`generateAccessToken`, which look pure but are not: the first checks the database
for collisions, and both need `node:crypto`, which the browser cannot resolve
either.

The pure modules hold types, defaults, validation, and small helpers. If you add
a **runtime value** an admin form needs, it belongs on the left.

The per-section modules — `lib/why-choose-us.ts`, `lib/how-it-works.ts`,
`lib/reviews.ts`, `lib/gallery.ts`, `lib/promo.ts`, `lib/faq.ts` — are not split,
because their
forms need only types from them, and `import type` is erased at compile time so
Prisma never reaches the bundle. Split one the moment a form needs a real value
out of it.

Each follows the same shape: an id constant, a `Content` type, a `*_DEFAULTS`
object holding the content the site shipped with, a `get*Record()` returning the
row or `null`, and a `get*Content()` falling back to the defaults. The defaults
serve double duty as the seed source, so there is one copy of the original
content rather than two.

`lib/data.ts` is the original hard-coded content. It is still the source for the
sections listed below, and the seed script reads it to populate the database.

## Admin authentication

Three layers, because no single one is enough:

1. **`proxy.ts`** redirects anonymous browsers away from `/admin`. It only checks
   that the cookie *exists* — validating it would mean a database round trip on
   every request, and `proxy` cannot import Prisma. That is why `ADMIN_COOKIE`
   lives in `lib/auth-cookies.ts`, a module with no imports. The same file guards
   `/account`; see [Customer accounts](#customer-accounts).
2. **`app/admin/(panel)/layout.tsx`** validates the session for real, so an
   expired or forged cookie cannot render the panel.
3. **`requireAdmin()`** at the top of every admin Server Action. This is the one
   that matters: a Server Action is a POST endpoint and can be invoked without
   ever loading the layout. Authorisation has to sit next to the write.

The sign-in page is at `app/admin/login`, deliberately *outside* the `(panel)`
route group — sharing that layout would redirect the login page to itself.

Passwords use `scrypt` from `node:crypto`, stored as `salt:key` in hex, so there
is no native dependency to build. Session cookies hold a random token and only
its SHA-256 hash is stored, meaning a leaked database dump cannot be replayed as
a login. Cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.

Those primitives live in `lib/password.ts` and are shared with the customer
sign-in. `lib/auth.ts` re-exports `hashPassword` and `verifyPassword` so admin
callers, and `prisma/seed.ts`, keep one import.

Default credentials are `admin@admin` / `admin`, created by the seed on first run
and never reset afterwards. **Change them.** Note the change form enforces a
minimum of 8 characters, so it will not let you set the password back to `admin`
— the short default exists only to get you in the first time.

## Admin panel

Shared form furniture lives in `components/admin/`, not under `app/`, so the
login page and the panel can both use it.

Every editor follows the same three-file shape:

- `page.tsx` — Server Component, loads the record
- `*Form.tsx` — Client Component, `useActionState`
- `actions.ts` — `"use server"`, validates and writes

Shared form furniture is in `components/admin/ui.tsx`, and
`components/admin/form-state.ts` holds the `AdminFormState` every action returns.
`app/admin/sections.ts` drives both the sidebar and the index page, in three
groups: `ADMIN_OPERATIONS` (the shop's daily work), `ADMIN_SETTINGS`,
`ADMIN_CATALOGUE` and `ADMIN_SECTIONS`.

The order screens are the one exception to that shape. They edit no record, so
there is no `*Form.tsx`: `page.tsx` lists or shows, `StatusControls.tsx` posts a
transition, `ui.tsx` holds the badge and the date formatting shared by both, and
`actions.ts` is the same as everywhere else.

Patterns to copy rather than reinvent:

**A `"use server"` file may only export async functions.** Everything it exports
becomes a callable server reference, and an object cannot be one. Exporting an
`IDLE` constant beside the actions fails at runtime with *a "use server" file can
only export async functions, found object* — and because the navbar imports
`signOut`, one bad export in the account actions took down every storefront page,
not just the one being worked on. `export type` is fine, since types are erased.
That is why the idle state lives in `components/admin/form-state.ts` and
`app/(site)/account/form-state.ts` rather than next to the actions.

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

| Changed        | Revalidates                                                |
| -------------- | ---------------------------------------------------------- |
| Theme          | `revalidatePath("/", "layout")` — it is in the root layout  |
| Hero           | `revalidatePath("/")`                                      |
| Categories     | `revalidatePath("/", "layout")` — they are in the chrome    |
| Products       | `revalidatePath("/", "layout")` plus the product's own page |
| Occasions      | `revalidatePath("/")`                                      |
| Why choose us  | `revalidatePath("/")`                                      |
| How it works   | `revalidatePath("/")`                                      |
| Reviews        | `revalidatePath("/")`                                      |
| Gallery        | `revalidatePath("/")`                                      |
| Promo banner   | `revalidatePath("/")`                                      |
| FAQs           | `revalidatePath("/")` plus `revalidatePath("/faqs")`       |
| Store settings | `revalidatePath("/", "layout")` — footer and page titles    |
| Shipping       | nothing; only checkout reads it, and that is dynamic        |
| Order status   | `/admin/orders` and that order's own page — both dynamic     |
| Delivery dates | `revalidatePath("/admin/delivery")`; checkout is dynamic     |
| About          | `revalidatePath("/about")`                                  |
| Contact        | `revalidatePath("/contact")`                                |

The customer-facing account actions follow the same rule: those pages read the
session so they are dynamic already, and only the address mutations revalidate —
`revalidatePath("/account/addresses")`, because otherwise the list on screen stays
the one rendered before the save.

## Cart

The cart is a cookie holding **only product ids and quantities**. Prices, names
and availability are read from the database every time the cart is shown, and
again when an order is placed. A tampered cookie can change *what* you are buying
but never *what it costs* — verified: a cookie with an injected `price` field is
ignored.

Unlike the session cookie this one is deliberately readable by the browser. There
is nothing secret in it, and the client needs to write it so the header count
updates without a round trip.

| Piece                            | Role                                          |
| -------------------------------- | --------------------------------------------- |
| `lib/cart.ts`                    | Cookie format and pure reducers. Safe on both sides. |
| `lib/cart-server.ts`             | Reads the cookie, prices it from the database  |
| `components/cart/useCart.ts`     | Client store, backed by the cookie             |
| `app/api/cart/route.ts`          | Returns the priced cart to the browser         |

`hydrateCart` in `lib/cart-server.ts` is the single place a cart total is
calculated, and checkout uses the same function — so what the customer is shown
and what they are charged cannot drift apart.

Two decisions worth knowing:

**The cart is client-owned, not read in a layout.** A layout that reads cookies
forces every page to render per-request, and the landing page is prerendered. The
cost is that the server render does not know the cart, so the header badge only
appears once hydrated and the cart page shows "Loading" rather than guessing
"empty" — guessing would flash an empty cart at someone who has one.

**`useCart` is a `useSyncExternalStore`, not React state in a provider.** The
cookie genuinely is external state, and reading it on mount with an effect means
calling `setState` in an effect body, which the React Compiler rejects. Snapshots
are cached against the raw cookie string to stay referentially stable.

On the cart page, quantities render from the client store so the steppers respond
instantly, while prices come from the server. The totals shown there are display
arithmetic over server-supplied prices.

The cookie is capped at 30 lines and 20 per line, which worst-cases to about 2.3KB
— comfortably inside the ~4KB cookie limit. Anything unparseable, duplicated or
out of range is corrected rather than thrown, so a broken cookie cannot take the
site down.

Add-to-cart lives on the product page only. `ProductCard`'s bag icon is
decorative: the card uses a stretched link so the whole tile is one tab stop, and
putting a button inside that would add a second stop per tile.

## Checkout and orders

Guests can order; no account is needed, and an account only ever adds convenience
— see [Customer accounts](#customer-accounts). `/checkout` reads the cart cookie
**server-side** — unlike the cart page, which prices client-side — because
checkout is dynamic anyway and the summary the customer confirms should come from
the same data the order is built from.

`placeOrder` in `app/(site)/checkout/actions.ts` recalculates everything:

- the cart is re-read from the cookie and re-priced with `hydrateCart`
- the delivery fee is re-resolved with `resolveShippingFee` from the submitted
  PSGC codes
- the delivery date is re-checked and its surcharge recalculated with
  `resolveDelivery` — see [Delivery dates](#delivery-dates)

Nothing about money is read from the form. Verified: posting `subtotal`, `total`,
`shippingFee` and `rushFee` alongside a valid order changes none of them.

An order total is therefore `subtotal + shippingFee + rushFee`, all whole pesos and
all decided server-side.

`OrderItem` copies the product name, slug, image and unit price at the time of
purchase. The relation to `Product` is `onDelete: SetNull`, so deleting a product
does not destroy order history. Verified: changing a product's price afterwards
leaves the recorded `unitPrice` untouched.

**Order numbers and access tokens are different things, on purpose.**

`orderNumber` is short and readable — `KS-260805-K7F3` — because customers quote
it when paying manually. Its alphabet leaves out `I L O U 0 1`, the characters
people misread when reading one out. Being short also makes it guessable, and the
confirmation page shows a name, phone number and home address. So the page is
keyed on `accessToken`, a 48-character random hex string, and `/orders/<number>`
404s. Verified both ways.

Orders start at `PENDING_PAYMENT`. For manual payment the confirmation page shows
the store's QR code, the order number, and a link to the Facebook page — all from
`/admin/store`. A QR code is optional: without one, manual payment still works off
the order number and the Facebook page, so the store is never left with no way to
take an order.

## Customer accounts

Accounts are optional and always were. All one adds is a saved address, an order
history, and not retyping contact details — checkout works exactly as before
without one, which is the constraint everything here is built around.

`lib/customer-auth.ts` is a deliberate **mirror** of `lib/auth.ts` rather than a
generalisation of it. Separate table, separate cookie, separate functions, so a
customer session has no path by which it could satisfy an admin check. What the
two do share is the crypto: `lib/password.ts` holds `hashPassword`,
`verifyPassword`, `hashToken` and `generateSessionToken`, and both import it, so
there is one copy of the scrypt parameters instead of two that can drift.

Customer sessions last 60 days against the admin's 7. The point of signing in is
to stop retyping an address, and being logged out weekly defeats that; the session
grants nothing but the customer's own history.

**Sign-in takes either the email or the phone number.** One field, and the `@`
decides which column to search — that test is routing, not validation, and a
mistyped value simply matches nothing. Both columns are therefore unique.

The phone is stored twice. `Customer.phone` is what the customer typed, for
display; `Customer.phoneKey` is normalised and is what sign-in looks at. Nobody
remembers whether they wrote `0917 123 4567`, `+639171234567` or `9171234567`, so
`normalizePhone` in `lib/customer.ts` strips punctuation, folds an international
`63` prefix back to the local `0`, and restores a missing trunk `0` on a 10-digit
mobile. Verified: all four of those shapes resolve to one key.

### Three layers, again

Same shape as the admin, for the same reasons:

1. **`proxy.ts`** now guards both areas. It branches on the path prefix and
   redirects to `/admin/login` or `/account/login` accordingly, still on cookie
   *presence* only. `CUSTOMER_COOKIE` sits beside `ADMIN_COOKIE` in
   `lib/auth-cookies.ts`, the module with no imports.
2. **`app/(site)/account/(dashboard)/layout.tsx`** validates the session for real.
   It is a route group so `/account/login` and `/account/register` fall outside it
   — sharing that layout would redirect the login page to itself, which is why
   `/admin/login` sits outside `(panel)` too.
3. **`requireCustomer()`** at the top of every account Server Action.

Beyond authentication there is authorisation, and it is the part that would be
easy to get wrong. Every query is scoped by `customerId`, and writes use
`updateMany`/`deleteMany` with the customer id **in the filter** rather than
`update` by primary key. `update` would need a separate ownership read first, and
forgetting that read is exactly how one customer edits another's address. Verified:
an `addressId` submitted with somebody else's session matches zero rows and the
row is left untouched.

### The navbar knows without making the site dynamic

`/` is prerendered, and a layout that reads cookies would make every page render
per-request. So the site layout does **not** read the session. `AccountMenu` asks
`/api/account/me` from the browser instead, backed by
`components/account/useAccount.ts` — a `useSyncExternalStore`, the same pattern
and the same justification as the cart.

Two consequences worth knowing:

- The icon renders nothing until the first lookup lands. Showing "Sign in" while
  still loading would flash the wrong thing at someone already signed in, so
  `status` distinguishes "loading" from "signed out" and the space is held either
  way.
- **No account action redirects from the server.** They set the cookie and return.
  The store caches who is signed in, so the browser has to call `refreshAccount()`
  and *then* navigate; a `redirect()` would land on the next page with the header
  still offering to sign you in. Every form here does those two in that order.

`getServerSnapshot` returns a fixed constant rather than the live module state.
Module state is shared across requests on the server, so returning it could render
one visitor another's name.

### Checkout

Signed in, `/checkout` reads the session **server-side** and renders from it, so
prefilled contact details and the preselected default address are in the first
paint rather than fetched afterwards. Checkout is dynamic anyway.

`placeOrder` takes `customerId` from the session cookie and never from the form. A
hidden field would let anyone write an order into somebody else's history.

The saved-address select fills the address fields and leaves contact alone.
Editing any address field by hand switches the select back to "Somewhere else…",
so what is shown always matches what will be submitted.

With "Keep this address on my account" ticked, `saveOrderAddress` files it
afterwards — after the order row exists and in its own `try`, so a failure there
cannot cost an order the customer has already confirmed. It skips an address
already on file, keyed on street, barangay and city; without that, ordering to the
same place three times would leave three identical entries in the picker. The first
address saved becomes the default, because there is nothing else to preselect.

### The sign-up panel

Offered mid-checkout, prefilled from the email and phone number already typed.
Three things make it work:

- **`signUp` does not redirect.** A navigation would throw away the address just
  filled in.
- **It is a native `<dialog>` opened with `showModal()`**, which brings the focus
  trap, Escape handling, inert background and backdrop for free.
- **It is rendered outside the checkout `<form>`.** `showModal` promotes the
  element in the top layer but not in the DOM, and a form inside a form is invalid
  HTML that browsers resolve by dropping the inner one.

Contact inputs on the checkout form are controlled rather than left to the DOM, so
the dialog follows a later correction instead of snapshotting whatever was there
when it opened.

### A guest order stays a guest order

Signing up later with the same email does **not** claim past guest orders. Nothing
verifies an email address here, so back-linking on one would let anybody read a
stranger's name, phone number and home address by registering with their email.
The order placed *during* the checkout sign-up is linked, which covers the case
people actually care about.

`CustomerAddress` holds no recipient name or phone, deliberately. `Order` carries
one set of contact details and has nowhere to put a second, so storing a recipient
would be a field that looks meaningful and reaches nothing.

## Payments

Two methods, both recorded on `Order.paymentMethod`.

**Manual.** The confirmation page shows the store's QR code (if uploaded), the
order number, and a link to the Facebook page. Nothing automated — an admin
confirms it. Works with no QR code at all, so the store is never left unable to
take an order.

**PayMongo QR Ph.** `lib/paymongo.ts` follows the documented Payment Intent flow:
create an intent with `qrph` allowed (secret key), create a `qrph` payment method
(public key), attach it (public key), then read the code from
`next_action.code.image_url`. It comes back as a base64 data URL, which is stored
on the order so the page does not re-call the API on every view. Codes are
single-use, carry the exact amount, and expire after 30 minutes.

The QR is created **after** the order row exists, so a PayMongo outage cannot lose
an order the customer already confirmed. If it fails they land on the confirmation
page and can generate the code from there.

### The webhook

`app/api/paymongo/webhook/route.ts`, in this order:

1. Read the **raw** body. Parsing first changes the bytes and breaks the signature.
2. Verify `Paymongo-Signature`. A bad signature gets a 401 and is not acknowledged.
3. Insert the event id into `WebhookEvent`. PayMongo retries up to 12 times, so a
   unique-key violation here means "already handled" — that is what stops an order
   being marked paid twice.
4. Only then act.

Everything past step 2 returns 2xx, including unrecognised event types. A 4xx or
5xx makes PayMongo retry, which would just pile up the queue.

Two guards worth knowing about, both verified:

- **The amount is checked.** An event claiming a smaller amount than the order
  total is acknowledged and ignored rather than marking it paid.
- **`livemode` must match the key mode.** In practice a mismatched event fails the
  signature check first, because test keys are verified against the `te` slot and
  live keys against `li` — so this is a second line rather than the only one.

PayMongo's guidance is to acknowledge immediately and process in a worker. There is
no queue here and the work is one indexed update, so it runs inline, well inside
the 30-second window. Revisit if that grows.

`verifyWebhookSignature` accepts both the documented "HMAC of the raw body" form
and the `t=<ts>,te=<sig>,li=<sig>` form where the signed value is `<ts>.<body>`,
because PayMongo's own docs describe the first while the header has historically
been the second. Every branch still requires a real HMAC with the endpoint secret,
so accepting both widens nothing.

**The webhook cannot reach a local machine.** Register the endpoint in the PayMongo
dashboard against a public HTTPS URL, or tunnel with something like ngrok. That is
why the confirmation page also has an "I have paid — check now" button, which polls
the intent directly — the documented alternative to webhooks, and the only way to
complete a payment locally.

## Admin orders

`/admin/orders` lists every order, newest first. `/admin/orders/<id>` is one order
in full and is where a manual payment is confirmed.

The list is keyed on the order **id**, not the access token. That is safe here and
wrong on the storefront: the token exists because the customer-facing page is
reachable by anyone holding the URL, whereas everything under `/admin` is behind
`requireAdmin()`. The detail page links out to the customer's own confirmation page
so the florist can see exactly what the customer sees.

Filtering, search and pagination are plain links and a `GET` form, so the whole
screen works with no client JavaScript and every view is a shareable URL. Search
covers the order number, name, email and phone, case-insensitively — a customer
quoting `ks-260805-k7f3` in lower case should still be found. Pagination is offset
based rather than cursor based, because the admin needs a total and the ability to
jump pages, and a florist's order table will not reach the depth where `OFFSET`
hurts. The count and the rows are built from one shared `where` clause, so the
total can never disagree with what it is counting.

### Status is a state machine, not a free-form field

`ORDER_TRANSITIONS` in `lib/orders.ts` says which moves are legal:

| From              | To                                          |
| ----------------- | ------------------------------------------- |
| `PENDING_PAYMENT` | `PAID`, `CANCELLED`                         |
| `PAID`            | `FULFILLED`, `PENDING_PAYMENT`, `CANCELLED` |
| `FULFILLED`       | `PAID` — the undo, nothing else             |
| `CANCELLED`       | `PENDING_PAYMENT` — reopen                  |

The buttons render from that map, and `setOrderStatus` checks it again. Both, not
either: a Server Action is a POST endpoint that never loads the admin layout, so
the page only decides what is *offered*. Verified — a crafted request asking for
`PENDING_PAYMENT → FULFILLED` is refused and the row is untouched, and every
attempt without a session cookie is refused by `requireAdmin()`.

Every status can be left, so no order can get stuck, but backwards moves are one
step rather than arbitrary. `FULFILLED` deliberately cannot go straight to
`CANCELLED`: the bouquet has gone out, so the honest correction is to step back to
`PAID` and decide from there.

Two fields are managed rather than merely set:

- **`paidAt` is written once.** It records when money actually arrived, so
  fulfilling an order and undoing that does not move it. Only stepping back to
  `PENDING_PAYMENT` clears it, which is the one case where the payment is being
  declared not to have happened. Without this, a mis-click could overwrite the
  timestamp of a real payment.
- **The QR code is cleared** on leaving `PENDING_PAYMENT`, because a spent code
  left on the row would have the confirmation page keep offering it.

Marking a `PAYMONGO_QRPH` order paid by hand is allowed but warned about on the
page, since the webhook normally settles those and doing it manually means
asserting the money arrived without PayMongo saying so.

## Email

One provider, one endpoint: `POST https://api.resend.com/emails`, called with
`fetch` from `lib/email.ts`. No SDK, matching how `lib/paymongo.ts` talks to
PayMongo — the entire surface used is a single POST.

`lib/email.ts` puts a message on the wire; `lib/order-emails.ts` decides what the
messages say. Two rules hold in the first:

- **It never throws into its caller.** Every function returns a result. An order
  that has been placed must not be lost because a mail provider had a bad minute.
- **It never blocks indefinitely.** Requests are bounded at eight seconds by
  `AbortSignal.timeout`, so a hanging Resend call cannot stall a checkout.

### When it sends

Placing an order sends two: a confirmation to the customer and an alert to
`CONTACT_TO_EMAIL`. Both are scheduled with `after()` from `next/server` rather
than awaited, so nobody waits on a mail provider to be told their order went
through.

`after` is the right tool rather than a dangling promise: it survives the response
being sent on serverless, where an unawaited promise is killed, and it still runs
when the action ends in a `redirect()` — which `placeOrder` does. The callback has
its own `try`/`catch` on top of that.

The two messages are sent with `allSettled` because they are independent, and in
the default configuration the customer's genuinely fails while the store's
succeeds. That must not be reported as a broken order.

### The markup

Inline styles and a table for the outer frame, because mail clients strip `<style>`
blocks and Outlook still lays out with tables. A plain-text alternative is always
built: some clients prefer it, and a message with no text part scores worse with
spam filters.

**Every interpolated value is escaped.** All of it comes from a customer — name,
street, delivery notes — and the store's alert is opened in the owner's mail
client, which makes a delivery note the natural place to try a script tag.
Verified: `<script>`, an `onerror` image and a quote-breakout in the notes all come
through inert, while the text part keeps its raw characters because it is not
markup.

The customer's link is `/orders/<accessToken>`, never the order number, for the
same reason the page itself is — the number is short enough to guess and the page
shows a home address.

The palette is hard-coded from `THEME_DEFAULTS` rather than read from the `Theme`
row, because email cannot use custom properties. Recolouring the site therefore
does not recolour these.

### The sandbox limit, which will catch you out

Resend sends from a domain you own, and until one is verified **the only recipient
it accepts is the address on the Resend account**. So with `EMAIL_FROM` left at the
default `onboarding@resend.dev`:

- the store alert to `CONTACT_TO_EMAIL` arrives, and
- the customer's confirmation is rejected, visible only as a line in the server log

Confirmed against the live API, which answers with exactly that. Verify a domain
and point `EMAIL_FROM` at an address on it before this is any use to customers —
see https://resend.com/docs/add-a-domain.

Also set `SITE_URL`. `lib/site-url.ts` falls back to `VERCEL_URL` and then to
localhost, so without it a production email either carries an ugly per-deployment
hostname or a link to the recipient's own machine.

## Addresses and shipping

Addresses are built from the Philippine Standard Geographic Code via
[psgc.cloud](https://psgc.cloud) — no key or sign-up. Region, province and
city/municipality come from the API; barangay, street and postal code are plain
text.

`lib/psgc.ts` wraps the upstream API and `app/api/psgc/route.ts` exposes it to the
browser. Going through our own route rather than calling psgc.cloud from the
client keeps their "please cache" request honoured in one place: every call sets
`revalidate` to a day, which is right for data that only changes on PSA release
cycles.

Three upstream quirks are handled in `lib/psgc.ts`, and are the reason the wrapper
exists at all:

- **Not every region has provinces.** NCR returns an empty array, so
  `LocationPicker` hides the province select and loads cities from the region.
- **`zip_code` is often blank** — 7 of 17 NCR cities have one. That is why the
  postal code field is prefilled "whenever possible" rather than derived, and
  stays editable.
- **The `province` field on city payloads is wrong for NCR** (it says
  "Sarangani"), so it is ignored entirely.

Sub-municipalities are filtered out. They are districts of Manila, and listing
"Tondo I/II" beside "City of Manila" makes the choice ambiguous for the customer
and for the shipping rate keyed off it. Barangay covers that detail.

`components/ui/LocationPicker.tsx` is the shared cascading select. It submits both
codes *and* names, so an order or saved address stays readable without calling the
API again, and historical records do not shift if upstream renames something. Each
list is cached against the query that produced it and the visible options are
derived from whether that key still matches — that is what keeps stale options
from flashing without clearing state inside an effect, which the React Compiler
rejects.

`LocationPicker` takes a `required` prop, defaulting to true. It is false in the
"add a rate" section of `/admin/shipping`, and that matters more than it sounds:
the section is empty most of the time, and marking its selects required made an
untouched picker silently block **every** save on that page, including toggling the
flat rate. There is no browser message pointing at a control the admin was not
using. Callers that pass `required={false}` validate on the server instead.

Shipping fees resolve in `resolveShippingFee` (`lib/shipping.ts`):

1. a rate for the selected city/municipality
2. otherwise a rate for the region
3. otherwise the flat rate

Disabled shipping short-circuits to zero with `basis: "DISABLED"`, and **every
surface then leaves the delivery line out entirely rather than printing "Free"** —
the cart, checkout, the confirmation page, the order emails and the admin order
detail all check for it. "Free" advertises a concession that was never on offer and
invites the question of when it stops being free. `Order.shippingBasis` is what a
stored order is judged by, since the setting may have changed since.

That ordering is the point of the table:
a region can be priced broadly and individual cities corrected without unpicking
anything. `ShippingRate` stores the PSGC code, the scope (`REGION` or `CITY`), and
the name at the time it was added.

Deleting a rate is its own action and takes effect immediately, rather than a
checkbox that only applies on save. The old scheme paired removals to rows by array
index — `rateRemove-<index>` had to line up with the order the `rateId` inputs were
submitted in — which was fragile for no benefit. The button cannot be its own
`<form>`, because the row sits inside the settings form and nested forms are invalid
HTML, so it is a `type="button"` calling the Server Action directly with a
hand-built `FormData`. That also means it sends exactly its own row's id.

## Delivery dates

Customers pick a day at checkout from a calendar the shop controls, and a date
close enough to disrupt the week carries a surcharge. Configured in
`/admin/delivery`.

### Dates are strings, and that is the whole design

`lib/delivery.ts` speaks `YYYY-MM-DD` everywhere. Never `Date`.

A `Date` is an instant; a delivery date is not. It is a day on a calendar hanging
in a shop in Pasig City. Mixing the two is how a bouquet arrives a day late: the
server runs in UTC, the shop is UTC+8, so an order placed at 9pm Manila on the 6th
is "the 5th" to a naive `new Date()`.

Three rules keep that from happening:

- **The current day comes from `todayInShopZone()`**, which formats the instant in
  `Asia/Manila` via `Intl.DateTimeFormat().formatToParts()`. Parts rather than
  slicing a locale string, because locale output is not a format to parse — `en-CA`
  happens to produce ISO order and is not promised to keep doing so.
- **Arithmetic runs on UTC getters.** `parseIsoDate` builds a `Date` at UTC
  midnight, and every helper reads it back with `getUTC*`, so it behaves the same
  on every machine.
- **`today` is always passed down from the server.** The admin calendar, the
  checkout picker and `placeOrder` all receive it. A customer in another timezone
  should see the shop's idea of tomorrow, and a wound-back clock must not buy a
  same-day slot.

`Order.deliveryDate` and `DeliveryDateException.date` are `@db.Date`, not
timestamps. `lib/delivery-queries.ts` is the only place those become strings and
back. Verified: a date written and read through Postgres lands on the same day.

### What decides whether a day is available

`describeDay`, in this order:

1. the past — never
2. inside the lead time — "we need at least N days' notice"
3. beyond the booking window — "too far ahead to book yet"
4. an explicit `DeliveryDateException` for that day, either direction
5. otherwise the weekly pattern, `closedWeekdays`

Steps 1 to 3 come first on purpose. **An exception can open a day the weekly
pattern closes, but it cannot open a day inside the lead time, in the past, or
beyond the window.** Those are hard limits rather than preferences, and letting a
one-off opening beat them would sell same-day orders the shop has said it cannot
build. All three verified.

Closures and openings share one table, keyed on `isOpen`. A holiday closure and a
one-off Sunday opening are the same kind of fact about the same day, and two tables
would let a date appear in both with no defined winner. `date` is unique for the
same reason.

### The rush fee

`resolveDelivery` is the only place it is decided. The checkout form calls it for
the live figure and `placeOrder` calls it again on the server, so the number shown
and the number charged come from one function.

Rushed means `daysAhead <= rushWithinDays`, counting today as 0 — so the default
`1` surcharges today and tomorrow. A `rushFee` of 0 switches it off without
touching the window.

The surcharge is printed on the day itself in the calendar (`+50`) rather than only
in the total, so the cost is visible before choosing instead of appearing as a jump
afterwards.

`placeOrder` takes a date from the form and nothing else — not whether it is
available, and not what it costs. Verified: posting `rushFee: 0`, `subtotal: 1` and
`total: 1` alongside a valid rush-date order stored ₱50, ₱7,360 and ₱7,410. Past,
out-of-window, blank and malformed dates are all refused. Re-checking also catches
the honest case: the admin closing a day while somebody had checkout open on it.

### The calendar component

`components/ui/MonthCalendar.tsx` lays out a month and steps between them, and asks
the caller what each day looks like through a `dayState(iso)` function. Day state is
a callback rather than props because the two screens want opposite things: checkout
greys out what cannot be picked, while the admin needs to **click a closed day** to
reopen it. Built here rather than pulled from a date-picker library because the hard
part is the shop's rules, not the grid, and a library would need all of them
expressed as callbacks anyway.

### Closing a day that already has orders

`setDeliveryException` counts the non-cancelled orders already booked for a day and
says so in the success message, but does not refuse. A shop may genuinely need to
close a day it has taken orders for — a typhoon, a burst pipe — and refusing would
leave them editing the database by hand. It must not happen silently, though, so
the count and a prompt to contact those customers come back with the confirmation.
The admin calendar also shows the booked count on each day.

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

`Newsletter` is the last section with its copy inline — the heading, blurb and
small print are in the component. Its form does write to the database.

`lib/data.ts` now exports only one thing the app still uses at runtime:
`formatPrice`, a helper rather than content. Everything else in that file
(`BRAND`, `BUSINESS_HOURS`, `CATEGORIES`, `FEATURED_PRODUCTS`, `BEST_SELLERS`,
`OCCASIONS`, `REVIEWS`, `GALLERY_IMAGES`, `FAQS`, `WHY_CHOOSE_US`,
`HOW_IT_WORKS`) is read only by `prisma/seed.ts`.

## Known gaps

- **The default admin password is `admin`.** Fine for first sign-in, not for a
  deployment. There is no prompt forcing a change yet.
- **No rate limiting on sign-in, admin or customer.** Passwords are hashed with
  scrypt, which is slow by design, but nothing throttles repeated attempts. The
  customer sign-in is worse off than the admin one: it is linked from the navbar
  on every page, and `/account/register` is an unauthenticated public endpoint that
  writes to the database. Throttle both before this is live.
- **Nothing verifies a customer's email or phone number.** No confirmation link,
  no SMS code. This is why signing up does not claim matching guest orders — see
  [Customer accounts](#customer-accounts) — and it is the first thing to fix if
  accounts are ever to carry more than a saved address.
- **No password reset.** A customer who forgets theirs has no way back in, because
  a reset needs email delivery and nothing here sends email. They can still order
  as a guest, so this locks them out of their history rather than the shop.
- **Sign-up confirms whether an email is already registered.** The alternative is
  telling someone their sign-up worked when it did not, which is worse. Sign-*in*
  gives one message for a missing account and a wrong password alike, so that path
  does not leak.
- **Customers have no admin screen.** Orders show whether one was placed by an
  account and name it, but there is no customer list, no way to reset a password and
  no way to close an account from `/admin`. Read the rows with `npx prisma studio`.
- **No admin screen edits an order.** Statuses move, but a wrong address, a typo in
  a phone number or a changed quantity cannot be corrected — that has to go through
  `npx prisma studio`. Editing money would also need a rule about what happens to a
  PayMongo intent already issued for the old total.
- **Nothing is audited.** An order's status history is not recorded, so there is no
  way to see who marked something paid or when it was cancelled. Only the current
  status and `paidAt` survive.
- **Closing an account is not offered.** The cascades are in place and verified,
  but nothing in the UI calls them.
- **The flat shipping rate is a placeholder.** Nothing in the original site
  charged for delivery, so ₱150 is a starting figure, not migrated content. No
  location rates are seeded, so every address falls to the flat rate until real
  ones are set in `/admin/shipping`.
- **`/api/psgc` is public and unauthenticated.** It only serves public reference
  data and is cached for a day, so the upstream API is shielded, but the route
  itself has no throttle.
- **PSGC data is community-maintained.** psgc.cloud mirrors the official PSGC but
  is not the PSA. Verify anything that matters for delivery boundaries.
- **The newsletter only stores addresses.** No sending, no double opt-in, no
  unsubscribe, and no admin screen — deliberately, until someone decides what it
  is for. Read the rows with `npx prisma studio` or the Supabase table editor.
  Before it is used for anything, it needs confirmed opt-in and an unsubscribe
  path, and the subscribe action needs rate limiting: it is the one public
  endpoint that writes to the database, so today it can be flooded.
- **Replaced images are not deleted from Storage.** Swapping a photo uploads the
  new file and repoints the row, leaving the old object behind.
- **Product descriptions are placeholders.** `lib/data.ts` never had any, so the
  blurbs in `prisma/seed.ts` were written to give the detail pages something to
  render. They are not real copy.
- **Ratings and review counts are decorative.** `Product.rating` and
  `Product.reviewCount` are editable numbers with nothing behind them, and the
  `Review` rows are curated quotes rather than submissions. Real reviews would
  mean a table keyed on `Product` and deriving those two figures from it.
- **The gallery has no real Instagram link.** `GallerySection.ctaHref` is seeded
  as `#gallery`; set the actual profile URL in `/admin/gallery`.
- **The webhook endpoint is not registered.** Nothing has been created in the
  PayMongo dashboard yet, so in production payments would only be confirmed by the
  "check now" button. Register it before going live.
- **Nothing tells the customer their order moved on.** Marking an order paid or
  fulfilled changes the confirmation page but sends no email, so a manual-payment
  customer has to check the link to learn they are confirmed. The machinery is all
  there — `sendEmail` and an `after()` hook in the status action would do it — it
  just has not been wired, because the copy for "paid" and "on its way" has not been
  written.
- **`qrph.expired` is acknowledged but ignored.** An expired code leaves the order
  awaiting payment, which is recoverable from the page, but nothing reacts to the
  event itself.
- **Only the happy path was exercised against PayMongo.** A real QR was generated
  with test keys, but no code has actually been scanned and paid, so the
  `payment.paid` handling was proven with synthetic signed events rather than a
  genuine delivery. Confirm the signature format against a real one.
- **No domain is verified with Resend, so customers get no email.** The order
  confirmation is built, sent and escaped correctly, but Resend refuses every
  recipient except the account's own address until `EMAIL_FROM` sits on a verified
  domain. Until then the confirmation page is still the only receipt the customer
  has. This is one DNS change away and is the highest-value thing left.
- **A failed email is only a log line.** There is no retry, no dead-letter record,
  and nothing in the admin panel showing whether an order's mail went out. If
  Resend is down for a minute, those confirmations are simply gone.
- **The emails have not been opened in a real mail client.** The markup is
  table-based and inline-styled for that reason, and one live send was delivered,
  but nobody has looked at it in Gmail, Outlook or on a phone.
- **Order search has no index behind it.** `contains` on four columns is a
  sequential scan. Fine at a florist's volume, worth revisiting — as a trigram or
  full-text index — if the table grows into five figures.
- **Nothing paginates the customer's own order history.** `/account/orders` takes
  the most recent 50 and stops.
- **The delivery city is taken on trust.** The fee is resolved from the submitted
  PSGC code, and a customer could pick a cheaper city than the one they actually
  live in. The mismatch is visible in the address on the order, but nothing
  cross-checks it.
- **The cart's and checkout's interactive parts are not browser-tested.** Pricing,
  validation, tamper-resistance and both render branches of checkout are covered
  server-side, but the steppers, badge, hydration, cascading address selects, the
  account dropdown and the sign-up dialog have been reasoned about rather than
  clicked. The dialog in particular relies on native `showModal()` behaviour that
  is worth confirming with a keyboard and a screen reader.
- **Placing an order was not driven end to end through the browser.** The
  address-saving and de-duplication path is verified directly, and the render of
  both signed-in and guest checkout is verified over HTTP, but no order has been
  submitted through the real Server Action while signed in. Server Action ids are
  not addressable from a plain HTTP client, so this needs a browser or a real
  end-to-end runner. `setOrderStatus`, `signUp` and `signIn` *were* each driven
  through their real implementations from a temporary Route Handler, which is the
  workaround when this comes up again.
- **A saved address cannot name a different recipient.** Bouquets are usually sent
  to someone else, but `Order` carries one set of contact details, so that needs a
  recipient on the order before it can mean anything on the address.
- **There is no per-day capacity limit.** A day is open or closed; nothing caps how
  many bouquets can be booked for one date. The admin calendar shows the count so it
  can be watched, and a day can be closed by hand once it is full, but nothing stops
  the twentieth order for a Saturday. A `maxOrdersPerDay` on `DeliverySettings` and a
  count check in `describeDay` would do it — but `describeDay` is pure and
  synchronous, so the counts would have to be loaded and passed in.
- **No same-day cut-off time.** Delivery dates are days with no time of day, as
  asked for, so an order placed at 11pm can still choose that same day if the lead
  time is 0. The announcement bar already promises same-day "before 1:00 PM", so the
  two disagree. Either set the lead time to 1 or add a cut-off hour, after which
  today stops being selectable.
- **Nothing reacts to a closure after the fact.** Closing a day warns that orders
  are already booked for it, but those orders keep their date and nobody is emailed.
  Rearranging is a phone call.
- **The delivery date cannot be changed after ordering.** Not by the customer and
  not by the admin — it needs the order-editing screen that does not exist yet.
- **The calendar has not been keyboard- or screen-reader-tested.** It is a grid of
  real buttons with `aria-pressed`, disabled states and labelled reasons, and the
  month heading is announced, but arrow-key navigation between days is not
  implemented and none of it has been driven with assistive technology.
- **Two categories have no products.** Graduation and Money Bouquets, because the
  original hard-coded data had none. They render an empty state.

## Search

The navbar's search icon opens a full-screen overlay (`components/layout/Navbar.tsx`).
Input is debounced (300 ms) and fetches `/api/search?q=<term>`, which returns up to
5 products and 5 categories whose `name` matches case-insensitively via Prisma
`contains`. Results link directly to the product detail page or the filtered
catalogue. The overlay closes on Escape, a backdrop click or navigating to a result.

The route is `no-store` and carries no auth — product and category names are already
public. It does not paginate; the cap of 5 keeps the query trivially fast.

## Price filter

`/products` accepts an optional `?price=<min>-<max>` search param alongside the
existing `?category=<slug>`. The ranges exposed in the UI are:

- 1–500, 501–1000, 1001–1500, 1501–2000, 2001+

Filtering is done in-memory on the server after `listProducts()` returns, which is
fine at catalogue scale. The `PriceFilter` client component
(`app/(site)/products/PriceFilter.tsx`) renders a `<select>` that updates the URL
via `router.push`, preserving the category param.

## About and Contact pages

Two standalone singletons (`AboutSection`, `ContactSection`) following the same
pattern as the other sections: a pure module (`lib/about.ts`, `lib/contact.ts`)
with the id, type and defaults, and a `*-queries.ts` module that reads the database.

`/about` renders the image prominently alongside body paragraphs. `/contact`
displays:

- email — read from `process.env.CONTACT_TO_EMAIL`, not the database
- phone and address — from `ContactSection`
- a simple `mailto:` form
- an optional Google Maps iframe (admin sets the embed URL)

Admin panels at `/admin/about` and `/admin/contact` follow the three-file pattern.

## Custom logo

`StoreSettings` gained three nullable columns: `logoUrl`, `logoWidth`, `logoHeight`.
When `logoUrl` is set, the `Logo` component (`components/ui/Logo.tsx`) renders a
`next/image` at the specified pixel dimensions instead of the inline SVG + text
mark. The admin uploads the file in `/admin/store` (Logo section), and can remove it
to revert to the default. Both the navbar and footer receive the logo data through
the site layout.

`storeName` still lives in settings and is used for the accessible `aria-label`
and page titles regardless of which visual form is shown.
