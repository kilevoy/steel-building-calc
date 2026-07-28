import { describe, expect, it } from "vitest";
import { toWindowRiegelTerrainType } from "./windowRiegelTerrainType";

describe("toWindowRiegelTerrainType", () => {
  it("converts shared Latin terrain values to workbook labels", () => {
    expect(toWindowRiegelTerrainType("A")).toBe("А");
    expect(toWindowRiegelTerrainType("B")).toBe("В");
    expect(toWindowRiegelTerrainType("C")).toBe("С");
  });
});
