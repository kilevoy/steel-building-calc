import type { Building } from "./buildingContext";
import {
  deriveUnifiedBuildingLayout,
  type UnifiedBuildingLayout,
  type UnifiedBuildingLayoutInput,
} from "./unifiedLayout";

function positiveIntegerFromLength(length_m: number, framePitch_m: number): number {
  if (!Number.isFinite(length_m) || !Number.isFinite(framePitch_m) || framePitch_m <= 0) {
    return 0;
  }
  return Math.floor(length_m / framePitch_m) + 1;
}

function crossSpanCountFromBuilding(building: Building): number {
  return building.spanCount === "multi" ? 2 : 1;
}

export function deriveUnifiedBuildingLayoutInput(
  building: Building,
): UnifiedBuildingLayoutInput {
  return {
    mainFrameAxisCount: positiveIntegerFromLength(building.length_m, building.framePitch_m),
    crossSpanCount: crossSpanCountFromBuilding(building),
    hasCrane: building.hasCrane,
  };
}

export function deriveUnifiedBuildingLayoutFromBuilding(
  building: Building,
): UnifiedBuildingLayout {
  return deriveUnifiedBuildingLayout(deriveUnifiedBuildingLayoutInput(building));
}
