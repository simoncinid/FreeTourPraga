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

**Rilascio GitHub/web e collaudo online in corso al momento di questo aggiornamento.** Il rapporto sarà aggiornato con gli esiti effettivi.

## Attività riservate al committente prima del lancio commerciale

1. Configurare Stripe e webhook e verificare una transazione nel proprio account.
2. Configurare SMTP e dominio mittente, quindi verificare recapito a una casella controllata.
3. Inserire e approvare tour, tariffe, partenze, contenuti e informative definitivi dal gestionale.
4. Validare gli step previsti dal contratto e, solo al termine, disattivare l’anteprima.

Il dominio Railway è la destinazione richiesta; il dominio personalizzato non è richiesto per questa anteprima. Fase 2, campagne Ads, Twilio e OTA non vengono attivati. Il widget TripAdvisor recuperato dal sito precedente è il certificato 2020, non una certificazione aggiornata.

La consegna commerciale completa non viene dichiarata finché queste attività rimangono aperte. Le istruzioni operative sono in [RAILWAY.md](RAILWAY.md), il manuale e la matrice della Fase 1 in [FASE-1.md](FASE-1.md).
