# Railway: gestione, rilascio e ripristino

Configurazione del 15 novembre 2026. Progetto: `7a0fae1d-ca22-4b6e-9030-483094639511`, ambiente `production`. [Dashboard Railway](https://railway.com/project/7a0fae1d-ca22-4b6e-9030-483094639511).

## Servizi

| Servizio | Compito | Avvio |
|---|---|---|
| web | Next.js standalone, API e gestionale | `node server.js` |
| Postgres | Dati applicativi e immagini CMS | Template PostgreSQL 18 |
| worker | Outbox email, scadenza blocchi e manutenzione | `node scripts/worker.mjs` |
| backup | Esportazione cifrata su bucket privato | `deploy/Dockerfile.backup`, cron `0 2 * * *` UTC |

Il Dockerfile principale include asset statici, font, Prisma CLI e worker. L’utente non è root. Le migrazioni sono nel pre-deploy di web: `node node_modules/prisma/build/index.js migrate deploy`. Se falliscono, il nuovo deploy si interrompe. L’healthcheck è `/api/platform/health`, timeout 120 secondi, e richiede un database raggiungibile.

Il manifest senza segreti è `deploy/railway-services.json`. `npm run railway:configure` applica esplicitamente quella configurazione al progetto tramite la CLI autenticata. Non eseguire il comando contro progetti diversi. Non vengono usati file Vercel o Render nel rilascio Railway.

Il repository sorgente è `simoncinid/FreeTourPraga`, ramo `main`. La CI GitHub verifica lint, tipi, test applicativi, PostgreSQL, HTTP e browser. Il deploy Railway deve seguire un commit verificato; lo stato effettivo è in `STATO-CONSEGNA.md`.

## Dominio e anteprima

Aggiornamento SEO del 16 novembre: l'anteprima contiene anche il recupero delle URL storiche, 12 tour, 28 articoli e 26 altre pagine; il dominio pubblico non è stato migrato. Vedere `SEO-ANTEPRIMA-2026-11-16.md` per deployment, backup e verifiche. Il comando `scripts/sync-seo-preview.mjs` è riservato all'anteprima e non configura DNS o domini.

Indirizzo: https://web-production-f3beeaff.up.railway.app

HTTPS è fornito dal dominio Railway. Il dominio inoltra alla porta **8080**, quella assegnata da Railway al processo web (`PORT`). `NEXT_PUBLIC_SITE_URL` contiene questo stesso URL; worker usa il medesimo dominio in `PLATFORM_URL`. `SITE_PREVIEW=true` mantiene le protezioni della revisione cliente e disabilita l’indicizzazione, senza mostrare avvisi pubblici. Per passare al dominio personalizzato aggiornare DNS/dominio su Railway, URL pubblico, URL worker e gli endpoint configurati su Stripe; quindi ridistribuire web. Le variabili `NEXT_PUBLIC_*` possono essere incorporate durante la build.

## Variabili web

- `DATABASE_URL`: riferimento al database Railway sulla rete privata.
- `PLATFORM_STORAGE=postgres`, `NODE_ENV=production`.
- `SESSION_SECRET`, `BOOKING_LINK_SECRET`, `CRON_SECRET`: valori casuali distinti, almeno 32 caratteri.
- `STAFF_USERS`: JSON con email, ruolo `admin`/`operator`, passwordHash scrypt. `node scripts/password-hash.mjs` legge la password da stdin. Non usare l’account locale in produzione.
- `SITE_PREVIEW=true`: mantenere finché catalogo e servizi non sono validati.
- Social: `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL` e gli altri canali effettivi.
- TripAdvisor: profilo e codice widget ufficiale del sito precedente. Il widget recuperato è il certificato **2020**, esattamente come sul sito attuale; non è una certificazione per l’anno corrente. Il caricamento richiede il clic del visitatore.

Dal sito usare “Area staff” nel footer, oppure aprire `/accesso`; dopo il login si entra in `/admin`. Sito e gestionale condividono il database PostgreSQL Railway.

Le credenziali staff iniziali sono in `privato/railway-accesso.txt`, mai nel repository o nel container. Le password non sono recuperabili dal gestionale: per sostituirle generare un nuovo hash e aggiornare `STAFF_USERS`.

## Pagamenti per tour — aggiornamento specifiche V2

Dal gestionale, nella scheda del tour, scegliere contanti e/o bonifico. Contanti è il default; il bonifico richiede beneficiario, IBAN e istruzioni confermati dal committente. Il checkout propone soltanto metodi disponibili per tutti i tour nell’ordine. Il server ricontrolla la configurazione alla vendita e congela le istruzioni nella prenotazione; il team registra incassi e rimborsi manuali.

Stripe non è attivo nella versione corrente: `/api/stripe/webhook` restituisce 410 e le chiavi da sole non abilitano il checkout. La precedente procedura di attivazione tramite sole variabili è superata; non richiedere credenziali Stripe per completare il perimetro attuale.

## Attivare l'invio email

Per Resend, verificare il dominio mittente con i record DNS del provider. Nel servizio **web** impostare `RESEND_API_KEY` come segreto e `RESEND_FROM=FreeTourPraga <info@freetourpraga.com>`, insieme ad `ADMIN_EMAIL` e `BOOKING_ADMIN_EMAILS`. Il worker usa lo stesso endpoint esistente e il servizio web invia via HTTPS.

Per SMTP, lasciare vuota `RESEND_API_KEY` e impostare le variabili seguenti.

In **web**, non nel worker, impostare:

- `SMTP_HOST=mail.freetourpraga.com`
- `SMTP_PORT=587` (STARTTLS; alternativa `465` TLS)
- `SMTP_USER=info@freetourpraga.com`
- `SMTP_PASS=…` (segreto hosting)
- `SMTP_FROM=freetourpraga.com <info@freetourpraga.com>`
- `ADMIN_EMAIL=info@freetourpraga.com`
- `BOOKING_ADMIN_EMAILS=info@freetourpraga.com,admin@unitedworldtours.eu`

Le conferme admin usano oggetto e corpo identici a Contact Form 7 (`Reserva freetourpraga.com italiano` + campi in spagnolo) perché UWT li importa automaticamente. In collaudo impostare `BOOKING_ADMIN_EMAILS` solo su una casella di test: non inviare prenotazioni fittizie a `admin@unitedworldtours.eu`. Validare recapito, spam e allegato ICS prima del go-live. Configurare SPF/DKIM/DMARC sul dominio mittente e ridistribuire web.

**Blocco SMTP Railway:** sui piani Free/Trial/Hobby le porte SMTP in uscita (25/465/587/2525) sono disabilitate. Diagnosi del 23/11/2026 dal runtime web: egress `152.55.176.205`, timeout su 587/465 verso `mail.freetourpraga.com`, mentre 443 verso lo stesso host è ok. Con `railway run` (rete diversa) l’SMTP funziona. Per usare l’SMTP dell’hosting serve **piano Pro** (poi ridistribuire web) oppure un relay transazionale HTTPS (Resend/SendGrid/Mailgun/Postmark). Vedi [Outbound Networking](https://docs.railway.com/networking/outbound-networking).

Worker usa `PLATFORM_URL` e lo stesso `CRON_SECRET` di web. Ogni minuto richiede `/api/platform/cron?task=jobs`; `ENABLE_OTA=false` evita l’attivazione di integrazioni della Fase 2. Il worker scrive lo stato HTTP nei log. Il gestionale consente di ritentare gli invii falliti. Lo stato «Inviata» indica l'accettazione del provider. Verificare il recapito e l'allegato ICS con una casella controllata prima del lancio.

`railway run --service web node scripts/preflight.mjs` usa le variabili del servizio e controlla la configurazione senza inviare email. Stripe non è un prerequisito del perimetro corrente.

## Backup giornaliero

Il piano corrente non offre backup nativi Railway: l’API li riserva a workspace Pro. È quindi previsto un servizio dedicato sul piano attuale, con bucket S3 privato Railway `freetourpraga-backups` in regione `ams`.

Il cron parte ogni giorno alle 02:00 UTC. `pg_dump` versione 18 produce un archivio custom; age lo cifra con la chiave pubblica `AGE_RECIPIENT`. Il file temporaneo viene rimosso dopo il caricamento. Il processo termina, come richiesto per i cron Railway. I backup più vecchi di `BACKUP_RETENTION_DAYS=30` vengono eliminati dopo il caricamento riuscito del nuovo archivio. Le immagini CMS nel database sono incluse. I segreti S3 esistono solo nel servizio backup; nessuna ACL pubblica viene applicata.

Variabili backup: `DATABASE_URL`, `AGE_RECIPIENT`, `BACKUP_BUCKET`, `SPACES_ENDPOINT` (nome storico per endpoint S3), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `BACKUP_RETENTION_DAYS`, `RAILWAY_DOCKERFILE_PATH=deploy/Dockerfile.backup`.

La chiave privata age è esclusivamente nel file locale `privato/backup-age-key.txt`. Conservarne una copia sicura offline: perderla impedisce il ripristino. Non copiarla nel servizio backup. Verificare periodicamente l’ultimo deploy cron, il file nel bucket e la sua data. Un cron configurato non prova che tutti i futuri backup riusciranno.

## Ripristino

1. Scaricare dal bucket il backup desiderato su una postazione autorizzata, usando credenziali del bucket senza stamparle nei log.
2. Decifrare: `age --decrypt -i privato/backup-age-key.txt -o database.dump BACKUP.dump.age`.
3. Verificare l’indice: `pg_restore --list database.dump` (client PostgreSQL 18 o successivo).
4. Creare un database di verifica vuoto e ripristinare con `pg_restore --no-owner --no-acl --dbname=DATABASE_DI_VERIFICA database.dump`. Usare variabili ambiente per le credenziali.
5. Controllare prenotazioni, tour, immagini e ultima modifica dello stato. Prima di sostituire il database attivo, sospendere le scritture, esportare lo stato corrente e conservare una possibilità di ritorno.
6. Modificare `DATABASE_URL` di web e backup solo dopo la verifica; ridistribuire web e verificare healthcheck e gestionale. Eliminare le copie locali decifrate al termine.

Non eseguire mai prove distruttive sul database attivo. L’esito della prova realmente eseguita è registrato nel collaudo.
