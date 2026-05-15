import { useEffect, useMemo, useState } from "react";
import { runCalculation, computeMu } from "../calc/engine";
import { useBuilding, type Building } from "../building/useBuilding";
import { useBuildingResults, type ColumnResultByType, type ResultItem } from "../building/useBuildingResults";
import { useRoofTotalLoad_kPa } from "../building/loadPropagation";
import { deriveColumnLayout } from "../building/layout";
import { PricesBlock } from "../building/PricesBlock";
import { Collapsible } from "../building/Collapsible";
import { validateBuildingNumericInput } from "../utils/validation";
import { LoadPropagationBanner } from "./LoadPropagationBanner";
import { GeometrySection } from "./GeometrySection";
import { LoadsSection } from "./LoadsSection";
import { EconomySection } from "./EconomySection";
import { CranesSection } from "./CranesSection";
import { ResultsView } from "./ResultsView";
import type { CalculationInput, CalculationOutput, ColumnType } from "../calc/types";
import { DEFAULT_COLUMN_INPUT } from "../defaults/columnInput";
import structuresJson from "../data/structures/structures.json";
import cranesJson from "../data/cranes/cranes.json";

const COLUMN_TYPES: ColumnType[] = ["edge", "fachwerk", "middle"];
const COLUMN_LABELS: Record<ColumnType, string> = {
  edge: "Крайняя",
  fachwerk: "Фахверковая",
  middle: "Средняя",
};
type Results = Record<ColumnType, CalculationOutput>;

interface StructureRow {
  id: string;
  kPa: number;
}
interface CraneRow {
  capacity: string;
  span_m: number;
  base_mm: number;
  gauge_mm: number;
  wheelLoad_kN: number;
  trolleyMass_t: number;
  craneMass_t: number;
}

const STRUCTURES = structuresJson as StructureRow[];
const CRANES = cranesJson as CraneRow[];

function lookupCrane(capacity: string, span_m: number): CraneRow | undefined {
  return CRANES.find((c) => c.capacity === capacity && c.span_m === span_m);
}

function lookupStructure(id: string): StructureRow | undefined {
  return STRUCTURES.find((s) => s.id === id);
}

/**
 * Column-tab orchestrator. Owns the tab-local `CalculationInput` state,
 * recomputes results on every change, syncs cross-tab fields with the
 * shared `Building` context, and publishes the picked profile to the
 * results bus for the Summary tab. UI is composed from section
 * components in `./` — none of them carry their own state.
 */
