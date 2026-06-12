import { useBuilding } from "../building/useBuilding";

/**
 * Схема здания, рисуется из общего BuildingContext: поперечная рама
 * (пролёт, высота, уклон, средняя колонна, ферма, кран) и продольный
 * вид (длина, шаг рам, торцевой фахверк). Чистый SVG без зависимостей;
 * цвета берутся из CSS-переменных дизайн-системы, размерные линии —
 * с засечками 45° в духе строительных чертежей.
 */

const C_MAIN = "var(--c-accent)";
const C_DIM = "var(--c-text-muted)";
const C_LIGHT = "var(--c-text-faint)";
const FONT = 10;

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Размерная линия с засечками 45° и подписью. */
function DimH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g stroke={C_DIM} strokeWidth={1}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1 - 3} y1={y + 3} x2={x1 + 3} y2={y - 3} />
      <line x1={x2 - 3} y1={y + 3} x2={x2 + 3} y2={y - 3} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} strokeWidth={0.6} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} strokeWidth={0.6} />
      <text
        x={(x1 + x2) / 2}
        y={y - 4}
        textAnchor="middle"
        stroke="none"
        fill={C_DIM}
        fontSize={FONT}
      >
        {label}
      </text>
    </g>
  );
}

function DimV({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
  return (
    <g stroke={C_DIM} strokeWidth={1}>
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 3} y1={y1 + 3} x2={x + 3} y2={y1 - 3} />
      <line x1={x - 3} y1={y2 + 3} x2={x + 3} y2={y2 - 3} />
      <text
        x={x - 4}
        y={(y1 + y2) / 2}
        textAnchor="middle"
        stroke="none"
        fill={C_DIM}
        fontSize={FONT}
        transform={`rotate(-90 ${x - 4} ${(y1 + y2) / 2})`}
      >
        {label}
      </text>
    </g>
  );
}

/** Земля: линия с косой штриховкой. */
function Ground({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const hatches = [];
  for (let x = x1; x <= x2 - 6; x += 12) {
    hatches.push(<line key={x} x1={x + 6} y1={y} x2={x} y2={y + 6} />);
  }
  return (
    <g stroke={C_LIGHT} strokeWidth={1}>
      <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={1.4} />
      {hatches}
    </g>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

/** Поперечная рама. */
function CrossSection() {
  const { building } = useBuilding();
  const S = Math.max(building.span_m, 1);
  const H = Math.max(building.height_m, 1);
  const slope = Math.min(Math.max(building.roofSlope_deg, 0), 45);
  const isGable = building.roofShape === "gable";
  const isMulti = building.spanCount === "multi";

  const rise = Math.tan(deg2rad(slope)) * (isGable ? S / 2 : S);
  const ML = 46;
  const MR = 18;
  const MT = 16;
  const MB = 36;
  const maxW = 320;
  const maxH = 168;
  const scale = Math.min(maxW / S, maxH / (H + rise));
  const W = S * scale;
  const yG = MT + (H + rise) * scale;
  const x = (d: number) => ML + d * scale;
  const y = (h: number) => yG - h * scale;
  const svgW = ML + W + MR;
  const svgH = yG + MB;

  // Верхний пояс кровли
  const roofTop = isGable
    ? [
        [0, H],
        [S / 2, H + rise],
        [S, H],
      ]
    : [
        [0, H + rise],
        [S, H],
      ];
  const roofPath = roofTop.map(([d, h], i) => `${i === 0 ? "M" : "L"}${x(d)},${y(h)}`).join(" ");

  // Решётка фермы: зигзаг между нижним поясом (на отметке H) и верхним
  const topAt = (d: number): number => {
    if (!isGable) return H + rise - (rise * d) / S;
    return d <= S / 2 ? H + (rise * d) / (S / 2) : H + (rise * (S - d)) / (S / 2);
  };
  const panels = 8;
  const webPts: string[] = [];
  for (let i = 0; i <= panels; i++) {
    const d = (S * i) / panels;
    const onTop = i % 2 === 1;
    webPts.push(`${x(d)},${y(onTop ? topAt(d) : H)}`);
  }

  const columns = [0, S, ...(isMulti ? [S / 2] : [])];
  const craneY = H * 0.72;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxWidth: svgW * 1.15 }}
      role="img"
      aria-label="Схема поперечной рамы"
    >
      <Ground x1={ML - 14} x2={ML + W + 14} y={yG} />
      {columns.map((d) => (
        <line key={d} x1={x(d)} y1={yG} x2={x(d)} y2={y(H)} stroke={C_MAIN} strokeWidth={3} />
      ))}
      {/* нижний пояс */}
      <line x1={x(0)} y1={y(H)} x2={x(S)} y2={y(H)} stroke={C_MAIN} strokeWidth={1.6} />
      {/* решётка */}
      {rise * scale > 7 && (
        <polyline points={webPts.join(" ")} fill="none" stroke={C_LIGHT} strokeWidth={1} />
      )}
      {/* верхний пояс */}
      <path d={roofPath} fill="none" stroke={C_MAIN} strokeWidth={2.2} />

      {building.hasCrane && (
        <g>
          {/* подкрановые консоли и мост */}
          {[0, S].map((d) => (
            <rect
              key={d}
              x={x(d) + (d === 0 ? 1.5 : -7.5)}
              y={y(craneY) - 3}
              width={6}
              height={6}
              fill={C_DIM}
            />
          ))}
          <line
            x1={x(S * 0.06)}
            y1={y(craneY) - 5}
            x2={x(S * 0.94)}
            y2={y(craneY) - 5}
            stroke={C_DIM}
            strokeWidth={2.5}
          />
          {/* тележка и крюк */}
          <rect x={x(S / 2) - 5} y={y(craneY) - 10} width={10} height={5} fill={C_DIM} />
          <line x1={x(S / 2)} y1={y(craneY) - 5} x2={x(S / 2)} y2={y(craneY) + 9} stroke={C_DIM} strokeWidth={1.2} />
          <path
            d={`M${x(S / 2)},${y(craneY) + 9} a3.5,3.5 0 1 0 3.5,3.5`}
            fill="none"
            stroke={C_DIM}
            strokeWidth={1.4}
          />
        </g>
      )}

      <DimH x1={x(0)} x2={x(S)} y={yG + 18} label={`${fmt(S)} м`} />
      {isMulti && (
        <DimH x1={x(0)} x2={x(S / 2)} y={yG + 30} label={`${fmt(S / 2)} м`} />
      )}
      <DimV x={ML - 16} y1={y(H)} y2={yG} label={`${fmt(H)} м`} />
      <text
        x={x(isGable ? S * 0.23 : S * 0.4)}
        y={y(topAt(isGable ? S * 0.23 : S * 0.4)) - 6}
        fontSize={FONT}
        fill={C_DIM}
        textAnchor="middle"
      >
        {fmt(slope)}°
      </text>
      <text x={svgW / 2 + 12} y={svgH - 2} fontSize={FONT} fill={C_LIGHT} textAnchor="middle">
        Поперечная рама{building.hasCrane ? " · с краном" : ""}
      </text>
    </svg>
  );
}

