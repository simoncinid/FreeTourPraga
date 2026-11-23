"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function AdminNotice({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [message]);
  if (!visible || !message || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="admin-toast admin-feedback"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>,
    document.querySelector("dialog[open]") || document.body,
  );
}
