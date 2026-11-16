import Link from "next/link";
import { ChevronDown, Menu, MessageCircle } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { NavHoverMenu } from "@/components/NavHoverMenu";
import { catalog, publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";

const primaryHrefs = [
  "/tour",
  "/chi-siamo",
  "/#informazioni-utili",
  "/contatti",
];
const menuTourLimit = 5;

export async function Header() {
  const [c, tours] = await Promise.all([publicSiteContent(), catalog()]);
  const menuTours = tours.slice(0, menuTourLimit);
  const links = c.globals.navigation;
  const rest = links;
  const primary = rest.filter((link) => primaryHrefs.includes(link.href));
  const more = rest.filter((link) => !primary.includes(link));
  const showSplit = primary.length > 0 && more.length > 0;
  const visible = showSplit ? primary : rest;
  const overflow = showSplit ? more : [];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-on-dark shadow-[0_4px_18px_rgba(7,26,53,0.18)]">
      <div className="container-page flex h-[74px] items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-[25px] leading-none tracking-tight text-white"
        >
          {c.globals.brandName}
        </Link>
        <nav className="hidden h-full items-center gap-5 self-stretch xl:flex">
          {visible.map((link) =>
            link.href === "/tour" ? (
              <NavHoverMenu
                key={`${link.href}-${link.label}`}
                label={
                  <>
                    {link.label}
                    <ChevronDown size={14} aria-hidden />
                  </>
                }
                panelClassName="w-72"
              >
                {menuTours.map((tour) => (
                  <Link
                    key={tour.slug}
                    href={`/tour/${tour.slug}`}
                    className="rounded-sm px-3 py-3 hover:bg-surface-soft"
                  >
                    {tour.title}
                  </Link>
                ))}
                <Link
                  href="/tour"
                  className="rounded-sm px-3 py-3 font-semibold hover:bg-surface-soft"
                >
                  Tutti i tour
                </Link>
              </NavHoverMenu>
            ) : (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="nav-link flex h-full items-center whitespace-nowrap"
              >
                {link.label}
              </Link>
            ),
          )}
          {overflow.length > 0 && (
            <NavHoverMenu label="Altro" panelClassName="w-64">
              {overflow.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="rounded-sm px-3 py-3 hover:bg-surface-soft"
                >
                  {link.label}
                </Link>
              ))}
            </NavHoverMenu>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <CartBadge />
          <a
            href={contentWhatsapp(
              c,
              "Ciao FreeTourPraga, vorrei un'informazione sui tour.",
            )}
            className="button-pill-primary max-lg:!hidden lg:inline-flex !border-transparent !bg-[#1aad53] !px-5 !py-2 !text-white hover:!bg-[#159648]"
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
          <details className="relative xl:hidden">
            <summary
              className="cursor-pointer list-none rounded-full border border-white/40 p-2"
              aria-label="Menu"
            >
              <Menu size={20} />
            </summary>
            <nav className="absolute right-0 top-12 grid max-h-[70vh] w-72 gap-1 overflow-auto rounded-lg border border-hairline bg-white p-3 text-ink shadow-card">
              {links.map((link) => (
                <span key={`${link.href}-${link.label}`} className="grid">
                  <Link
                    className="rounded-sm px-3 py-3 hover:bg-surface-soft"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                  {link.href === "/tour" &&
                    menuTours.map((tour) => (
                      <Link
                        key={tour.slug}
                        href={`/tour/${tour.slug}`}
                        className="rounded-sm py-2 pl-6 pr-3 text-sm hover:bg-surface-soft"
                      >
                        {tour.title}
                      </Link>
                    ))}
                </span>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
