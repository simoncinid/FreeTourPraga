"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Highlighter,
  Italic,
  Link2,
  RemoveFormatting,
  Underline,
} from "lucide-react";

type FormatTarget = {
  element: HTMLElement;
  emit: () => void;
  block: boolean;
};

type FormatToolContextValue = {
  register: (target: FormatTarget) => void;
  unregister: (element: HTMLElement) => void;
  rememberSelection: (element?: HTMLElement) => void;
  run: (command: string, value?: string) => void;
  editLink: () => void;
  clearFormat: () => void;
};

const FormatToolContext = createContext<FormatToolContextValue | null>(null);

export function useFormatTool() {
  return useContext(FormatToolContext);
}

const marks = ["bold", "italic", "underline"] as const;
const legacySizes = [
  "",
  "xx-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
];
const sizesInPixels = [
  "",
  "9px",
  "13px",
  "16px",
  "18px",
  "24px",
  "32px",
  "48px",
];
const flags = [
  ...marks,
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
  "justifyFull",
  "insertUnorderedList",
  "insertOrderedList",
] as const;

type FormatState = {
  active: string[];
  fontName: string;
  fontSize: string;
  formatBlock: string;
  foreColor: string;
  hiliteColor: string;
  link: boolean;
};

function toHex(color: string, fallback: string) {
  if (/^#[a-f0-9]{6}$/i.test(color)) return color.toLowerCase();
  const channels = color.match(
    /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:,\s*([\d.]+))?\s*\)$/,
  );
  return channels && channels[4] !== "0"
    ? "#" +
        channels
          .slice(1, 4)
          .map((value) => Number(value).toString(16).padStart(2, "0"))
          .join("")
    : fallback;
}

function readFormat(editor: HTMLElement, range: Range): FormatState {
  const atStart =
    range.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer.childNodes[range.startOffset] ??
        range.startContainer)
      : range.startContainer;
  const element =
    atStart instanceof HTMLElement
      ? atStart
      : (atStart.parentElement ?? editor);

  // Read authored values as well as command state. Browsers return computed sizes,
  // and a background on an ancestor is visible even when hiliteColor reports none.
  let fontName = "",
    fontSize = "",
    background = "";
  for (
    let parent: HTMLElement | null = element;
    parent && parent !== editor;
    parent = parent.parentElement
  ) {
    fontName ||=
      parent.style.fontFamily ||
      (parent.tagName === "FONT" ? (parent.getAttribute("face") ?? "") : "");
    fontSize ||=
      parent.style.fontSize ||
      (parent.tagName === "FONT" ? (parent.getAttribute("size") ?? "") : "");
    if (
      !background &&
      (parent.style.backgroundColor || parent.tagName === "MARK")
    )
      background = getComputedStyle(parent).backgroundColor;
  }
  if (!fontSize) fontSize = document.queryCommandValue("fontSize") || "";
  const sizeIndex = Math.max(
    legacySizes.indexOf(fontSize),
    sizesInPixels.indexOf(fontSize),
  );
  const font = (fontName || document.queryCommandValue("fontName") || "")
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const color =
    document.queryCommandValue("foreColor") || getComputedStyle(element).color;
  return {
    active: flags.filter((command) => document.queryCommandState(command)),
    fontName:
      inlineControls[0].options.find(
        ([name]) => name.toLowerCase() === font.toLowerCase(),
      )?.[0] ?? font,
    fontSize: sizeIndex > 0 ? String(sizeIndex) : fontSize,
    formatBlock: (
      document.queryCommandValue("formatBlock") || "p"
    ).toLowerCase(),
    foreColor: toHex(color, "#17263b"),
    hiliteColor: toHex(
      background || document.queryCommandValue("hiliteColor") || "",
      "#fff2ae",
    ),
    link: Boolean(element.closest("a[href]")),
  };
}

function selectionInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return editor.contains(range.startContainer) &&
    editor.contains(range.endContainer)
    ? range
    : null;
}

function initialCaret(editor: HTMLElement) {
  const range = document.createRange();
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent?.trim()) node = walker.nextNode();
  range.setStart(node ?? editor, 0);
  return range;
}

