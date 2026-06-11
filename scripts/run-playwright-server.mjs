import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Web server for Playwright. Spawns node on package bins directly (same
// pattern as run-vitest.mjs) — Node 18.20+/20.12+/22 refuses to spawn
// npm.cmd without a shell on Windows (CVE-2024-27980).
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const viteBin = resolve(root, "node_modules", "vite", "bin", "vite.js");

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(resolve(root, "dist"))) {
  runNode([resolve(root, "scripts", "run-vite-build.mjs")]);
}

const preview = spawnSync(
  process.execPath,
  [viteBin, "preview", "--host", "127.0.0.1", "--port", "4174", "--strictPort"],
  { cwd: root, env: process.env, stdio: "inherit" },
);

process.exit(preview.status ?? 0);
