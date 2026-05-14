import { useBuildingResults } from "../building/useBuildingResults";
import { useRoofTotalLoad_kPa } from "../building/loadPropagation";

/**
 * Compact info banner showing auto-propagated loads from other tabs.
 * Extracted verbatim from `App.tsx` to keep the column tab UI compact.
 */
export function LoadPropagationBanner() {
  const { results } = useBuildingResults();
  const roofLoad = useRoofTotalLoad_kPa();
  const hasRoof = roofLoad.purlin_kPa > 0 || roofLoad.beamCell_kPa > 0;
  const hasTruss = !!results.truss?.reactions;
  const hasCrane = !!results.craneBeam;
  if (!hasRoof && !hasTruss && !hasCrane) return null;
  const rx = results.truss?.reactions;
  return (
    <div
      style={{
        marginBottom: 12,
        padding: "8px 12px",
        background: "#eff6ff",
        border: "1px dashed #3b82f6",
        borderRadius: 6,
        fontSize: 12,
        color: "#1e40af",
        lineHeight: 1.6,
      }}
    >
      <b>🔗 Автопередача нагрузок</b>
      {hasRoof && (
        <div>
          Кровля → {roofLoad.structure_kPa.toFixed(3)}
          {roofLoad.purlin_kPa > 0 && ` + ${roofLoad.purlin_kPa.toFixed(3)} (прогоны)`}
          {roofLoad.beamCell_kPa > 0 && ` + ${roofLoad.beamCell_kPa.toFixed(3)} (балка покр.)`}
          {" = "}<b>{roofLoad.total_kPa.toFixed(3)} кПа</b> → нагрузка от кровли
        </div>
      )}
      {hasTruss && rx && (
        <div>
          Ферма (реакции на опоры) → V<sub>пост</sub> = {rx.V_perm_kN.toFixed(1)} кН,
          V<sub>снег</sub> = {rx.V_snow_kN.toFixed(1)} кН,
          V<sub>ветер</sub> = {rx.V_wind_kN.toFixed(1)} кН
        </div>
      )}
      {hasCrane && (
        <div>
          Подкрановая балка → {results.craneBeam!.profile} ({results.craneBeam!.steel})
        </div>
      )}
    </div>
  );
}
