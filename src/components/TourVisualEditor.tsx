"use client";
import { RichTextEditor } from "./RichTextEditor";
import { useEffect, useRef, useState } from "react";
import type { CatalogTour } from "@/lib/platform/model";
import { readContentPath, writeContentPath } from "@/lib/visual-content";
import { minutesToLabel } from "@/lib/format";
import { ImageSourceField } from "./ImageSourceField";
import { AdminNotice } from "./AdminNotice";

type Editing = { path: string; kind: string; value: string };
export function TourVisualEditor({
  tour,
  previewTour,
  isNew,
  change,
  onUploading,
}: {
  tour: CatalogTour;
  previewTour: CatalogTour;
  isNew: boolean;
  change: (key: keyof CatalogTour, value: unknown) => void;
  onUploading: (busy: boolean) => void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null),
    stage = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const source = useRef(tour),
    changeRef = useRef(change),
    cleanup = useRef<() => void>(() => {});
  const [url] = useState(
    `/tour/${previewTour.slug}?cms-preview=1&cms-tour=${encodeURIComponent(tour.id)}${isNew ? "&cms-new=1" : ""}`,
  );
  const [editing, setEditing] = useState<Editing | null>(null),
    [value, setValue] = useState(""),
    [uploading, setUploading] = useState(false),
    [notice, setNotice] = useState("");
  const [frameWidth, setFrameWidth] = useState(0),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setFrameWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  function paint() {
    const doc = iframe.current?.contentDocument;
    if (!doc) return;
    for (const node of doc.querySelectorAll<HTMLElement>("[data-tour-field]")) {
      const path = node.dataset.tourField!;
      const stored = readContentPath(source.current, path.split("."));
      if (stored === undefined) continue;
      const next = String(stored ?? "");
      if (node.dataset.tourKind === "image") {
        const current = node.getAttribute("src") || "";
        const decoded = current.startsWith("/_next/image")
          ? new URL(current, location.origin).searchParams.get("url")
          : current;
        if (decoded !== next) {
          node.removeAttribute("srcset");
          node.setAttribute("src", next);
        }
      } else if (node.dataset.tourKind === "html") {
        if (node.dataset.tourPainted !== next) {
          node.innerHTML = next;
          node.dataset.tourPainted = next;
        }
      } else {
        const text =
          path === "durationMinutes" ? minutesToLabel(Number(stored)) : next;
        if (node.textContent !== text) node.textContent = text;
      }
    }
  }
  useEffect(() => {
    source.current = tour;
    changeRef.current = change;
    if (ready) paint();
  }, [tour, change, ready]);
  useEffect(() => {
    if (editing) dialog.current?.showModal();
  }, [editing]);
  useEffect(() => () => cleanup.current(), []);
  function connect() {
    cleanup.current();
    const doc = iframe.current?.contentDocument;
    if (!doc) return;
    const style = doc.createElement("style");
    style.textContent =
      "[data-tour-field]{white-space:pre-wrap}[data-tour-field]:hover{outline:2px dashed #0b83a6;outline-offset:4px;cursor:text}.consent-banner,.consent-settings{display:none!important}";
    doc.head.append(style);
    const double = (event: MouseEvent) => {
      const node = (event.target as Element).closest<HTMLElement>(
        "[data-tour-field]",
      );
      if (!node) return;
      event.preventDefault();
      event.stopPropagation();
      const path = node.dataset.tourField!,
        kind = node.dataset.tourKind || "text";
      const stored = readContentPath(source.current, path.split("."));
      const text = String(stored ?? (kind === "html" ? node.querySelector(".rich-content")?.innerHTML || node.innerHTML : ""));
      setNotice("");
      setValue(text);
      setEditing({ path, kind, value: text });
    };
    const click = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest("[data-tour-field]")) {
        if (
          target.closest<HTMLElement>("[data-tour-field]")?.dataset.tourKind ===
            "image" &&
          target.closest("button") &&
          !target.closest("form")
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const anchor = target.closest("a");
      if (anchor && !anchor.getAttribute("href")?.startsWith("#")) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (target.closest("form button")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const submit = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    doc.addEventListener("dblclick", double, true);
    doc.addEventListener("click", click, true);
    doc.addEventListener("submit", submit, true);
    let pending = false;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        paint();
      });
    });
    observer.observe(doc.body, { childList: true, subtree: true });
    cleanup.current = () => {
      observer.disconnect();
      doc.removeEventListener("dblclick", double, true);
      doc.removeEventListener("click", click, true);
      doc.removeEventListener("submit", submit, true);
    };
    paint();
    setReady(true);
  }
  function apply() {
    if (!editing) return;
    const draft = structuredClone(source.current),
      path = editing.path.split("."),
      root = path[0] as keyof CatalogTour;
    const next = editing.kind === "number" ? Number(value) : value;
    if (
      editing.kind === "number" &&
      (!value.trim() || !Number.isFinite(next) || Number(next) < 0)
    )
      return;
    writeContentPath(draft, path, next);
    changeRef.current(root, draft[root]);
    if (editing.kind === "html") {
      const parsed = new DOMParser().parseFromString(
        value.replace(/<\/(?:p|div|h[1-6]|li)>|<br\s*\/?>/gi, "$&\n"),
        "text/html",
      );
      const plain = parsed.body.textContent?.trim() || "";
      if (editing.path === "descriptionHtml") changeRef.current("description", plain);
      if (root === "formattedCopy" && path[1] in draft) {
        writeContentPath(draft, path.slice(1), plain);
        const field = path[1] as keyof CatalogTour;
        changeRef.current(field, draft[field]);
      }
      if (root === "contentBlocks") {
        writeContentPath(draft, [...path.slice(0, -1), "text"], plain);
        changeRef.current(root, draft[root]);
      }
    }
    setEditing(null);
    setNotice("Bozza aggiornata. Salva il tour per pubblicare.");
  }
  const scale = frameWidth ? Math.min(1, frameWidth / 1440) : 1;
  return (
    <div className="tour-visual-editor">
      <div className="tour-visual-stage" ref={stage}>
        <iframe
          ref={iframe}
          title="Contenuto pubblico del tour modificabile"
          src={url}
          onLoad={connect}
          style={{
            width: 1440,
            height: `${100 / scale}%`,
            transform: `scale(${scale})`,
            pointerEvents: ready ? "auto" : "none",
          }}
        />
      </div>
      {notice && <AdminNotice key={notice} message={notice} />}
      {editing && (
        <dialog
          ref={dialog}
          className="tour-edit-dialog"
          onCancel={(e) => {
            e.preventDefault();
            if (!uploading) setEditing(null);
          }}
        >
          <h2>
            {editing.kind === "image"
              ? "Modifica foto"
              : editing.kind === "html"
                ? "Modifica testo formattato"
                : "Modifica contenuto"}
          </h2>
          {editing.kind === "image" ? (
            <ImageSourceField
              label="Foto"
              value={value}
              onChange={setValue}
              onNotice={setNotice}
              onUploading={(busy) => {
                setUploading(busy);
                onUploading(busy);
              }}
              required
            />
          ) : editing.kind === "html" ? (
              <RichTextEditor label="Testo formattato" html={value} onChange={setValue} />
          ) : (
            <label>
              {editing.kind === "number" ? "Valore (minuti)" : "Testo"}
              {editing.kind === "number" ? (
                <input
                  className="text-input"
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              ) : (
                <textarea
                  className="text-input"
                  rows={6}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
            </label>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              className="button-secondary"
              disabled={uploading}
              onClick={() => setEditing(null)}
            >
              Annulla
            </button>
            <button
              type="button"
              className="button-primary"
              disabled={uploading || !value.trim()}
              onClick={apply}
            >
              Applica alla bozza
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
