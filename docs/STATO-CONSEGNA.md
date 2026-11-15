# Stato della Fase 1 — 15 novembre 2026

Perimetro richiesto: sei step della Fase 1 del PDF, con Railway al posto di Vercel e backup giornaliero. Il committente ha confermato il mantenimento del catalogo dimostrativo e la successiva configurazione di Stripe e SMTP su Railway. Incluse le modifiche contemporanee a home, menu, Chi siamo, Informazioni utili, Blog e Aiuto.

## Verifiche completate sul codice

- Lint senza errori o avvisi e TypeScript superati.
- 27 test superati; anche i test applicativi su PostgreSQL reale sono superati.
- Build standalone, migrazioni e smoke HTTP delle 23 pagine/risorse previsti superati.
- E2E API: checkout cash multi-tour, sconto server, idempotenza, permessi, CMS, upload immagini PostgreSQL, calendario e gestione staff.
- Browser desktop/mobile: pagine, assenza di overflow, date di Praga da un browser in fuso americano, carrello, checkout cash, conferma e calendario. Accesso staff e pagine tour/calendario/CMS/impostazioni verificati.
- Protocollo Stripe: sessione mock HTTPS, importo/metadati/idempotency key, link email, webhook firmato, eventi duplicati e rifiuto di pagamenti live nell’anteprima.
- SMTP locale: 13 messaggi ricevuti da server isolato STARTTLS, con verifica dell’HTML e dell’allegato calendario. Non sono state inviate email su Internet.
- Audit npm: nessuna vulnerabilità segnalata.

## Infrastruttura

Railway è autenticato e collegato al progetto indicato. Configurati web, worker, database e servizio backup con cron giornaliero e bucket privato. Corrette le cause dei crash precedenti (percorso server, Prisma CLI e script worker mancanti). Creato account staff con password casuale, salvata solo nel file locale privato. Impostata anteprima non indicizzabile.

## Verifiche esterne eseguite

- Anteprima pubblicata in HTTPS: https://web-production-f3beeaff.up.railway.app. Healthcheck HTTP 200 con storage PostgreSQL. Il dominio è allineato alla porta 8080 del processo Railway.
- 17 pagine/risorse pubbliche verificate online, noindex dell’anteprima, protezione API staff e cron, login amministratore e upload immagini persistente verificati.
- Browser desktop/mobile sull’URL pubblico: rendering, un solo h1, assenza di overflow, Maps su richiesta e widget TripAdvisor ufficiale caricabile.
- Worker attivo; le richieste periodiche ai job restituiscono HTTP 200.
- Backup giornaliero alle 02:00 UTC: due esecuzioni di prova con caricamento riuscito sul bucket privato Railway.
- Backup del 15 novembre alle 15:35:38 UTC scaricato, decifrato e ripristinato integralmente in un database PostgreSQL locale isolato: 1 stato applicativo, 3 tour, 1 immagine e 2 migrazioni verificati. Database temporaneo e archivio decifrato eliminati dopo la prova. [Evidenza del ripristino](evidenze/backup-restore.json).
- Repository aggiornato su GitHub; CI con lint, tipi, test, PostgreSQL, browser e allegati QA attiva. Anche l’ultima revisione applicativa `8d44d32` ha superato la [CI GitHub](https://github.com/simoncinid/FreeTourPraga/actions/runs/43731125905). La sitemap online contiene 15 URL tutti distinti.

## Copertura dei sei step

| Step | Stato tecnico |
|---|---|
| 1. UX/UI e prototipi | Flussi documentati, prototipo navigabile e [schermate desktop](prototipi/home-desktop.png)/[mobile](prototipi/home-mobile.png) consegnati; validazione cliente da formalizzare |
| 2. Frontend, SEO/GEO, Maps, social, TripAdvisor e Partner Europa | Implementati e verificati; anteprima non indicizzabile con contenuti dimostrativi |
| 3. Back-office tour, orari, disponibilità e contenuti | Implementato e verificato su PostgreSQL e nel browser, incluse le nuove pagine |
| 4. Booking e Stripe | Cash verificato; integrazione Stripe verificata con protocollo mock e firme reali dello SDK; configurazione/collaudo account del committente pendenti |
| 5. Email e calendario | Worker e ICS verificati; SMTP STARTTLS locale verificato; provider e recapito Internet del committente pendenti |
| 6. Online, SSL e deploy | Anteprima Railway HTTPS attiva, CI verde, database e migrazioni attivi, backup giornaliero e prova di ripristino riusciti |

## Attività riservate al committente prima del lancio commerciale

1. Configurare Stripe e webhook e verificare una transazione nel proprio account.
2. Configurare SMTP e dominio mittente, quindi verificare recapito a una casella controllata.
3. Inserire e approvare tour, tariffe, partenze, contenuti e informative definitivi dal gestionale.
4. Validare gli step previsti dal contratto e, solo al termine, disattivare l’anteprima.

Il dominio Railway è la destinazione richiesta; il dominio personalizzato non è richiesto per questa anteprima. Fase 2, campagne Ads, Twilio e OTA non vengono attivati. Il widget TripAdvisor recuperato dal sito precedente è il certificato 2020, non una certificazione aggiornata.

La consegna commerciale completa non viene dichiarata finché queste attività rimangono aperte. Le istruzioni operative sono in [RAILWAY.md](RAILWAY.md), il manuale e la matrice della Fase 1 in [FASE-1.md](FASE-1.md).

## Rimozione dell’accesso clienti dalla Fase 1

Su richiesta del committente, rimossi la voce pubblica “Accedi o registrati” e la pagina `/account` (HTTP 404), anche quando il collegamento è presente in una navigazione CMS salvata in precedenza. Il checkout resta senza account; `/accesso` rimane riservato allo staff. Verificati lint, TypeScript, 27 test e collaudo HTTP del bundle di produzione.
