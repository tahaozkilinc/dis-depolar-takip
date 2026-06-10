"use client";

import { useState } from "react";

interface FormattedNumberInputProps {
  name: string;
  decimals?: number;
  defaultValue?: number | string | null;
  value?: string;
  onValueChange?: (raw: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function groupThousands(digits: string): string {
  if (!digits) return digits;
  const stripped = digits.replace(/^0+(?=\d)/, "");
  return stripped.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Converts a display string (dot thousand separators, comma decimal) into a
// formatted display string and a raw numeric string (dot decimal separator,
// suitable for parseFloat) used by the hidden form field.
function sanitize(input: string, decimals: number): { display: string; raw: string } {
  const noGroups = input.replace(/\./g, "");
  const commaIndex = decimals > 0 ? noGroups.indexOf(",") : -1;

  let intDigits: string;
  let decDigits: string | undefined;
  if (commaIndex !== -1) {
    intDigits = noGroups.slice(0, commaIndex).replace(/\D/g, "");
    decDigits = noGroups.slice(commaIndex + 1).replace(/\D/g, "").slice(0, decimals);
  } else {
    intDigits = noGroups.replace(/\D/g, "");
    decDigits = undefined;
  }

  const groupedInt = groupThousands(intDigits);
  const display = decDigits !== undefined ? `${groupedInt || "0"},${decDigits}` : groupedInt;

  const rawInt = intDigits.replace(/^0+(?=\d)/, "");
  const raw = decDigits !== undefined ? `${rawInt || "0"}.${decDigits}` : rawInt;

  return { display, raw };
}

function toDisplay(value: string | number | null | undefined, decimals: number): string {
  if (value === null || value === undefined || value === "") return "";
  return sanitize(String(value).replace(".", ","), decimals).display;
}

export default function FormattedNumberInput({
  name,
  decimals = 2,
  defaultValue,
  value,
  onValueChange,
  required,
  placeholder,
  disabled,
  className,
  id,
}: FormattedNumberInputProps) {
  const isControlled = value !== undefined;
  const [internalRaw, setInternalRaw] = useState(() =>
    sanitize(toDisplay(defaultValue, decimals), decimals).raw
  );
  const [display, setDisplay] = useState(() => toDisplay(defaultValue, decimals));

  const raw = isControlled
    ? sanitize(toDisplay(value, decimals), decimals).raw
    : internalRaw;
  const shownDisplay = isControlled ? toDisplay(value, decimals) : display;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const newValue = input.value;
    const cursorPos = input.selectionStart ?? newValue.length;
    const meaningfulBeforeCursor = newValue.slice(0, cursorPos).replace(/\./g, "").length;

    const { display: formatted, raw: newRaw } = sanitize(newValue, decimals);

    let newPos = formatted.length;
    if (meaningfulBeforeCursor === 0) {
      newPos = 0;
    } else {
      let count = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== ".") count++;
        if (count === meaningfulBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
    }

    if (isControlled) {
      onValueChange?.(newRaw);
    } else {
      setInternalRaw(newRaw);
      setDisplay(formatted);
    }

    requestAnimationFrame(() => {
      input.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <>
      <input type="hidden" name={name} value={raw} />
      <input
        type="text"
        inputMode="decimal"
        id={id}
        value={shownDisplay}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    </>
  );
}
