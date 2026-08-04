/**
 * Downloads the royalty-free Unsplash photos used by the storefront into `public/images/**`.
 * Every id in this manifest was visually checked so the subject matches the label it is used for.
 * Run with: node scripts/download-assets.mjs
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_IMAGES = join(ROOT, "public", "images");

/** @type {{ file: string, id: string, w: number, h: number, note: string }[]} */
const manifest = [
  // ---------- Hero ----------
  { file: "hero/hero-bouquet.jpg", id: "photo-1487530811176-3780de880c2d", w: 2000, h: 1333, note: "lush mixed bouquet held in hands" },
  { file: "hero/hero-accent.jpg", id: "photo-1563241527-3004b7be0ffd", w: 800, h: 1000, note: "blush peony arrangement in vase" },

  // ---------- About / Why choose us ----------
  { file: "about/flower-shop.jpg", id: "photo-1487070183336-b863922373d4", w: 1200, h: 900, note: "flower shop storefront" },
  { file: "about/craft-table.jpg", id: "photo-1493932484895-752d1471eab5", w: 1200, h: 900, note: "hand sketching on kraft paper" },

  // ---------- Featured bouquets ----------
  { file: "products/blush-peony-serenade.jpg", id: "photo-1591886960571-74d43a9d4166", w: 900, h: 1200, note: "pink and white roses in vase" },
  { file: "products/garden-rose-embrace.jpg", id: "photo-1582794543139-8ac9cb0f7b11", w: 900, h: 1200, note: "pink garden roses" },
  { file: "products/sunlit-sunflower-cheer.jpg", id: "photo-1455659817273-f96807779a8a", w: 900, h: 1200, note: "sunflowers" },
  { file: "products/tulip-whisper.jpg", id: "photo-1561181286-d3fee7d55364", w: 900, h: 1200, note: "pink tulips in vase" },
  { file: "products/midnight-garden-mix.jpg", id: "photo-1457089328109-e5d9bd499191", w: 900, h: 1200, note: "moody mixed flower bouquet" },
  { file: "products/coral-sunset-vase.jpg", id: "photo-1533616688419-b7a585564566", w: 900, h: 1200, note: "coral and orange bouquet in vase" },
  { file: "products/pearl-white-rose.jpg", id: "photo-1495231916356-a86217efff12", w: 900, h: 1200, note: "single white rose on wood" },
  { file: "products/hydrangea-dream.jpg", id: "photo-1471696035578-3d8c78d99684", w: 900, h: 1200, note: "blue and purple hydrangeas" },

  // ---------- Best sellers ----------
  { file: "products/ivory-eucalyptus-bridal.jpg", id: "photo-1596438459194-f275f413d6ff", w: 900, h: 1200, note: "pale roses with eucalyptus" },
  { file: "products/rainbow-celebration.jpg", id: "photo-1508610048659-a06b669e3321", w: 900, h: 1200, note: "multicoloured roses" },
  { file: "products/peach-dahlia-glow.jpg", id: "photo-1546842931-886c185b4c8c", w: 900, h: 1200, note: "peach dahlias" },
  { file: "products/single-stem-rose.jpg", id: "photo-1518895949257-7621c3c786d7", w: 900, h: 1200, note: "single pink rose in glass vase" },

  // ---------- Shop by category (matches the Products dropdown) ----------
  { file: "categories/graduation-bouquets.jpg", id: "photo-1541339907198-e08756dedf3f", w: 800, h: 800, note: "graduates throwing caps at sunset" },
  { file: "categories/birthday-bouquets.jpg", id: "photo-1530103862676-de8c9debad1d", w: 800, h: 800, note: "colourful balloons" },
  { file: "categories/anniversary-bouquets.jpg", id: "photo-1465495976277-4387d4b0b4c6", w: 800, h: 800, note: "wedding rings with bouquet" },
  { file: "categories/wedding-bouquets.jpg", id: "photo-1519741497674-611481863552", w: 800, h: 800, note: "couple holding bridal bouquet" },
  { file: "categories/sunflower-bouquets.jpg", id: "photo-1455659817273-f96807779a8a", w: 800, h: 800, note: "sunflowers" },
  { file: "categories/rose-bouquets.jpg", id: "photo-1582794543139-8ac9cb0f7b11", w: 800, h: 800, note: "pink garden roses" },
  { file: "categories/tulip-bouquets.jpg", id: "photo-1520763185298-1b434c919102", w: 800, h: 800, note: "single pink tulip" },
  { file: "categories/mixed-flower-bouquets.jpg", id: "photo-1457089328109-e5d9bd499191", w: 800, h: 800, note: "moody mixed bouquet" },
  { file: "categories/money-bouquets.jpg", id: "photo-1580519542036-c47de6196ba5", w: 800, h: 800, note: "assorted banknotes" },
  { file: "categories/custom-bouquets.jpg", id: "photo-1508610048659-a06b669e3321", w: 800, h: 800, note: "multicoloured roses" },

  // ---------- Shop by occasion ----------
  { file: "occasions/graduation.jpg", id: "photo-1627556704302-624286467c65", w: 800, h: 1000, note: "graduation cap held up" },
  { file: "occasions/birthday.jpg", id: "photo-1464349095431-e9a21285b5f3", w: 800, h: 1000, note: "rainbow layer cake" },
  { file: "occasions/anniversary.jpg", id: "photo-1526047932273-341f2a7631f9", w: 800, h: 1000, note: "hands holding heart of flowers" },
  { file: "occasions/wedding.jpg", id: "photo-1583939003579-730e3918a45a", w: 800, h: 1000, note: "wedding couple with confetti" },
  { file: "occasions/congratulations.jpg", id: "photo-1511285560929-80b456fea0bc", w: 800, h: 1000, note: "celebration balloon release" },
  { file: "occasions/just-because.jpg", id: "photo-1462530260150-162092dbf011", w: 800, h: 1000, note: "white tulips in a vase" },

  // ---------- Instagram-style gallery ----------
  { file: "gallery/gallery-01.jpg", id: "photo-1465146344425-f00d5f5c8f07", w: 700, h: 700, note: "red poppies" },
  { file: "gallery/gallery-02.jpg", id: "photo-1490750967868-88aa4486c946", w: 700, h: 700, note: "yellow poppies" },
  { file: "gallery/gallery-03.jpg", id: "photo-1516834474-48c0abc2a902", w: 700, h: 700, note: "blue roses at dusk" },
  { file: "gallery/gallery-04.jpg", id: "photo-1519378058457-4c29a0a2efac", w: 700, h: 700, note: "red begonias" },
  { file: "gallery/gallery-05.jpg", id: "photo-1522748906645-95d8adfd52c7", w: 700, h: 700, note: "cherry blossom" },
  { file: "gallery/gallery-06.jpg", id: "photo-1513885535751-8b9238bd345a", w: 700, h: 700, note: "wrapped gifts" },
  { file: "gallery/gallery-07.jpg", id: "photo-1416879595882-3373a0480b5b", w: 700, h: 700, note: "potting tools and soil" },
  { file: "gallery/gallery-08.jpg", id: "photo-1487070183336-b863922373d4", w: 700, h: 700, note: "flower shop display" },

  // ---------- Promotional banner ----------
  { file: "banners/promo-spring.jpg", id: "photo-1585320806297-9794b3e4eeae", w: 2000, h: 900, note: "rose garden walkway" },

  // ---------- Customer review avatars ----------
  { file: "reviews/avatar-01.jpg", id: "photo-1494790108377-be9c29b29330", w: 200, h: 200, note: "smiling woman portrait" },
  { file: "reviews/avatar-02.jpg", id: "photo-1507003211169-0a1dd7228f2d", w: 200, h: 200, note: "smiling man portrait" },
  { file: "reviews/avatar-03.jpg", id: "photo-1517841905240-472988babdf9", w: 200, h: 200, note: "woman in denim jacket" },
  { file: "reviews/avatar-04.jpg", id: "photo-1552058544-f2b08422138a", w: 200, h: 200, note: "bearded man portrait" },
  { file: "reviews/avatar-05.jpg", id: "photo-1544005313-94ddf0286df2", w: 200, h: 200, note: "woman portrait outdoors" },
];

