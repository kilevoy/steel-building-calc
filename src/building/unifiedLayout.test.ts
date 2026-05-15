import { describe, expect, it } from "vitest";
import { BUILDING_COUNT_SCENARIOS } from "./__fixtures__/building-count-scenarios";
import { deriveUnifiedBuildingLayout } from "./unifiedLayout";

describe("unified building layout helpers", () => {
  it.each(BUILDING_COUNT_SCENARIOS)("$id applies the accepted column count model", (scenario) => {
    const layout = deriveUnifiedBuildingLayout(scenario.input);

    expect(layout).toEqual(scenario.expected);
  });
});
