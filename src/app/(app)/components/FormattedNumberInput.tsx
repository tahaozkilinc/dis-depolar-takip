"use client";

import { useEffect, useRef, useState } from "react";

interface FormattedNumberInputProps {
  name: string;
  /** Number of decimal digits. 0 = whole number with "." thousand separators
   *  (e.g. 1233 -> "1.233"). >0 = fixed-decimal entry where the last N typed
   *  digits become the decimal part (e.g. 23312 with decimals=3 -> "23.312"). */
  decimals?: number;
  /** Maximum number of digits the user can type in total (integer + decimal). */
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

function digitsFromValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/\D/g, "");
}

function formatGrouped(digits: string): { display: string; raw: string } {
  if (!digits) return { display: "", raw: "" };
  const stripped = digits.replace(/^0+/, "") || "0";
  const display = stripped.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return { display, raw: stripped };
}

function formatFixedDecimal(
  digits: string,
  decimals: number
): { display: string; raw: string } {
  if (!digits) return { display: "", raw: "" };
  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, -decimals).replace(/^0+/, "") || "0";
  const decPart = padded.slice(-decimals);
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const display = `${groupedInt},${decPart}`;
  const raw = `${intPart}.${decPart}`;
  return { display, raw };
}

function format(digits: string, decimals: number) {
  return decimals > 0
    ? formatFixedDecimal(digits, decimals)
    : formatGrouped(digits);
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
  const [internalDigits, setInternalDigits] = useState(() =>
    digitsFromValue(defaultValue)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const digits = isControlled ? digitsFromValue(value) : internalDigits;
  const { display, raw } = format(digits, decimals);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let newDigits = e.target.value.replace(/\D/g, "");
    if (maxDigits) newDigits = newDigits.slice(0, maxDigits);
    if (isControlled) {
      onValueChange?.(format(newDigits, decimals).raw);
    } else {
      setInternalDigits(newDigits);
    }
  }

  // Typing always appends/removes at the end (calculator-style entry), so
  // keep the caret pinned to the end after every formatted re-render.
  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  });

  return (
    <>
      <input type="hidden" name={name} value={raw} />
      <input
        ref={inputRef}
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
