import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BuildingProvider } from "./building/context";
import { BuildingResultsProvider } from "./building/results";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BuildingProvider>
      <BuildingResultsProvider>
        <App />
      </BuildingResultsProvider>
    </BuildingProvider>
  </StrictMode>,
);
