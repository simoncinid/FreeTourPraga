"use client";
import { RichTextEditor } from "./RichTextEditor";
import { InlineRichField } from "./InlineRichField";
import { readRichTextField } from "./useRichTextField";
import { hasInlineFormatting, paintPreviewText, previewInlineValue, removedFieldCss } from "./previewText";
import { richHasText } from "@/lib/rich-text";
import { AdminNotice } from "./AdminNotice";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { observePreviewMounts } from "./CmsPreviewMount";
import { BlogArticle } from "./BlogArticle";
import type { GuideItem } from "@/lib/guides";
import { writeContentPath } from "@/lib/visual-content";
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
import type { BlogBlock, SiteContent } from "@/lib/platform/content";
import type { ContentPage, EuropeanPartner } from "@/lib/platform/model";
import type { Tour } from "@/lib/types";
import { sampleParagraph, samplePhotos } from "@/lib/content-placeholders";
import css from "./visual-content-editor.module.css";

function sampleArticleBlock(type: BlogBlock["type"]): BlogBlock {
  const text = { heading: "Lorem ipsum", text: sampleParagraph };
  const photo = samplePhotos[type === "split" ? 2 : 1];
  const image = {
    imageUrl: photo.url,
    alt: photo.alt,
    caption: "Lorem ipsum dolor sit amet",
  };
  if (type === "text") return { type, ...text };
  if (type === "image") return { type, ...image };
  return { type, ...text, ...image, imagePosition: "right" };
}
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
  if (kind === "inline") return previewInlineValue(node);
  return node.innerText;
}
function plainTextBinding(binding: ContentBinding): ContentBinding | undefined {
  const fields: Record<string, string> = {
    html: "text",
    bodyHtml: "body",
    introHtml: "intro",
    answerHtml: "a",
    titleHtml: "title",
    subtitleHtml: "subtitle",
    headingHtml: "heading",
    captionHtml: "caption",
  };
  const plainField = fields[binding.path.at(-1) ?? ""];
  if (binding.scope === "site" && binding.path[0] === "formattedText")
    return { ...binding, path: binding.path[1].split("-") };
  return plainField
    ? { ...binding, path: [...binding.path.slice(0, -1), plainField] }
    : undefined;
}
function textStyleBinding(binding: ContentBinding): ContentBinding {
  return { ...binding, path: ["formattedText", binding.path.join("-")] };
}
const hiddenTextBinding: ContentBinding = { scope: "site", path: ["hiddenText"] };
const previewOriginals = new WeakMap<HTMLElement, {
  html: string;
  text: string;
  src: string | null;
  srcset: string | null;
  href: string | null;
}>();
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
  hidden: readonly string[],
  readSaved: (binding: ContentBinding) => unknown,
) {
  if (!doc) return;
  const removed = new Set(hidden);
  const hasPatches = Object.keys(patches).length > 0;
  for (const node of doc.querySelectorAll<HTMLElement>("[data-cms]")) {
    if (node.dataset.cmsRichImage !== undefined) continue;
    node.toggleAttribute("data-cms-removed", removed.has(node.dataset.cms!));
    const kind = node.dataset.cmsKind;
    const patch = patches[node.dataset.cms!];
    const binding = patch?.binding ?? (hasPatches && (kind === "inline" || kind === "text")
      ? JSON.parse(node.dataset.cms!) as ContentBinding
      : undefined);
    const plainBinding = binding && kind === "inline" ? plainTextBinding(binding) : undefined;
    const plain = plainBinding && patches[bindingId(plainBinding)]?.value;
    const style = binding && kind === "text" ? patches[bindingId(textStyleBinding(binding))] : undefined;
    if (!patch && !style && typeof plain !== "string") {
      const original = previewOriginals.get(node);
      if (!original) continue;
      previewOriginals.delete(node);
      if (node.dataset.cmsKind === "image" || node.dataset.cmsKind === "link") {
        for (const attribute of ["src", "srcset", "href"] as const) {
          const value = original[attribute];
          if (value === null) node.removeAttribute(attribute);
          else node.setAttribute(attribute, value);
        }
      } else if (node.innerHTML !== original.html) {
        node.innerHTML = original.html;
      }
      continue;
    }
    if (!previewOriginals.has(node)) previewOriginals.set(node, {
      html: node.innerHTML,
      text: node.textContent ?? "",
      src: node.getAttribute("src"),
      srcset: node.getAttribute("srcset"),
      href: node.getAttribute("href"),
    });
    const value = String(patch?.value ?? "");
    if (kind === "text" && typeof style?.value === "string" && style.value) {
      paintPreviewText(node, style.value, "inline");
    } else if (kind === "text" && style && !patch) {
      paintPreviewText(node, previewOriginals.get(node)!.text, "text");
    } else if (kind === "link") {
      if (node.getAttribute("href") !== value) node.setAttribute("href", value);
    } else if (kind === "image") {
      if (node.getAttribute("src") !== value) {
        node.removeAttribute("srcset");
        node.setAttribute("src", value);
      }
    } else if (kind === "inline" && !value) {
      const savedPlain = plainBinding && readSaved(plainBinding);
      const fallback = typeof savedPlain === "string" ? savedPlain : previewOriginals.get(node)!.text;
      paintPreviewText(node, typeof plain === "string" ? plain : fallback, "text");
    } else if (kind === "html" || kind === "inline") {
      paintPreviewText(node, value, kind);
    } else {
      const text = kind === "money"
        ? formatMoney(Number(patch?.value), node.dataset.cmsCurrency || "EUR")
        : value;
      paintPreviewText(node, text, "text");
    }
  }
}
type Selection = {
  binding: ContentBinding;
  kind: EditKind;
  label: string;
  richImage?: number;
  link?: boolean;
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
  articleDraft,
}: {
  content: SiteContent;
  pages: Record<string, ContentPage>;
  partners?: EuropeanPartner[];
  tours: Pick<Tour, "title" | "slug" | "canonicalPath">[];
  detail?: string;
  busy: boolean;
  save: (body: unknown) => Promise<unknown>;
  onChromeChange?: (chrome: VisualContentChrome | null) => void;
  articleDraft?: {
    guide: GuideItem;
    change: (guide: GuideItem) => void;
    onUploading: (busy: boolean) => void;
    locked?: boolean;
  };
}) {
  const destinations = articleDraft ? [] : visualDestinations(content, pages, tours);
  const [articleMount, setArticleMount] = useState<HTMLElement | null>(null);
  const article = useRef(articleDraft?.guide);
  useLayoutEffect(() => { article.current = articleDraft?.guide; }, [articleDraft]);
  const initial = articleDraft ? {
    label: articleDraft.guide.title, href: "/cms-articolo", scope: "article" as const,
    key: articleDraft.guide.id || `guide:${guideSlug(articleDraft.guide)}`,
  } :
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
  useLayoutEffect(() => {
    if (!dirty && !busy) source.current = { content, pages, partners };
  }, [content, pages, partners, dirty, busy]);
  useLayoutEffect(() => {
    patchRef.current = patches;
    paint(frame.current?.contentDocument, patches, hiddenText(patches), storedValue);
    if (frame.current?.contentDocument)
      decorateRichImages(frame.current.contentDocument);
  }, [patches, articleDraft?.guide.hiddenText, content.hiddenText]);


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
  function hiddenText(patches = patchRef.current): string[] {
    if (article.current) return article.current.hiddenText ?? [];
    const fields = (binding: ContentBinding, saved?: string[]) => {
      const patch = patches[bindingId(binding)];
      return (patch ? patch.value as string[] | undefined : saved) ?? [];
    };
    return [
      ...fields(hiddenTextBinding, source.current.content.hiddenText),
      ...source.current.content.gallery.flatMap((guide) => fields({
        scope: "article",
        key: guide.id || `guide:${guideSlug(guide)}`,
        path: ["hiddenText"],
      }, guide.hiddenText)),
    ];
  }
  function storedValue(binding: ContentBinding) {
    if (binding.scope === "article" && article.current)
      return readContentPath(article.current, binding.path);
    return original(binding, source.current.content, source.current.pages, source.current.partners);
  }
  function draftValue(binding: ContentBinding) {
    const patch = patchRef.current[bindingId(binding)];
    return patch ? patch.value : storedValue(binding);
  }
  function put(binding: ContentBinding, next: unknown) {
    const id = bindingId(binding);
    const expected = storedValue(binding);
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
    const stored = draftValue(binding);
    const style = kind === "text" ? draftValue(textStyleBinding(binding)) : undefined;
    const next = typeof style === "string" && style ? style : kind === "money" && typeof stored === "number"
      ? String(stored / 100)
      : (kind === "html" || kind === "inline") && typeof stored === "string" && stored
        ? stored
        : visible ?? (typeof stored === "string" ? stored : "");
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
            ? String(draftValue(altBinding) ?? node?.getAttribute("alt") ?? "")
            : node?.getAttribute("alt") || "",
        });
    }
    if (node?.dataset.cmsHref) {
      const hrefBinding = JSON.parse(node.dataset.cmsHref) as ContentBinding;
      additional.push({
        binding: hrefBinding,
        label: "Destinazione del pulsante",
        value: String(draftValue(hrefBinding) ?? ""),
      });
    }
    setNotice("");
    setExtras(additional);
    setValue(hiddenText().includes(bindingId(binding)) ? "" : next);
    setSelection({
      binding,
      kind,
      richImage,
      link: !node?.closest("a,button"),
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
    const stopWatchingMount = articleDraft && observePreviewMounts(doc, () => {
      setArticleMount(doc.querySelector<HTMLElement>("#cms-article-preview[data-cms-mounted]"));
    });
    connected.current = doc;
    doc.body.setAttribute("data-cms-editor", "");
    const style = doc.createElement("style");
    style.textContent = removedFieldCss +
      '[data-cms]{transition:outline-color .15s}[data-cms]:hover{outline:2px dashed #0b83a6;outline-offset:4px;cursor:text}[data-cms-kind="image"]:hover{cursor:pointer}[data-cms-kind="text"]:empty,[data-cms-kind="inline"]:empty,[data-cms-kind="html"]:empty{display:inline-block;min-width:30px;min-height:20px;outline:1px dashed #0b83a6}.consent-banner,.consent-settings{display:none!important}';
    doc.head.appendChild(style);
    const dbl = (event: MouseEvent) => {
      const element = event.target as Element;
      let node = element.closest<HTMLElement>("[data-cms]");
      if (!node && element.matches("details, summary, [data-cms-hide-parent]")) {
        node = element.querySelector<HTMLElement>(
          element.matches("details") ? ":scope > summary [data-cms]" : ":scope > [data-cms]",
        );
      }
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
      if (articleDraft && b.scope !== "article") return;
      const kind = (node.dataset.cmsKind || "text") as EditKind;
      open(
        b,
        kind,
        nodeValue(node, kind),
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
      if (articleDraft) return;
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
        paint(doc, patchRef.current, hiddenText(), storedValue);
        decorateRichImages(doc);
      });
    });
    observer.observe(doc.body, { subtree: true, childList: true, characterData: true });
    paint(doc, patchRef.current, hiddenText(), storedValue);
    decorateRichImages(doc);
    // Old tree links to an individual blog article keep opening that article.
    const hash = decodeURIComponent(window.location.hash);
    if (!articleDraft && hash.startsWith("#articolo-")) {
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
      if (stopWatchingMount) stopWatchingMount();
      doc.removeEventListener("dblclick", dbl, true);
      doc.removeEventListener("click", click, true);
      doc.removeEventListener("submit", submit, true);
    };
  }
  function apply() {
    if (!selection) return;
    const field = dialog.current?.querySelector<HTMLElement>("[contenteditable='true']");
    const rich = field ? readRichTextField(field) : undefined;
    const hasMedia = Boolean(field?.querySelector("img,hr,table"));
    const nextValue = rich ? (rich.plain || hasMedia ? rich.html : "") : value;
    if (articleDraft && selection.kind === "image" && !/^(?:\/(?!\/)|https:\/\/)/i.test(value.trim())) {
      setNotice("Inserisci un percorso immagine o un URL HTTPS.");
      return;
    }
    const id = bindingId(selection.binding);
    const hiddenBinding: ContentBinding = selection.binding.scope === "article"
      ? { ...selection.binding, path: ["hiddenText"] }
      : hiddenTextBinding;
    const savedHidden = storedValue(hiddenBinding) as string[] | undefined;
    const hidden = (draftValue(hiddenBinding) as string[] | undefined) ?? [];
    const wasHidden = hidden.includes(id);
    const hide = Boolean(rich && !rich.plain && !hasMedia);
    const nextHidden = hide ? [...new Set([...hidden, id])] : hidden.filter((entry) => entry !== id);
    if (hide !== wasHidden && !articleDraft)
      put(hiddenBinding, nextHidden.length || savedHidden ? nextHidden : undefined);
    if (hide) {
      if (articleDraft) {
        const guide = { ...articleDraft.guide, hiddenText: nextHidden };
        article.current = guide;
        articleDraft.change(guide);
      }
      setSelection(null);
      return;
    }

    seedPage(selection.binding);
    if (selection.richImage !== undefined) {
      const current = draftValue(selection.binding) ?? "";
      const parsed = new DOMParser().parseFromString(
        String(current),
        "text/html",
      );
      const image = parsed.body.querySelectorAll("img")[selection.richImage];
      if (!image) {
        setNotice("Foto non più presente. Ricarica la pagina.");
        return;
      }
      image.setAttribute("src", value.trim());
      image.setAttribute("alt", extras[0]?.value || "");
      put(selection.binding, parsed.body.innerHTML);
    } else {
      if (selection.kind === "money") {
        const amount = Number(value.replace(",", "."));
        if (!value.trim() || !Number.isFinite(amount) || amount < 0) return;
        put(selection.binding, Math.round(amount * 100));
      } else {
        if (selection.kind === "text" && rich) {
          const style = textStyleBinding(selection.binding);
          const html = hasInlineFormatting(rich.html) ? rich.html : "";
          const previousStyle = storedValue(style);
          put(style, html || (previousStyle ? "" : previousStyle));
          put(selection.binding, rich.plain);
        } else {
          if (selection.kind === "inline" && !hasInlineFormatting(nextValue)) {
            const savedStyle = storedValue(selection.binding);
            put(selection.binding, savedStyle ? "" : savedStyle);
          } else {
            put(selection.binding, selection.kind === "image" ? value.trim() : nextValue);
          }
        }
      }
      for (const extra of extras)
        if (extra.binding) put(extra.binding, extra.value);
    }

    if (rich) {
      const plainBinding = plainTextBinding(selection.binding);
      if (plainBinding) put(plainBinding, rich.plain);
    }
    if (articleDraft) {
      const guide = structuredClone(articleDraft.guide);
      if (wasHidden) guide.hiddenText = nextHidden;
      for (const { binding, value: next } of Object.values(patchRef.current))
        writeContentPath(guide, binding.path, next);
      article.current = guide;
      articleDraft.change(guide);
      patchRef.current = {};
      setPatches({});
    }
    setSelection(null);
    setNotice(articleDraft ? "" : "Modifica in bozza. Premi Salva modifiche per pubblicarla.");
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
      {articleDraft ? (
        <div className={css.articleToolbar}>
          <p className={`text-sm ${css.articleHint}`}>
            Fai doppio clic su un testo o su una foto per modificarli.
          </p>
          <div className={css.articleActions}>
            {(
              [
                ["text", "Aggiungi testo"],
                ["image", "Aggiungi immagine"],
                ["split", "Aggiungi testo e immagine"],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                className="button-secondary"
                disabled={
                  articleDraft.locked ||
                  (articleDraft.guide.blocks?.length ?? 0) >= 40
                }
                onClick={() =>
                  articleDraft.change({
                    ...articleDraft.guide,
                    blocks: [
                      ...(articleDraft.guide.blocks ?? []),
                      sampleArticleBlock(type),
                    ],
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : <div className={css.toolbar}>
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
      </div>}
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
      {(readySource !== iframeSource || (articleDraft && !articleMount)) && (
        <p role="status">Caricamento della pagina modificabile…</p>
      )}
      <div ref={stage} className={css.stage}>
        <div
          className={css.previewViewport}
          style={{ width: viewportWidth * previewScale, height: previewHeight }}
        >
          <iframe
            key={iframeSource}
            ref={frame}
            title={`Pagina pubblica modificabile: ${destination.label}`}
            src={iframeSource}
            onLoad={onLoad}
            className={css.canvas}
            style={{
              width: viewportWidth,
              height: previewHeight / previewScale,
              transform: `scale(${previewScale})`,
              pointerEvents: readySource === iframeSource && !busy ? "auto" : "none",
            }}
          />
        </div>
      </div>
      {articleMount && articleDraft && createPortal(<BlogArticle guide={articleDraft.guide} preview />, articleMount)}
      {selection && (
        <dialog
          ref={dialog}
          className={css.dialog}
          onCancel={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
                onUploading={(busy) => { setUploading(busy); articleDraft?.onUploading(busy); }}
                onNotice={setNotice}
              />
            ) : selection.kind === "html" ? (
              <RichTextEditor
                label="Testo formattato"
                html={richHasText(value) ? value : undefined}
                text={value}
                onChange={(html, plain) => setValue(plain ? html : plain)}
              />
            ) : selection.kind === "link" ? (
              <label>
                Indirizzo del collegamento
                <input className="text-input" value={value} onChange={(event) => setValue(event.target.value)} />
              </label>
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
              <InlineRichField
                label="Testo"
                link={selection.link}
                multiline
                html={richHasText(value) && value.includes("<") ? value : undefined}
                text={value}
                onChange={(html, plain) => setValue(plain ? html : plain)}
              />
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
              {articleDraft ? "Pubblica articoli per salvare la bozza." : "La modifica viene applicata alla bozza e salvata quando pubblichi."}
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
