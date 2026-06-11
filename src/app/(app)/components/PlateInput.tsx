"use client";

import { useState } from "react";
import { formatPlate } from "@/lib/plate";

export default function PlateInput({
  name,
  required,
  defaultValue = "",
  className,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  const [value, setValue] = useState(formatPlate(defaultValue));

  return (
    <input
      type="text"
      name={name}
      required={required}
      value={value}
      onChange={(e) => setValue(formatPlate(e.target.value))}
      placeholder="34-ABC-123"
      maxLength={11}
      className={className}
    />
  );
}