function buildUrl({ id, w, h }) {
  const params = new URLSearchParams({
    fm: "jpg",
    q: "72",
    fit: "crop",
    crop: "entropy",
    w: String(w),
    h: String(h),
  });
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}

async function download(entry) {
  const target = join(PUBLIC_IMAGES, entry.file);
  await mkdir(dirname(target), { recursive: true });

  const res = await fetch(buildUrl(entry));
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) {
    throw new Error(`${entry.file}: HTTP ${res.status} (${type})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 1024) {
    throw new Error(`${entry.file}: suspiciously small (${buf.byteLength} bytes)`);
  }
  // JPEG magic number check so we never ship an HTML error page as a ".jpg".
  if (buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error(`${entry.file}: not a JPEG`);
  }
  await writeFile(target, buf);
  return buf.byteLength;
}

const failures = [];
let totalBytes = 0;

for (const entry of manifest) {
  try {
    const bytes = await download(entry);
    totalBytes += bytes;
    console.log(`ok   ${entry.file.padEnd(44)} ${(bytes / 1024).toFixed(0)} KB`);
  } catch (err) {
    failures.push(err.message);
    console.log(`FAIL ${entry.file} -> ${err.message}`);
  }
}

// Verify every manifest entry actually exists on disk.
const missing = [];
for (const entry of manifest) {
  try {
    await stat(join(PUBLIC_IMAGES, entry.file));
  } catch {
    missing.push(entry.file);
  }
}

console.log("\n--- summary ---");
console.log(`files expected : ${manifest.length}`);
console.log(`failures       : ${failures.length}`);
console.log(`missing on disk: ${missing.length}${missing.length ? " -> " + missing.join(", ") : ""}`);
console.log(`total size     : ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

if (failures.length || missing.length) process.exit(1);
