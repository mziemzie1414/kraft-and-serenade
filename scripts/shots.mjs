/** Temporary utility: screenshots the landing page for visual review. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3111";
// fileURLToPath is required here: the home directory contains a space, which
// stays percent-encoded if the URL object is handed straight to fs.
const OUT = join(dirname(fileURLToPath(import.meta.url)), "shots");
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];
const failedRequests = [];

async function shoot(name, viewport, actions) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${name}] ${msg.text()}`);
  });
  page.on("requestfailed", (req) =>
    failedRequests.push(`[${name}] ${req.url()} ${req.failure()?.errorText}`)
  );
  page.on("pageerror", (err) => consoleErrors.push(`[${name}] pageerror: ${err.message}`));

  await page.goto(BASE, { waitUntil: "load" });
  // Scroll through the whole page so lazy images decode, then return to top.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);

  if (actions) await actions(page);

  await page.screenshot({
    path: join(OUT, `${name}.png`),
    fullPage: !actions,
  });
  await page.close();
  console.log("shot:", name);
}

await shoot("desktop-full", { width: 1440, height: 900 });
await shoot("mobile-full", { width: 390, height: 844 });

// Hero only, at rest.
await shoot("desktop-hero", { width: 1440, height: 900 }, async (page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
});

// Products hover dropdown, desktop.
await shoot("desktop-dropdown", { width: 1440, height: 900 }, async (page) => {
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  await page.getByRole("link", { name: "Products" }).first().hover();
  await page.waitForTimeout(600);
});

// Mobile drawer with the Products accordion expanded.
await shoot("mobile-menu", { width: 390, height: 844 }, async (page) => {
  await page.getByRole("button", { name: /open menu/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Products" }).click();
  await page.waitForTimeout(500);
});

await browser.close();

console.log(`\nconsole errors : ${consoleErrors.length}`);
consoleErrors.forEach((e) => console.log("  " + e));
console.log(`failed requests: ${failedRequests.length}`);
failedRequests.forEach((e) => console.log("  " + e));
