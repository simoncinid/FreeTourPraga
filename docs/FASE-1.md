# Fase 1: perimetro, UX e manuale operativo

Aggiornamento: 15 novembre 2026. Fonte: `freetour-praga-contratto.pdf`, pagine 1, 3 e 4. Questo documento sostituisce le precedenti note di Fase 1. Il committente ha richiesto Railway al posto di Vercel e ha scelto un’anteprima con dati dimostrativi, con configurazione successiva di Stripe e SMTP a proprio carico.

## 1. Analisi UX/UI e prototipi

Obiettivo: consentire al visitatore italiano di scegliere un tour, una partenza e i partecipanti, conoscere il totale prima della conferma e ricevere tutti i dettagli per presentarsi al punto d’incontro. Lo staff gestisce catalogo, capienze, prezzi e contenuti senza modificare il codice.

Flusso pubblico: home → catalogo/filtri → scheda tour → data → orario → biglietti per fascia d’età → carrello → contatti/consensi/metodo pagamento → conferma. Il carrello resta nel browser, senza registrazione. Il server ricalcola tariffe e sconti; lo stato del pagamento arriva dal webhook firmato Stripe.

Flusso staff: accesso → tour e orari → prezzi/fasce/capienze → pubblicazione → calendario → prenotazioni. Le modifiche editoriali sono disponibili in Contenuti e Home/FAQ/contatti. I ruoli admin e operator hanno permessi distinti.

Interfaccia: palette blu/arancio del progetto, caratteri locali Manrope/Fraunces, navigazione mobile, form etichettati, focus tastiera, link al contenuto e riepilogo visibile. Maps e TripAdvisor si caricano su richiesta. Il prototipo navigabile coincide con l’applicazione; le schermate del collaudo vengono salvate in `tmp/browser-qa/`.

Decisioni operative: orari in Europe/Prague, importi in centesimi EUR, fasce d’età configurabili per tour, anche gli infanti occupano capienza. Gli orari si salvano in UTC. La data scelta nel calendario rimane quella di Praga anche per utenti in altri fusi. Lo sconto multi-tour è configurabile e viene applicato dal server. I dati dimostrativi non rappresentano offerte definitive.

## 2. Frontend, SEO/GEO e integrazioni

Pagine: home, catalogo, schede tour, tour privati, Partner Europa con modulo, contatti con modulo, FAQ, privacy e termini. Rendering server, metadata/canonical, Open Graph, lingua italiana, dati strutturati TravelAgency/WebSite/TouristTrip/FAQ/Breadcrumb, sitemap con FAQ e sole pagine HTML pubbliche. `llms.txt`, `llms-full.txt` e `ai-context.json` espongono il catalogo pubblicato e i contenuti aggiornati dal CMS. Nessun posizionamento nei motori è garantito.

Maps usa il punto d’incontro di ciascun tour. Social e profilo TripAdvisor sono configurabili; il widget richiede il codice ufficiale in `TRIPADVISOR_WIDGET_HTML` e `NEXT_PUBLIC_TRIPADVISOR_WIDGET_SCRIPT_SRC`. Nessun widget esterno viene simulato.

In anteprima `SITE_PREVIEW=true`: avviso pubblico, meta noindex/nofollow e robots che esclude la scansione. Prima del lancio inserire catalogo e testi definitivi e cambiare questa variabile in `false`. Non indicizzare tariffe dimostrative.

## 3. Gestionale tour, orari, disponibilità e contenuti

Accedere a `/accesso` con l’account staff configurato in `STAFF_USERS`. Le credenziali iniziali Railway sono nel file privato locale `privato/railway-accesso.txt`.

- `/admin/tour`: creare/modificare tour, descrizione, foto, incontro, mappe, durata, tariffe adulto/bambino/infante, soglie di età, SEO, pubblicazione e partenze.
- Per ogni partenza: impostare inizio/fine nel fuso di Praga e capienza. Le prenotazioni esistenti impediscono riduzioni incompatibili.
- `/admin/contenuti`: testi e metadata delle pagine informative.
- `/admin/sito`: marchio, home, FAQ, galleria, contatti, navigazione, footer, social e TripAdvisor.
- `/admin/impostazioni`: soglia/percentuale sconto, policy e testi delle comunicazioni.
- `/admin/prenotazioni`: ricerca e filtri, inserimento manuale, dettagli, note, presenza e pagamenti.
- `/admin/calendario`: partenze, occupazione e dettagli operativi.
- `/admin/pre-tour`: coda invii, esiti ed eventuali ritentativi.

Le foto caricate vengono validate, ridimensionate e convertite WebP. Senza bucket media opzionale vengono conservate in PostgreSQL, incluse nei backup e disponibili dopo ogni nuovo deploy. Le modifiche passano da API autenticate con validazione server e controllo origine.

## 4. Booking engine e Stripe

Il visitatore seleziona data/orario e fasce d’età, aggiunge più tour e vede lo sconto automatico. Il checkout richiede nome, email, telefono internazionale e accettazione delle condizioni. Il codice di idempotenza evita duplicati nei tentativi ripetuti; il server conserva atomicamente prenotazione, posti e coda email.

Contanti: prenotazione confermata e saldo sul posto. Stripe: Checkout esterno, link in email, blocco posti per circa 30 minuti. Il ritorno alla pagina non vale come pagamento: servono evento firmato, sessione associata, valuta EUR e importo coincidente. Eventi duplicati non riapplicano il pagamento. Link scaduti/cancellati vengono rifiutati; pagamenti tardivi non rioccupano posti già liberati.

Finché non sono presenti chiave Stripe e firma webhook, l’opzione carta risulta in attivazione. Nell’anteprima sono ammessi solo pagamenti Stripe di test. La configurazione e il collaudo dell’account reale restano da eseguire dal committente.

## 5. Email transazionali e calendario

La conferma include PNR, tour, partecipanti, data/orario a Praga, punto d’incontro, mappa, totale, indicazioni di pagamento e assistenza. Le email di prenotazione includono un allegato `.ics` e il link per scaricarlo. Il calendario usa UTC, UID stabile, sequenza degli aggiornamenti e stato coerente (provvisorio/confermato/cancellato). Il calendario operativo è nel gestionale.

Un worker Railway ogni minuto elabora l’outbox persistente, con lease e retry. Un tentativo fallito non viene indicato come inviato. L’email al cliente e quella operativa allo staff sono distinte. In Fase 1 il polling OTA è disabilitato (`ENABLE_OTA=false`). SMTP e recapito sul dominio effettivo richiedono la configurazione del committente.

## 6. Pubblicazione, SSL e documentazione

Infrastruttura, comandi e ripristino sono documentati in [RAILWAY.md](RAILWAY.md). Le migrazioni precedono il rilascio e il controllo di salute verifica il database. Il dominio Railway dispone di HTTPS. Il backup giornaliero esporta PostgreSQL, cifra con age e carica su bucket privato Railway; la chiave privata resta offline. Retention: 30 giorni.

Il codice è nel repository GitHub del progetto. La CI verifica lint, TypeScript, test locali/PostgreSQL, API e browser sul bundle di produzione. [COLLAUDO.md](COLLAUDO.md) distingue verifiche automatiche, verifiche online e servizi non ancora configurati.

La validazione del cliente prevista per ciascuno step del contratto rimane un’attività del committente e non viene sostituita dai test automatici. L’anteprima pubblicata non equivale all’accettazione commerciale finale.
