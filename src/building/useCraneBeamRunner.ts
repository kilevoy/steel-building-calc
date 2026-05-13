import { useContext } from "react";
import {
  CraneBeamRunnerContext,
  type CraneBeamRunnerValue,
} from "./craneBeamRunnerContext";

export function useCraneBeamRunner(): CraneBeamRunnerValue {
  const ctx = useContext(CraneBeamRunnerContext);
  if (!ctx) throw new Error("useCraneBeamRunner must be used inside <CraneBeamRunnerProvider>");
  return ctx;
}
