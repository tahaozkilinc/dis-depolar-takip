"use client";

import { useState } from "react";

interface FormattedNumberInputProps {
  name: string;
  /** Number of decimal digits allowed after the comma. */
  decimals?: number;
  /** Maximum number of digits allowed in the integer part. */
  maxDigits?: number;
  defaultValue?: number | string | null;
  value?: string;
  onValueChange?: (raw: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

interface ParsedNumber {
  intDigits: string;
  decDigits: string;
  hasComma: boolean;
}

function parseValue(value: string | number | null | undefined): ParsedNumber {
  if (value === null || value === undefined || value === "") {
    return { intDigits: "", decDigits: "", hasComma: false };
  }
  const str = String(value).replace(",", ".");
  const [intPart, decPart] = str.split(".");
  return {
    intDigits: (intPart ?? "").replace(/\D/g, ""),
    decDigits: (decPart ?? "").replace(/\D/g, ""),
    hasComma: decPart !== undefined,
  };
}

/** Strip everything except digits and a single comma, and clamp digit counts. */
function sanitize(
  input: string,
  decimals: number,
  maxIntDigits: number
): ParsedNumber {
  // Accept both "." and "," as the decimal separator the user types.
  const cleaned = input.replace(/[^\d.,]/g, "").replace(/\./g, ",");

  const firstComma = cleaned.indexOf(",");
  let intDigits: string;
  let decDigits = "";
  let hasComma = false;

  if (decimals > 0 && firstComma !== -1) {
    hasComma = true;
    intDigits = cleaned.slice(0, firstComma);
    decDigits = cleaned.slice(firstComma + 1).replace(/,/g, "").slice(0, decimals);
  } else {
    intDigits = cleaned.replace(/,/g, "");
  }

  // Drop leading zeros (keep a single "0" if that's all there is).
  intDigits = intDigits.replace(/^0+(?=\d)/, "");
  intDigits = intDigits.slice(0, maxIntDigits);

  return { intDigits, decDigits, hasComma };
}

function toDisplay({ intDigits, decDigits, hasComma }: ParsedNumber): string {
  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasComma ? `${grouped},${decDigits}` : grouped;
}

function toRaw({ intDigits, decDigits, hasComma }: ParsedNumber): string {
  if (!intDigits && !decDigits) return "";
  const intPart = intDigits || "0";
  return hasComma ? `${intPart}.${decDigits}` : intPart;
}

/** Count digit/comma characters in `str` up to (and excluding) `index`. */
function countSignificant(str: string, index: number): number {
  let count = 0;
  for (let i = 0; i < index && i < str.length; i++) {
    if (/[\d,]/.test(str[i])) count++;
  }
  return count;
}

/** Find the position right after the n-th digit/comma character in `str`. */
function positionAfterSignificant(str: string, n: number): number {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (/[\d,]/.test(str[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return str.length;
}

export default function FormattedNumberInput({
  name,
  decimals = 2,
  maxDigits,
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
  const [internal, setInternal] = useState<ParsedNumber>(() =>
    parseValue(defaultValue)
  );

  const maxIntDigits = maxDigits ?? Infinity;
  const parsed = isControlled ? parseValue(value) : internal;
  const display = toDisplay(parsed);
  const raw = toRaw(parsed);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    const caret = e.target.selectionStart ?? newValue.length;
    const significantBeforeCaret = countSignificant(newValue, caret);

    const next = sanitize(newValue, decimals, maxIntDigits);
    const nextDisplay = toDisplay(next);

    if (isControlled) {
      onValueChange?.(toRaw(next));
    } else {
      setInternal(next);
    }

    requestAnimationFrame(() => {
      const pos = positionAfterSignificant(nextDisplay, significantBeforeCaret);
      e.target.setSelectionRange(pos, pos);
    });
  }

  return (
    <>
      <input type="hidden" name={name} value={raw} />
      <input
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        id={id}
        value={display}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    </>
  );
}
