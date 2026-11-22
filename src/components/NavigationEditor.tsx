"use client";
import type { NavigationItem } from "@/lib/navigation";
export function NavigationEditor({
  items,
  onChange,
}: {
  items: NavigationItem[];
  onChange: (items: NavigationItem[]) => void;
}) {
  const move = (list: NavigationItem[], i: number, d: number) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  };
  return (
    <div className="grid gap-4">
      {items.map((n, i) => (
        <fieldset key={i} className="grid gap-3 rounded border p-4">
          <legend>Voce principale {i + 1}</legend>
          <label>
            Etichetta
            <input
              className="text-input"
              required
              value={n.label}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <label>
            Percorso
            <input
              className="text-input"
              required
              value={n.href}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i ? { ...x, href: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => onChange(move(items, i, -1))}
            >
              Su
            </button>
            <button
              type="button"
              disabled={i === items.length - 1}
              onClick={() => onChange(move(items, i, 1))}
            >
              Giù
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => i !== j))}
            >
              Rimuovi voce
            </button>
          </div>
          <details>
            <summary>Sottomenu ({n.children?.length ?? 0})</summary>
            <div className="grid gap-3 pt-3">
              {n.children?.map((child, j) => (
                <div key={j} className="grid gap-2 border-l pl-4">
                  <label>
                    Etichetta sottovoce
                    <input
                      className="text-input"
                      value={child.label}
                      onChange={(e) =>
                        onChange(
                          items.map((x, k) =>
                            k === i
                              ? {
                                  ...x,
                                  children: x.children?.map((c, k) =>
                                    k === j
                                      ? { ...c, label: e.target.value }
                                      : c,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Percorso sottovoce
                    <input
                      className="text-input"
                      value={child.href}
                      onChange={(e) =>
                        onChange(
                          items.map((x, k) =>
                            k === i
                              ? {
                                  ...x,
                                  children: x.children?.map((c, k) =>
                                    k === j
                                      ? { ...c, href: e.target.value }
                                      : c,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={j === 0}
                      onClick={() =>
                        onChange(
                          items.map((x, k) =>
                            k === i
                              ? { ...x, children: move(x.children!, j, -1) }
                              : x,
                          ),
                        )
                      }
                    >
                      Su
                    </button>
                    <button
                      type="button"
                      disabled={j === (n.children?.length ?? 0) - 1}
                      onClick={() =>
                        onChange(
                          items.map((x, k) =>
                            k === i
                              ? { ...x, children: move(x.children!, j, 1) }
                              : x,
                          ),
                        )
                      }
                    >
                      Giù
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(
                          items.map((x, k) =>
                            k === i
                              ? {
                                  ...x,
                                  children: x.children?.filter(
                                    (_, k) => k !== j,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      Rimuovi sottovoce
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  onChange(
                    items.map((x, k) =>
                      k === i
                        ? {
                            ...x,
                            children: [
                              ...(x.children ?? []),
                              { label: "Nuova sottovoce", href: "/tour" },
                            ],
                          }
                        : x,
                    ),
                  )
                }
              >
                Aggiungi sottovoce
              </button>
            </div>
          </details>
        </fieldset>
      ))}
      <button
        type="button"
        className="button-secondary"
        onClick={() =>
          onChange([...items, { label: "Nuova voce", href: "/tour" }])
        }
      >
        Aggiungi voce principale
      </button>
      <p className="text-sm">
        Il menu Tour senza sottovoci elenca automaticamente i tour pubblicati.
      </p>
    </div>
  );
}
