import { useContext } from "react";
import { ResultsContext } from "./resultsContext";

export type {
  BuildingResults,
  ColumnResultByType,
  ResultItem,
  TrussResult,
  TrussSectionItem,
} from "./resultsContext";

export function useBuildingResults() {
  const c = useContext(ResultsContext);
  if (!c) throw new Error("useBuildingResults must be used inside BuildingResultsProvider");
  return c;
}
