"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import css from "./admin-records.module.css";
export { css as recordsCss };
export function useRecordPagination(total: number) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0),
    [size, setSize] = useState(7);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize(Math.max(1, Math.floor((entry.contentRect.height - 42) / 56))),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [total, element]);
  const pages = Math.max(1, Math.ceil(total / size)),
    current = Math.min(page, pages - 1);
  return {
    area: setElement,
    size,
    page: current,
    start: current * size,
    pages,
    setPage,
  };
}
export function RecordPager({
  page,
  pages,
  total,
  onChange,
  compactOnMobile = false,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
  compactOnMobile?: boolean;
}) {
  return (
    <footer
      className={`${css.pagination}${compactOnMobile ? ` ${css.paginationMobileCompact}` : ""}`}
    >
      <span className={css.paginationMeta}>
        {total} risultati · Pagina {page + 1} di {pages}
      </span>
      <button
        type="button"
        className="button-secondary"
        aria-label="Pagina precedente"
        disabled={!page}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <span className={css.paginationCompactMeta} aria-hidden="true">
        {page + 1}/{pages}
      </span>
      <button
        type="button"
        className="button-secondary"
        aria-label="Pagina successiva"
        disabled={page >= pages - 1}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </footer>
  );
}
export function RecordDrawer({
  title,
  subtitle,
  close,
  locked = false,
  children,
}: {
  title: ReactNode;
  subtitle: string;
  close: () => void;
  locked?: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={css.drawer}
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) close();
      }}
    >
      <div className={css.drawerShell}>
        <header className={css.drawerHeader}>
          <div>
            <p>{subtitle}</p>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            aria-label="Chiudi pannello"
            disabled={locked}
            onClick={close}
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
