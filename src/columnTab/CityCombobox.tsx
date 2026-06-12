import { useCallback, useEffect, useState } from "react";
import { useBuilding, type Building } from "../building/useBuilding";
import {
  getSettlementClimateByIdAsync,
  searchSettlementsAsync,
} from "../services/settlements";
import type { SettlementClimateData } from "../types/climate";

/**
 * City combobox with debounced async search and on-select patch of the
 * shared `Building` (city label, terrain type, w0, Sg).
 *
 * Extracted from `App.tsx` without behaviour changes:
 *   - 200 ms debounce, 2-char minimum query length,
 *   - up to 10 matches shown,
 *   - `setBuilding({ city: cityQuery })` on blur (preserves typed text),
 *   - 150 ms blur delay before hiding the dropdown so onMouseDown still
 *     wins over the focus loss.
 */
export function CityCombobox() {
  const { building, setBuilding } = useBuilding();
  const [cityQuery, setCityQuery] = useState(building.city);
  const [showCityMatches, setShowCityMatches] = useState(false);
  const [cityMatches, setCityMatches] = useState<SettlementClimateData[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  // Re-sync local input when the shared building city changes from
  // another tab. Mirrors the original `useEffect(..., [building, ...])`
  // in `App.tsx`.
  useEffect(() => {
    setCityQuery(building.city);
  }, [building.city]);

  useEffect(() => {
    if (!showCityMatches || cityQuery.trim().length < 2) {
      setCityMatches([]);
      setCityLoading(false);
      return;
    }
    let cancelled = false;
    setCityLoading(true);
    const timer = window.setTimeout(() => {
      searchSettlementsAsync(cityQuery)
        .then((matches) => {
          if (!cancelled) setCityMatches(matches.slice(0, 10));
        })
        .catch((error: unknown) => {
          console.error("Failed to search settlements", error);
          if (!cancelled) setCityMatches([]);
        })
        .finally(() => {
          if (!cancelled) setCityLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cityQuery, showCityMatches]);

  const handleCitySelect = useCallback(
    async (id: string) => {
      const s = await getSettlementClimateByIdAsync(id);
      if (!s) return;
      const label = `${s.settlement} (${s.region})`;
      setShowCityMatches(false);
      const patch: Partial<Building> = { city: label };
      if (s.terrain.defaultType) patch.terrainType = s.terrain.defaultType as Building["terrainType"];
      if (typeof s.wind.w0Kpa === "number") patch.w0_kPa = s.wind.w0Kpa;
      if (typeof s.snow.sgKpa === "number") patch.Sg_kPa = s.snow.sgKpa;
      setBuilding(patch);
    },
    [setBuilding],
  );

  return (
    <div className="synced-field" title="Синхронизировано со всеми вкладками">
      <label className="field__label">
        <span className="synced-field__badge">🔗</span>
        Город (автозаполнение w₀, Sg)
      </label>
      <input
        type="text"
        value={cityQuery}
        onChange={(e) => {
          setCityQuery(e.target.value);
          setShowCityMatches(true);
        }}
        onFocus={() => setShowCityMatches(true)}
        onBlur={() => {
          setBuilding({ city: cityQuery });
          window.setTimeout(() => setShowCityMatches(false), 150);
        }}
        placeholder="Введите название..."
      />
      {cityMatches.length > 0 && (
        <div style={{ border: "1px solid #ddd", maxHeight: 200, overflow: "auto", background: "white" }}>
          {cityMatches.map((s) => (
            <div
              key={s.id}
              style={{ padding: "4px 8px", cursor: "pointer", fontSize: 13 }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCitySelect(s.id);
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#eef")}
              onMouseOut={(e) => (e.currentTarget.style.background = "")}
            >
              {s.settlement} — {s.region}{" "}
              <span className="text-muted">
                (w₀={s.wind.w0Kpa ?? "—"}, Sg={s.snow.sgKpa ?? "—"})
              </span>
            </div>
          ))}
        </div>
      )}
      {cityLoading && (
        <div className="field__hint" style={{ marginTop: 4 }}>
          Поиск...
        </div>
      )}
    </div>
  );
}
