import type { TrussResult } from "./resultsContext";

export interface TrussBuildingSummary {
  hasResult: boolean;
  count: number | null;
  lengthPerPiece_m: number | null;
  totalLength_m: number | null;
  massPerPiece_kg: number | null;
  totalMass_kg: number | null;
  unitMass_kg_per_m2: number | null;
  details: string | null;
}

export function buildTrussBuildingSummary(
  truss: TrussResult | null,
): TrussBuildingSummary {
  if (!truss) {
    return {
      hasResult: false,
      count: null,
      lengthPerPiece_m: null,
      totalLength_m: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      unitMass_kg_per_m2: null,
      details: null,
    };
  }

  const massPerPiece_kg =
    truss.n_trusses > 0 ? truss.totalMass_kg / truss.n_trusses : null;

  return {
    hasResult: true,
    count: truss.n_trusses,
    lengthPerPiece_m: truss.lengthPerPiece_m ?? null,
    totalLength_m: truss.totalLength_m ?? null,
    massPerPiece_kg,
    totalMass_kg: truss.totalMass_kg,
    unitMass_kg_per_m2: truss.unitMass_kg_per_m2,
    details: "внутренние рамы",
  };
}
