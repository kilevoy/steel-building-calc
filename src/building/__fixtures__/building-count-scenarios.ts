import type { UnifiedBuildingLayout, UnifiedBuildingLayoutInput } from "../unifiedLayout";

export interface BuildingCountScenario {
  id: string;
  sourceId: string;
  title: string;
  note: string;
  input: UnifiedBuildingLayoutInput;
  expected: UnifiedBuildingLayout;
}

export const BUILDING_COUNT_SCENARIOS: readonly BuildingCountScenario[] = [
  {
    id: "SCN-BUILDING-COUNT-001",
    sourceId: "KM-004",
    title: "Односкатный каркас VELICAN",
    note: "Draft-сценарий: буквенные оси требуют подтверждения как основные несущие.",
    input: {
      mainFrameAxisCount: 12,
      crossSpanCount: 6,
    },
    expected: {
      frames: {
        totalFrameAxes: 12,
        interiorFrameAxes: 10,
        endFrameAxes: 2,
        frameBays: 11,
        extraFrameAxes: 0,
      },
      columns: {
        edgePerFrame: 2,
        middlePerFrame: 5,
        totalPerFrame: 7,
        interiorEdge: 20,
        interiorMiddle: 50,
        interiorTotal: 70,
        endEdge: 4,
        endMiddle: 10,
        endTotal: 14,
        allEdge: 24,
        allMiddle: 60,
        allTotal: 84,
      },
    },
  },
  {
    id: "SCN-BUILDING-COUNT-002",
    sourceId: "KM-006",
    title: "Двухпролётный каркас VELICAN",
    note: "Draft-сценарий: дополнительная ось 11/1 учитывается отдельно от основных рам.",
    input: {
      mainFrameAxisCount: 20,
      crossSpanCount: 2,
      extraFrameAxisCount: 1,
    },
    expected: {
      frames: {
        totalFrameAxes: 20,
        interiorFrameAxes: 18,
        endFrameAxes: 2,
        frameBays: 19,
        extraFrameAxes: 1,
      },
      columns: {
        edgePerFrame: 2,
        middlePerFrame: 1,
        totalPerFrame: 3,
        interiorEdge: 36,
        interiorMiddle: 18,
        interiorTotal: 54,
        endEdge: 4,
        endMiddle: 2,
        endTotal: 6,
        allEdge: 40,
        allMiddle: 20,
        allTotal: 60,
      },
    },
  },
  {
    id: "SCN-BUILDING-COUNT-003",
    sourceId: "KM-009",
    title: "Четырёхпролётный каркас VELICAN",
    note: "Draft-сценарий: промежуточные буквенные оси учитываются отдельно от основных.",
    input: {
      mainFrameAxisCount: 13,
      crossSpanCount: 4,
    },
    expected: {
      frames: {
        totalFrameAxes: 13,
        interiorFrameAxes: 11,
        endFrameAxes: 2,
        frameBays: 12,
        extraFrameAxes: 0,
      },
      columns: {
        edgePerFrame: 2,
        middlePerFrame: 3,
        totalPerFrame: 5,
        interiorEdge: 22,
        interiorMiddle: 33,
        interiorTotal: 55,
        endEdge: 4,
        endMiddle: 6,
        endTotal: 10,
        allEdge: 26,
        allMiddle: 39,
        allTotal: 65,
      },
    },
  },
];
