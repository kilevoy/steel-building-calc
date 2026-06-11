import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playwrightBin = resolve(root, "node_modules", "@playwright", "test", "cli.js");

const result = spawnSync(process.execPath, [playwrightBin, ...process.argv.slice(2)], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
