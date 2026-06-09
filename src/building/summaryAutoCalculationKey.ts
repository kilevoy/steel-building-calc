import type { Building } from "./buildingContext";

export function buildSummaryAutoCalculationKey(building: Building): string {
  return JSON.stringify({
    span_m: building.span_m,
    length_m: building.length_m,
    height_m: building.height_m,
    roofSlope_deg: building.roofSlope_deg,
    framePitch_m: building.framePitch_m,
    w0_kPa: building.w0_kPa,
    Sg_kPa: building.Sg_kPa,
    terrainType: building.terrainType,
    roofStructure: building.roofStructure,
    roofShape: building.roofShape,
    spanCount: building.spanCount,
    hasCrane: building.hasCrane,
    city: building.city,
    responsibilityCoeff: building.responsibilityCoeff,
    priceC255B_rubKg: building.priceC255B_rubKg,
    priceC355B_rubKg: building.priceC355B_rubKg,
    priceC245_rubKg: building.priceC245_rubKg,
    priceC345_rubKg: building.priceC345_rubKg,
    priceMP350_rubKg: building.priceMP350_rubKg,
    priceMP390_rubKg: building.priceMP390_rubKg,
    purlinSelectionMode: building.purlinSelectionMode,
    purlinContinuityScheme: building.purlinContinuityScheme,
    windowRiegelCount: building.windowRiegelCount,
  });
}
