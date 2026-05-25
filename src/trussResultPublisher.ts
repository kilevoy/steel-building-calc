import { deriveRoofElementLayout } from "./building/layout";
import type { TrussResult } from "./building/useBuildingResults";
import {
  TRUSS_SECTIONS,
  TRUSS_SECTION_SHORT,
  type TrussInput,
  type TrussOutput,
} from "./calc/truss/types";
import type { SpanCount } from "./calc/types";

export function buildTrussResultPayload(params: {
  input: Pick<TrussInput, "length_m" | "framePitch_m" | "span_m">;
  output: TrussOutput;
  spanCount: SpanCount;
  priceC345_rubKg: number;
}): TrussResult {
  const n_trusses = deriveRoofElementLayout({
    length_m: params.input.length_m,
    framePitch_m: params.input.framePitch_m,
    spanCount: params.spanCount,
  }).trussCount;

  const sections = TRUSS_SECTIONS.flatMap((section) => {
    const result = params.output.sections[section];
    const selected = result.selected;
    if (!selected) return [];

    return [{
      section: TRUSS_SECTION_SHORT[section],
      profile: selected.profile.name,
      steel: "С345",
      totalMass_kg: selected.totalMass_kg * n_trusses,
    }];
  });

  const totalMass_kg = params.output.totalMass_kg * n_trusses;

  return {
    sections,
    totalMass_kg,
    totalCost_rub: totalMass_kg * params.priceC345_rubKg,
    unitMass_kg_per_m2: params.output.unitMass_kg_per_m2,
    n_trusses,
    reactions: {
      V_perm_kN: (params.output.loads.roof_kN_per_m * params.input.span_m) / 2,
      V_snow_kN: (params.output.loads.snow_kN_per_m * params.input.span_m) / 2,
      V_wind_kN: (params.output.loads.wind_kN_per_m * params.input.span_m) / 2,
      H_kN: null,
    },
  };
}
