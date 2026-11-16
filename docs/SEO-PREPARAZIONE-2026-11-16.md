# Preparazione SEO locale, senza migrazione

**Aggiornamento successivo:** codice e contenuti sono stati portati anche nella sola anteprima Railway, mantenendo invariato il dominio pubblico. Stato corrente e collaudo: [SEO-ANTEPRIMA-2026-11-16.md](SEO-ANTEPRIMA-2026-11-16.md). Le indicazioni «solo locale» qui sotto descrivono la fase precedente.

Stato al 16 novembre 2026. Nessuna modifica a WordPress, DNS, MX, Railway o repository remoto. Le credenziali WordPress non sono state utilizzate: sono bastate richieste GET alle pagine pubblicate e alle API pubbliche.

## Interfaccia e dati preservati

La soluzione finale riutilizza le schede tour, il template BlogArticle e ContentBlock già presenti nel progetto. Non aggiunge sezioni WordPress alla homepage, un secondo catalogo o un nuovo menu. Sono stati conservati anche HomeGallery, HeroTourCta e i relativi interventi grafici già in corso nel workspace.

L'importazione effettivamente eseguita riguarda l'archivio locale usato dall'applicazione, configurata con `PLATFORM_STORAGE=local`. Non ha scritto nel database Railway. È disponibile anche un importatore per PostgreSQL **locale**, collaudato su un database temporaneo distinto; rifiuta connessioni remote.

Risultato nell'archivio locale:

| Contenuto | Prima | Aggiunto | Totale |
|---|---:|---:|---:|
| Tour | 3 | 9 | 12 |
| Articoli | 4 | 24 | 28 |
| Altre pagine storiche | 0 | 26 | 26 |

Il tour del Castello già esistente è stato collegato a `/tour/castello/`, conservando ID, testo personalizzato, prezzi, immagini e partenze. I nuovi tour e gli articoli sono record dei modelli del gestionale, non pagine HTML indipendenti dal suo archivio.

Il confronto con il backup precedente all'importazione conferma l'uguaglianza dei dati già presenti: prenotazioni, ordini, invii, impostazioni, affiliazioni, richieste, campi della home e del menu, quattro articoli originali, partenze e prezzi dei tour esistenti. I backup sono in `privato/seo-before-*.json`, esclusi da Git e creati con permessi privati. L'importazione è idempotente e conserva successive modifiche ai record importati.

## Contenuti e indirizzi

I contenuti recuperati vengono salvati nei modelli nativi, mantenendo titoli, descrizioni SEO, testi, collegamenti e formattazione. L'HTML testuale viene filtrato con una libreria di sanitizzazione: niente script, form WordPress, iframe, classi o stili del vecchio tema.

Le URL storiche degli articoli e dei tour sono conservate attraverso `canonicalPath`. I percorsi che non corrispondono a `/tour/[slug]` o `/blog/[slug]` risolvono gli stessi record e gli stessi componenti tramite la route di compatibilità. Non esiste una seconda interfaccia pubblica WordPress.

I redirect sono HTTP **301**, puntuali e appiattiti a una destinazione finale. Conservano query UTM e affiliazioni. Le precedenti pagine di prenotazione conducono alla scheda dello stesso tour; gli alias e gli indirizzi delle vecchie sitemap hanno destinazioni esplicite. Le URL sconosciute continuano a restituire 404.

Precisazione rispetto all'audit iniziale: delle 147 URL di sitemap, 75 pagine allegato risultavano già rimosse con 410 sul sito originale. Un'altra restituiva 500 e rimandava a un'immagine già inesistente. Le 76 URL sono gestite come contenuti rimossi, senza inventare pagine o inviarle indistintamente alla home. Gli altri indirizzi inventariati raggiungono pagine attive o redirect permanenti pertinenti.

Sono stati copiati **198 file, inclusi quattro PDF**, mantenendo i percorsi delle risorse italiane. Le immagini che provenivano dal dominio principale sono state copiate localmente senza modificare quel dominio. L'immagine del Clementinum, assente sull'host italiano ma ancora presente sul dominio principale, è stata recuperata allo stesso percorso italiano. Due file immagine relativi a un vecchio hotel risultano mancanti anche all'origine; i tag rotti sono stati rimossi dai contenuti importati.

## Protezioni tecniche

