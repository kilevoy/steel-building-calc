import { useBuilding } from "../building/useBuilding";

/**
 * Cross-tab summary banner shown at the top of the app. Lists the shared
 * `Building` parameters so users can verify which inputs are propagated
 * between tabs.
 */
export function BuildingSummaryBanner() {
  const { building } = useBuilding();
  return (
    <div
      title="Эти параметры синхронизированы между всеми вкладками. Жёлтые поля внутри вкладок изменяют их сразу везде."
      style={{
        marginBottom: 12,
        padding: "8px 12px",
        background: "#fef9c3",
        border: "1px dashed #eab308",
        borderRadius: 6,
        fontSize: 12,
        color: "#78350f",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: 600 }}>🔗 Здание (общее):</span>
      {building.city && <span>город <b>{building.city}</b></span>}
      <span>пролёт <b>{building.span_m}</b> м</span>
      <span>длина <b>{building.length_m}</b> м</span>
      <span>высота <b>{building.height_m}</b> м</span>
      <span>уклон <b>{building.roofSlope_deg}°</b></span>
      <span>шаг рам <b>{building.framePitch_m}</b> м</span>
      <span>w₀ <b>{building.w0_kPa}</b> кПа</span>
      <span>Sg <b>{building.Sg_kPa}</b> кПа</span>
      <span>местн. <b>{building.terrainType}</b></span>
      <span>покр. <b>{building.roofStructure}</b></span>
      <span>γₙ <b>{building.responsibilityCoeff}</b></span>
    </div>
  );
}
