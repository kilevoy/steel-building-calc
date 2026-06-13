import { describe, expect, it } from "vitest";
import { calculateProjectWork, defaultProjectWorkInputs } from "./engine";
import type { ProjectWorkInputs } from "./types";
import scenarios from "./__fixtures__/scenarios.json";

/**
 * Acceptance-тест движка стоимости проектных работ (Великан) против
 * ground-truth, полученного офлайн-оракулом на HyperFormula из исходной
 * книги EXCEL-011 (scripts/extract_project_workbook.py + sweep сценариев).
 *
 * Оракул, в свою очередь, сверен с кэшированными значениями Excel
 * (дефолтный файл: Z9=179.2, Z10=19.91). Любой дрейф в книге или в
 * формате входных ячеек ловится здесь.
 */

type Scenario = {
  inputs: Record<string, number | boolean>;
  expected: { Z9: number; Z10: number; Z17: number };
};

function toInputs(raw: Record<string, number | boolean>): ProjectWorkInputs {
  // buildingType/kmFlag в фикстуре игнорируются — движок их фиксирует сам.
  return {
    ...defaultProjectWorkInputs,
    spanCount: raw.spanCount as number,
    spanWidth1: raw.spanWidth1 as number,
    spanWidth2: (raw.spanWidth2 as number) ?? 0,
    spanWidth3: (raw.spanWidth3 as number) ?? 0,
    spanWidth4: (raw.spanWidth4 as number) ?? 0,
    spanWidth5: (raw.spanWidth5 as number) ?? 0,
    length: raw.length as number,
    framePitch: raw.framePitch as number,
    height: raw.height as number,
    roof: raw.roof as ProjectWorkInputs["roof"],
    seismic: raw.seismic as ProjectWorkInputs["seismic"],
    wallMaterial: raw.wallMaterial as ProjectWorkInputs["wallMaterial"],
    wallThickness: raw.wallThickness as number,
    windows: raw.windows as boolean,
    windowCount: raw.windowCount as number,
    gates: raw.gates as boolean,
    doors: raw.doors as boolean,
    doorCount: raw.doorCount as number,
    overheadCrane: raw.overheadCrane as boolean,
    overheadCraneCapacity: raw.overheadCraneCapacity as number,
    suspendedCrane: raw.suspendedCrane as boolean,
    suspendedCraneCapacity: raw.suspendedCraneCapacity as number,
    overheadCost: raw.overheadCost as number,
  };
}

describe("project work engine — Excel/HyperFormula acceptance (Великан)", () => {
  const cases = Object.entries(scenarios as Record<string, Scenario>);

  it.each(cases)("сценарий %s совпадает с оракулом", (_name, sc) => {
    const result = calculateProjectWork(toInputs(sc.inputs));
    expect(result.kmCostThousandRub).not.toBeNull();
    expect(result.kmCostThousandRub!).toBeCloseTo(sc.expected.Z9, 6);
    expect(result.kmDurationDays!).toBeCloseTo(sc.expected.Z10, 6);
    expect(result.costPerTon!).toBeCloseTo(sc.expected.Z17, 6);
  });

  it("кэш книги не зависит от предыдущих расчётов", () => {
    const first = calculateProjectWork(toInputs((scenarios as Record<string, Scenario>).base.inputs));
    calculateProjectWork(toInputs((scenarios as Record<string, Scenario>).big.inputs));
    const again = calculateProjectWork(toInputs((scenarios as Record<string, Scenario>).base.inputs));
    expect(again.kmCostThousandRub).toBe(first.kmCostThousandRub);
    expect(again.kmDurationDays).toBe(first.kmDurationDays);
    expect(again.costPerTon).toBe(first.costPerTon);
  });
});
