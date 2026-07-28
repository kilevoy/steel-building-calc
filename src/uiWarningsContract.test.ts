import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSource(fileName: string): string {
  return readFileSync(`src/${fileName}`, "utf8");
}

describe("UI warning contracts", () => {
  it("keeps the truss horizontal reaction warning visible", () => {
    const source = readSource("TrussApp.tsx");

    expect(source).toContain("горизонтальная реакция H");
    expect(source).toContain("открытый инженерный вопрос");
    expect(source).toContain("не подтверждённое H = 0");
  });

  it("keeps the purlin axial wind warning visible", () => {
    const source = readSource("PurlinApp.tsx");

    expect(source).toContain("осевая ветровая нагрузка");
    expect(source).toContain("временным допущением");
    expect(source).toContain("полноценный расчёт");
  });
});
