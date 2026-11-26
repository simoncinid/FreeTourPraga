"use client";

import { useId } from "react";
import styles from "./rich-content.module.css";
import { useRichTextField } from "./useRichTextField";

export function RichTextEditor({
  label,
  html,
  text = "",
  onChange,
}: {
  label: string;
  html?: string;
  text?: string;
  onChange: (html: string, plain: string) => void;
}) {
  const labelId = useId();
  const field = useRichTextField(html, text, onChange, true);

  return (
    <div className="rich-text-editor grid gap-2 text-sm">
      <span id={labelId}>{label}</span>
      <div
        {...field}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-labelledby={labelId}
        className={`text-input min-h-28 ${styles.content}`}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand(
            "insertText",
            false,
            event.clipboardData.getData("text/plain"),
          );
        }}
        onDrop={(event) => event.preventDefault()}
      />
    </div>
  );
}
