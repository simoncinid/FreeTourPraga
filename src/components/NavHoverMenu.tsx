"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type NavHoverMenuProps = {
  label: ReactNode;
  children: ReactNode;
  panelClassName: string;
};

export function NavHoverMenu({
  label,
  children,
  panelClassName,
}: NavHoverMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative flex h-full items-center"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="nav-link flex cursor-pointer items-center gap-1 whitespace-nowrap"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div
          className={`absolute left-0 top-full z-40 grid gap-1 rounded-lg border border-hairline bg-white p-3 text-ink shadow-card ${panelClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
