"use client";
import { RichTextEditor } from "./RichTextEditor";
import { InlineRichField } from "./InlineRichField";
import { readRichTextField } from "./useRichTextField";
import { hasInlineFormatting, paintPreviewText, previewInlineValue, removedFieldCss } from "./previewText";
import { richHasText } from "@/lib/rich-text";
import { useEffect, useRef, useState } from "react";
import type { CatalogTour } from "@/lib/platform/model";
import { readContentPath, writeContentPath } from "@/lib/visual-content";
import { minutesToLabel } from "@/lib/format";
import { ImageSourceField } from "./ImageSourceField";
import { AdminNotice } from "./AdminNotice";
import { createPortal } from "react-dom";
import { observePreviewMounts } from "./CmsPreviewMount";
import { TourEditableText, tourTextHtml } from "./TourEditableText";
import { TourCard } from "./TourCard";
import { TourGallery } from "./TourGallery";
import { tourPhotos } from "@/lib/tour-gallery";
import { sampleParagraph } from "@/lib/content-placeholders";
import {
  TourInfoList,
  TourItinerary,
  tourInfoEntries,
} from "./TourDetailLists";

const listLabels = {
  highlights: "Tappa dell’itinerario",
  inclusions: "Servizio incluso",
  exclusions: "Servizio escluso",
  safetyNotes: "Informazione pratica",
} as const;
type ListField = keyof typeof listLabels;
type PreviewMount = ListField | "card" | "gallery";

