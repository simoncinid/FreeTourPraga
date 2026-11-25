import type { SiteContent } from "./platform/content";
import type { Tour } from "./types";
import { tourPath } from "./public-paths";
export type NavigationItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};
export const defaultNavigation: NavigationItem[] = [
  { label: "I nostri tour", href: "/tour", children: [] },
  { label: "Chi siamo", href: "/chi-siamo" },
  {
    label: "Informazioni utili",
    href: "/informazioni-utili",
    children: [
      { label: "Cambio euro e corona ceca", href: "/cambio-euro-corona-ceca/" },
      {
        label: "Come arrivare dall’aeroporto",
        href: "/come-raggiungerci-dallaeroporto/",
      },
      { label: "Dove mangiare a Praga", href: "/dove-mangiare-a-praga/" },
    ],
  },
  { label: "Contatti", href: "/contatti" },
  {
    label: "Altro",
    href: "/partner-europa",
    children: [
      { label: "Partner tour in Europa", href: "/partner-europa" },
      { label: "Agenzie e scuole", href: "/agenzie-b2b" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Aiuto", href: "/aiuto" },
    ],
  },
];
function correctUsefulLink<T extends { label: string; href: string }>(item: T): T {
  if (item.label.trim().toLowerCase() === "informazioni utili" && /^\/blog\/?$/.test(item.href))
    return { ...item, href: "/informazioni-utili" };
  return item;
}

export function siteNavigation(
  content: SiteContent,
  tours: Pick<Tour, "title" | "slug" | "canonicalPath">[] = [],
): NavigationItem[] {
  const stored = content.globals.navigation;
  const source =
    content.globals.navigationVersion === 2 ||
    stored.some((n) => n.children !== undefined)
      ? stored
      : defaultNavigation;
  return source
    .filter(
      (n) => !/^\/(?:account|accesso|tour-privati)(?:[/?#]|$)/.test(n.href),
    )
    .map((n) => ({
      ...correctUsefulLink(n),
      children:
        n.href.replace(/\/$/, "") === "/tour" && n.children?.length === 0
          ? tours.map((t) => ({ label: t.title, href: tourPath(t) }))
          : n.children?.filter(
              (c) =>
                !/^\/(?:account|accesso|tour-privati)(?:[/?#]|$)/.test(c.href),
            ).map(correctUsefulLink),
    }));
}