function restoreSelection(editor: HTMLElement, range: Range) {
  editor.focus({ preventScroll: true });
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function FormatToolProvider({ children }: { children: ReactNode }) {
  const target = useRef<FormatTarget | null>(null);
  const savedRange = useRef<Range | null>(null);
  const [activeTarget, setActiveTarget] = useState<FormatTarget | null>(null);
  const [state, setState] = useState<FormatState | null>(null);

  const rememberSelection = useCallback((element = target.current?.element) => {
    if (
      !element ||
      target.current?.element !== element ||
      document.activeElement !== element
    )
      return;
    const range = selectionInside(element);
    if (!range) return;
    savedRange.current = range.cloneRange();
    const next = readFormat(element, range);
    setState((previous) =>
      previous && JSON.stringify(previous) === JSON.stringify(next)
        ? previous
        : next,
    );
  }, []);

  const register = useCallback(
    (next: FormatTarget) => {
      if (target.current?.element !== next.element) {
        target.current = next;
        setActiveTarget(next);
        savedRange.current = null;
      }
      const range = selectionInside(next.element);
      if (
        !range ||
        (range.collapsed &&
          range.startContainer === next.element &&
          range.startOffset === 0)
      )
        restoreSelection(
          next.element,
          savedRange.current ?? initialCaret(next.element),
        );
      rememberSelection(next.element);
    },
    [rememberSelection],
  );

  const unregister = useCallback((element: HTMLElement) => {
    if (target.current?.element !== element) return;
    target.current = null;
    savedRange.current = null;
    setActiveTarget(null);
    setState(null);
  }, []);

  useEffect(() => {
    const selectionChanged = () => rememberSelection();
    const focusChanged = (event: FocusEvent) => {
      const editor = target.current?.element;
      const focused = event.target;
      if (
        editor &&
        focused instanceof HTMLElement &&
        focused !== editor &&
        !focused.closest(".format-tool")
      )
        unregister(editor);
    };
    document.addEventListener("selectionchange", selectionChanged);
    document.addEventListener("focusin", focusChanged);
    return () => {
      document.removeEventListener("selectionchange", selectionChanged);
      document.removeEventListener("focusin", focusChanged);
    };
  }, [rememberSelection, unregister]);

  const prepare = useCallback(() => {
    const current = target.current;
    if (!current?.element.isConnected) return null;
    const { element } = current;
    if (document.activeElement !== element || !selectionInside(element)) {
      const range = savedRange.current;
      restoreSelection(
        element,
        range &&
          element.contains(range.startContainer) &&
          element.contains(range.endContainer)
          ? range.cloneRange()
          : initialCaret(element),
      );
    }
    return current;
  }, []);

  const run = useCallback(
    (command: string, value?: string) => {
      const current = prepare();
      if (!current) return;
      document.execCommand("styleWithCSS", false, "true");
      const applied = document.execCommand(command, false, value);
      if (!applied && command === "hiliteColor")
        document.execCommand("backColor", false, value);
      current.emit();
      rememberSelection(current.element);
    },
    [prepare, rememberSelection],
  );

  const clearFormat = useCallback(() => {
    const current = prepare();
    if (!current) return;
    const range = selectionInside(current.element);
    const all = document.createRange();
    all.selectNodeContents(current.element);
    const wholeField =
      !range || range.collapsed || range.toString() === all.toString();

    if (
      !current.block &&
      wholeField &&
      !current.element.querySelector("img,hr,table")
    ) {
      const text = current.element.innerText;
      current.element.textContent = text;
      all.selectNodeContents(current.element);
      restoreSelection(current.element, all);
      current.emit();
      rememberSelection(current.element);
      return;
    }
    if (!range || range.collapsed) restoreSelection(current.element, all);
    document.execCommand("removeFormat", false);
    document.execCommand("unlink", false);
    if (current.block) {
      for (const list of ["insertUnorderedList", "insertOrderedList"])
        if (document.queryCommandState(list)) document.execCommand(list, false);
      if (!document.queryCommandState("justifyLeft"))
        document.execCommand("justifyLeft", false);
      if (document.queryCommandValue("formatBlock") !== "p")
        document.execCommand("formatBlock", false, "p");
    }
    current.emit();
    rememberSelection(current.element);
  }, [prepare, rememberSelection]);

  const editLink = useCallback(() => {
    const current = prepare();
    if (!current || current.element.dataset.richLinks === "off") return;
    const node = selectionInside(current.element)?.startContainer;
    const element = node instanceof Element ? node : node?.parentElement;
    const previous = element?.closest("a")?.getAttribute("href") ?? "";
    const href = window.prompt("Indirizzo del link", previous)?.trim();
    if (href === undefined) return;
    if (!href) run("unlink");
    else if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href))
      run("createLink", href);
  }, [prepare, run]);

  const value = useMemo(
    () => ({
      register,
      unregister,
      rememberSelection,
      run,
      editLink,
      clearFormat,
    }),
    [register, unregister, rememberSelection, run, editLink, clearFormat],
  );

  return (
    <FormatToolContext.Provider value={value}>
      {children}
      {activeTarget && (
        <FormatTool
          block={activeTarget.block}
          link={activeTarget.element.dataset.richLinks !== "off"}
          host={activeTarget.element.closest("dialog[open]") ?? document.body}
          state={state}
        />
      )}
    </FormatToolContext.Provider>
  );
}

