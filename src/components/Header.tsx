import { tourPath } from "@/lib/public-paths";
import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { NavHoverMenu } from "@/components/NavHoverMenu";
import { catalog, publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";

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
  const [c, tours] = await Promise.all([publicSiteContent(), catalog()]);
  const links = (items: {label: string; href: string}[]) => items.map((item) => <Link key={item.href} href={item.href} className="rounded-sm px-3 py-3 hover:bg-surface-soft">{item.label}</Link>);
  function navigation(mobile = false) {
    return <>
      <NavHoverMenu label="I nostri tour" href="/tour" mobile={mobile}>{links(tours.map((tour) => ({ label: tour.title, href: tourPath(tour) })))}</NavHoverMenu>
      <Link href="/chi-siamo" className={mobile ? "px-3 py-3" : "nav-link"}>Chi siamo</Link>
      <NavHoverMenu label="Informazioni utili" href="/informazioni-utili" mobile={mobile}>{links(usefulLinks)}</NavHoverMenu>
      <Link href="/contatti" className={mobile ? "px-3 py-3" : "nav-link"}>Contatti</Link>
      <NavHoverMenu label="Altro" mobile={mobile}>{links(moreLinks)}</NavHoverMenu>
    </>;
  }
  return <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-on-dark shadow-[0_4px_18px_rgba(7,26,53,0.18)]">
    <div className="container-page flex h-[74px] items-center justify-between gap-4">
      <Link href="/" className="font-display text-[25px] leading-none tracking-tight text-white">{c.globals.brandName}</Link>
      <nav aria-label="Navigazione principale" className="hidden h-full items-center gap-4 xl:flex">{navigation()}</nav>
      <div className="flex items-center gap-4">
        <CartBadge />
        <a href={contentWhatsapp(c, "Ciao FreeTourPraga, vorrei un'informazione sui tour.")} className="header-whatsapp max-lg:!hidden"><MessageCircle size={15} /> WhatsApp</a>
        <details className="relative xl:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-white/40 p-2" aria-label="Menu"><Menu size={20} /></summary>
          <nav aria-label="Navigazione mobile" className="absolute right-0 top-12 grid max-h-[70vh] w-[min(320px,calc(100vw-32px))] gap-1 overflow-auto rounded-lg border border-hairline bg-white p-3 text-ink shadow-card">{navigation(true)}</nav>
        </details>
      </div>
    </div>
  </header>;
}
