"use client";
import { RichTextEditor } from "./RichTextEditor";
import { AdminNotice } from "./AdminNotice";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { siteNavigation } from "@/lib/navigation";
import { ImageSourceField } from "./ImageSourceField";
import { pageLabels } from "@/lib/content-sections";
import { pageEditorKey } from "@/lib/content-routing";
import { guidePath, guideSlug, tourPath } from "@/lib/public-paths";
import { formatMoney } from "@/lib/format";
import { jsonEqual } from "@/lib/json-equal";
import {
  bindingId,
  readContentPath,
  type ContentBinding,
  type ContentPatch,
  type EditKind,
} from "@/lib/visual-content";
import type { SiteContent } from "@/lib/platform/content";
import type { ContentPage, EuropeanPartner } from "@/lib/platform/model";
import type { Tour } from "@/lib/types";
import css from "./visual-content-editor.module.css";
export type VisualContentChrome = {
  dirty: number;
  canSave: boolean;
  busy: boolean;
  href: string;
  save: () => void;
  discard: () => void;
};
export type VisualDestination = {
  group?: string;
  label: string;
  href: string;
  scope: "site" | "page" | "article";
  key: string;
};
export function visualDestinations(
  content: SiteContent,
  pages: Record<string, ContentPage>,
  tours: Pick<Tour, "slug" | "canonicalPath">[],
): VisualDestination[] {
  const base: VisualDestination[] = [
    { label: "Homepage", href: "/", scope: "site", key: "homepage" },
    { label: "Blog", href: "/blog", scope: "site", key: "blog" },
    { label: "FAQ", href: "/faq", scope: "site", key: "faq" },
    ...Object.entries(pageLabels).map(([key, label]) => ({
      label,
      href: key === "catalogo" ? "/tour" : `/${key}`,
      scope: "page" as const,
      key,
    })),
  ];
  const articles = content.gallery.map((a) => ({
    label: a.title,
    href: guidePath(a),
    scope: "article" as const,
    key: a.id || `guide:${guideSlug(a)}`,
  }));
  const occupied = new Set(
    [...base, ...articles, ...tours.map((t) => ({ href: tourPath(t) }))].map(
      (d) => d.href.replace(/\/$/, "") || "/",
    ),
  );
  const all: VisualDestination[] = [
    ...base,
    ...Object.entries(pages)
      .filter(
        ([k, p]) =>
          k.startsWith("legacy:") &&
          p.published &&
          p.canonicalPath &&
          !occupied.has(p.canonicalPath.replace(/\/$/, "")),
      )
      .map(([key, p]) => ({
        label: p.title,
        href: p.canonicalPath!,
        scope: "page" as const,
        key,
      })),
    ...articles,
  ];
  const ordered: VisualDestination[] = [],
    seen = new Set<string>();
  const append = (href: string, group: string) => {
    const d = all.find(
      (d) =>
        (d.href.replace(/\/$/, "") || "/") === (href.replace(/\/$/, "") || "/"),
    );
    if (d && !seen.has(d.href)) {
      seen.add(d.href);
      ordered.push({ ...d, group });
    }
  };
  append("/", "Homepage");
  for (const item of siteNavigation(
    content,
    tours.map((t) => ({ ...t, title: "" })),
  )) {
    append(item.href, item.label);
    for (const child of item.children ?? []) append(child.href, item.label);
  }
  for (const d of all)
    append(
      d.href,
      d.scope === "article" ? "Articoli del blog" : "Altre pagine",
    );
  return ordered;
}
function original(
  binding: ContentBinding,
  content: SiteContent,
  pages: Record<string, ContentPage>,
  partners: EuropeanPartner[] = [],
) {
  const root =
    binding.scope === "site"
      ? content
      : binding.scope === "page"
        ? pages[binding.key || ""]
        : binding.scope === "partner"
          ? partners.find((p) => p.id === binding.key)
          : content.gallery.find(
              (a) => (a.id || `guide:${guideSlug(a)}`) === binding.key,
            );
  return readContentPath(root, binding.path);
}
function nodeValue(node: HTMLElement, kind: EditKind) {
  if (node.dataset.cmsValue !== undefined) return node.dataset.cmsValue;
  if (kind === "image") {
    const img = node as HTMLImageElement;
    const url = img.getAttribute("src") || "";
    try {
      const parsed = new URL(url, location.origin);
      return parsed.pathname === "/_next/image"
        ? parsed.searchParams.get("url") || url
        : url;
    } catch {
      return url;
    }
  }
  if (kind === "link") return node.getAttribute("href") || "";
  if (kind === "html")
    return node.querySelector(".rich-content")?.innerHTML || node.innerHTML;
  return node.innerText;
}
const paintedHtml = new WeakMap<HTMLElement, string>();
function decorateRichImages(doc: Document) {
  for (const root of doc.querySelectorAll<HTMLElement>(
    '[data-cms-kind="html"]',
  ))
    root.querySelectorAll<HTMLElement>("img").forEach((image, index) => {
      image.dataset.cms = root.dataset.cms;
      image.dataset.cmsKind = "image";
      image.dataset.cmsRichImage = String(index);
    });
}
function paint(
  doc: Document | undefined | null,
  patches: Record<string, ContentPatch>,
) {
  if (!doc) return;
  for (const node of doc.querySelectorAll<HTMLElement>("[data-cms]")) {
    const patch = patches[node.dataset.cms!];
    if (!patch) continue;
    const value = String(patch.value ?? "");
    if (node.dataset.cmsRichImage !== undefined) continue;
    if (node.dataset.cmsKind === "link") {
      node.setAttribute("href", value);
    } else if (node.dataset.cmsKind === "image") {
      if (node.getAttribute("src") !== value) {
        node.removeAttribute("srcset");
        node.setAttribute("src", value);
      }
    } else if (node.dataset.cmsKind === "html") {
      if (paintedHtml.get(node) !== value) {
        node.innerHTML = value;
        paintedHtml.set(node, value);
      }
    } else {
      const text =
        node.dataset.cmsKind === "money"
          ? formatMoney(Number(patch.value), node.dataset.cmsCurrency || "EUR")
          : value;
      if (node.textContent !== text) node.textContent = text;
    }
  }
}
type Selection = {
  binding: ContentBinding;
  kind: EditKind;
  value: string;
  label: string;
  richImage?: number;
  currency?: string;
};
export function VisualContentEditor({
  content,
  pages,
  tours,
  partners = [],
  detail,
  busy,
  save,
  onChromeChange,
}: {
  content: SiteContent;
  pages: Record<string, ContentPage>;
  partners?: EuropeanPartner[];
  tours: Pick<Tour, "title" | "slug" | "canonicalPath">[];
  detail?: string;
  busy: boolean;
  save: (body: unknown) => Promise<unknown>;
  onChromeChange?: (chrome: VisualContentChrome | null) => void;
}) {
  const destinations = visualDestinations(content, pages, tours);
  const initial =
    destinations.find((d) => d.key === pageEditorKey(detail || "homepage")) ||
    destinations[0];
  const [destination, setDestination] = useState(initial),
    [width, setWidth] = useState("desktop"),
    [revision, setRevision] = useState(0);
  const [patches, setPatches] = useState<Record<string, ContentPatch>>({}),
    [selection, setSelection] = useState<Selection | null>(null),
    [value, setValue] = useState(""),
    [notice, setNotice] = useState(""),
    [uploading, setUploading] = useState(false),
    [settings, setSettings] = useState(false),
    [extras, setExtras] = useState<
      { binding?: ContentBinding; label: string; value: string }[]
    >([]);
  const stage = useRef<HTMLDivElement>(null);
  const seoDialog = useRef<HTMLDialogElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(750);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setAvailableWidth(entry.contentRect.width);
      setPreviewHeight(
        Math.max(550, entry.contentRect.height || window.innerHeight * 0.8),
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = seoDialog.current;
    if (!el) return;
    if (settings) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [settings]);
  const viewportWidth =
    width === "mobile" ? 390 : width === "tablet" ? 768 : 1440;
  const previewScale = availableWidth
    ? Math.min(1, availableWidth / viewportWidth)
    : 1;
  const [readySource, setReadySource] = useState("");
  const connected = useRef<Document | null>(null);
  const frame = useRef<HTMLIFrameElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    patchRef = useRef(patches),
    source = useRef({ content, pages, partners }),
    cleanup = useRef<() => void>(() => {});
  const dirty = Object.keys(patches).length;
  useEffect(() => {
    patchRef.current = patches;
    paint(frame.current?.contentDocument, patches);
    if (frame.current?.contentDocument)
      decorateRichImages(frame.current.contentDocument);
  }, [patches]);
  useEffect(() => {
    if (!dirty && !busy) source.current = { content, pages, partners };
  }, [content, pages, partners, dirty, busy]);

  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (Object.keys(patchRef.current).length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (
        !anchor ||
        anchor.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const url = new URL(anchor.href, location.origin);
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      if (
        !window.confirm(
          "Ci sono modifiche non salvate. Vuoi uscire e scartare la bozza?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [dirty]);
  useEffect(() => {
    if (selection) dialog.current?.showModal();
  }, [selection]);
  useEffect(() => () => cleanup.current(), []);
  function put(binding: ContentBinding, next: unknown) {
    const id = bindingId(binding),
      expected = original(
        binding,
        source.current.content,
        source.current.pages,
        source.current.partners,
      );
    const result = { ...patchRef.current };
    if (jsonEqual(expected, next)) delete result[id];
    else result[id] = { binding, expected, value: next };
    patchRef.current = result;
    setPatches(result);
  }
  function seedPage(binding: ContentBinding) {
    if (
      binding.scope !== "page" ||
      source.current.pages[binding.key!]?.published
    )
      return;
    const seen = new Set<string>();
    for (const node of frame.current?.contentDocument?.querySelectorAll<HTMLElement>(
      "[data-cms]",
    ) ?? []) {
      const b = JSON.parse(node.dataset.cms!) as ContentBinding;
      const id = bindingId(b);
      if (
        b.scope !== "page" ||
        b.key !== binding.key ||
        seen.has(id) ||
        patchRef.current[id]
      )
        continue;
      seen.add(id);
      put(b, nodeValue(node, (node.dataset.cmsKind || "text") as EditKind));
    }
  }
  function open(
    binding: ContentBinding,
    kind: EditKind,
    visible?: string,
    node?: HTMLElement,
  ) {
    const id = bindingId(binding);
    const stored =
      patchRef.current[id]?.value ??
      original(
        binding,
        source.current.content,
        source.current.pages,
        source.current.partners,
      );
    const next =
      kind === "money" && typeof stored === "number"
        ? String(stored / 100)
        : kind === "html" && typeof stored === "string" && stored
          ? stored
          : (visible ?? (typeof stored === "string" ? stored : ""));
    const richImage =
      node?.dataset.cmsRichImage !== undefined
        ? Number(node.dataset.cmsRichImage)
        : undefined;
    const additional: {
      binding?: ContentBinding;
      label: string;
      value: string;
    }[] = [];
    if (kind === "image") {
      const altBinding: ContentBinding | undefined =
        richImage !== undefined
          ? undefined
          : binding.scope !== "partner" && binding.path.at(-1) === "imageUrl"
            ? {
                ...binding,
                path:
                  binding.path.length === 1
                    ? ["imageAlt"]
                    : [...binding.path.slice(0, -1), "alt"],
              }
            : undefined;
      if (altBinding || richImage !== undefined)
        additional.push({
          binding: altBinding,
          label: "Testo alternativo",
          value: altBinding
            ? String(
                patchRef.current[bindingId(altBinding)]?.value ??
                  original(
                    altBinding,
                    source.current.content,
                    source.current.pages,
                    source.current.partners,
                  ) ??
                  node?.getAttribute("alt") ??
                  "",
              )
            : node?.getAttribute("alt") || "",
        });
    }
    if (node?.dataset.cmsHref) {
      const hrefBinding = JSON.parse(node.dataset.cmsHref) as ContentBinding;
      additional.push({
        binding: hrefBinding,
        label: "Destinazione del pulsante",
        value: String(
          patchRef.current[bindingId(hrefBinding)]?.value ??
            original(
              hrefBinding,
              source.current.content,
              source.current.pages,
              source.current.partners,
            ) ??
            "",
        ),
      });
    }
    setNotice("");
    setExtras(additional);
    setValue(next);
    setSelection({
      binding,
      kind,
      value: next,
      richImage,
      currency: node?.dataset.cmsCurrency,
      label:
        kind === "image"
          ? "Modifica foto"
          : kind === "html"
            ? "Modifica testo formattato"
            : kind === "money"
              ? "Modifica prezzo offerta"
              : kind === "link"
                ? "Modifica collegamento"
                : "Modifica testo",
    });
  }
  function onLoad() {
    if (frame.current?.contentDocument === connected.current) return;
    cleanup.current();
    const doc = frame.current?.contentDocument;
    if (!doc?.body?.querySelector("main")) return;
    connected.current = doc;
    const style = doc.createElement("style");
    style.textContent =
      '[data-cms]{transition:outline-color .15s}[data-cms]:hover{outline:2px dashed #0b83a6;outline-offset:4px;cursor:text}[data-cms-kind="image"]:hover{cursor:pointer}[data-cms-kind="text"]:empty,[data-cms-kind="html"]:empty{display:inline-block;min-width:30px;min-height:20px;outline:1px dashed #0b83a6}.consent-banner,.consent-settings{display:none!important}';
    doc.head.appendChild(style);
    const dbl = (event: MouseEvent) => {
      const element = event.target as Element;
      let node = element.closest<HTMLElement>("[data-cms]");
      if (!node && !element.closest("a,button") && element.tagName !== "IMG") {
        const background = element.closest("[data-cms-background]");
        node = background
          ? Array.from(
              background.querySelectorAll<HTMLElement>(
                '[data-cms-kind="image"]',
              ),
            ).find(
              (n) =>
                n.getBoundingClientRect().width > 0 &&
                n.getBoundingClientRect().height > 0,
            ) || null
          : element.querySelector<HTMLElement>(
              ':scope > [data-cms-kind="image"]',
            );
      }
      if (!node) return;
      event.preventDefault();
      event.stopPropagation();
      const b = JSON.parse(node.dataset.cms!) as ContentBinding;
      const kind = (node.dataset.cmsKind || "text") as EditKind;
      open(
        b,
        kind,
        node.dataset.cmsRichImage === undefined &&
          patchRef.current[bindingId(b)]
          ? String(patchRef.current[bindingId(b)].value ?? "")
          : nodeValue(node, kind),
        node,
      );
    };
    const click = (event: MouseEvent) => {
      const element = event.target as Element;
      if (element.closest("[data-cms]")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const a = element.closest("a");
      if (!a) return;
      event.preventDefault();
      event.stopPropagation();
      const url = new URL(a.href, location.origin);
      const target = destinations.find(
        (d) =>
          (d.href.replace(/\/$/, "") || "/") ===
          (url.pathname.replace(/\/$/, "") || "/"),
      );
      if (url.origin === location.origin && target) {
        setDestination(target);
        setNotice("");
      } else
        setNotice(
          "Questo collegamento non apre una pagina modificabile. Le schede tour si gestiscono dalla sezione Tour.",
        );
    };
    const submit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setNotice("I moduli pubblici non inviano richieste durante la modifica.");
    };
    doc.addEventListener("dblclick", dbl, true);
    doc.addEventListener("click", click, true);
    doc.addEventListener("submit", submit, true);
    let pending = false;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        paint(doc, patchRef.current);
        decorateRichImages(doc);
      });
    });
    observer.observe(doc.body, { subtree: true, childList: true });
    paint(doc, patchRef.current);
    decorateRichImages(doc);
    // Old tree links to an individual blog article keep opening that article.
    const hash = decodeURIComponent(window.location.hash);
    if (hash.startsWith("#articolo-")) {
      const a = source.current.content.gallery.find(
        (a) => `#articolo-${guideSlug(a)}` === hash,
      );
      if (a && guidePath(a) !== destination.href) {
        setDestination({
          label: a.title,
          href: guidePath(a),
          scope: "article",
          key: a.id || `guide:${guideSlug(a)}`,
        });
        history.replaceState(null, "", location.pathname);
      }
    }
    setReadySource(frame.current?.getAttribute("src") || "");
    cleanup.current = () => {
      observer.disconnect();
      doc.removeEventListener("dblclick", dbl, true);
      doc.removeEventListener("click", click, true);
      doc.removeEventListener("submit", submit, true);
    };
  }
  function apply() {
    if (!selection) return;
    seedPage(selection.binding);
    if (selection.richImage !== undefined) {
      const current =
        patchRef.current[bindingId(selection.binding)]?.value ??
        original(
          selection.binding,
          source.current.content,
          source.current.pages,
          source.current.partners,
        ) ??
        "";
      const parsed = new DOMParser().parseFromString(
        String(current),
        "text/html",
      );
      const image = parsed.body.querySelectorAll("img")[selection.richImage];
      if (!image) {
        setNotice("Foto non più presente. Ricarica la pagina.");
        return;
      }
      image.setAttribute("src", value);
      image.setAttribute("alt", extras[0]?.value || "");
      put(selection.binding, parsed.body.innerHTML);
    } else {
      if (selection.kind === "money") {
        const amount = Number(value.replace(",", "."));
        if (!value.trim() || !Number.isFinite(amount) || amount < 0) return;
        put(selection.binding, Math.round(amount * 100));
      } else put(selection.binding, value);
      for (const extra of extras)
        if (extra.binding) put(extra.binding, extra.value);
    }

    if (selection.kind === "html") {
      const b = selection.binding,
        last = b.path.at(-1);
      const sibling =
        ({ html: "text", bodyHtml: "body", introHtml: "intro", answerHtml: "a" } as Record<string, string>)[last ?? ""];
      const plainPath = b.scope === "site" && b.path[0] === "formattedText"
        ? b.path[1].split("-")
        : sibling ? [...b.path.slice(0, -1), sibling] : null;
      if (plainPath) {
        const doc = new DOMParser().parseFromString(
          value.replace(/<\/(?:p|div|h[1-6]|li)>|<br\s*\/?>/gi, "$&\n"),
          "text/html",
        );
        put(
          { ...b, path: plainPath },
          doc.body.textContent?.trim() || "",
        );
      }
    }
    setSelection(null);
    setNotice("Modifica in bozza. Premi Salva modifiche per pubblicarla.");
  }
  async function publish() {
    setNotice("");
    const payload = Object.values(patchRef.current);
    if (!payload.length) {
      setNotice("Nessuna modifica da salvare.");
      return;
    }
    try {
      const result = await save({ patches: payload });
      if (!result)
        throw Error("Salvataggio non riuscito. La bozza è conservata.");
      patchRef.current = {};
      setPatches({});
      setRevision((r) => r + 1);
      setNotice("Modifiche salvate nella pagina pubblica.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Salvataggio non riuscito");
    }
  }
  function discard() {
    patchRef.current = {};
    setPatches({});
    setRevision((r) => r + 1);
    setNotice("Bozza annullata.");
  }
  const publishRef = useRef(publish);
  const discardRef = useRef(discard);
  useEffect(() => {
    publishRef.current = publish;
    discardRef.current = discard;
  });
  const iframeSource = `${destination.href}${destination.href.includes("?") ? "&" : "?"}cms-preview=1&revision=${revision}`;
  const canSave =
    dirty > 0 && !busy && !uploading && readySource === iframeSource;
  useEffect(() => {
    onChromeChange?.({
      dirty,
      canSave,
      busy,
      href: destination.href,
      save: () => void publishRef.current(),
      discard: () => discardRef.current(),
    });
  }, [onChromeChange, dirty, canSave, busy, destination.href]);
  useEffect(() => () => onChromeChange?.(null), [onChromeChange]);
  const pageKey =
    destination.scope === "page"
      ? destination.key
      : destination.scope === "site"
        ? destination.key
        : null;
  const seoBinding = (field: string): ContentBinding =>
    destination.scope === "article"
      ? { scope: "article", key: destination.key, path: [field] }
      : { scope: "page", key: pageKey!, path: [field] };
  return (
    <section className={css.workspace} aria-label="Editor visuale delle pagine">
      <div className={css.toolbar}>
        <label className={css.pageSelect}>
          <span>Pagina</span>
          <select
            className="text-input"
            disabled={busy || readySource !== iframeSource}
            aria-label="Pagina da modificare"
            value={destination.href}
            onChange={(e) => {
              const d = destinations.find((d) => d.href === e.target.value);
              if (d) setDestination(d);
            }}
          >
            {[...new Set(destinations.map((d) => d.group || "Pagine"))].map(
              (group) => (
                <optgroup key={group} label={group}>
                  {destinations
                    .filter((d) => (d.group || "Pagine") === group)
                    .map((d) => (
                      <option key={d.href} value={d.href}>
                        {d.label}
                      </option>
                    ))}
                </optgroup>
              ),
            )}
          </select>
        </label>
        {dirty > 0 && (
          <button
            type="button"
            className={`button-secondary ${css.discardButton}`}
            onClick={discard}
          >
            Annulla bozza
          </button>
        )}
        <div className={css.devices}>
          <button
            type="button"
            className={`button-primary ${css.seoButton}`}
            onClick={() => setSettings(true)}
          >
            SEO
          </button>
          {[
            ["desktop", "Desktop"],
            ["tablet", "Tablet"],
            ["mobile", "Mobile"],
          ].map(([v, label]) => (
            <button
              type="button"
              key={v}
              aria-pressed={width === v}
              onClick={() => setWidth(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {notice && !selection && <AdminNotice key={notice} message={notice} />}
      <dialog
        ref={seoDialog}
        className={css.seoModal}
        onClose={() => setSettings(false)}
        onCancel={(e) => {
          e.preventDefault();
          setSettings(false);
        }}
      >
        <div className={css.seoModalBody}>
          <div className={css.seoModalHead}>
            <h3>SEO e collegamenti</h3>
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Chiudi"
              onClick={() => setSettings(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className={css.seoModalContent}>
            {["seoTitle", "seoDescription"].map((field, i) => {
              const b = seoBinding(field);
              return (
                <label key={field}>
                  {i === 0 ? "Titolo SEO" : "Descrizione SEO"}
                  <input
                    className="text-input"
                    value={String(
                      patches[bindingId(b)]?.value ??
                        original(b, content, pages) ??
                        "",
                    )}
                    onChange={(e) => {
                      seedPage(b);
                      put(b, e.target.value);
                    }}
                  />
                </label>
              );
            })}
            <p>
              Sezioni e ordine della pagina restano fissi, come previsto dal
              contratto.
            </p>
            <div className={css.links}>
              <Link href="/admin/contenuti/articoli">Gestione articoli</Link>
              <Link href="/admin/contenuti/navigazione">Menu e social</Link>
              <Link href="/admin/contenuti/identita">
                Recapiti e dati condivisi
              </Link>
              <Link href="/admin/contenuti/recensioni">Recensioni</Link>
              <Link href="/admin/tour">Gestionale tour invariato</Link>
            </div>
          </div>
        </div>
      </dialog>
      {readySource !== iframeSource && (
        <p role="status">Caricamento della pagina modificabile…</p>
      )}
      <div ref={stage} className={css.stage}>
        <div
          className={css.previewViewport}
          style={{ width: viewportWidth * previewScale, height: previewHeight }}
        >
          <iframe
            ref={frame}
            title={`Pagina pubblica modificabile: ${destination.label}`}
            src={iframeSource}
            onLoad={onLoad}
            className={css.canvas}
            style={{
              width: viewportWidth,
              height: previewHeight / previewScale,
              transform: `scale(${previewScale})`,
              pointerEvents: readySource === iframeSource ? "auto" : "none",
            }}
          />
        </div>
      </div>
      {selection && (
        <dialog
          ref={dialog}
          className={css.dialog}
          onCancel={(e) => {
            e.preventDefault();
            if (!uploading) setSelection(null);
          }}
        >
          <div className={css.dialogBody}>
            <h2 className="display-md">{selection.label}</h2>
            {selection.kind === "image" ? (
              <ImageSourceField
                required
                label="Foto"
                value={value}
                onChange={setValue}
                onUploading={setUploading}
                onNotice={setNotice}
              />
            ) : selection.kind === "html" ? (
              <RichTextEditor label="Testo formattato" html={value} onChange={setValue} />
            ) : selection.kind === "money" ? (
              <label>
                Prezzo offerta ({selection.currency || "EUR"})
                <input
                  className="text-input"
                  aria-label="Prezzo offerta"
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                />
              </label>
            ) : (
              <label>
                Testo
                <textarea
                  className="text-input"
                  aria-label="Testo da modificare"
                  rows={7}
                  maxLength={30000}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                />
              </label>
            )}
            {extras.map((extra, index) => (
              <label key={extra.label}>
                {extra.label}
                <input
                  className="text-input"
                  value={extra.value}
                  onChange={(e) =>
                    setExtras((items) =>
                      items.map((item, i) =>
                        i === index ? { ...item, value: e.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
            ))}
            {notice && <AdminNotice key={notice} message={notice} />}
            <p>
              La modifica viene applicata alla bozza. Il salvataggio pubblica
              soltanto i campi modificati.
            </p>
            <div className={css.actions}>
              <button
                type="button"
                className="button-secondary"
                disabled={uploading}
                onClick={() => setSelection(null)}
              >
                Annulla
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={
                  uploading ||
                  (selection.kind === "image" && !value.trim()) ||
                  (selection.kind === "money" &&
                    (!value.trim() ||
                      !Number.isFinite(Number(value)) ||
                      Number(value) < 0))
                }
                onClick={apply}
              >
                Applica alla bozza
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
