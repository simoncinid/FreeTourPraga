"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBrowserStorage } from "@/lib/browser-storage";

export function ConsentAndTracking() {
  const savedConsent = useBrowserStorage("ftp-consent");
  const consent =
    savedConsent === "essential" || savedConsent === "marketing"
      ? "essential"
      : null;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Parità WP Affiliates: ?affiliates=ID (cookie 30gg) + legacy ?ref=CODICE.
    const params = new URLSearchParams(window.location.search);
    const affiliates = params.get("affiliates");
    const ref = params.get("ref");
    const value =
      affiliates && /^\d+$/.test(affiliates)
        ? affiliates
        : ref && /^[A-Z0-9_-]{3,40}$/i.test(ref)
          ? ref.toUpperCase()
          : "";
    if (!value) return;
    localStorage.setItem("ftp-affiliate", value);
    window.dispatchEvent(new Event("ftp-storage"));
    const maxAge = 30 * 24 * 60 * 60;
    document.cookie = `ftp_affiliates=${encodeURIComponent(value)}; Max-Age=${maxAge}; path=/; SameSite=Lax`;
  }, []);
  function choose() {
    localStorage.setItem("ftp-consent", "essential");
    window.dispatchEvent(new Event("ftp-storage"));
    setOpen(false);
    window.dispatchEvent(new Event("ftp-consent"));
  }
  return (
    <>
      <button className="consent-settings" onClick={() => setOpen(true)}>
        Preferenze cookie
      </button>
      {(consent === null || open) && (
        <aside className="consent-banner" aria-label="Preferenze privacy">
          <strong className="text-ink">La tua scelta, prima di partire.</strong>
          <p className="my-3 text-sm">
            Usiamo solo i dati necessari per prenotazioni, sicurezza e
            attribuzione affiliati. Nessun tracciamento pubblicitario.{" "}
            <Link className="underline" href="/privacy">
              Informativa privacy
            </Link>
          </p>
          <div className="consent-banner-actions">
            <button className="button-primary consent-btn-essential" onClick={choose}>
              Ok, solo necessari
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
