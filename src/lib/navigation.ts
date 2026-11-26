import type { SiteContent } from "./platform/content";
import type { Tour } from "./types";
import { tourPath } from "./public-paths";
export type NavigationItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};
/** Voci collaborazioni che restano sotto Altro anche dopo migrazioni CMS. */
const requiredAltroLinks: { label: string; href: string }[] = [
  { label: "Lavora con noi", href: "/lavora-con-noi" },
  { label: "Diventa un partner", href: "/diventa-un-partner" },
];

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
      { label: "Lavora con noi", href: "/lavora-con-noi" },
      { label: "Diventa un partner", href: "/diventa-un-partner" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Aiuto", href: "/aiuto" },
    ],
  },
];

function navPath(href: string) {
  return href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
}

function correctUsefulLink<T extends { label: string; href: string }>(item: T): T {
  if (item.label.trim().toLowerCase() === "informazioni utili" && /^\/blog\/?$/.test(item.href))
    return { ...item, href: "/informazioni-utili" };
  return item;
}

/** Reinserisce Lavora con noi / Diventa un partner se mancano nel menu Altro salvato. */
export function withRequiredAltroLinks(
  navigation: NavigationItem[],
): NavigationItem[] {
  return navigation.map((item) => {
    if (item.label.trim().toLowerCase() !== "altro" || !item.children) return item;
    const present = new Set(item.children.map((c) => navPath(c.href)));
    const missing = requiredAltroLinks.filter((link) => !present.has(navPath(link.href)));
    if (!missing.length) return item;
    const children = [...item.children];
    let insertAt = 0;
    for (let i = 0; i < children.length; i++) {
      const path = navPath(children[i].href);
      if (path === "/partner-europa" || path === "/agenzie-b2b") insertAt = i + 1;
    }
    children.splice(insertAt, 0, ...missing);
    return { ...item, children };
  });
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
  return withRequiredAltroLinks(source)
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
