import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";

const primaryHrefs = [
  "/tour",
  "/chi-siamo",
  "/informazioni-utili",
  "/contatti",
];

export async function Header() {
  const c = await publicSiteContent();
  const links = c.globals.navigation;
  const account = links.find(
    (link) => link.href === "/account" || link.href === "/accesso",
  );
  const rest = links.filter((link) => link !== account);
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
        <nav className="hidden items-center gap-5 xl:flex">
          {visible.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="nav-link whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          {overflow.length > 0 && (
            <details className="nav-more relative">
              <summary className="nav-link cursor-pointer whitespace-nowrap">
                Altro
              </summary>
              <div className="absolute left-0 top-9 z-40 grid w-64 gap-1 rounded-lg border border-hairline bg-white p-3 text-ink shadow-card">
                {overflow.map((link) => (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className="rounded-sm px-3 py-3 hover:bg-surface-soft"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {account && (
            <Link
              href={account.href}
              className="nav-link hidden whitespace-nowrap xl:inline !text-primary"
            >
              {account.label}
            </Link>
          )}
          <CartBadge />
          <a
            href={contentWhatsapp(
              c,
              "Ciao FreeTourPraga, vorrei un'informazione sui tour.",
            )}
            className="button-pill-primary max-lg:!hidden lg:inline-flex !border !border-primary/60 !bg-transparent !px-5 !py-2 !text-primary"
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
                <Link
                  className="rounded-sm px-3 py-3 hover:bg-surface-soft"
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
