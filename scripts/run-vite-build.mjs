import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const viteBin = resolve(root, "node_modules", "vite", "bin", "vite.js");
const env = {
  ...process.env,
  GOMAXPROCS: process.env.GOMAXPROCS ?? "1",
};
const args = ["--max-old-space-size=4096", viteBin, "build", ...process.argv.slice(2)];

const result = spawnSync(process.execPath, args, {
  cwd: root,
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
