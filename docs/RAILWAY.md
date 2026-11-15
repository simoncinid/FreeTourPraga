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

Indirizzo: https://web-production-f3beeaff.up.railway.app

HTTPS è fornito dal dominio Railway. Il dominio inoltra alla porta **8080**, quella assegnata da Railway al processo web (`PORT`). `NEXT_PUBLIC_SITE_URL` contiene questo stesso URL; worker usa il medesimo dominio in `PLATFORM_URL`. `SITE_PREVIEW=true` contrassegna i dati dimostrativi e disabilita l’indicizzazione. Per passare al dominio personalizzato aggiornare DNS/dominio su Railway, URL pubblico, URL worker e gli endpoint configurati su Stripe; quindi ridistribuire web. Le variabili `NEXT_PUBLIC_*` possono essere incorporate durante la build.

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

## Attivare Stripe (committente)

1. In web impostare `STRIPE_SECRET_KEY` di test.
2. Creare un webhook Stripe verso `https://web-production-f3beeaff.up.railway.app/api/stripe/webhook` e salvare il relativo `STRIPE_WEBHOOK_SECRET` in web.
3. Eventi: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`; per i flussi di rimborso già presenti, `refund.created`, `refund.updated`, `refund.failed`.
4. Ridistribuire web. Eseguire un pagamento test dal browser e verificare stato, importo EUR, conferma email e calendario. Provare anche abbandono, scadenza e reinvio dello stesso evento.
5. Usare chiavi live solo dopo il completamento dell’anteprima (`SITE_PREVIEW=false`) e la configurazione del corrispondente webhook live. La chiave privata resta solo in web.

Prima di questi passaggi i contanti sono disponibili; il pagamento online risulta in attivazione. Il test automatico del protocollo Stripe usa un mock HTTPS e webhook firmati: non equivale a una transazione sul proprio account Stripe.

## Attivare SMTP (committente)

In **web**, non nel worker, impostare `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS o 465 TLS), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` e `ADMIN_EMAIL`. `BOOKING_ADMIN_EMAILS` contiene i destinatari delle conferme operative. Validare queste caselle prima di inviare prenotazioni reali. Configurare il dominio mittente nel proprio provider (SPF/DKIM/DMARC) e ridistribuire web.

Worker usa `PLATFORM_URL` e lo stesso `CRON_SECRET` di web. Ogni minuto richiede `/api/platform/cron?task=jobs`; `ENABLE_OTA=false` evita l’attivazione di integrazioni della Fase 2. Il worker scrive lo stato HTTP nei log; il gestionale mostra l’esito di ogni invio. Gli invii falliti si possono ritentare dal gestionale. Verificare recapito reale, cartella spam, allegato ICS e link di pagamento con una casella controllata prima del lancio.

`railway run --service web node scripts/preflight.mjs` richiede il file locale di questo script e usa le variabili del servizio; il controllo è di configurazione e non invia messaggi o pagamenti. Stripe e SMTP mancanti producono esito non superato, intenzionalmente.

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
