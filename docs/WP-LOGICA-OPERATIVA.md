# Logica operativa WordPress (it.freetourpraga.com) → piattaforma

Analisi in sola lettura del WP live. Nessuna modifica effettuata su WordPress.

## Stack WP rilevante

| Area | Plugin / meccanismo |
|------|---------------------|
| Affiliati | **Affiliati** (itthinx) + **Affiliates Contact Form 7 Integration** |
| Tour / prenotazioni | **Contact Form 7** (un form per tour) + Datepicker + Cost Calculator + Tel. internazionale |
| Archivio lead | **Contact Form Advance Database** |
| Email | CF7 mail 1 (admin) + mail 2 (cliente HTML). WP Mail SMTP **disattivato** |

Niente WooCommerce / booking engine: le prenotazioni sono lead via form.

## Affiliati

- Parametro URL: `?affiliates={ID}` (ID numerico, nessuna codifica MD5)
- Cookie / timeout referenza: **30 giorni**, last-touch
- Redirect che toglie il parametro: **off**
- Stato referral default: **Accettato**
- Rate commissione CF7: **0** (attribuzione, non payout automatico)
- Tag form: `[wp_affiliates]` (campo nascosto nell’email admin)
- Notifiche plugin: solo email di registrazione affiliato (non referral)

### Partner attivi rilevati

| WP ID | Nome | Email |
|------:|------|-------|
| 2 | Ahoy hostel | manager@ahoyhostel.com |
| 3 | Hostal Downtown | downtown@jsc.cz |
| 4 | Sophies new town | sophies.hostel@bohoco.cz |
| 5 | Charles Bridge Hostel | Info@charlesbridgehostel.com |
| 6 | Best Spot | info@bestspothostel.cz |
| 7 | Prague city center | maioasis506@gmail.com |
| 8 | Hop On Hop Off | heshamadammoursi@gmail.com |

(ID 1 = Direct, pending)

## Tour (form CF7)

Ogni tour = pagina + form con campi tipici:

- nome, email, telefono intl, data, ora, adulti, minori, commenti, acceptance meeting point
- `[wp_affiliates]`
- festività bloccate nel datepicker (24/25/31-12, 1-1) sul Free Tour

Form presenti: Free Tour, Castello, Città Nuova, Comunismo, Free Tour Castello, Terezin, Interni Castello, Mercatini, Petřín/Strahov, Tour Serale, Sconto Teatro Nero.

## Email (flusso prenotazione)

1. **Mail admin (CF7 mail 1)**
   A: `info@freetourpraga.com`, `admin@unitedworldtours.eu`, `freetourpraga@gmail.com`
   Oggetto: `Reserva freetourpraga.com italiano`
   Body testo: tour, nome, email, telefono, data, ora, pax, lingua, **Afiliado: [wp_affiliates]**, messaggio.

2. **Mail cliente (CF7 mail 2, HTML)**
   A: `[email]`
   Conferma con dettagli, punto d’incontro (ombrellone verde / Stavovské divadlo sul free tour), telefono, cross-sell altri tour.

3. **Archivio**
   Contact Form Advance Database salva i payload CF7 per form.

## Mapping nella piattaforma Next

| WP | Codice FreeTourPraga |
|----|----------------------|
| `?affiliates=ID` + cookie 30g | `ConsentAndTracking` + cookie `ftp_affiliates` |
| `[wp_affiliates]` | campo checkout read-only se già tracciato |
| Hostel WP | seed `src/lib/platform/affiliates-wp.ts` (`wpId`, commission 0) |
| Mail admin | job email a `BOOKING_ADMIN_EMAILS` / `ADMIN_EMAIL` |
| Mail cliente HTML | `notification()` con `html` + testo |
| Link/QR partner | `/?affiliates={wpId}` via `affiliatePublicLink()` |

La piattaforma mantiene inventario/slot/PNR (assenti su WP) ma **ripete la stessa logica di attribuzione e notifiche**.
