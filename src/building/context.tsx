import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BuildingContext,
  DEFAULT_BUILDING,
  type Building,
} from "./buildingContext";

const STORAGE_KEY = "colonna:building:v1";

function loadFromStorage(): Building {
  if (typeof window === "undefined") return DEFAULT_BUILDING;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BUILDING;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_BUILDING, ...parsed };
  } catch {
    return DEFAULT_BUILDING;
  }
}

export function BuildingProvider({ children }: { children: ReactNode }) {
  const [building, setBuildingState] = useState<Building>(loadFromStorage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(building));
    } catch {
      /* ignore quota errors */
    }
  }, [building]);

  const setBuilding = useCallback(
    (patch: Partial<Building>) => setBuildingState((cur) => ({ ...cur, ...patch })),
    [],
  );

  return (
    <BuildingContext.Provider value={{ building, setBuilding }}>
      {children}
    </BuildingContext.Provider>
  );
}
