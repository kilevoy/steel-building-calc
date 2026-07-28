import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import console from "node:console";
import process from "node:process";

const root = process.cwd();
const distDir = join(root, "dist");
const assetsDir = join(distDir, "assets");
const indexHtmlPath = join(distDir, "index.html");
const faviconPath = join(distDir, "favicon.svg");
const maxEntryBytes = 260 * 1024;

const localPathPatterns = [
  /[A-Z]:\\(?:Users|Downloads|Балка|[^"'\r\n]*\\)/i,
  /file:\/\/\//i,
  /Users\\work/i,
  /Downloads/i,
];

const heavyEntryMarkers = [
  "craneWorkbook",
  "windowRiegelWorkbook",
  "climateSettlements",
  "settlements-climate",
  "sourceWorkbook",
  "EXCEL-006:",
  "EXCEL-005:",
  "EXCEL-007:",
];

function fail(message) {
  console.error(`[bundle-check] ${message}`);
  process.exitCode = 1;
}

if (!existsSync(assetsDir)) {
  fail("dist/assets was not found. Run the production build first.");
  process.exit();
}

if (!existsSync(indexHtmlPath)) {
  fail("dist/index.html was not found. Run the production build first.");
}

if (!existsSync(faviconPath)) {
  fail("dist/favicon.svg was not found.");
}

const assetFiles = readdirSync(assetsDir).filter((file) => file.endsWith(".js"));
const entryFiles = assetFiles.filter((file) => /^index-[\w-]+\.js$/.test(file));

if (entryFiles.length !== 1) {
  fail(`expected exactly one index chunk, found ${entryFiles.length}: ${entryFiles.join(", ")}`);
}

for (const file of assetFiles) {
  const path = join(assetsDir, file);
  const text = readFileSync(path, "utf8");

  for (const pattern of localPathPatterns) {
    if (pattern.test(text)) {
      fail(`${file} contains local path metadata matching ${pattern}`);
    }
  }
}

for (const entryFile of entryFiles) {
  const path = join(assetsDir, entryFile);
  const size = statSync(path).size;
  const text = readFileSync(path, "utf8");

  if (size > maxEntryBytes) {
    fail(`${entryFile} is ${size} bytes, above the ${maxEntryBytes} byte entry budget`);
  }

  for (const marker of heavyEntryMarkers) {
    if (text.includes(marker)) {
      fail(`${entryFile} contains heavy generated marker "${marker}"`);
    }
  }

  console.log(`[bundle-check] ${entryFile}: ${size} bytes, entry budget OK`);
}

if (existsSync(indexHtmlPath)) {
  const indexHtml = readFileSync(indexHtmlPath, "utf8");
  if (!indexHtml.includes('rel="icon"')) {
    fail("dist/index.html does not include a favicon link");
  }
  if (!indexHtml.includes("favicon.svg")) {
    fail("dist/index.html does not reference favicon.svg");
  }
}
