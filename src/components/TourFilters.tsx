"use client";

import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FilterSelect } from "@/components/FilterSelect";
import { SlotDatePicker } from "@/components/SlotDatePicker";
import { TourCard } from "@/components/TourCard";
import type { Tour } from "@/lib/types";

const PAGE_SIZE_DESKTOP = 6;
const PAGE_SIZE_MOBILE = 3;

export function TourFilters({ tours }: { tours: Tour[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DESKTOP);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setPageSize(mq.matches ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP);
      setPage(0);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const dates = useMemo(
    () =>
      [
        ...new Set(
          tours.flatMap((tour) =>
            tour.slots.map((slot) => slot.startsAt.slice(0, 10)),
          ),
        ),
      ].sort(),
    [tours],
  );
  const visibleTours = useMemo(
    () =>
      tours.filter((tour) => {
        const searchable =
          `${tour.title} ${tour.category} ${tour.shortDescription}`.toLocaleLowerCase(
            "it",
          );
        if (!searchable.includes(query.toLocaleLowerCase("it"))) return false;
        if (category !== "all" && tour.category !== category) return false;
        if (!date && guests === "1") return true;
        const party = Number(guests);
        return tour.slots.some((slot) => {
          const matchingDate = !date || slot.startsAt.startsWith(date);
          return matchingDate && slot.capacity - slot.reserved >= party;
        });
      }),
    [tours, query, category, date, guests],
  );

  const totalPages = Math.max(1, Math.ceil(visibleTours.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageTours = visibleTours.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  const filtered = Boolean(
    query || category !== "all" || date || guests !== "1",
  );
  function reset() {
    setQuery("");
    setCategory("all");
    setDate("");
    setGuests("1");
    setPage(0);
  }
  return (
    <>
      <div className="tour-filters mb-8 grid gap-3 rounded-[28px] border border-hairline bg-surface-card p-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="tour-filters-field grid gap-1 px-3">
          <span className="caption text-ink">Cerca</span>
          <input
            aria-label="Cerca un tour"
            placeholder="Es. Castello, birra..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className="tour-filters-control min-w-0 bg-transparent text-sm text-body outline-none"
          />
        </label>
        <label className="tour-filters-field grid gap-1 border-hairline px-3 lg:border-x lg:px-5">
          <span className="caption text-ink">Tour</span>
          <FilterSelect
            aria-label="Tipo di tour"
            value={category}
            onChange={(value) => { setCategory(value); setPage(0); }}
            options={[
              { value: "all", label: "Tutte le esperienze" },
              ...[...new Set(tours.map((tour) => tour.category))].map((item) => ({
                value: item,
                label: item,
              })),
            ]}
          />
        </label>
        <label className="tour-filters-field grid gap-1 border-hairline px-3 lg:border-r lg:px-5">
          <span className="caption text-ink">Data</span>
          <SlotDatePicker
            days={dates}
            value={date}
            onChange={(value) => { setDate(value); setPage(0); }}
            required={false}
            placeholder="Scegli una data"
            triggerClassName="slot-date-trigger tour-filter-date"
          />
        </label>
        <label className="tour-filters-field grid gap-1 px-3">
          <span className="caption text-ink">Partecipanti</span>
          <FilterSelect
            aria-label="Numero partecipanti"
            value={guests}
            onChange={(value) => { setGuests(value); setPage(0); }}
            options={[1, 2, 3, 4, 5, 6].map((item) => ({
              value: String(item),
              label: `${item} ${item === 1 ? "persona" : "persone"}`,
            }))}
          />
        </label>
      </div>
      <div
        className="mb-5 flex items-center justify-between gap-4 text-xs"
        aria-live="polite"
      >
        <p>
          {visibleTours.length}{" "}
          {visibleTours.length === 1 ? "esperienza" : "esperienze"}
          {totalPages > 1
            ? ` · pagina ${safePage + 1} di ${totalPages}`
            : ""}
        </p>
        {filtered && (
          <button
            type="button"
            className="flex items-center gap-2 font-semibold text-ink"
            onClick={reset}
          >
            <RotateCcw size={13} /> Azzera filtri
          </button>
        )}
      </div>
      {pageTours.length ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pageTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="tour-results-pager" aria-label="Paginazione tour">
              <button
                type="button"
                className="card-carousel-nav"
                aria-label="Pagina precedente"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft size={20} aria-hidden />
              </button>
              <div className="card-carousel-dots" role="tablist" aria-label="Pagine">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-label={`Vai alla pagina ${i + 1} di ${totalPages}`}
                    aria-current={safePage === i ? "true" : undefined}
                    onClick={() => setPage(i)}
                  >
                    <span />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="card-carousel-nav"
                aria-label="Pagina successiva"
                disabled={safePage >= totalPages - 1}
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
              >
                <ChevronRight size={20} aria-hidden />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center">
          <Search size={26} className="mx-auto mb-4 text-primary" aria-hidden />
          <p className="body-md">
            Nessun tour corrisponde ai filtri scelti. Prova un&apos;altra data o
            meno partecipanti.
          </p>
          <button type="button" className="button-secondary mt-5" onClick={reset}>
            Mostra tutti i tour <RotateCcw size={14} />
          </button>
        </div>
      )}
    </>
  );
}