/** Продольный вид: оси рам по длине здания. */
function LongitudinalView() {
  const { building } = useBuilding();
  const L = Math.max(building.length_m, 1);
  const p = Math.max(building.framePitch_m, 0.5);
  const H = Math.max(building.height_m, 1);
  const axisCount = Math.floor(L / p) + 1;

  const ML = 24;
  const MR = 18;
  const MT = 30;
  const MB = 36;
  const maxW = 340;
  const maxH = 130;
  const scale = Math.min(maxW / L, maxH / H);
  const W = L * scale;
  const yG = MT + H * scale;
  const x = (d: number) => ML + d * scale;
  const svgW = ML + W + MR;
  const svgH = yG + MB;

  const axes = Array.from({ length: axisCount }, (_, i) => Math.min(i * p, L));

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxWidth: svgW * 1.15 }}
      role="img"
      aria-label="Продольный вид здания"
    >
      <Ground x1={ML - 14} x2={ML + W + 14} y={yG} />
      {axes.map((d, i) => {
        const isEnd = i === 0 || i === axes.length - 1;
        return (
          <line
            key={i}
            x1={x(d)}
            y1={yG}
            x2={x(d)}
            y2={yG - H * scale}
            stroke={isEnd && !building.hasCrane ? C_LIGHT : C_MAIN}
            strokeWidth={isEnd && !building.hasCrane ? 1.6 : 2.2}
            strokeDasharray={isEnd && !building.hasCrane ? "4 3" : undefined}
          />
        );
      })}
      <line x1={x(0)} y1={yG - H * scale} x2={x(L)} y2={yG - H * scale} stroke={C_MAIN} strokeWidth={2.2} />

      {axes.length > 1 && (
        <DimH x1={x(axes[0])} x2={x(axes[1])} y={yG - H * scale - 12} label={`${fmt(p)} м`} />
      )}
      <DimH x1={x(0)} x2={x(L)} y={yG + 18} label={`${fmt(L)} м`} />
      <text x={svgW / 2} y={svgH - 2} fontSize={FONT} fill={C_LIGHT} textAnchor="middle">
        Продольный вид · рам: {axisCount}
        {building.hasCrane ? "" : " · торцы — фахверк (пунктир)"}
      </text>
    </svg>
  );
}

export function BuildingSketch() {
  return (
    <div className="sketch-row">
      <CrossSection />
      <LongitudinalView />
    </div>
  );
}
