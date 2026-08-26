import type { Building } from "./buildingContext";
import {
  deriveUnifiedBuildingLayout,
  type UnifiedBuildingLayout,
  type UnifiedBuildingLayoutInput,
} from "./unifiedLayout";
import { deriveFrameAxisLayout } from "./layout";

function crossSpanCountFromBuilding(building: Building): number {
  return building.spanCount === "multi" ? 2 : 1;
}

export function deriveUnifiedBuildingLayoutInput(
  building: Building,
): UnifiedBuildingLayoutInput {
  const frameLayout = deriveFrameAxisLayout({
    length_m: building.length_m,
    framePitch_m: building.framePitch_m,
    mode: building.frameLayoutMode,
    centralBayCount: building.centralBayCount,
  });
  return {
    mainFrameAxisCount: frameLayout.frameCount,
    crossSpanCount: crossSpanCountFromBuilding(building),
    hasCrane: building.hasCrane,
  };
}

export function deriveUnifiedBuildingLayoutFromBuilding(
  building: Building,
): UnifiedBuildingLayout {
  return deriveUnifiedBuildingLayout(deriveUnifiedBuildingLayoutInput(building));
}
