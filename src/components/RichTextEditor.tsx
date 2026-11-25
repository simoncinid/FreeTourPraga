"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { sanitizeRichText } from "@/lib/rich-text";

const commands = [
  ["bold", "Grassetto", "G"],
  ["italic", "Corsivo", "C"],
  ["underline", "Sottolineato", "S"],
  ["strikeThrough", "Barrato", "Barrato"],
  ["justifyLeft", "Allinea a sinistra", "Sinistra"],
  ["justifyCenter", "Centra", "Centro"],
  ["justifyRight", "Allinea a destra", "Destra"],
  ["justifyFull", "Giustifica", "Giustifica"],
  ["insertUnorderedList", "Elenco puntato", "• Elenco"],
  ["insertOrderedList", "Elenco numerato", "1. Elenco"],
] as const;

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
  const editor = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const lastHtml = useRef<string | undefined>(undefined);
  const labelId = useId();

  useLayoutEffect(() => {
    const node = editor.current;
    if (!node || (lastHtml.current !== undefined && lastHtml.current === html))
      return;
    if (html) node.innerHTML = sanitizeRichText(html);
    else node.textContent = text;
    lastHtml.current = html;
    selection.current = null;
  }, [html, text]);

  function rememberSelection() {
    const current = window.getSelection();
    if (current?.rangeCount && editor.current?.contains(current.anchorNode))
      selection.current = current.getRangeAt(0).cloneRange();
  }

  function emit() {
    const node = editor.current;
    if (!node) return;
    const html = sanitizeRichText(node.innerHTML);
    lastHtml.current = html;
    onChange(html, node.innerText.trim());
    rememberSelection();
  }

  function run(command: string, value?: string) {
    editor.current?.focus();
    const current = window.getSelection();
    if (current && selection.current) {
      current.removeAllRanges();
      current.addRange(selection.current);
    }
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    emit();
  }

  function editLink() {
    const node = selection.current?.startContainer;
    const element = node instanceof Element ? node : node?.parentElement;
    const previous = element?.closest("a")?.getAttribute("href") ?? "";
    const href = window.prompt("Indirizzo del link", previous)?.trim();
    if (href === undefined) return;
    if (!href) run("unlink");
    else if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href))
      run("createLink", href);
  }

  return (
    <div className="grid gap-2 text-sm">
      <span id={labelId}>{label}</span>
      <div
        role="group"
        aria-label="Formattazione del testo"
        className="flex flex-wrap items-center gap-2"
      >
        <select
          aria-label="Stile paragrafo"
          className="rounded border px-2 py-1"
          defaultValue=""
          onChange={(event) => {
            run("formatBlock", event.target.value);
            event.currentTarget.value = "";
          }}
        >
          <option value="" disabled>
            Stile
          </option>
          <option value="p">Paragrafo</option>
          <option value="h1">Titolo 1</option>
          <option value="h2">Titolo 2</option>
          <option value="h3">Titolo 3</option>
        </select>
        <select
          aria-label="Carattere"
          className="rounded border px-2 py-1"
          defaultValue=""
          onChange={(event) => {
            run("fontName", event.target.value);
            event.currentTarget.value = "";
          }}
        >
          <option value="" disabled>
            Carattere
          </option>
          {[
            "Arial",
            "Georgia",
            "Verdana",
            "Times New Roman",
            "Courier New",
          ].map((font) => (
            <option key={font}>{font}</option>
          ))}
        </select>
        <select
          aria-label="Dimensione carattere"
          className="rounded border px-2 py-1"
          defaultValue=""
          onChange={(event) => {
            run("fontSize", event.target.value);
            event.currentTarget.value = "";
          }}
        >
          <option value="" disabled>
            Dimensione
          </option>
          {["Piccola", "Normale", "Media", "Grande", "Molto grande"].map(
            (name, index) => (
              <option key={name} value={index + 2}>
                {name}
              </option>
            ),
          )}
        </select>
        {commands.map(([command, title, label]) => (
          <button
            type="button"
            key={command}
            aria-label={title}
            title={title}
            className="rounded border px-2 py-1"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(command)}
          >
            {label}
          </button>
        ))}
        <label className="flex items-center gap-1">
          Testo
          <input
            type="color"
            defaultValue="#17263b"
            aria-label="Colore del testo"
            onChange={(event) => run("foreColor", event.target.value)}
          />
        </label>
        <label className="flex items-center gap-1">
          Evidenzia
          <input
            type="color"
            defaultValue="#fff2ae"
            aria-label="Colore evidenziazione"
            onChange={(event) => run("hiliteColor", event.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded border px-2 py-1"
          onMouseDown={(event) => event.preventDefault()}
          onClick={editLink}
        >
          Inserisci o modifica link
        </button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-labelledby={labelId}
        className="text-input min-h-28 whitespace-pre-wrap"
        onInput={emit}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onBlur={rememberSelection}
        onPaste={(event) => {
          event.preventDefault();
          run("insertText", event.clipboardData.getData("text/plain"));
        }}
        onDrop={(event) => event.preventDefault()}
      />
    </div>
  );
}
