# Collaudo Fase 1 — 15 novembre 2026

## Ambiente locale verificato

Next.js 16.4.5, bundle standalone, PostgreSQL temporaneo dedicato, SMTP isolato con STARTTLS e certificato di test esplicitamente fidato dal processo. Nessuna richiesta di pagamento reale o invio email su Internet durante questi test.

| Verifica | Esito |
|---|---|
| `npm run lint` | Superato, zero avvisi |
| `npm run typecheck` | Superato |
| `npm test` | 27 test superati |
| `npm run test:postgres` | Superato su database temporaneo; entrambe le migrazioni applicate |
| `npm run test:browser` | Build, 23 risposte HTTP, E2E API, browser desktop/mobile e SMTP superati |
| `npm audit --audit-level=moderate` | Zero vulnerabilità |
| `git diff --check` | Superato |

Le prove Stripe intercettano il protocollo HTTPS tramite nock: verificano richiesta Checkout, importo, metadati, chiave idempotente e link generato. Il test firma gli eventi con lo SDK Stripe, prova la duplicazione e rifiuta sessioni scadute/cancellate e chiavi live nell’anteprima. Non prova la configurazione di un account Stripe effettivo.

Il server SMTP locale ha ricevuto 13 messaggi tramite STARTTLS, incluse conferme con HTML, link protetti e allegati `.ics`. Il file calendario ha UID stabile, sequenza e stato coerente. Il recapito del provider del committente richiede una prova distinta.

I browser desktop 1440×1000 e mobile 390×844 percorrono il checkout fino alla conferma. Le date vengono selezionate con fuso del browser America/Los_Angeles per verificare che il giorno operativo resti quello di Praga. Verificati assenza di errori JavaScript, un solo h1 e assenza di overflow sulle pagine pubbliche esaminate. Le schermate sono in `tmp/browser-qa/`; sono schermate QA con contenuti modificati dai test, non una copia del database di produzione.

Verificati anche login staff, protezione delle API, separazione dei ruoli, controllo origine, persistenza del CMS, tariffe e fasce configurabili, upload WebP persistente nel database, permessi di pubblicazione e download calendario protetto. I test API conservano copertura delle funzioni preesistenti di Fase 2, senza attivarne i servizi.

Non sono dichiarati punteggi Lighthouse, certificazioni di accessibilità, posizionamenti SEO/GEO o conformità legale sulla base di questi test.

## Verifiche Railway e GitHub

Provisioning e primo backup avviati. Rilascio web, CI remota, HTTPS e prova di ripristino sono in corso; gli esiti effettivi saranno riportati in [STATO-CONSEGNA.md](STATO-CONSEGNA.md). Nessun pagamento, recapito SMTP Internet o validazione del cliente viene dichiarato eseguito senza evidenze.
