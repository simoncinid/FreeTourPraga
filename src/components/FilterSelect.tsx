"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

export function FilterSelect({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className = "",
  triggerClassName = "filter-select-trigger",
  disabled = false,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  "aria-label": string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? options[0]?.label ?? "";

  if (disabled && open) setOpen(false);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const host =
      (triggerRef.current.closest("dialog") as HTMLElement | null) ||
      document.body;
    setPortalTarget(host);

    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const hostEl =
        (trigger.closest("dialog") as HTMLElement | null) || document.body;
      const hostRect =
        hostEl === document.body
          ? {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : hostEl.getBoundingClientRect();
      const width = Math.min(
        Math.max(rect.width, 200),
        hostRect.width - 16,
      );
      const gap = 6;
      const estimatedHeight = Math.min(280, options.length * 44 + 16);
      const spaceBelow = hostRect.top + hostRect.height - rect.bottom - gap;
      const openUp =
        spaceBelow < estimatedHeight && rect.top - hostRect.top > spaceBelow;
      const left = Math.min(
        Math.max(hostRect.left + 8, rect.left),
        hostRect.left + hostRect.width - width - 8,
      );

      setPanelStyle({
        position: "fixed",
        zIndex: 100,
        left,
        width,
        top: openUp ? undefined : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
        maxHeight: openUp
          ? Math.max(160, rect.top - hostRect.top - 12)
          : Math.max(160, spaceBelow - 8),
        overflowY: "auto",
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`filter-select ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`${triggerClassName}${!value ? " is-placeholder" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
      >
        <span className="filter-select-value">{label}</span>
        <ChevronDown size={16} className="filter-select-chevron" aria-hidden />
      </button>
      {open &&
        portalTarget &&
        createPortal(
          <div
            ref={panelRef}
            className="filter-select-panel"
            style={panelStyle}
            role="listbox"
            aria-label={ariaLabel}
            aria-required={required || undefined}
          >
            {options.map((option) => (
              <button
                key={option.value || "__empty"}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={
                  option.value === value
                    ? "filter-select-option is-selected"
                    : "filter-select-option"
                }
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>,
          portalTarget,
        )}
    </div>
  );
}
