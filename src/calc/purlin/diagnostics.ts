import type {
  LstkProfileType,
  PurlinInput,
  PurlinOutput,
  PurlinSectionResult,
  SteelGrade,
} from "./types";

export interface PurlinFamilyDiagnostic {
  grade: SteelGrade;
  type: LstkProfileType;
  status: "selected" | "no_candidate";
  profileName: string | null;
  spacing_mm: number | null;
  utilization: number | null;
  massPerBuilding_kg: number | null;
  notes: string[];
}

export interface PurlinSelectionDiagnostics {
  familyDiagnostics: PurlinFamilyDiagnostic[];
  selectedOverallProfileName: string | null;
  selectedOverallGrade: SteelGrade | null;
  selectedOverallType: LstkProfileType | null;
  oracleOnlyParameters: string[];
  warnings: string[];
}

const GRADES: SteelGrade[] = ["MP350", "MP390"];
const TYPES: LstkProfileType[] = ["2TPS", "2PS", "Z"];

function sectionKey(section: PurlinSectionResult): string {
  return `${section.grade}:${section.type}`;
}

function gradeFromRy(Ry_MPa: number): SteelGrade | null {
  if (Ry_MPa === 350) return "MP350";
  if (Ry_MPa === 390) return "MP390";
  return null;
}

export function buildPurlinSelectionDiagnostics(
  input: PurlinInput,
  output: PurlinOutput,
): PurlinSelectionDiagnostics {
  const sectionByKey = new Map(output.sections.map((section) => [sectionKey(section), section]));
  const familyDiagnostics = GRADES.flatMap((grade) =>
    TYPES.map((type): PurlinFamilyDiagnostic => {
      const section = sectionByKey.get(`${grade}:${type}`);
      const best = section?.best ?? null;

      if (!best) {
        const notes = ["No accepted candidate in the current native LSTK calculation."];
        if (input.cassetteHeightFilter_mm > 0) {
          notes.push(`Active cassette height filter: ${input.cassetteHeightFilter_mm} mm.`);
        }
        notes.push("Possible causes: strength utilization, step limits, cassette height filter, or missing oracle-only filters.");
        return {
          grade,
          type,
          status: "no_candidate",
          profileName: null,
          spacing_mm: null,
          utilization: null,
          massPerBuilding_kg: null,
          notes,
        };
      }

      return {
        grade,
        type,
        status: "selected",
        profileName: best.profile.name,
        spacing_mm: best.spacing_mm,
        utilization: best.K,
        massPerBuilding_kg: best.massPerBuilding_kg,
        notes: ["Selected as the lightest accepted candidate in this grade/type family."],
      };
    }),
  );

  const selectedOverall = output.top10[0] ?? null;
  const selectedOverallGrade = selectedOverall ? gradeFromRy(selectedOverall.profile.Ry_MPa) : null;

  return {
    familyDiagnostics,
    selectedOverallProfileName: selectedOverall?.profile.name ?? null,
    selectedOverallGrade,
    selectedOverallType: selectedOverall?.profile.type ?? null,
    oracleOnlyParameters: [
      "LSTK prices",
      "requiresPanelFilter",
      "black/galvanized/braced mass split",
    ],
    warnings: [
      "Diagnostics report current native selection only; it does not change profile checks or numerical output.",
      "Tie installation and brace step are explicit inputs for workbook parity, but they are not applied to the native selection yet.",
      "COLONNA/VELICAN indicate additional oracle-only filters that are not fully represented in this module yet.",
      "The current native LSTK branch applies maxUtilization when it is numeric; COLONNA documents workbook parity as using profile default_coef instead.",
    ],
  };
}
