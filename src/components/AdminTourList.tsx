"use client";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import type { CatalogTour } from "@/lib/platform/model";
import { tourHeadlinePrice } from "@/lib/participant-pricing";

function CategoryMenu({
  tour,
  categories,
  busy,
  onPick,
  onCreate,
}: {
  tour: CatalogTour;
  categories: string[];
  busy: boolean;
  onPick: (category: string) => void;
  onCreate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const width = Math.max(200, r.width);
      const left = Math.min(
        Math.max(8, r.left),
        window.innerWidth - width - 8,
      );
      setPos({ top: r.bottom + 6, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div
      className={`tour-category-menu${open ? " is-open" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        ref={triggerRef}
        className="tour-category-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setOpen((v) => !v);
        }}
      >
        <span>{tour.category || "Senza categoria"}</span>
        <ChevronDown size={14} className="tour-category-caret" aria-hidden />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className="tour-category-panel"
            role="listbox"
            style={{ top: pos.top, left: pos.left }}
          >
            <button
              type="button"
              role="option"
              className="tour-category-new"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onCreate();
              }}
            >
              + Nuova categoria
            </button>
            {categories.map((c) => (
              <button
                type="button"
                key={c}
                role="option"
                aria-selected={c === tour.category}
                className={c === tour.category ? "is-active" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  if (c !== tour.category) onPick(c);
                }}
              >
                {c}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function AdminTourList({
  tours,
  busy,
  update,
}: {
  tours: CatalogTour[];
  busy: boolean;
  update: (body: unknown, method: "PATCH" | "DELETE") => Promise<unknown>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createFor, setCreateFor] = useState<CatalogTour | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const createDialog = useRef<HTMLDialogElement>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () =>
      [
        ...new Set(tours.map((t) => t.category.trim()).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b, "it")),
    [tours],
  );

  const filtered = tours.filter(
    (t) =>
      !t.archivedAt &&
      `${t.title} ${t.category} ${t.slug}`
        .toLocaleLowerCase("it")
        .includes(query.toLocaleLowerCase("it")),
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      setMobile(mq.matches);
      if (!mq.matches) setExpanded(null);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const measure = () => {
      if (window.matchMedia("(max-width: 700px)").matches) return;
      const head = el.querySelector("thead tr") as HTMLElement | null;
      const row = el.querySelector("tbody tr") as HTMLElement | null;
      const headH = head?.getBoundingClientRect().height || 40;
      const rowH = row?.getBoundingClientRect().height || 44;
      const available = el.clientHeight - headH - 2;
      const n = Math.max(1, Math.floor(available / Math.max(rowH, 1)));
      setPageSize(n);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [filtered.length]);

  const count = Math.max(1, Math.ceil(filtered.length / pageSize)),
    current = Math.min(page, count - 1);
  const visible = mobile
    ? filtered
    : filtered.slice(current * pageSize, (current + 1) * pageSize);

  useEffect(() => {
    if (page > count - 1) setPage(Math.max(0, count - 1));
  }, [page, count]);

  useEffect(() => {
    const el = createDialog.current;
    if (!el) return;
    if (createFor && !el.open) el.showModal();
    if (!createFor && el.open) el.close();
  }, [createFor]);

  function archiveTour(t: CatalogTour) {
    if (
      !window.confirm(
        `Archiviare «${t.title}»? Il tour sparirà dal sito e dall’elenco operativo. Lo storico delle prenotazioni e delle vendite sarà conservato.`,
      )
    )
      return;
    if (
      !window.confirm(
        `Confermi l’eliminazione definitiva di «${t.title}» dall’elenco operativo?`,
      )
    )
      return;
    void update({ id: t.id, archiveConfirmed: true }, "DELETE");
  }

  async function applyCategory(tour: CatalogTour, category: string) {
    const next = category.trim();
    if (!next || next === tour.category) return;
    await update({ id: tour.id, category: next }, "PATCH");
  }

  return (
    <section className="tour-directory">
      <div className="tour-directory-toolbar">
        <label className="admin-search">
          <Search size={16} />
          <input
            className="text-input"
            aria-label="Cerca tour"
            placeholder="Cerca tour per nome o categoria"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      <div className="tour-directory-mobile">
        {visible.map((t) => {
          const open = expanded === t.id;
          return (
            <article
              className={`tour-directory-mobile-item${open ? " is-open" : ""}`}
              key={t.id}
            >
              <button
                type="button"
                className="tour-directory-mobile-toggle"
                aria-expanded={open}
                onClick={() =>
                  setExpanded((id) => (id === t.id ? null : t.id))
                }
              >
                <span className="tour-directory-mobile-name-row">
                  <span className="tour-directory-mobile-title">{t.title}</span>
                  <span
                    className={`tour-directory-status-dot${t.published ? " is-published" : " is-draft"}`}
                    title={t.published ? "Pubblicato" : "Bozza"}
                    aria-label={t.published ? "Pubblicato" : "Bozza"}
                  />
                </span>
                <ChevronDown size={16} aria-hidden />
              </button>
              {open && (
                <div className="tour-directory-mobile-body">
                  <p className="tour-directory-mobile-meta">
                    {t.category} · {tourHeadlinePrice(t).text} · {t.slots.length}{" "}
                    partenze
                  </p>
                  <div className="tour-directory-actions">
                    <Link
                      className="button-secondary"
                      href={`/admin/tour/${t.slug}`}
                    >
                      Modifica
                    </Link>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={busy}
                      onClick={() =>
                        void update(
                          { id: t.id, published: !t.published },
                          "PATCH",
                        )
                      }
                    >
                      {t.published ? "Nascondi" : "Mostra"}
                    </button>
                    <button
                      type="button"
                      className="button-secondary button-danger"
                      disabled={busy}
                      onClick={() => archiveTour(t)}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {!filtered.length && (
          <p className="p-5 text-sm">Nessun tour corrisponde alla ricerca.</p>
        )}
      </div>
      <div
        className="tour-directory-table card tour-directory-desktop"
        ref={tableWrapRef}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th className="tours-col-name">Tour</th>
              <th className="tours-col-category">Categoria</th>
              <th className="tours-col-price">Prezzo da</th>
              <th className="tours-col-slots">Partenze</th>
              <th className="tours-col-status">Stato</th>
              <th className="tours-col-actions">
                <span className="sr-only">Azioni</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.id}>
                <td className="tours-col-name">
                  <Link
                    className="font-medium"
                    href={`/admin/tour/${t.slug}`}
                  >
                    {t.title}
                  </Link>
                </td>
                <td className="tours-col-category">
                  <CategoryMenu
                    tour={t}
                    categories={categories}
                    busy={busy}
                    onPick={(category) => void applyCategory(t, category)}
                    onCreate={() => {
                      setNewCategory("");
                      setCreateFor(t);
                    }}
                  />
                </td>
                <td className="tours-col-price">
                  {tourHeadlinePrice(t).text}
                </td>
                <td className="tours-col-slots">{t.slots.length}</td>
                <td className="tours-col-status">
                  <span
                    className={`status-chip ${t.published ? "status-success" : "status-neutral"}`}
                  >
                    {t.published ? "Pubblicato" : "Bozza"}
                  </span>
                </td>
                <td className="tours-col-actions">
                  <div className="tour-directory-actions">
                    <Link
                      className="button-secondary"
                      href={`/admin/tour/${t.slug}`}
                    >
                      Modifica
                    </Link>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={busy}
                      onClick={() =>
                        void update(
                          { id: t.id, published: !t.published },
                          "PATCH",
                        )
                      }
                    >
                      {t.published ? "Nascondi" : "Mostra"}
                    </button>
                    <button
                      type="button"
                      className="button-secondary button-danger"
                      disabled={busy}
                      onClick={() => archiveTour(t)}
                    >
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-5 text-sm">Nessun tour corrisponde alla ricerca.</p>
        )}
      </div>
      {!mobile && (
        <div className="admin-pagination tour-directory-pagination">
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina precedente"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {filtered.length} tour · Pagina {current + 1} di {count}
          </span>
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina successiva"
            disabled={current >= count - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={createDialog}
        className="tour-create-modal"
        onClose={() => setCreateFor(null)}
        onCancel={(e) => {
          e.preventDefault();
          setCreateFor(null);
        }}
      >
        <form
          className="tour-create-modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!createFor || !newCategory.trim()) return;
            const tour = createFor;
            const category = newCategory.trim();
            setCreateFor(null);
            void applyCategory(tour, category);
          }}
        >
          <div className="tour-create-modal-head">
            <h2>Nuova categoria</h2>
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Chiudi"
              disabled={busy}
              onClick={() => setCreateFor(null)}
            >
              <X size={18} />
            </button>
          </div>
          <p className="tour-category-create-hint">
            Verrà creata e applicata subito a «{createFor?.title}».
          </p>
          <label>
            Nome categoria
            <input
              className="text-input"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Es. Gli essenziali"
              required
              autoFocus
            />
          </label>
          <button
            type="submit"
            className="button-primary tour-create-submit"
            disabled={busy || !newCategory.trim()}
          >
            Crea e applica
          </button>
        </form>
      </dialog>
    </section>
  );
}
