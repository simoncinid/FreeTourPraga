# SEO: anteprima aggiornata, dominio pubblico invariato

Il 16 novembre 2026 è stata aggiornata esclusivamente l'anteprima https://web-production-f3beeaff.up.railway.app. Deployment Railway `56248d6f-3b7f-4518-a5ce-6ab665773e50`, esito `SUCCESS`. Non sono stati collegati domini personalizzati né modificati DNS, posta, WordPress o variabili di servizio. Il rilascio non richiedeva modifiche dello schema PostgreSQL: il pre-deploy ha riportato «No pending migrations to apply».

Questo documento aggiorna lo stato descritto in `SEO-PREPARAZIONE-2026-11-16.md`: codice e contenuti SEO sono ora presenti anche nell'anteprima Railway, non soltanto in locale.

## Contenuti completati nello stesso layout

La home mantiene le stesse **otto sezioni** e **sei schede informative**. Sono stati aggiornati soltanto i testi nei campi CMS già esistenti: Free Tour in italiano, offerta libera, percorso Città Vecchia/Josefov, orario pubblicato, punto di incontro, lingua, durata e prenotazione. Sono stati aggiunti collegamenti contestuali alle schede e alle guide pertinenti nello stesso testo delle schede. Immagini, pulsante, menu, griglie, colori e componenti rimangono quelli del nuovo sito.

La descrizione storica del Castello è stata recuperata nella sezione «L'esperienza» della scheda esistente, con itinerario e indicazioni sugli accessi. Non sono stati mescolati prezzi e orari del vecchio articolo con quelli del gestionale: le sezioni commerciali del testo importato sono escluse da questo completamento. La scheda è contrassegnata per revisione operativa prima di aprire le prenotazioni.

La revisione normalizza inoltre una vecchia configurazione CMS: alcuni campi delle pagine pubblicate sovrascrivevano ancora i campi strutturati della home. Il trasferimento avviene una sola volta, conservando i testi effettivi di blog e FAQ; la versione dei contenuti passa a 2. Le revisioni editoriali sono identificate da hash e non vengono riapplicate sopra successive modifiche del gestore.

## Dati e pacchetto Railway

L'anteprima contiene **12 tour, 28 articoli e 26 altre pagine storiche**. L'importazione aggiunge soltanto i record mancanti e applica la revisione dei testi. Sono state confrontate copie prima/dopo e verificate inalterate prenotazioni, ordini, impostazioni, affiliazioni, richieste, quattro articoli preesistenti, prezzi, punti d'incontro, durate e partenze dei tre tour precedenti. La revisione del Castello riguarda il testo e il flag di verifica, non questi dati operativi.

Il comando `scripts/sync-seo-preview.mjs` accetta soltanto il progetto Railway conosciuto, il servizio web, `SITE_PREVIEW=true`, il dominio tecnico esatto e storage PostgreSQL. Non configura domini e non modifica record DNS. Crea un backup privato prima della scrittura e registra una revisione per rendere il comando idempotente. Il secondo avvio ha restituito `alreadyApplied: true`.

I backup prima del rilascio e della transazione sono in `privato/`, esclusi da Git. Quello transazionale è stato scaricato e confrontato tramite SHA-256. Il pacchetto di rilascio è stato preparato con una lista esplicita di file, senza `.env`, `.data`, credenziali o cartella `privato`. Manifest del pacchetto in `tmp/seo-phase2/build-manifest.json`.

È stata corretta anche `.dockerignore`: i quattro PDF pubblici sotto `public/wp-content/uploads` ora fanno eccezione al filtro generale sui PDF. La sola build locale non avrebbe rilevato la loro esclusione dal contesto Docker.

## Verifiche effettive

- **48 test automatici**, lint e controllo TypeScript superati.
- Build di produzione e flussi HTTP completi verificati su PostgreSQL locale temporaneo, inclusa l'importazione con revisione editoriale. Nessun invio email Internet o pagamento reale nei test.
- Build Docker reale e avvio Railway riusciti.
- **191 controlli HTTP sull'anteprima**, senza errori: URL storiche, alias, redirect 301, canonical, H1 e mantenimento di query UTM/affiliazione. Le vecchie pagine allegato già rimosse mantengono 410.
- **198 risorse pubbliche** verificate su Railway con risposta 200, compresi **quattro PDF** e il loro content type.
- Browser reale, viewport **1440 px e 390 px**: stessa struttura delle sezioni della home rispetto al riferimento, sei schede informative, contenuto Castello presente, nessun overflow né errore JavaScript.
- Misure indicative sul collegamento di prova, senza simulazione di rete mobile: TTFB 658/267 ms, LCP 1420/568 ms, CLS 0,0044/0,0024 rispettivamente desktop/mobile. Sono misure di laboratorio, non dati Core Web Vitals degli utenti e non una verifica INP.
- `SITE_PREVIEW=true`, meta/header `noindex` e robots `Disallow: /` verificati. Sitemap vuota in anteprima: comportamento intenzionale per non pubblicarla come sito indicizzabile.
- Confronto DNS autorevole prima/dopo: A di `it`, A del dominio principale, MX, alias `mail` e TXT SPF invariati. `it.freetourpraga.com` continua a puntare a `92.60.33.37`.

Evidenze senza dati personali: [seo-anteprima-2026-11-16.json](evidenze/seo-anteprima-2026-11-16.json). Schermate e dettagli di verifica sono in `tmp/seo-phase2/`.

## Cosa resta prima del cambio dominio

1. **Search Console e backlink.** Nessuna esportazione trovata localmente o in Google Drive; Semrush richiede una nuova autenticazione. L'utente ha confermato che fornirà successivamente un'eventuale esportazione. Il controllo dei risultati pubblici ha restituito URL già comprese nell'inventario; non sostituisce dati di clic, impressioni o backlink.
2. **Revisione operativa dei tour.** Verificare prezzi effettivi, fasce di età, capienza, calendari e punti d'incontro prima di confermare il relativo flag nel gestionale. Nessuna partenza è stata inventata o resa prenotabile dall'importazione. Il Castello richiede anch'esso questa verifica: i dati operativi precedenti sono conservati, non approvati come equivalenti a quelli WordPress.
3. **Configurazione del lancio.** Solo al momento autorizzato: URL ufficiale nelle variabili e nella build, rimozione delle protezioni preview sul sito definitivo, collaudo dei redirect dal dominio tecnico, TLS, webhook e posta reali, monitoraggio e possibilità di ritorno.
4. **DNS della sola versione italiana.** Risolvere prima il conflitto tra TXT SPF e CNAME sul nome `it` con il gestore DNS/posta. Non cambiare il root A: è anche destinazione dell'MX del dominio principale. Nessuno di questi passaggi DNS è stato eseguito.

Le verifiche eliminano errori tecnici conosciuti e documentano la conservazione dei percorsi inventariati. Non certificano l'assenza di URL fuori inventario né garantiscono posizioni Google immutabili dopo un futuro cambio di hosting e contenuti.