const inlineControls = [
  {
    label: "Font",
    command: "fontName",
    options: [
      ["Arial", "Arial"],
      ["Georgia", "Georgia"],
      ["Verdana", "Verdana"],
      ["Courier New", "Courier New"],
    ],
  },
  {
    label: "Dimensione testo",
    command: "fontSize",
    options: [
      ["1", "Minima"],
      ["2", "Piccola"],
      ["3", "Normale"],
      ["4", "Media"],
      ["5", "Grande"],
      ["6", "Molto grande"],
      ["7", "Massima"],
    ],
  },
] as const;

const blockControls = [
  {
    label: "Paragrafo o titolo",
    command: "formatBlock",
    options: [
      ["p", "Paragrafo"],
      ["h1", "Titolo H1"],
      ["h2", "Titolo H2"],
      ["h3", "Titolo H3"],
      ["h4", "Titolo H4"],
    ],
  },
  {
    label: "Allineamento",
    options: [
      ["justifyLeft", "Sinistra"],
      ["justifyCenter", "Centrato"],
      ["justifyRight", "Destra"],
      ["justifyFull", "Giustificato"],
    ],
  },
  {
    label: "Elenchi",
    options: [
      ["insertUnorderedList", "Puntato"],
      ["insertOrderedList", "Numerato"],
    ],
  },
] as const;

const toolbarWidth = 520;

function placeTool(el: HTMLElement, x: number, y: number) {
  const width = el.offsetWidth || toolbarWidth;
  const height = el.offsetHeight || 48;
  const nextX = Math.min(
    Math.max(8, window.innerWidth - width - 8),
    Math.max(8, x),
  );
  const nextY = Math.min(
    Math.max(8, window.innerHeight - height - 8),
    Math.max(8, y),
  );
  el.style.left = `${nextX}px`;
  el.style.top = `${nextY}px`;
  return { x: nextX, y: nextY };
}

