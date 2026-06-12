import type { ReactNode } from "react";

/**
 * Минималистичные SVG-иконки вкладок (14×14, stroke = currentColor) —
 * наследуют цвет текста вкладки в обычном и активном состоянии.
 */

function Icon({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-icon={label}
    >
      {children}
    </svg>
  );
}

/* Колонна: двутавр спереди */
export const ColumnIcon = (
  <Icon label="column">
    <path d="M3.5 2h7M3.5 12h7M7 2v10" />
  </Icon>
);

/* Ферма: пояс + раскосы */
export const TrussIcon = (
  <Icon label="truss">
    <path d="M1.5 10.5h11M2.5 10.5L7 4l4.5 6.5M7 4v6.5M4.7 7.4L7 10.5M9.3 7.4L7 10.5" strokeWidth={1.2} />
  </Icon>
);

/* Прогоны: параллельные элементы */
export const PurlinIcon = (
  <Icon label="purlins">
    <path d="M2 4h10M2 7h10M2 10h10" />
  </Icon>
);

/* Балка покрытия: двутавр сбоку */
export const BeamIcon = (
  <Icon label="beam">
    <path d="M2.5 4v6M11.5 4v6M2.5 7h9" />
  </Icon>
);

/* Оконные ригели: проём с ригелем */
export const RiegelIcon = (
  <Icon label="riegel">
    <rect x="2.5" y="2.5" width="9" height="9" rx="1" />
    <path d="M2.5 7h9" />
  </Icon>
);

/* Подкрановая балка: балка + крюк */
export const CraneIcon = (
  <Icon label="crane">
    <path d="M2 3.5h10M7 3.5v4" />
    <path d="M7 7.5a2.2 2.2 0 1 0 2.2 2.2" />
  </Icon>
);

/* Сводка: сигма */
export const SummaryIcon = (
  <Icon label="summary">
    <path d="M10.5 3.5H4l3.5 3.5L4 10.5h6.5" />
  </Icon>
);
