import type { ReactNode } from "react";
import {
  userValidationMessage,
  validateNumberByKind,
  type ValidationKind,
} from "../utils/validation";

const SYNCED_BADGE = "🔗";

/**
 * Универсальная обёртка для синхронизированного поля.
 * Подсвечивает фон жёлтым, добавляет иконку 🔗 и tooltip.
 *
 * Используется внутри уже существующих Field/NumField компонентов — оборачивает
 * label + input как блок.
 */
export function SyncedField({
  label,
  children,
  hint = "Синхронизировано со всеми вкладками",
}: {
  label?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="synced-field" title={hint}>
      {label && (
        <label className="field__label">
          <span className="synced-field__badge">{SYNCED_BADGE}</span>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/** Inline numeric synced field (label + input together). */
export function SyncedNumField({
  label,
  value,
  onChange,
  step = 1,
  hint = "Синхронизировано со всеми вкладками",
  validationKind,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  hint?: string;
  validationKind?: ValidationKind;
}) {
  const validationMessage = validateNumberByKind(value, label, validationKind);
  return (
    <div className="synced-field" title={hint}>
      <label className="field__label">
        <span className="synced-field__badge">{SYNCED_BADGE}</span>
        {label}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {validationMessage && (
        <div className="field__error">
          {userValidationMessage(validationMessage)}
        </div>
      )}
    </div>
  );
}

/** Inline synced select field (label + select together). */
export function SyncedSelectField({
  label,
  value,
  options,
  onChange,
  hint = "Синхронизировано со всеми вкладками",
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="synced-field" title={hint}>
      <label className="field__label">
        <span className="synced-field__badge">{SYNCED_BADGE}</span>
        {label}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
