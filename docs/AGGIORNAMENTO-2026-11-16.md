# Aggiornamento del 16 novembre 2026

## Contenuti del gestionale

Un solo ingresso: `/admin/contenuti`. Il vecchio `/admin/sito` reindirizza qui.

| Area | Responsabilità |
| --- | --- |
| Homepage | Apertura, testi delle sezioni, dati in evidenza e punti di forza |
| Blog | Introduzione condivisa dell’elenco articoli; creazione e modifica degli articoli |
| FAQ e risposte | Pagina FAQ e risposte rapide della homepage |
| Pagine del sito | Chi siamo, catalogo, Partner Europa, pagina contatti, privacy e termini |
| Dati e contatti | Identità, recapiti, orari e footer condivisi |
| Menu e social | Navigazione e profili social |
| Recensioni | Profilo TripAdvisor e testi della relativa sezione |

Homepage, blog e FAQ hanno un unico editor per i testi visibili. I metadati SEO si salvano separatamente e non sostituiscono il layout pubblico. I precedenti testi pubblicati vengono recuperati alla prima normalizzazione; quelli archiviati nelle pagine restano conservati.

## Articoli

Tutti gli articoli usano lo stesso template: apertura con titolo e copertina, poi un’unica colonna di lettura larga al massimo 1120 px. Testi, titoli, immagini e didascalie condividono il margine sinistro. Il gestionale permette di aggiungere, riordinare e rimuovere blocchi e caricare foto.

Il pulsante finale è disattivato per impostazione iniziale. Quando viene attivato, etichetta e destinazione sono scelte dall’admin; sono ammessi percorsi locali e URL HTTPS.

L’articolo di esempio “Praga senza fretta: una giornata a piedi” contiene dieci blocchi e cinque immagini. I contenuti e le immagini caricate sono dati del CMS, non codice del template.

## Pubblicazione e dati

Il codice, gli asset pubblici e le migrazioni Prisma sono in Git. Segreti, accessi, snapshot del database e file di collaudo restano privati. Il sito e il gestionale Railway usano lo stesso PostgreSQL; le immagini caricate sono salvate in `MediaAsset`.

Il comando `scripts/sync-preview-content.mjs` importa uno snapshot privato nell’anteprima Railway configurata. È manuale: i successivi deploy non sovrascrivono i contenuti modificati dal cliente. Senza `--apply` mostra solo il piano di importazione. Conserva prenotazioni, ordini, messaggi, richieste e partenze che hanno già prenotazioni.

Esempio da eseguire nel servizio web, dopo aver trasferito lo snapshot e le foto in una cartella temporanea privata:

```sh
node scripts/sync-preview-content.mjs --snapshot /tmp/cms-sync/snapshot.json
node scripts/sync-preview-content.mjs --snapshot /tmp/cms-sync/snapshot.json --apply
```

Lo snapshot ha un identificativo; una seconda importazione dello stesso snapshot viene ignorata. Le directory temporanee possono essere eliminate dopo la verifica: i dati importati persistono in PostgreSQL.

La pagina Tour privati è sospesa: restituisce 404 ed è esclusa da navigazione, sitemap e indice per assistenti. Il codice resta disponibile per una futura riattivazione.
