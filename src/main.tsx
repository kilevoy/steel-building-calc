import { StrictMode } from "react";
import "./styles.css";

// Тема применяется до первого рендера, чтобы не было «вспышки» светлой.
try {
  const stored = window.localStorage.getItem("colonna:theme");
  const dark = stored
    ? stored === "dark"
    : window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
} catch {
  /* ignore */
}
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BuildingProvider } from "./building/context";
import { BuildingResultsProvider } from "./building/results";
import { CraneBeamRunnerProvider } from "./building/craneBeamRunner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BuildingProvider>
      <BuildingResultsProvider>
        <CraneBeamRunnerProvider>
          <App />
        </CraneBeamRunnerProvider>
      </BuildingResultsProvider>
    </BuildingProvider>
  </StrictMode>,
);
