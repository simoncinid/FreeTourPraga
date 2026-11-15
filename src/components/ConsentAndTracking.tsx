"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBrowserStorage } from "@/lib/browser-storage";
type Consent = "essential" | "marketing";
export function ConsentAndTracking() {
  const savedConsent = useBrowserStorage("ftp-consent");
  const consent = savedConsent === "marketing" || savedConsent === "essential" ? savedConsent : null;
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
  useEffect(() => {
    if (consent !== "marketing") return;
    let cancelled = false;
    fetch("/api/platform/catalog")
      .then((r) => r.json())
      .then((d) => {
        const id = d.settings?.googleAdsId;
        if (cancelled || !/^AW-\d+$/.test(id)) return;
        const w = window as unknown as {
          dataLayer: unknown[];
          gtag?: (...args: unknown[]) => void;
        };
        w.dataLayer = w.dataLayer || [];
        w.gtag =
          w.gtag ||
          function () {
            w.dataLayer.push(arguments);
          };
        w.gtag("js", new Date());
        w.gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
          analytics_storage: "denied",
        });
        w.gtag("config", id);
        if (!document.getElementById("ftp-ads")) {
          const script = document.createElement("script");
          script.id = "ftp-ads";
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
          document.head.appendChild(script);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [consent]);
  function choose(v: Consent) {
    localStorage.setItem("ftp-consent", v);
    window.dispatchEvent(new Event("ftp-storage"));
    setOpen(false);
    window.dispatchEvent(new Event("ftp-consent"));
    if (v === "essential") {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      w.gtag?.("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      });
      for (const part of document.cookie.split(";")) {
        const name = part.split("=")[0].trim();
        if (/^(_ga|_gcl|_gid)/.test(name))
          document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      }
    }
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
            Usiamo solo i dati necessari per prenotazioni e sicurezza. Con il
            tuo consenso attiviamo anche il tracciamento pubblicitario Google
            Ads.{" "}
            <Link className="underline" href="/privacy">
              Informativa privacy
            </Link>
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="button-secondary"
              onClick={() => choose("essential")}
            >
              Solo necessari
            </button>
            <button
              className="button-primary"
              onClick={() => choose("marketing")}
            >
              Accetta marketing
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
export function trackPurchase(
  order: { id: string; totalCents: number },
  settings: { googleAdsId?: string; googleAdsLabel?: string },
) {
  if (
    localStorage.getItem("ftp-consent") !== "marketing" ||
    !settings.googleAdsId ||
    !settings.googleAdsLabel
  )
    return;
  if (sessionStorage.getItem(`ftp-ads-${order.id}`)) return;
  const w = window as unknown as {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  w.gtag =
    w.gtag ||
    function () {
      w.dataLayer.push(arguments);
    };
  sessionStorage.setItem(`ftp-ads-${order.id}`, "sent");
  w.gtag("event", "conversion", {
    send_to: `${settings.googleAdsId}/${settings.googleAdsLabel}`,
    value: order.totalCents / 100,
    currency: "EUR",
    transaction_id: order.id,
  });
}
