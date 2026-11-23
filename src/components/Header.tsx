import { siteNavigation } from "@/lib/navigation";
import { MobileNavigation } from "./MobileNavigation";
import { canonicalPath } from "@/lib/public-paths";
import Link from "next/link";
import { Menu } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { NavHoverMenu } from "@/components/NavHoverMenu";
import { navigationTours, publicSiteContent } from "@/lib/platform/public";

export async function Header() {
  const [c, tours] = await Promise.all([
    publicSiteContent(),
    navigationTours(),
  ]);
  const items = siteNavigation(c, tours);
  function navigation(mobile = false) {
    return items.map((item) => {
      if (!item.children) {
        return (
          <Link
            key={item.href}
            href={canonicalPath(item.href)}
            className={mobile ? "px-3 py-3" : "nav-link"}
          >
            {item.label}
          </Link>
        );
      }
      const parentHref = canonicalPath(item.href);
      const showParentInSubmenu = !item.children.some(
        (child) => canonicalPath(child.href) === parentHref,
      );
      return (
        <NavHoverMenu
          key={item.label}
          label={item.label}
          href={parentHref}
          mobile={mobile}
        >
          {showParentInSubmenu && (
            <Link href={parentHref} className="px-3 py-3">
              {item.label}
            </Link>
          )}
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={canonicalPath(child.href)}
              className="px-3 py-3"
            >
              {child.label}
            </Link>
          ))}
        </NavHoverMenu>
      );
    });
  }
  return (
    <header
      data-cms-navigation="true"
      className="sticky top-0 z-30 border-b border-white/10 bg-navy text-on-dark shadow-[0_4px_18px_rgba(7,26,53,0.18)]"
    >
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
          <MobileNavigation>
            <summary className="site-mobile-menu-toggle" aria-label="Menu">
              <Menu size={20} />
            </summary>
            <nav
              aria-label="Navigazione mobile"
              className="site-mobile-menu-panel"
            >
              {navigation(true)}
            </nav>
          </MobileNavigation>
        </div>
      </div>
    </header>
  );
}
