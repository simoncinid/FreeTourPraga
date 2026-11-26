"use client";

import { useState } from "react";

/** Numero intero svuotabile in digitazione: niente 0 bloccato e niente 025. */
export function CountInput({
  value,
  min = 1,
  max = 10000,
  onChange,
  placeholder = "Es. 25",
  required,
  disabled,
}: {
  value: number | undefined;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown =
    draft ?? (value !== undefined && value > 0 ? String(value) : "");
  return (
    <input
      className="text-input"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      value={shown}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const raw = event.currentTarget.value
          .replace(/\D/g, "")
          .replace(/^0+(?=\d)/, "");
        setDraft(raw);
        if (!raw) return;
        const next = Number(raw);
        if (next >= min && next <= max) onChange(next);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