type Editing = { path: string; kind: string; altPath?: string[]; link?: boolean };
export function TourVisualEditor({
  tour,
  previewTour,
  isNew,
  variant = "page",
  change,
  onUploading,
}: {
  tour: CatalogTour;
  previewTour: CatalogTour;
  isNew: boolean;
  variant?: "page" | "card";
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
    `/tour/${previewTour.slug}?cms-preview=1&cms-tour=${encodeURIComponent(tour.id)}${isNew ? "&cms-new=1" : ""}${variant === "card" ? "&cms-card=1" : ""}`,
  );
  const [editing, setEditing] = useState<Editing | null>(null),
    [value, setValue] = useState(""),
    [alt, setAlt] = useState(""),
    [uploading, setUploading] = useState(false),
    [notice, setNotice] = useState("");
  const [frameWidth, setFrameWidth] = useState(0),
    [ready, setReady] = useState(false);
  const [mounts, setMounts] = useState<
    Partial<Record<PreviewMount, HTMLElement>>
  >({});
  const [list, setList] = useState<ListField>("highlights");
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setFrameWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  function paint(doc = iframe.current?.contentDocument) {
    if (!doc) return;
    const hidden = new Set(source.current.hiddenText);
    for (const node of doc.querySelectorAll<HTMLElement>("[data-tour-field]")) {
      const path = node.dataset.tourField!;
      node.toggleAttribute("data-cms-removed", hidden.has(path));
      if (node.closest("[id^=cms-tour-]")) continue;
      const kind = node.dataset.tourKind;
      const stored = readContentPath(source.current, path.split("."));
      if (kind === "plain") {
        const html = tourTextHtml(source.current, path);
        if (html) paintPreviewText(node, html, "inline");
        else if (stored != null || node.dataset.tourFallback !== undefined)
          paintPreviewText(node, String(stored || node.dataset.tourFallback || ""), "text");
        continue;
      }
      if (stored == null) continue;
      if (stored === "") {
        if (kind !== "image") paintPreviewText(node, "", "text");
        continue;
      }
      const next = String(stored);
      if (node.dataset.tourKind === "image") {
        const current = node.getAttribute("src") || "";
        const decoded = current.startsWith("/_next/image")
          ? new URL(current, location.origin).searchParams.get("url")
          : current;
        if (path.startsWith("contentBlocks.")) {
          const altPath = [...path.split(".").slice(0, -1), "alt"];
          const description = readContentPath(source.current, altPath);
          if (
            typeof description === "string" &&
            node.getAttribute("alt") !== description
          )
            node.setAttribute("alt", description);
        }
        if (decoded !== next) {
          node.removeAttribute("srcset");
          node.setAttribute("src", next);
        }
      } else if (kind === "html" || kind === "inline") {
        if (kind === "html" || richHasText(next)) paintPreviewText(node, next, kind);
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
  }, [tour, change, ready, mounts]);
  useEffect(() => {
    if (editing) dialog.current?.showModal();
  }, [editing]);
  useEffect(() => () => cleanup.current(), []);
  function connect() {
    cleanup.current();
    const doc = iframe.current?.contentDocument;
    if (!doc?.body) return;
    const stopWatchingMount = observePreviewMounts(doc, () => {
      const next: Partial<Record<PreviewMount, HTMLElement>> = {};
      for (const key of [
        "card",
        "gallery",
        "highlights",
        "inclusions",
        "exclusions",
        "safetyNotes",
      ] as const) {
        const el = doc.querySelector<HTMLElement>(
          `#cms-tour-${key}[data-cms-mounted]`,
        );
        if (el) next[key] = el;
      }
      setMounts(next);
      if (next.gallery || next.card) setReady(true);
    });
    doc.body.setAttribute("data-cms-editor", "");
    const style = doc.createElement("style");
    style.textContent = removedFieldCss +
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
      const fromDom =
        kind === "html"
          ? node.querySelector(".rich-content")?.innerHTML || node.innerHTML
          : kind === "inline" || kind === "plain"
            ? previewInlineValue(node)
            : kind === "image"
            ? new URL(
                node.getAttribute("src") || "",
                location.origin,
              ).searchParams.get("url") ||
              node.getAttribute("src") ||
              ""
            : node.innerText || "";
      const raw =
        (kind === "plain" && tourTextHtml(source.current, path)) ||
        (typeof stored === "string" && (kind === "plain" || richHasText(stored))
          ? stored
          : stored != null && stored !== "" && kind !== "html"
            ? String(stored)
            : fromDom);
      // Prefer sibling plain field when html slot is empty but page shows plain.
      let text = String(raw || "");
      if (kind === "html" && !richHasText(text)) {
        if (path === "descriptionHtml") {
          const plain = readContentPath(source.current, ["description"]);
          if (typeof plain === "string" && plain.trim()) text = plain;
        } else if (path.startsWith("formattedCopy.")) {
          const sibling = path.replace(/^formattedCopy\./, "").split(".");
          const plain = readContentPath(source.current, sibling);
          if (typeof plain === "string" && plain.trim()) text = plain;
          else if (Array.isArray(plain)) text = plain.join("\n");
        }
      }
      if (!text.trim() && kind !== "plain") text = fromDom;
      setNotice("");
      setValue(source.current.hiddenText?.includes(path) ? "" : text);
      const parts = path.split(".");
      const altPath =
        kind === "image" &&
        (parts[0] === "galleryImages" || parts[0] === "contentBlocks")
          ? [...parts.slice(0, -1), "alt"]
          : undefined;
      setAlt(
        altPath ? String(readContentPath(source.current, altPath) ?? "") : "",
      );
      setEditing({ path, kind, altPath, link: !node.closest("a,button") });
    };
    const click = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest("[data-tour-field]")) {
        if (
          target.closest<HTMLElement>("[data-tour-field]")?.dataset.tourKind ===
            "image" &&
          target.closest("#cms-tour-gallery button")
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
        if (doc.querySelector("[data-cms-mounted]")) paint(doc);
      });
    });
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
    cleanup.current = () => {
      observer.disconnect();
      stopWatchingMount();
      doc.removeEventListener("dblclick", double, true);
      doc.removeEventListener("click", click, true);
      doc.removeEventListener("submit", submit, true);
    };
  }
  function apply() {
    if (!editing) return;
    if (
      editing.kind === "image" &&
      !/^(?:\/(?!\/)|https:\/\/)/i.test(value.trim())
    ) {
      setNotice("Inserisci un percorso immagine o un URL HTTPS.");
      return;
    }
    const path = editing.path.split(".");
    const root = path[0] as keyof CatalogTour;
    const field = dialog.current?.querySelector<HTMLElement>("[contenteditable='true']");
    const formatted = field ? readRichTextField(field) : undefined;
    const hasMedia = Boolean(field?.querySelector("img,hr,table"));
    const hidden = source.current.hiddenText ?? [];
    const wasHidden = hidden.includes(editing.path);
    if (formatted && !formatted.plain && !hasMedia) {
      if (!wasHidden) changeRef.current("hiddenText", [...hidden, editing.path]);
      setEditing(null);
      setNotice("Testo rimosso dalla bozza. Salva il tour per pubblicare.");
      return;
    }
    if (wasHidden) changeRef.current("hiddenText", hidden.filter((path) => path !== editing.path));

    const draft = structuredClone(source.current);
    const next =
      editing.kind === "number"
        ? Number(value)
        : editing.kind === "plain" || editing.kind === "image"
          ? value.trim()
          : value;
    if (
      editing.kind === "number" &&
      (!value.trim() || !Number.isFinite(next) || Number(next) < 0)
    )
      return;
    if (root === "highlightGalleries")
      draft.highlightGalleries = draft.highlights.map(
        (_, index) => draft.highlightGalleries?.[index] ?? [],
      );
    if (editing.altPath) writeContentPath(draft, editing.altPath, alt);
    if (formatted && editing.kind === "plain") {
      const { plain, html } = formatted;
      const rich = hasInlineFormatting(html) ? html : "";
      writeContentPath(draft, path, plain);
      if (root === "itineraryGroups") {
        writeContentPath(draft, [...path.slice(0, -1), "titleHtml"], rich || undefined);
      } else if (root === "fareRequirements" || root === "cancellationClause") {
        changeRef.current("formattedCopy", { [root]: rich });
      } else {
        const labels = { ...draft.formattedCopy?.labels };
        const key = editing.path.replaceAll(".", "-");
        if (rich) labels[key] = rich;
        else delete labels[key];
        changeRef.current("formattedCopy", { labels });
      }
      changeRef.current(root, draft[root]);
    } else if (formatted && (editing.kind === "html" || editing.kind === "inline")) {
      const { plain, html } = formatted;
      const rich = plain || hasMedia ? html : "";
      if (editing.path === "descriptionHtml") {
        changeRef.current("descriptionHtml", rich || "");
        changeRef.current("description", plain);
      } else if (
        root === "formattedCopy" &&
        path.length === 3 &&
        Object.hasOwn(listLabels, path[1])
      ) {
        const field = path[1] as ListField;
        const index = Number(path[2]);
        const lines = [...(tour[field] ?? [])];
        const htmls = [
          ...(tour.formattedCopy?.[field] ?? lines.map(() => null)),
        ];
        while (lines.length <= index) lines.push("");
        while (htmls.length <= index) htmls.push(null);
        lines[index] = plain;
        htmls[index] = rich || null;
        changeRef.current(field, lines);
        // Solo il campo lista: il merge in TourEditor conserva il resto.
        changeRef.current("formattedCopy", { [field]: htmls });
      } else if (root === "formattedCopy" && path.length === 2) {
        const field = path[1] as keyof CatalogTour;
        changeRef.current(field, plain);
        changeRef.current("formattedCopy", { [field]: rich || null });
        if (field === "title" && tour.cardPreview)
          changeRef.current("cardPreview", { ...tour.cardPreview, title: rich || plain });
      } else if (root === "contentBlocks") {
        const leaf = path.at(-1);
        const plainField =
          leaf === "headingHtml"
            ? "heading"
            : leaf === "captionHtml"
              ? "caption"
              : "text";
        writeContentPath(draft, path, rich || plain);
        writeContentPath(draft, [...path.slice(0, -1), plainField], plain);
        changeRef.current(root, draft[root]);
      } else if (editing.path === "cardPreview.title") {
        changeRef.current("title", plain);
        changeRef.current("formattedCopy", { title: rich || null });
        changeRef.current("cardPreview", {
          ...tour.cardPreview,
          title: rich || plain,
        });
      } else if (editing.path === "cardPreview.description") {
        changeRef.current("shortDescription", plain);
        changeRef.current("formattedCopy", {
          shortDescription: rich || null,
        });
        changeRef.current("cardPreview", {
          ...tour.cardPreview,
          description: rich || plain,
        });
      } else {
        writeContentPath(draft, path, rich || plain);
        changeRef.current(root, draft[root]);
      }
    } else {
      writeContentPath(draft, path, next);
      changeRef.current(root, draft[root]);
    }
    setEditing(null);
    setNotice("Bozza aggiornata. Salva il tour per pubblicare.");
  }
  const gallery = tour.galleryImages ?? [];
  const photos = tourPhotos(tour);
  const galleryIndex = editing?.path.startsWith("galleryImages.")
    ? Number(editing.path.split(".")[1])
    : -1;
  function updateGallery(index: number, offset?: number) {
    const next = [...gallery];
    if (offset === undefined) next.splice(index, 1);
    else
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
    change("galleryImages", next);
    setEditing(null);
  }
  function addPhoto() {
    setAlt("");
    setValue("");
    setEditing({
      path: `galleryImages.${gallery.length}.url`,
      kind: "image",
      altPath: ["galleryImages", String(gallery.length), "alt"],
    });
  }
  function addEntry() {
    const lines = tour[list] ?? [];
    const sampleHtml = `<p>${sampleParagraph}</p>`;
    const nextLines = [...lines, sampleParagraph];
    change(list, nextLines);
    // Stesso percorso delle voci seed: HTML parallelo così il rendering
    // passa da RichContent + lista con icona/indentazione, non testo grezzo.
    change("formattedCopy", {
      [list]: [
        ...lines.map(
          (_, index) =>
            tour.formattedCopy?.[list]?.[index] ??
            (lines[index] ? `<p>${lines[index]}</p>` : null),
        ),
        sampleHtml,
      ],
    });
    if (list === "highlights") {
      change("highlightGalleries", [
        ...lines.map((_, index) => tour.highlightGalleries?.[index] ?? []),
        [],
      ]);
      if (!tour.itineraryGroups?.length) {
        change("itineraryGroups", [{ title: "Itinerario", start: 0 }]);
      }
      const preview = tour.cardPreview;
      if (preview?.itinerary != null) {
        change("cardPreview", {
          ...preview,
          itinerary: `<ul>${nextLines
            .map((line) => `<li>${line}</li>`)
            .join("")}</ul>`,
        });
      }
    }
  }
  const fieldPath =
    editing?.path.replace(/^formattedCopy\./, "").split(".") ?? [];
  const entryField = fieldPath[0] as ListField;
  const entryIndex = Number(fieldPath[1]);
  const listEntry =
    Object.hasOwn(listLabels, entryField) && Number.isInteger(entryIndex);

  function removeEntry() {
    const lines = tour[entryField] ?? [];
    change(
      entryField,
      lines.filter((_, index) => index !== entryIndex),
    );
    change("formattedCopy", {
      [entryField]: lines
        .map((_, index) => tour.formattedCopy?.[entryField]?.[index] ?? null)
        .filter((_, index) => index !== entryIndex),
    });
    const groupIndices = new Map<number, number>();
    if (entryField === "highlights") {
      change(
        "highlightGalleries",
        tour.highlightGalleries?.filter((_, index) => index !== entryIndex),
      );
      const starts = new Set<number>();
      const groups = tour.itineraryGroups?.flatMap((group, index) => {
        const start = group.start > entryIndex ? group.start - 1 : group.start;
        if (start >= lines.length - 1 || starts.has(start)) return [];
        groupIndices.set(index, starts.size);
        starts.add(start);
        return [{ ...group, start }];
      });
      change("itineraryGroups", groups);
    }
    if (tour.hiddenText?.length) {
      const entryPrefix = `formattedCopy.${entryField}.`;
      const hiddenText = tour.hiddenText.flatMap((path) => {
        if (path.startsWith(entryPrefix)) {
          const index = Number(path.slice(entryPrefix.length));
          if (!Number.isInteger(index)) return [path];
          return index === entryIndex ? [] : [`${entryPrefix}${index > entryIndex ? index - 1 : index}`];
        }
        if (entryField === "highlights" && path.startsWith("itineraryGroups.")) {
          const index = groupIndices.get(Number(path.split(".")[1]));
          return index === undefined ? [] : [`itineraryGroups.${index}.title`];
        }
        return [path];
      });
      change("hiddenText", hiddenText);
    }
    setEditing(null);
  }
  function addFact() {
    const preview = tour.cardPreview ?? {};
    change("cardPreview", {
      ...preview,
      facts: [...(preview.facts ?? []), "Lorem ipsum"],
    });
  }
  const scale = frameWidth ? Math.min(1, frameWidth / 1440) : 1;
  return (
    <div className="tour-visual-editor">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          Fai doppio clic su un testo o su una foto per modificarli.
        </p>
        {variant === "page" ? (
          <>
            <button
              type="button"
              className="button-secondary"
              disabled={gallery.length >= 20}
              onClick={addPhoto}
            >
              Aggiungi foto alla galleria
            </button>
            <div className="tour-visual-list-actions">
              <select
                className="text-input"
                aria-label="Tipo di voce da aggiungere"
                value={list}
                onChange={(e) => setList(e.target.value as ListField)}
              >
                {Object.entries(listLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button-secondary"
                disabled={(tour[list]?.length ?? 0) >= 30}
                onClick={addEntry}
              >
                Aggiungi voce
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="button-secondary"
              disabled={(tour.cardPreview?.facts?.length ?? 0) >= 30}
              onClick={addFact}
            >
              Aggiungi informazione alla card
            </button>
            {tour.cardPreview?.facts !== undefined && (
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  change("cardPreview", {
                    ...tour.cardPreview,
                    facts: undefined,
                  })
                }
              >
                Usa le informazioni del tour
              </button>
            )}
          </>
        )}
      </div>
      <div className="tour-visual-stage" ref={stage}>
        <iframe
          ref={iframe}
          title={
            variant === "card"
              ? "Card del tour modificabile"
              : "Contenuto pubblico del tour modificabile"
          }
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
      {mounts.card &&
        createPortal(<TourCard tour={tour} editable />, mounts.card)}
      {mounts.highlights &&
        createPortal(<TourItinerary tour={tour} editable />, mounts.highlights)}
      {(["inclusions", "exclusions", "safetyNotes"] as const).map((field) => {
        const target = mounts[field];
        if (!target) return null;
        const heading =
          field === "exclusions" && tourInfoEntries(tour, field).length > 0 ? (
            <h3 className="display-sm mb-3 mt-5">
              <TourEditableText tour={tour} path="detailCopy.headingEscluso" text={tour.detailCopy?.headingEscluso?.trim() || "Non incluso"} />
            </h3>
          ) : undefined;
        return createPortal(
          <TourInfoList tour={tour} field={field} heading={heading} />,
          target,
          field,
        );
      })}
      {mounts.gallery &&
        createPortal(
          <TourGallery
            key={gallery.length}
            editable
            title={tour.title}
            photos={photos}
            editPaths={photos.map((photo) =>
              photo.url === tour.imageUrl
                ? "imageUrl"
                : `galleryImages.${gallery.findIndex((item) => item.url === photo.url)}.url`,
            )}
          />,
          mounts.gallery,
        )}
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
          <div className="tour-edit-dialog-scroll">
          <h2>
            {editing.kind === "image"
              ? "Modifica foto"
              : editing.kind === "html"
                ? "Modifica testo formattato"
                : "Modifica contenuto"}
          </h2>
          {editing.kind === "image" ? (
            <ImageSourceField
              key={editing.path}
              label="Foto"
              value={value}
              alt={editing.altPath ? alt : undefined}
              onAltChange={editing.altPath ? setAlt : undefined}
              onChange={setValue}
              onNotice={setNotice}
              onUploading={(busy) => {
                setUploading(busy);
                onUploading(busy);
              }}
              required
            />
          ) : editing.kind === "html" ? (
            <RichTextEditor
              label="Testo formattato"
              html={richHasText(value) ? value : undefined}
              text={value}
              onChange={(html, plain) => setValue(plain ? html : plain)}
            />
          ) : editing.kind === "number" ? (
            <label>
              Valore (minuti)
              <input
                className="text-input"
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
          ) : (
            <InlineRichField
              label="Testo"
              link={editing.link}
              multiline
              html={
                richHasText(value) && /<[a-z][\s\S]*>/i.test(value)
                  ? value
                  : undefined
              }
              text={value}
              onChange={(html, plain) =>
                setValue(
                  editing.kind === "inline"
                    ? plain
                      ? html
                      : ""
                    : plain && /<[a-z][\s\S]*>/i.test(html)
                      ? html
                      : plain,
                )
              }
            />
          )}
          {galleryIndex >= 0 && galleryIndex < gallery.length && (
            <div className="flex gap-2">
              <button
                type="button"
                className="button-secondary"
                disabled={uploading || galleryIndex === 0}
                onClick={() => updateGallery(galleryIndex, -1)}
              >
                Sposta prima
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={uploading || galleryIndex === gallery.length - 1}
                onClick={() => updateGallery(galleryIndex, 1)}
              >
                Sposta dopo
              </button>
              <button
                type="button"
                className="button-secondary button-danger"
                disabled={uploading}
                onClick={() => updateGallery(galleryIndex)}
              >
                Rimuovi foto
              </button>
            </div>
          )}
          {listEntry && (
            <div className="flex gap-2">
              <button
                type="button"
                className="button-secondary button-danger"
                onClick={removeEntry}
              >
                Rimuovi voce
              </button>
              {entryField === "highlights" &&
                (tour.highlightGalleries?.[entryIndex]?.length ?? 0) < 4 && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => {
                      setValue("");
                      setEditing({
                        path: `highlightGalleries.${entryIndex}.${tour.highlightGalleries?.[entryIndex]?.length ?? 0}`,
                        kind: "image",
                      });
                    }}
                  >
                    Aggiungi foto alla tappa
                  </button>
                )}
            </div>
          )}
          {editing.path.startsWith("highlightGalleries.") &&
            typeof readContentPath(tour, editing.path.split(".")) ===
              "string" && (
              <button
                type="button"
                className="button-secondary button-danger"
                disabled={uploading}
                onClick={() => {
                  const [, row, photo] = editing.path.split(".").map(Number);
                  change(
                    "highlightGalleries",
                    tour.highlightGalleries?.map((images, index) =>
                      index === row
                        ? images.filter((_, index) => index !== photo)
                        : images,
                    ),
                  );
                  setEditing(null);
                }}
              >
                Rimuovi foto della tappa
              </button>
            )}
          {editing.path.startsWith("cardPreview.facts.") && (
            <button
              type="button"
              className="button-secondary button-danger"
              onClick={() => {
                change("cardPreview", {
                  ...tour.cardPreview,
                  facts: tour.cardPreview?.facts?.filter(
                    (_, index) => index !== Number(editing.path.split(".")[2]),
                  ),
                });
                setEditing(null);
              }}
            >
              Rimuovi informazione
            </button>
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
              disabled={
                uploading ||
                (editing.kind === "image" && !value.trim()) ||
                (editing.kind === "number" &&
                  (!value.trim() || Number(value) < 0 || !Number.isFinite(Number(value))))
              }
              onClick={apply}
            >
              Applica alla bozza
            </button>
          </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
