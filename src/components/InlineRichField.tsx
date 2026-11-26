"use client";

import { useId } from "react";
import { useRichTextField } from "./useRichTextField";

/** Single-line (or compact) contentEditable field driven by the global FormatTool. */
export function InlineRichField({
  label,
  html,
  text = "",
  onChange,
  multiline = false,
  required = false,
  link = true,
}: {
  label: string;
  html?: string;
  text?: string;
  onChange: (html: string, plain: string) => void;
  multiline?: boolean;
  required?: boolean;
  link?: boolean;
}) {
  const labelId = useId();
  const field = useRichTextField(html, text, onChange, false);

  return (
    <div className="grid gap-2 text-sm">
      <span id={labelId}>
        {label}
        {required ? " *" : ""}
      </span>
      <div
        {...field}
        data-rich-links={link ? undefined : "off"}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={multiline}
        aria-labelledby={labelId}
        aria-required={required || undefined}
        className={`text-input inline-rich-field${multiline ? " is-multiline" : ""}`}
        onKeyDown={(event) => {
          if (!multiline && event.key === "Enter") event.preventDefault();
        }}
        onPaste={(event) => {
          event.preventDefault();
          const plain = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, plain);
        }}
        onDrop={(event) => event.preventDefault()}
      />
    </div>
  );
}
