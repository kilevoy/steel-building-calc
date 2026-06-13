import { describe, expect, it } from "vitest";
import { calculateProjectWork, defaultProjectWorkInputs } from "./engine";
import type { ProjectWorkInputs } from "./types";
import scenarios from "./__fixtures__/scenarios.json";

/**
 * Acceptance-тест движка стоимости проектных работ (Великан) против
 * ground-truth, полученного офлайн-оракулом на HyperFormula из исходной
 * книги EXCEL-011 (scripts/extract_project_workbook.py + sweep сценариев,
 * включая все добавленные проектные опции).
 *
 * Оракул сверен с кэшированными значениями Excel (дефолтный файл:
 * Z9=179.2, Z10=19.91). Любой дрейф в книге или в формате входных ячеек
 * ловится здесь.
 */

type Scenario = {
  inputs: Record<string, unknown>;
  expected: { Z9: number; Z10: number; Z17: number };
};

function toInputs(raw: Record<string, unknown>): ProjectWorkInputs {
  // Фикстура содержит полный набор входов движка; buildingType/kmFlag
  // движок фиксирует сам, поэтому их в фикстуре нет.
  return { ...defaultProjectWorkInputs, ...(raw as Partial<ProjectWorkInputs>) };
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
    const scen = scenarios as Record<string, Scenario>;
    const first = calculateProjectWork(toInputs(scen.base.inputs));
    calculateProjectWork(toInputs(scen.big.inputs));
    const again = calculateProjectWork(toInputs(scen.base.inputs));
    expect(again.kmCostThousandRub).toBe(first.kmCostThousandRub);
    expect(again.kmDurationDays).toBe(first.kmDurationDays);
    expect(again.costPerTon).toBe(first.costPerTon);
  });
});
