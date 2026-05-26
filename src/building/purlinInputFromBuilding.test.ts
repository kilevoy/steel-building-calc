import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { buildPurlinInputFromBuilding } from "./purlinInputFromBuilding";

describe("buildPurlinInputFromBuilding", () => {
  it("maps shared building fields into purlin input", () => {
    const input = buildPurlinInputFromBuilding(DEFAULT_BUILDING);

    expect(input.span_m).toBe(DEFAULT_BUILDING.span_m);
    expect(input.length_m).toBe(DEFAULT_BUILDING.length_m);
    expect(input.height_m).toBe(DEFAULT_BUILDING.height_m);
    expect(input.framePitch_m).toBe(DEFAULT_BUILDING.framePitch_m);
    expect(input.roofShape).toBe(DEFAULT_BUILDING.roofShape);
    expect(input.terrainType).toBe(DEFAULT_BUILDING.terrainType);
    expect(input.gamma_n).toBe(DEFAULT_BUILDING.responsibilityCoeff);
  });

  it("uses profiled sheet roof load and no layer height filter by default", () => {
    const input = buildPurlinInputFromBuilding({
      ...DEFAULT_BUILDING,
      roofStructure: "профлист",
    });

    expect(input.roofLoad_kPa).toBe(0.105);
    expect(input.cassetteHeightFilter_mm).toBe(0);
  });

  it("activates layer-by-layer assembly height filter for Наше roof assemblies", () => {
    const input = buildPurlinInputFromBuilding({
      ...DEFAULT_BUILDING,
      roofStructure: "наше 150 мм",
    });

    expect(input.roofLoad_kPa).toBe(0.22);
    expect(input.cassetteHeightFilter_mm).toBe(150);
  });
});