function FormatTool({
  block,
  link,
  host,
  state,
}: {
  block: boolean;
  link: boolean;
  host: Element;
  state: FormatState | null;
}) {
  const api = useFormatTool()!;
  const panel = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 24, y: 96 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    let next = { x: window.innerWidth - toolbarWidth - 16, y: 88 };
    try {
      const stored = window.sessionStorage.getItem("admin-format-tool-pos");
      if (stored) {
        const parsed = JSON.parse(stored) as { x: number; y: number };
        if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y))
          next = parsed;
      }
    } catch {
      // The toolbar can still be moved when storage is unavailable.
    }
    pos.current = next;
    const place = () => {
      if (panel.current) placeTool(panel.current, pos.current.x, pos.current.y);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [host]);

  const stopDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    panel.current?.classList.remove("is-dragging");
    try {
      window.sessionStorage.setItem(
        "admin-format-tool-pos",
        JSON.stringify(pos.current),
      );
    } catch {
      // The current position remains usable.
    }
  };

  const tool = (
    <div
      ref={panel}
      className="format-tool"
      role="toolbar"
      aria-label="Formattazione testo"
      onPointerDownCapture={() => api.rememberSelection()}
    >
      <button
        type="button"
        className="format-tool-handle"
        aria-label="Trascina barra formattazione"
        onPointerDown={(event) => {
          event.preventDefault();
          const el = panel.current;
          if (!el || event.button !== 0) return;
          const rect = el.getBoundingClientRect();
          drag.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
          el.classList.add("is-dragging");
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current || !panel.current) return;
          pos.current = placeTool(
            panel.current,
            event.clientX - drag.current.x,
            event.clientY - drag.current.y,
          );
        }}
        onLostPointerCapture={stopDrag}
      >
        ⋮⋮
      </button>
      <div className="format-tool-body">
        <div className="format-tool-row">
          <button
            type="button"
            className="format-tool-btn"
            aria-label="Grassetto"
            title="Grassetto"
            aria-pressed={state?.active.includes("bold") ?? false}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => api.run("bold")}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            className="format-tool-btn"
            aria-label="Corsivo"
            title="Corsivo"
            aria-pressed={state?.active.includes("italic") ?? false}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => api.run("italic")}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            className="format-tool-btn"
            aria-label="Sottolineato"
            title="Sottolineato"
            aria-pressed={state?.active.includes("underline") ?? false}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => api.run("underline")}
          >
            <Underline size={14} />
          </button>
          <label className="format-tool-color" title="Colore testo">
            <span className="sr-only">Colore testo</span>
            <span
              className="format-tool-swatch"
              style={{ backgroundColor: state?.foreColor ?? "#17263b" }}
            />
            <input
              type="color"
              value={state?.foreColor ?? "#17263b"}
              onChange={(event) => api.run("foreColor", event.target.value)}
            />
          </label>
          <label className="format-tool-color" title="Evidenzia">
            <span className="sr-only">Evidenzia</span>
            <Highlighter size={12} aria-hidden />
            <span
              className="format-tool-swatch"
              style={{ backgroundColor: state?.hiliteColor ?? "#fff2ae" }}
            />
            <input
              type="color"
              value={state?.hiliteColor ?? "#fff2ae"}
              onChange={(event) => api.run("hiliteColor", event.target.value)}
            />
          </label>
          <button
            type="button"
            className="format-tool-btn"
            aria-label="Inserisci o modifica link"
            title="Link"
            disabled={!link}
            aria-pressed={state?.link ?? false}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => api.editLink()}
          >
            <Link2 size={14} />
          </button>
          <button
            type="button"
            className="format-tool-btn"
            aria-label="Reimposta stile selezione"
            title="Reimposta stile"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => api.clearFormat()}
          >
            <RemoveFormatting size={14} />
          </button>
        </div>
        <div className="format-tool-row">
          {inlineControls.map(({ label, command, options }) => (
            <select
              key={label}
              className={`format-tool-select${command === "fontSize" ? " format-tool-select-size" : ""}`}
              aria-label={label}
              value={state?.[command] ?? ""}
              onChange={(event) => api.run(command, event.currentTarget.value)}
            >
              <option value="" disabled>
                {label}
              </option>
              {state?.[command] &&
                !options.some(([value]) => value === state[command]) && (
                  <option value={state[command]} disabled>
                    {state[command]}
                  </option>
                )}
              {options.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          ))}
          {blockControls.map((control) => (
            <select
              key={control.label}
              className="format-tool-select"
              aria-label={control.label}
              value={
                (state &&
                  ("command" in control
                    ? state.formatBlock
                    : (control.options.find(([value]) =>
                        state.active.includes(value),
                      )?.[0] ??
                      (control.label === "Elenchi" ? "none" : "")))) ||
                ""
              }
              disabled={!block}
              onChange={(event) => {
                const value = event.currentTarget.value;
                if ("command" in control) api.run(control.command, value);
                else if (value === "none") {
                  const list = state?.active.find(
                    (command) =>
                      command === "insertOrderedList" ||
                      command === "insertUnorderedList",
                  );
                  if (list) api.run(list);
                } else api.run(value);
              }}
            >
              <option value="" disabled>
                {control.label}
              </option>
              {"command" in control &&
                state?.formatBlock &&
                !control.options.some(
                  ([value]) => value === state.formatBlock,
                ) && (
                  <option value={state.formatBlock} disabled>
                    {state.formatBlock}
                  </option>
                )}
              {control.label === "Elenchi" && (
                <option value="none">Nessun elenco</option>
              )}
              {control.options.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(tool, host);
}
