import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSource(fileName: string): string {
  return readFileSync(`src/${fileName}`, "utf8");
}

describe("app infrastructure contracts", () => {
  it("keeps heavy calculation tabs lazy loaded behind Suspense and ErrorBoundary", () => {
    const source = readSource("App.tsx");

    expect(source).toContain("lazy(() => import(\"./TrussApp\")");
    expect(source).toContain("lazy(() => import(\"./PurlinApp\")");
    expect(source).toContain("lazy(() => import(\"./BeamCellApp\")");
    expect(source).toContain("lazy(() => import(\"./WindowRiegelApp\")");
    expect(source).toContain("lazy(() => import(\"./CraneBeamApp\")");
    expect(source).toContain("lazy(() => import(\"./SummaryApp\")");
    expect(source).toContain("<Suspense fallback={TAB_FALLBACK}>");
    expect(source).toContain("<ErrorBoundary key={active}>");
    expect(source).not.toContain("import { TrussApp } from \"./TrussApp\"");
    expect(source).not.toContain("import { PurlinApp } from \"./PurlinApp\"");
    expect(source).not.toContain("import { CraneBeamApp } from \"./CraneBeamApp\"");
  });

  it("keeps climate settlements outside the startup import path", () => {
    const typeSource = readSource("types/climate.ts");
    const serviceSource = readSource("services/settlements.ts");

    expect(typeSource).not.toContain("settlements-climate.json");
    expect(serviceSource).toContain("import(\"../data/regions/settlements-climate.json\")");
    expect(serviceSource).toContain("searchSettlementsAsync");
    expect(serviceSource).toContain("getSettlementClimateByIdAsync");
  });

  it("keeps crane beam engine behind dynamic import and no-crane guard", () => {
    const source = readSource("building/craneBeamRunner.tsx");

    expect(source).toContain("if (!building.hasCrane)");
    expect(source).toContain("await import(\"../calc/craneBeam/engine\")");
    expect(source).not.toContain("import { calculateCraneBeam } from \"../calc/craneBeam/engine\"");
  });

  it("keeps ErrorBoundary reset and technical details available", () => {
    const source = readSource("components/ErrorBoundary.tsx");

    expect(source).toContain("message: error.message");
    expect(source).toContain("componentDidCatch");
    expect(source).toContain("console.error");
    expect(source).toContain("private reset");
    expect(source).toContain("onClick={this.reset}");
  });
});
