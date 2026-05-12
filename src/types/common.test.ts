import { describe, expect, it } from "vitest";
import { isTerrainType } from "./common";

describe("isTerrainType", () => {
  it("accepts known terrain types", () => {
    expect(isTerrainType("A")).toBe(true);
    expect(isTerrainType("B")).toBe(true);
    expect(isTerrainType("C")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isTerrainType("D")).toBe(false);
    expect(isTerrainType("")).toBe(false);
    expect(isTerrainType(null)).toBe(false);
  });
});
