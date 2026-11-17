"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function NavHoverMenu({ label, href, children, mobile = false }: {
  label: string; href?: string; children: ReactNode; mobile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);
  return (
    <div ref={root} className={mobile ? "relative" : "relative flex h-full items-center"}
      onPointerEnter={(event) => { if (!mobile && event.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={(event) => { if (!mobile && event.pointerType === "mouse") setOpen(false); }}
      onBlur={(event) => { if (!mobile && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); root.current?.querySelector("button")?.focus(); } }}>
      <div className={`flex items-center ${mobile ? "justify-between" : ""}`}>
        {href && <Link href={href} onClick={() => setOpen(false)} className={mobile ? "flex-1 px-3 py-3 text-ink" : "nav-link py-5"}>{label}</Link>}
        <button type="button" className={mobile ? "flex min-h-11 min-w-11 items-center justify-center gap-2 px-3 text-ink" : "nav-link flex min-h-11 items-center gap-1 px-2"}
          aria-label={`Apri menu ${label}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {!href && label}<ChevronDown size={16} aria-hidden className={open ? "rotate-180" : ""} />
        </button>
      </div>
      {open && <div id={id} onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}
        className={mobile ? "grid gap-1 border-l border-hairline pl-3" : "absolute left-0 top-full z-40 grid max-h-[70vh] w-72 gap-1 overflow-auto rounded-lg border border-hairline bg-white p-3 text-ink shadow-card"}>{children}</div>}
    </div>
  );
}
