"use client";

import { useState } from "react";

export function PriceInput({
  cents,
  onChange,
  required,
  optional,
}: {
  cents?: number;
  onChange: (cents: number | undefined) => void;
  required?: boolean;
  optional?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = cents === undefined ? "" : String(cents / 100);
  return (
    <input
      className="text-input"
      type="number"
      min={0}
      step="0.01"
      placeholder="0"
      required={required}
      value={draft ?? value}
      onChange={(event) => {
        const next = event.currentTarget.value;
        setDraft(next);
        if (next) onChange(Math.round(Number(next) * 100));
        else if (optional) onChange(undefined);
        else onChange(0);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