export function ColumnApp() {
  const { building, setBuilding } = useBuilding();
  const initialRoof = lookupStructure(building.roofStructure);
  const [input, setInput] = useState<CalculationInput>(() => ({
    ...DEFAULT_COLUMN_INPUT,
    span_m: building.span_m,
    length_m: building.length_m,
    height_m: building.height_m,
    roofSlope_deg: building.roofSlope_deg,
    framePitch_m: building.framePitch_m,
    spanCount: building.spanCount,
    w0_kPa: building.w0_kPa,
    Sg_kPa: building.Sg_kPa,
    terrainType: building.terrainType,
    roofStructure: building.roofStructure,
    roofLoad_kPa: initialRoof?.kPa ?? DEFAULT_COLUMN_INPUT.roofLoad_kPa,
    responsibilityCoeff: building.responsibilityCoeff,
    prices: {
      "С255Б": building.priceC255B_rubKg,
      "С355Б": building.priceC355B_rubKg,
      "С245": building.priceC245_rubKg,
      "С345": building.priceC345_rubKg,
    },
  }));
  const [activeTab, setActiveTab] = useState<ColumnType>("edge");
  const { setResult } = useBuildingResults();

  const validationErrors = useMemo(
    () => validateBuildingNumericInput({
      span_m: input.span_m,
      length_m: input.length_m,
      height_m: input.height_m,
      framePitch_m: input.framePitch_m,
      w0_kPa: input.w0_kPa,
      Sg_kPa: input.Sg_kPa,
    }),
    [input.span_m, input.length_m, input.height_m, input.framePitch_m, input.w0_kPa, input.Sg_kPa],
  );

  // Auto-recompute results on every input change — no «Рассчитать» button needed.
  const { results, error } = useMemo<{ results: Results | null; error: string | null }>(() => {
    if (validationErrors.length > 0) {
      return { results: null, error: validationErrors[0] };
    }
    try {
      const out: Partial<Results> = {};
      const layout = deriveColumnLayout(input);
      for (const ct of COLUMN_TYPES) {
        const height_m = layout[ct].maxHeight_m || input.height_m;
        out[ct] = runCalculation({ ...input, columnType: ct, height_m });
      }
      return { results: out as Results, error: null };
    } catch (e) {
      return { results: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, validationErrors]);

  // Publish current column selection into the shared results bus for the Summary tab.
  useEffect(() => {
    if (!results) {
      setResult("column", null);
      return;
    }
    const layout = deriveColumnLayout(input);
    const buildItem = (ct: ColumnType): ResultItem | null => {
      const group = layout[ct];
      if (group.count === 0) return null;
      const r = results[ct].results[0];
      if (!r) return null;
      const strutStep = ct === "fachwerk" ? input.fachverkPitch_m : input.framePitch_m;
      const strutMassPerPiece_kg = r.strutCount * 12 * strutStep * 1.15;
      const totalMass_kg =
        r.mass_per_m * group.totalHeight_m + strutMassPerPiece_kg * group.count;
      return {
        profile: r.profileName,
        steel: r.steel,
        massPerPiece_kg: totalMass_kg / group.count,
        count: group.count,
        totalMass_kg,
        // Group mass uses layout-specific column heights; price is rub/kg.
        cost_rub: totalMass_kg * input.prices[r.steel],
      };
    };
    const payload: ColumnResultByType = {
      edge: buildItem("edge"),
      middle: buildItem("middle"),
      fachwerk: buildItem("fachwerk"),
    };
    setResult("column", payload);
  }, [results, input, setResult]);

  useEffect(() => {
    setBuilding({
      hasCrane: input.overheadCrane.enabled || input.suspendedCrane.enabled,
    });
  }, [input.overheadCrane.enabled, input.suspendedCrane.enabled, setBuilding]);

  // Pull updates from BuildingContext when other tabs change shared fields.
  // Roof load includes self-weight of purlins / beam-cell (auto-propagation).
  const roofLoad = useRoofTotalLoad_kPa();
  useEffect(() => {
    setInput((cur) => ({
      ...cur,
      span_m: building.span_m,
      length_m: building.length_m,
      height_m: building.height_m,
      roofSlope_deg: building.roofSlope_deg,
      framePitch_m: building.framePitch_m,
      spanCount: building.spanCount,
      w0_kPa: building.w0_kPa,
      Sg_kPa: building.Sg_kPa,
      terrainType: building.terrainType,
      roofStructure: building.roofStructure,
      roofType: building.roofShape === "gable" ? "gable" : "single_slope",
      roofLoad_kPa: roofLoad.total_kPa > 0 ? roofLoad.total_kPa : cur.roofLoad_kPa,
      responsibilityCoeff: building.responsibilityCoeff,
      prices: {
        "С255Б": building.priceC255B_rubKg,
        "С355Б": building.priceC355B_rubKg,
        "С245": building.priceC245_rubKg,
        "С345": building.priceC345_rubKg,
      },
    }));
  }, [building, roofLoad.total_kPa]);

  const updSynced = <K extends keyof Building>(key: K, value: Building[K]) => {
    setBuilding({ [key]: value } as Partial<Building>);
  };

  const upd = (patch: Partial<CalculationInput>) =>
    setInput((p) => ({ ...p, ...patch }));

  const setWallStructure = (id: string) => {
    const s = lookupStructure(id);
    upd({
      wallStructure: id,
      wallLoad_kPa: s ? s.kPa : input.wallLoad_kPa,
    });
  };

  const setOverhead = (patch: Partial<CalculationInput["overheadCrane"]>) => {
    setInput((p) => {
      const next = { ...p.overheadCrane, ...patch };
      // Re-lookup catalog when (capacity, span) changes.
      if (patch.capacity !== undefined || patch.span_m !== undefined) {
        const r = lookupCrane(next.capacity, next.span_m);
        if (r) {
          next.wheelLoad_kN = r.wheelLoad_kN;
          next.base_m = r.base_mm / 1000;
          next.gauge_m = r.gauge_mm / 1000;
        }
      }
      return { ...p, overheadCrane: next };
    });
  };
  const setSuspended = (patch: Partial<CalculationInput["suspendedCrane"]>) =>
    setInput((p) => ({ ...p, suspendedCrane: { ...p.suspendedCrane, ...patch } }));

  const muByType: Record<ColumnType, number> = {
    edge: computeMu({ ...input, columnType: "edge" }),
    fachwerk: computeMu({ ...input, columnType: "fachwerk" }),
    middle: computeMu({ ...input, columnType: "middle" }),
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        Калькулятор стальных колонн промышленных зданий
      </h1>
      <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
        Подбор профиля по СП 16.13330 / СП 20.13330. 208 профилей × 4 марки стали × 0–4 распорки.
      </p>

      <div style={{ marginBottom: 16 }}>
        <Collapsible title="📥 Исходные данные" storageKey="column-inputs" defaultOpen={true}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <GeometrySection input={input} building={building} updSynced={updSynced} upd={upd} />
            <LoadsSection
              input={input}
              structures={STRUCTURES}
              roofLoad={roofLoad}
              updSynced={updSynced}
              upd={upd}
              setWallStructure={setWallStructure}
            />
            <EconomySection input={input} muByType={muByType} upd={upd} />
          </div>

          {/* Synced prices block (visible in every tab) */}
          <div style={{ marginBottom: 16 }}>
            <PricesBlock />
          </div>

          <CranesSection input={input} setOverhead={setOverhead} setSuspended={setSuspended} />
        </Collapsible>
      </div>

      {/* Auto-propagation info banner */}
      <LoadPropagationBanner />

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      {results && (
        <ResultsView
          results={results}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          columnTypes={COLUMN_TYPES}
          columnLabels={COLUMN_LABELS}
        />
      )}
    </div>
  );
}
