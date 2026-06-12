import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Сворачиваемый блок с заголовком. Состояние «раскрыт/свёрнут»
 * сохраняется в localStorage по ключу `storageKey`, чтобы пережить
 * перезагрузку и переключение вкладок.
 */
export function Collapsible({
  title,
  storageKey,
  defaultOpen = true,
  children,
  headerStyle,
  containerStyle,
  rightHeader,
}: {
  title: ReactNode;
  storageKey: string;
  defaultOpen?: boolean;
  children: ReactNode;
  headerStyle?: CSSProperties;
  containerStyle?: CSSProperties;
  rightHeader?: ReactNode;
}) {
  const fullKey = `colonna:collapsible:${storageKey}`;
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultOpen;
    const v = window.localStorage.getItem(fullKey);
    if (v == null) return defaultOpen;
    return v === "1";
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(fullKey, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open, fullKey]);

  return (
    <div
      className={`collapsible ${open ? "collapsible--open" : "collapsible--closed"}`}
      style={containerStyle}
    >
      <div className="collapsible__header" onClick={() => setOpen((v) => !v)} style={headerStyle}>
        <span className="collapsible__title">
          <span aria-hidden className="collapsible__chevron">▶</span>
          {title}
        </span>
        {rightHeader && (
          <span className="collapsible__right" onClick={(e) => e.stopPropagation()}>
            {rightHeader}
          </span>
        )}
      </div>
      {open && <div className="collapsible__body">{children}</div>}
    </div>
  );
}
