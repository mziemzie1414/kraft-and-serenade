/**
 * Runtime check against a running server: confirms the page renders, that every
 * referenced image resolves through the Next image optimizer, and that every
 * in-page anchor target actually exists in the markup.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3111";

const res = await fetch(BASE);
const html = await res.text();
console.log(`GET / -> ${res.status} (${(html.length / 1024).toFixed(0)} KB of HTML)`);
if (!res.ok) process.exit(1);

/* ---------- 1. Images ---------- */
const srcSet = new Set();
for (const match of html.matchAll(/(?:src|srcSet|srcset)="([^"]+)"/g)) {
  for (const candidate of match[1].split(",")) {
    const url = candidate.trim().split(/\s+/)[0];
    if (url.startsWith("/_next/image") || url.startsWith("/images/")) {
      srcSet.add(url.replaceAll("&amp;", "&"));
    }
  }
}

const imageFailures = [];

/**
 * Image optimization is CPU-bound, so hammering the server with 500+ parallel
 * requests exhausts sockets and reports false negatives. Walk a bounded pool
 * instead, with one retry per URL.
 */
async function checkWithPool(urls, limit, check) {
  const queue = [...urls];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const item = queue.pop();
      if (item === undefined) break;
      await check(item);
    }
  });
  await Promise.all(workers);
}

await checkWithPool([...srcSet], 6, async (path) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const r = await fetch(new URL(path, BASE));
      const type = r.headers.get("content-type") || "";
      if (!r.ok || !type.startsWith("image/")) {
        imageFailures.push(`${r.status} ${type} ${path}`);
      }
      return;
    } catch (err) {
      if (attempt === 2) imageFailures.push(`ERR ${err.message} ${path}`);
    }
  }
});

console.log(`\nimage requests checked : ${srcSet.size}`);
console.log(`image failures         : ${imageFailures.length}`);
imageFailures.forEach((f) => console.log("  " + f));

/* ---------- 2. Public asset files referenced by the app ---------- */
const publicRefs = new Set();
for (const match of html.matchAll(/%2F|\/images\/[A-Za-z0-9._/-]+\.(?:jpg|svg|png)/g)) {
  if (match[0].startsWith("/images/")) publicRefs.add(match[0]);
}
// Also pull the decoded originals out of the optimizer URLs.
for (const path of srcSet) {
  const url = new URL(path, BASE);
  const original = url.searchParams.get("url");
  if (original?.startsWith("/images/")) publicRefs.add(original);
}

const publicFailures = [];
await Promise.all(
  [...publicRefs].map(async (path) => {
    const r = await fetch(new URL(path, BASE));
    if (!r.ok) publicFailures.push(`${r.status} ${path}`);
  })
);
console.log(`\npublic assets checked  : ${publicRefs.size}`);
console.log(`public asset failures  : ${publicFailures.length}`);
publicFailures.forEach((f) => console.log("  " + f));

/* ---------- 3. Anchor targets ---------- */
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const anchors = new Set(
  [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((a) => a.length > 0)
);
const danglingAnchors = [...anchors].filter((a) => !ids.has(a));

console.log(`\nanchor links found     : ${anchors.size}`);
console.log(`dangling anchors       : ${danglingAnchors.length}`);
danglingAnchors.forEach((a) => console.log("  #" + a));

/* ---------- 4. Required section presence ---------- */
const requiredIds = [
  "top", "featured", "best-sellers", "occasions", "shop-by-category",
  "about", "how-it-works", "reviews", "gallery", "promo", "faqs",
  "newsletter", "contact",
];
const missingSections = requiredIds.filter((id) => !ids.has(id));
console.log(`\nmissing sections       : ${missingSections.length}`);
missingSections.forEach((s) => console.log("  #" + s));

/* ---------- 5. Category anchor targets from the Products dropdown ---------- */
const categoryAnchors = [...anchors].filter((a) => a.startsWith("category-"));
console.log(`\ncategory anchors       : ${categoryAnchors.length} unique`);
const missingCategoryTargets = categoryAnchors.filter((a) => !ids.has(a));
console.log(`missing category ids   : ${missingCategoryTargets.length}`);
missingCategoryTargets.forEach((s) => console.log("  #" + s));

const totalProblems =
  imageFailures.length +
  publicFailures.length +
  danglingAnchors.length +
  missingSections.length +
  missingCategoryTargets.length;

console.log(`\n=== ${totalProblems === 0 ? "ALL CHECKS PASSED" : totalProblems + " PROBLEM(S)"} ===`);
process.exit(totalProblems === 0 ? 0 : 1);
