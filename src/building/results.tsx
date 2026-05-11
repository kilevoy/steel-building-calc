import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Shared "results" context: each calculator tab publishes its selected solution
 * here after each calculation. The summary tab and load-propagation use it
 * to roll everything up into one model of the building.
 *
 * Keep entries minimal — only what the summary needs. Each tab's own UI
 * remains the source of truth for detail.
 */

/** Generic per-element item: a single piece of metalwork in the building. */
export interface ResultItem {
  /** Display name of the section/profile (e.g. "25 Б1", "120х80х5", "Z 350х2,5") */
  profile: string;
  /** Steel grade label (С255Б, С355Б, С245, С345, МП350, МП390). */
  steel: string;
  /** Mass of ONE piece, kg. May be omitted if all mass is in totalMass_kg. */
  massPerPiece_kg?: number;
  /** Count of identical pieces in the building. */
  count?: number;
  /** Total mass in the whole building (kg). */
  totalMass_kg: number;
  /** Total cost in the whole building (руб). */
  cost_rub: number;
}

/** Truss section breakdown (ВП / НП / ОРб / ОР / РР) inside ONE truss. */
export interface TrussSectionItem {
  section: string;
  profile: string;
  steel: string;
  /** Mass of THIS section in the whole building (kg). */
  totalMass_kg: number;
}

export interface TrussResult {
  sections: TrussSectionItem[];
  totalMass_kg: number;
  totalCost_rub: number;
  unitMass_kg_per_m2: number;
  n_trusses: number;
  /** Support reactions for one truss (kN). For automatic load transfer to column. */
  reactions?: {
    V_perm_kN: number;
    V_snow_kN: number;
    V_wind_kN: number;
    H_kN: number;
  };
}

export interface ColumnResultByType {
  edge: ResultItem | null;
  middle: ResultItem | null;
  fachwerk: ResultItem | null;
}

export interface BuildingResults {
  column: ColumnResultByType | null;
  truss: TrussResult | null;
  purlin: ResultItem | null;
  beamCell: ResultItem | null;
  windowRiegel: ResultItem | null;
  craneBeam: ResultItem | null;
}

const EMPTY: BuildingResults = {
  column: null,
  truss: null,
  purlin: null,
  beamCell: null,
  windowRiegel: null,
  craneBeam: null,
};

interface ResultsCtx {
  results: BuildingResults;
  setResult: <K extends keyof BuildingResults>(
    key: K,
    value: BuildingResults[K],
  ) => void;
}

const Ctx = createContext<ResultsCtx | null>(null);

export function BuildingResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<BuildingResults>(EMPTY);

  const setResult = useCallback<ResultsCtx["setResult"]>((key, value) => {
    setResults((prev) => ({ ...prev, [key]: value }));
  }, []);

  const ctx = useMemo<ResultsCtx>(() => ({ results, setResult }), [results, setResult]);
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useBuildingResults() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBuildingResults must be used inside BuildingResultsProvider");
  return c;
}
