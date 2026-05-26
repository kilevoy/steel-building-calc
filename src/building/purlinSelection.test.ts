import { describe, expect, it } from "vitest";
import { runPurlinCalculation } from "../calc/purlin/engine";
import { selectRolledTop10, type RolledPrices } from "../calc/purlin/rolled";
import { DEFAULT_BUILDING } from "./buildingContext";
import { buildPurlinInputFromBuilding } from "./purlinInputFromBuilding";
import {
  buildSelectedPurlinResultItem,
  getAvailablePurlinSelectionModes,
} from "./purlinSelection";

const prices = {
  priceMP350_rubKg: DEFAULT_BUILDING.priceMP350_rubKg,
  priceMP390_rubKg: DEFAULT_BUILDING.priceMP390_rubKg,
  priceC245_rubKg: DEFAULT_BUILDING.priceC245_rubKg,
  priceC345_rubKg: DEFAULT_BUILDING.priceC345_rubKg,
};

const rolledPrices: RolledPrices = {
  beam_C255B: DEFAULT_BUILDING.priceC255B_rubKg,
  beam_C355B: DEFAULT_BUILDING.priceC355B_rubKg,
  tube_C245: DEFAULT_BUILDING.priceC245_rubKg,
  tube_C345: DEFAULT_BUILDING.priceC345_rubKg,
  channel_C245: DEFAULT_BUILDING.priceC245_rubKg,
  channel_C345: DEFAULT_BUILDING.priceC345_rubKg,
};

describe("purlin selection mode", () => {
  it("offers 2TPS only for layer-by-layer roof assemblies", () => {
    expect(getAvailablePurlinSelectionModes(DEFAULT_BUILDING)).toEqual([
      "auto",
      "2PS",
      "Z",
      "rolled",
    ]);
    expect(getAvailablePurlinSelectionModes({
      ...DEFAULT_BUILDING,
      roofStructure: "наше 150 мм",
    })).toEqual(["auto", "2TPS", "2PS", "Z", "rolled"]);
  });

  it("can select Z or rolled purlins from the same building input", () => {
    const input = buildPurlinInputFromBuilding(DEFAULT_BUILDING);
    const output = runPurlinCalculation(input);
    const cosA = Math.cos((input.roofSlope_deg * Math.PI) / 180);
    const qSls =
      0.5 * 1.1 * input.Sg_kPa * cosA * input.gamma_n + (input.roofLoad_kPa / 1.2) * input.gamma_n;
    const rolledTop10 = selectRolledTop10(
      {
        ...input,
        minStep_mm: 1500,
        maxStep_mm: 1500,
        rolledMaxK: 0.8,
        rolledPrices,
      },
      output.q_total_kPa,
      qSls,
    );

    const z = buildSelectedPurlinResultItem(output, rolledTop10, "Z", prices);
    const rolled = buildSelectedPurlinResultItem(output, rolledTop10, "rolled", prices);

    expect(z?.profile).toContain("Z");
    expect(z?.steel).toMatch(/^МП/);
    expect(rolled?.steel).toMatch(/^С/);
    expect(rolled?.totalMass_kg).toBeGreaterThan(0);
  });
});
