import type { KeyboardEvent } from "react";

/** Evita che Invio in un input salvi/invii il form senza click esplicito su Salva. */
export function blockEnterSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter") return;
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (
    target.closest(
      "textarea, [contenteditable='true'], button, a, [role='button'], summary",
    )
  ) {
    return;
  }
  if (
    target instanceof HTMLInputElement &&
    (target.type === "submit" ||
      target.type === "button" ||
      target.type === "checkbox" ||
      target.type === "radio" ||
      target.type === "file")
  ) {
    return;
  }
  event.preventDefault();
}
