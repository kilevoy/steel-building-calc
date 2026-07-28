import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSource(fileName: string): string {
  return readFileSync(`src/${fileName}`, "utf8");
}

describe("feature user story contracts", () => {
  it("keeps column calculation, crane flags and load propagation wired", () => {
    const columnApp = readSource("columnTab/ColumnApp.tsx");
    const craneFlags = readSource("calc/cranes.ts");
    const loadBanner = readSource("columnTab/LoadPropagationBanner.tsx");

    expect(columnApp).toContain("runCalculation");
    expect(columnApp).toContain("hasColumnCrane");
    expect(columnApp).toContain("<LoadPropagationBanner />");
    expect(columnApp).toContain("hasCrane: inputHasCrane");
    expect(craneFlags).toContain("export function hasColumnCrane");
    expect(loadBanner).toContain("results.truss?.reactions");
    expect(loadBanner).toContain("results.craneBeam");
    expect(loadBanner).toContain("useRoofTotalLoad_kPa");
  });

  it("keeps truss, purlin and window riegel calculation outputs published", () => {
    const trussApp = readSource("TrussApp.tsx");
    const purlinApp = readSource("PurlinApp.tsx");
    const windowRiegelApp = readSource("WindowRiegelApp.tsx");

    expect(trussApp).toContain("runTrussCalculation");
    expect(trussApp).toContain("buildTrussResultPayload");
    expect(trussApp).toContain("setResult(\"truss\"");
    expect(purlinApp).toContain("runPurlinCalculation");
    expect(purlinApp).toContain("selectRolledTop10");
    expect(purlinApp).toContain("buildSelectedPurlinResultItem");
    expect(purlinApp).toContain("setResult(\"purlin\"");
    expect(windowRiegelApp).toContain("calculateWindowRiegel");
    expect(windowRiegelApp).toContain("buildWindowRiegelResultItem");
    expect(windowRiegelApp).toContain("setResult(\"windowRiegel\"");
  });

  it("keeps summary diagnostics and purlin controls visible in SummaryApp", () => {
    const summary = readSource("SummaryApp.tsx");

    expect(summary).toContain("purlinSelectionMode");
    expect(summary).toContain("purlinContinuityScheme");
    expect(summary).toContain("getAvailablePurlinSelectionModes");
    expect(summary).toContain("buildColumnCountSummary");
    expect(summary).toContain("BuildingCountDiagnostics");
    expect(summary).toContain("ColumnCountSummaryBlock");
    expect(summary).toContain("buildTrussBuildingSummary");
    expect(summary).toContain("TrussBuildingSummaryBlock");
  });

  it("keeps knowledge wiki entry points available for future agents", () => {
    const requiredFiles = [
      "knowledge/README.md",
      "knowledge/AGENTS.md",
      "knowledge/index.md",
      "knowledge/lint.md",
      "knowledge/wiki/project-overview.md",
      "knowledge/wiki/open-assumptions.md",
      "knowledge/wiki/parity/acceptance-tests.md",
      "knowledge/raw/source-register.md",
    ];

    for (const fileName of requiredFiles) {
      expect(readFileSync(fileName, "utf8").trim().length).toBeGreaterThan(0);
    }
  });
});
