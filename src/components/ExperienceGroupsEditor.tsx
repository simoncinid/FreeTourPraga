"use client";
import type { SiteContent } from "@/lib/platform/content";
type Groups = SiteContent["home"]["groups"];
export function ExperienceGroupsEditor({
  groups,
  onChange,
}: {
  groups: Groups;
  onChange: (value: Groups) => void;
}) {
  return (
    <details>
      <summary className="title-md">
        Gruppi di esperienze della homepage
      </summary>
      <div className="grid gap-4 pt-4">
        {groups.map((g, i) => (
          <fieldset key={i} className="grid gap-3 rounded border p-4">
            <legend>Gruppo {i + 1}</legend>
            <label>
              Titolo
              <input
                className="text-input"
                value={g.title}
                onChange={(e) =>
                  onChange(
                    groups.map((x, j) =>
                      i === j ? { ...x, title: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Sottotitolo
              <input
                className="text-input"
                value={g.subtitle}
                onChange={(e) =>
                  onChange(
                    groups.map((x, j) =>
                      i === j ? { ...x, subtitle: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            {g.items.map((item, j) => (
              <div className="grid gap-2 border-l pl-3" key={j}>
                <label>
                  Nome esperienza
                  <input
                    className="text-input"
                    value={item.title}
                    onChange={(e) =>
                      onChange(
                        groups.map((x, k) =>
                          i === k
                            ? {
                                ...x,
                                items: x.items.map((y, k) =>
                                  j === k ? { ...y, title: e.target.value } : y,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Link esperienza
                  <input
                    className="text-input"
                    value={item.href}
                    onChange={(e) =>
                      onChange(
                        groups.map((x, k) =>
                          i === k
                            ? {
                                ...x,
                                items: x.items.map((y, k) =>
                                  j === k ? { ...y, href: e.target.value } : y,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      groups.map((x, k) =>
                        i === k
                          ? { ...x, items: x.items.filter((_, k) => j !== k) }
                          : x,
                      ),
                    )
                  }
                >
                  Rimuovi esperienza
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button-secondary"
              disabled={g.items.length >= 6}
              onClick={() =>
                onChange(
                  groups.map((x, j) =>
                    i === j
                      ? {
                          ...x,
                          items: [
                            ...x.items,
                            { title: "Nuova esperienza", href: "/contatti" },
                          ],
                        }
                      : x,
                  ),
                )
              }
            >
              Aggiungi esperienza
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => {
                  const next = [...groups];
                  [next[i], next[i - 1]] = [next[i - 1], next[i]];
                  onChange(next);
                }}
              >
                Sposta gruppo su
              </button>
              <button
                type="button"
                onClick={() => onChange(groups.filter((_, j) => i !== j))}
              >
                Rimuovi gruppo
              </button>
            </div>
          </fieldset>
        ))}
        <button
          type="button"
          className="button-secondary"
          disabled={groups.length >= 6}
          onClick={() =>
            onChange([
              ...groups,
              {
                title: "Nuovo gruppo",
                subtitle: "",
                items: [{ title: "Nuova esperienza", href: "/contatti" }],
              },
            ])
          }
        >
          Aggiungi gruppo
        </button>
      </div>
    </details>
  );
}
