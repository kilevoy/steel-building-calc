import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vitestBin = resolve(root, "node_modules", "vitest", "vitest.mjs");
const args = [
  "--max-old-space-size=4096",
  vitestBin,
  "run",
  "--pool=threads",
  "--maxWorkers=1",
  ...process.argv.slice(2),
];

const result = spawnSync(process.execPath, args, {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
