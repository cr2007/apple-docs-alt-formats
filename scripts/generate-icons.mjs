/**
 * Renders assets/icon.svg to every PNG size the manifest needs
 * (16, 32, 48, 96, 128) and writes them into public/icon/, replacing
 * WXT's default icons.
 *
 * Step 1: launch headless Chromium (already a dev dependency via
 * Playwright, so this needs no extra tooling).
 * Step 2: for each size, load the SVG scaled to exactly that many
 * pixels and screenshot it with a transparent background.
 * Step 3: write each PNG to public/icon/<size>.png.
 *
 * Run with `bun run generate-icons` after editing assets/icon.svg.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path";

const ICON_SIZES = [16, 32, 48, 96, 128];
const SOURCE_SVG = path.resolve("assets/icon.svg");
const OUTPUT_DIR = path.resolve("public/icon");

const svg = readFileSync(SOURCE_SVG, "utf-8");
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

for (const size of ICON_SIZES) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const scaledSvg = svg.replace(
    /width="128" height="128"/,
    `width="${size}" height="${size}"`
  );
  await page.setContent(
    `<html><head><style>html,body{margin:0;padding:0;}</style></head><body>${scaledSvg}</body></html>`
  );
  const outputPath = path.join(OUTPUT_DIR, `${size}.png`);
  await page.screenshot({ path: outputPath, omitBackground: true });
  console.log(`wrote ${outputPath}`);
  await page.close();
}

await browser.close();
console.log("DONE");
