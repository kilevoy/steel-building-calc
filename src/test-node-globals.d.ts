declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
}

declare module "node:child_process" {
  export function execFileSync(command: string, args: readonly string[], options: { cwd: string; encoding: "utf8" }): string;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
}

declare const process: {
  cwd(): string;
};
