import { canonicalPath, tourPath } from "@/lib/public-paths";
import Link from "next/link";
import { Menu } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { NavHoverMenu } from "@/components/NavHoverMenu";
import { navigationTours, publicSiteContent } from "@/lib/platform/public";

const usefulLinks = [
  { label: "Domande frequenti", href: "/faq" },
  { label: "Cambio euro e corona ceca", href: "/cambio-euro-corona-ceca/" },
  { label: "Come arrivare dall’aeroporto", href: "/come-raggiungerci-dallaeroporto/" },
  { label: "Dove mangiare a Praga", href: "/dove-mangiare-a-praga/" },
];
const moreLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Partner tour in Europa", href: "/partner-europa" },
  { label: "Agenzie B2B", href: "/agenzie-b2b" },
  { label: "Social", href: "/social" },
  { label: "Lavora con noi", href: "/lavora-con-noi" },
  { label: "Diventa un partner", href: "/diventa-un-partner" },
];

export async function Header() {
  const [c, tours] = await Promise.all([publicSiteContent(), navigationTours()]);
  const links = (
    items: { label: string; href: string; highlight?: boolean }[],
  ) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={canonicalPath(item.href)}
        className={`rounded-sm px-3 py-3 ${
          item.highlight
            ? "bg-surface-soft font-medium hover:bg-primary hover:text-on-primary"
            : "hover:bg-surface-soft"
        }`}
      >
        {item.label}
      </Link>
    ));
  function navigation(mobile = false) {
    return (
      <>
        <NavHoverMenu
          label="I nostri tour"
          href={canonicalPath("/tour")}
          mobile={mobile}
        >
          {links([
            { label: "Tutti i tour", href: "/tour", highlight: true },
            ...tours.map((tour) => ({
              label: tour.title,
              href: tourPath(tour),
            })),
          ])}
        </NavHoverMenu>
        <Link
          href="/chi-siamo"
          className={mobile ? "px-3 py-3" : "nav-link"}
        >
          Chi siamo
        </Link>
        <NavHoverMenu
          label="Informazioni utili"
          href="/informazioni-utili"
          mobile={mobile}
        >
          {links([
            {
              label: "Informazioni utili",
              href: "/informazioni-utili",
              highlight: true,
            },
            ...usefulLinks,
          ])}
        </NavHoverMenu>
        <Link
          href={canonicalPath("/contatti")}
          className={mobile ? "px-3 py-3" : "nav-link"}
        >
          Contatti
        </Link>
        <NavHoverMenu label="Altro" mobile={mobile}>
          {links(moreLinks)}
        </NavHoverMenu>
      </>
    );
  }
  return <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-on-dark shadow-[0_4px_18px_rgba(7,26,53,0.18)]">
    <div className="container-page relative flex h-[74px] items-center justify-between gap-4">
      <Link
        href="/"
        className="relative z-10 font-display text-[25px] leading-none tracking-tight text-white"
      >
        {c.globals.brandName}
      </Link>
      <nav
        aria-label="Navigazione principale"
        className="absolute left-1/2 top-0 hidden h-full -translate-x-1/2 items-center gap-4 xl:flex"
      >
        {navigation()}
      </nav>
      <div className="relative z-10 flex items-center gap-4">
        <CartBadge />
        <details className="site-mobile-menu xl:hidden">
          <summary
            className="site-mobile-menu-toggle"
            aria-label="Menu"
          >
            <Menu size={20} />
          </summary>
          <nav
            aria-label="Navigazione mobile"
            className="site-mobile-menu-panel"
          >
            {navigation(true)}
          </nav>
        </details>
      </div>
    </div>
  </header>;
}
