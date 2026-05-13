import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_RESULTS,
  ResultsContext,
  type ResultsCtx,
  type BuildingResults,
} from "./resultsContext";

/**
 * Shared "results" context: each calculator tab publishes its selected solution
 * here after each calculation. The summary tab and load-propagation use it
 * to roll everything up into one model of the building.
 */
export function BuildingResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<BuildingResults>(EMPTY_RESULTS);

  const setResult = useCallback<ResultsCtx["setResult"]>((key, value) => {
    setResults((prev) => ({ ...prev, [key]: value }));
  }, []);

  const ctx = useMemo<ResultsCtx>(() => ({ results, setResult }), [results, setResult]);
  return <ResultsContext.Provider value={ctx}>{children}</ResultsContext.Provider>;
}
