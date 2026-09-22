import { chromium } from "playwright";
import path from "node:path";
import process from "node:process";

const extensionPath = path.resolve(".output/chrome-mv3");

const pages = [
  {
    name: "documentation page (has markdown and json)",
    url: "https://developer.apple.com/documentation/swiftui/view",
    expectButtons: 2,
  },
  {
    name: "design page (has markdown and json)",
    url: "https://developer.apple.com/design/human-interface-guidelines",
    expectButtons: 2,
  },
  {
    name: "non-matching page (no buttons)",
    url: "https://developer.apple.com/support/",
    expectButtons: 0,
  },
  {
    name: "documentation page that does not exist (no buttons)",
    url: "https://developer.apple.com/documentation/doesnotexist123/nope",
    expectButtons: 0,
  },
  {
    name: "design page with a trailing slash (has markdown and json)",
    url: "https://developer.apple.com/design/human-interface-guidelines/",
    expectButtons: 2,
  },
];

let failed = false;

for (const colorScheme of ["light", "dark"]) {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    colorScheme,
    args: [
      "--headless=new",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  for (const check of pages) {
    const page = await context.newPage();
    await page.goto(check.url, { waitUntil: "load", timeout: 30000 });

    if (check.expectButtons > 0) {
      await page
        .waitForSelector(".adde-button-row a", { timeout: 15000 })
        .catch(() => {});
    } else {
      await page.waitForTimeout(3000);
    }

    const hrefs = await page.$$eval(".adde-button-row a", (as) =>
      as.map((a) => a.getAttribute("href"))
    );

    const ok = hrefs.length === check.expectButtons;
    console.log(
      `[${colorScheme}] ${check.name}: expected ${check.expectButtons} button(s), found ${hrefs.length}. ${ok ? "PASS" : "FAIL"}`
    );
    if (hrefs.length > 0) {
      console.log(`  hrefs: ${JSON.stringify(hrefs)}`);
    }
    if (!ok) {
      failed = true;
    }

    await page.screenshot({
      path: `verify-${colorScheme}-${check.name.replace(/[^a-z0-9]+/gi, "-")}.jpg`,
      type: "jpeg",
      quality: 70,
    });
    await page.close();
  }

  await context.close();
}

if (failed) {
  console.log("VERIFY_FAILED");
  process.exit(1);
}
console.log("VERIFY_PASSED");
