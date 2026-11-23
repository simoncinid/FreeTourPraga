"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { CatalogTour } from "@/lib/platform/model";
import { tourHeadlinePrice } from "@/lib/participant-pricing";
export function AdminTourList({ tours }: { tours: CatalogTour[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const filtered = tours.filter((t) =>
    `${t.title} ${t.category} ${t.slug}`
      .toLocaleLowerCase("it")
      .includes(query.toLocaleLowerCase("it")),
  );
  const pageSize = 8,
    count = Math.max(1, Math.ceil(filtered.length / pageSize)),
    current = Math.min(page, count - 1);
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
      <div className="tour-directory-table card">
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
            {filtered
              .slice(current * pageSize, (current + 1) * pageSize)
              .map((t) => (
                <tr key={t.id}>
                  <td className="tours-col-name">
                    <Link
                      className="font-medium"
                      href={`/admin/tour/${t.slug}`}
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="tours-col-category">{t.category}</td>
                  <td className="tours-col-price">{tourHeadlinePrice(t).text}</td>
                  <td className="tours-col-slots">{t.slots.length}</td>
                  <td className="tours-col-status">
                    <span
                      className={`status-chip ${t.published ? "status-success" : "status-neutral"}`}
                    >
                      {t.published ? "Pubblicato" : "Bozza"}
                    </span>
                  </td>
                  <td className="tours-col-actions">
                    <Link
                      className="button-secondary"
                      href={`/admin/tour/${t.slug}`}
                    >
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-5 text-sm">Nessun tour corrisponde alla ricerca.</p>
        )}
      </div>
      <div className="admin-pagination">
        <span>
          {filtered.length} tour · Pagina {current + 1} di {count}
        </span>
        <button
          type="button"
          className="button-secondary"
          aria-label="Pagina precedente"
          disabled={!current}
          onClick={() => setPage(current - 1)}
        >
          <ChevronLeft size={16} />
        </button>
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
    </section>
  );
}