- Slug persistenti e identità degli articoli indipendenti dal titolo; alias per i cambi intenzionali e controlli di unicità.
- Protezione degli indirizzi storici di tour, articoli e pagine nelle operazioni CMS.
- Sitemap basata sui record pubblicati nel gestionale, comprensiva della home, senza date di modifica inventate a ogni richiesta.
- Compatibilità con `sitemap_index.xml` e redirect dai vecchi nomi di sitemap.
- Anteprima con noindex e blocco robots; con configurazione definitiva, redirect del dominio tecnico Railway al dominio ufficiale.
- Eccezione per le immagini pubbliche `/api/media/`: consentite ai crawler, senza il noindex o il no-store delle API private.
- Controllo aggiuntivo `preflight --seo-launch` per verificare dominio ufficiale esatto e disattivazione esplicita della preview.

## Collaudo eseguito

- Lint e controllo TypeScript superati.
- **45 test automatici** superati, inclusi importazione idempotente, conservazione del layout e dei dati operativi, validazione dei record, integrità dei file, sanitizzazione e stabilità URL.
- Build di produzione superata e flussi HTTP completi verificati su **PostgreSQL locale temporaneo**. Sono stati provati anche upload immagini, cache e assenza di noindex sui media pubblici. SMTP verificato esclusivamente con server locale di test: nessuna email inviata su Internet.
- **205 controlli SEO superati** nell'ambiente di produzione isolato: tutte le 147 URL inventariate più alias e pagine aggiuntive; canonical, H1, indicizzabilità, redirect e query controllati. Sitemap di quell'ambiente: 74 URL, compresa la home. Il locale dell'utente contiene anche un articolo personalizzato aggiuntivo.
- Controlli browser desktop 1440 px e mobile 390 px su home, catalogo, articolo e scheda tour: nessun overflow, immagine rotta o errore JavaScript. Assenti le sezioni aggiuntive del precedente tentativo.

Le evidenze HTTP di produzione sono in [seo-collaudo-produzione-2026-11-16.json](evidenze/seo-collaudo-produzione-2026-11-16.json). Le schermate di verifica locale sono in `tmp/seo-qa/` e non sono pubblicate.

## Comandi e futuro passaggio

```sh
# Controllo sul sito locale corrente, senza scritture esterne
npm run seo:check -- --url http://localhost:3100

# Riepilogo dell'importazione locale, senza applicarla
npm run seo:import

# Solo quando si vuole applicare il contenuto all'archivio locale selezionato
npm run seo:import -- --apply

# Rigenerazione del payload strutturato dal recupero già salvato
npm run seo:prepare

# Collaudo isolato con build e PostgreSQL locale temporaneo
npm run test:http:production
```

`scripts/recover-wordpress-content.py` aggiorna il recupero pubblico in sola lettura; richiede BeautifulSoup. Dopo un nuovo recupero eseguire `seo:prepare` e rivedere i diff prima di importare. Nessuno di questi script esegue deploy o modifiche DNS.

Prima della futura migrazione restano attività che non devono essere eseguite ora:

1. Integrare l'inventario con Search Console, backlink e log, per coprire URL con traffico non esposte dalle sitemap. Il collaudo di 147 URL non dimostra che siano tutte quelle storicamente usate.
2. Validare operativamente i nuovi tour: prezzi e fasce particolari, capienza e calendario. Non sono state inventate partenze prenotabili. I nuovi record sono contrassegnati per revisione; il gestionale permette di confermare la verifica, e la prenotazione rimane chiusa finché tale verifica non è completata.
3. Trasferire il dataset revisionato nell'ambiente destinato al lancio e ripetere il collaudo sull'artefatto definitivo, con dominio e variabili corretti. Questa operazione non è stata fatta su Railway.
4. Risolvere con il gestore DNS il conflitto TXT SPF/CNAME sul solo host `it`, conservando root, MX, server di posta e altri record. Il root A è anche destinazione della posta: non va modificato come parte di questo passaggio.
5. Verificare proprietà Search Console, tracciamento esistente, TLS, prestazioni reali, invio/ricezione email, monitoraggio e piano di ritorno.

L'interfaccia della home è stata preservata su richiesta. Il suo contenuto editoriale rimane quindi diverso dalla vecchia home, anche se i metadati storici sono recuperati e il Free Tour ha ora una scheda completa. Anche la scheda Castello preesistente conserva il testo scelto nel nuovo sito. La copertura tecnica delle URL non equivale a una garanzia di posizionamento immutabile: queste differenze editoriali vanno considerate insieme ai dati Search Console prima del lancio.
