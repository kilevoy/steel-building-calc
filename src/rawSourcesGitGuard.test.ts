import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const FORBIDDEN_RAW_EXTENSIONS = /\.(?:xlsx|xls|xlsm|xlsb|pdf|dwg|dxf|rvt|ifc|zip|rar|7z)$/i;

describe("raw source git guard", () => {
  it("does not track heavy or confidential raw engineering sources", () => {
    const trackedFiles = execFileSync("git", ["ls-files", "knowledge/raw"], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter(Boolean);

    expect(trackedFiles.filter((file) => FORBIDDEN_RAW_EXTENSIONS.test(file))).toEqual([]);
  });
});
