import { describe, expect, it } from "vitest";
import { hasColumnCrane } from "./cranes";
import { DEFAULT_COLUMN_INPUT } from "../defaults/columnInput";

describe("column crane flag", () => {
  it("is false when neither overhead nor suspended crane is enabled", () => {
    expect(hasColumnCrane(DEFAULT_COLUMN_INPUT)).toBe(false);
  });

  it("is true when overhead crane is enabled", () => {
    expect(
      hasColumnCrane({
        ...DEFAULT_COLUMN_INPUT,
        overheadCrane: {
          ...DEFAULT_COLUMN_INPUT.overheadCrane,
          enabled: true,
        },
      }),
    ).toBe(true);
  });

  it("is true when suspended crane is enabled", () => {
    expect(
      hasColumnCrane({
        ...DEFAULT_COLUMN_INPUT,
        suspendedCrane: {
          ...DEFAULT_COLUMN_INPUT.suspendedCrane,
          enabled: true,
        },
      }),
    ).toBe(true);
  });
});
