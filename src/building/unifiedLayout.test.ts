import { describe, expect, it } from "vitest";
import { BUILDING_COUNT_SCENARIOS } from "./__fixtures__/building-count-scenarios";
import { deriveUnifiedBuildingLayout } from "./unifiedLayout";

describe("unified building layout helpers", () => {
  it.each(BUILDING_COUNT_SCENARIOS)("$id applies the accepted column count model", (scenario) => {
    const layout = deriveUnifiedBuildingLayout(scenario.input);

    expect(layout).toEqual(scenario.expected);
  });

  it("keeps end columns in the end-fachwerk group when there is no crane", () => {
    const layout = deriveUnifiedBuildingLayout({
      mainFrameAxisCount: 20,
      crossSpanCount: 2,
      hasCrane: false,
    });

    expect(layout.columns.mainTotal).toBe(54);
    expect(layout.columns.endFachwerkTotal).toBe(6);
  });

  it("counts end columns as main frame columns when there is a crane", () => {
    const layout = deriveUnifiedBuildingLayout({
      mainFrameAxisCount: 20,
      crossSpanCount: 2,
      hasCrane: true,
    });

    expect(layout.columns.mainTotal).toBe(60);
    expect(layout.columns.endFachwerkTotal).toBe(0);
  });
});
