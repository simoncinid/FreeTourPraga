"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
export function MobileNavigation({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null),
    pathname = usePathname();
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);
  return (
    <details
      ref={ref}
      className="site-mobile-menu xl:hidden"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a"))
          ref.current?.removeAttribute("open");
      }}
    >
      {children}
    </details>
  );
}
