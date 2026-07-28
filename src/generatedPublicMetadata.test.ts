import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PUBLIC_GENERATED_FILES = [
  "src/calc/craneBeam/workbook.generated.ts",
  "src/calc/windowRiegel/workbook.generated.ts",
  "src/calc/beamCell/catalog.generated.ts",
  "src/data/climate/settlements.generated.ts",
] as const;

const LOCAL_PATH_PATTERNS = [
  /[A-Z]:\\(?:Users|Downloads|Балка|[^"'\r\n]*\\)/i,
  /file:\/\/\//i,
  /Users\\work/i,
  /Downloads/i,
];

describe("public generated metadata", () => {
  it("does not expose local workbook paths", () => {
    for (const file of PUBLIC_GENERATED_FILES) {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");

      for (const pattern of LOCAL_PATH_PATTERNS) {
        expect(text, `${file} should not contain ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
