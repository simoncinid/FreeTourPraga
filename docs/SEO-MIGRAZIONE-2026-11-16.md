# Analisi della migrazione SEO e DNS — 16 novembre 2026

**Esito: il progetto può essere ospitato su Railway, ma il codice e i contenuti attuali non sono pronti per sostituire il sito storico preservandone la continuità SEO. Non procedere al cambio DNS nello stato analizzato.**

Il problema non è Railway: mancano la conservazione delle URL storiche, gran parte dei contenuti e un piano di redirect verificato. È inoltre presente una dipendenza DNS della posta che rende insufficiente la sola precauzione «non modificare gli MX».

## 1. Metodo e limiti

Analizzati il checkout locale al commit `678a236`, configurazione Next.js e Docker, manifest Railway, preflight e controlli HTTP, sito pubblico `https://it.freetourpraga.com` e anteprima `https://web-production-f3beeaff.up.railway.app`. L'identità del commit effettivamente distribuito sull'anteprima non è stata verificata: osservazioni sul deployment e revisione del sorgente sono evidenze distinte.

Operazioni eseguite esclusivamente in lettura sui servizi: recupero di robots e sitemap, richieste GET delle URL storiche sull'anteprima, controllo della prima risposta e della destinazione finale, estrazione metadati HTML, interrogazioni DNS anche al nameserver autorevole `ns1.dns-es.com`. Nessuna modifica a DNS, Railway, caselle o configurazione applicativa. Aggiunti soltanto questo rapporto e due file di evidenze nel repository.

Inventario ed esiti riproducibili:

- [CSV delle 147 URL e relative risposte](evidenze/seo-url-storiche-2026-11-16.csv).
- [JSON delle evidenze, metadati e DNS](evidenze/seo-audit-2026-11-16.json).

L'inventario delle sitemap non certifica quali URL Google abbia indicizzato o quali generino traffico. Non sono disponibili Search Console, Analytics, log del vecchio server, backlink, esportazione WordPress completa o zona DNS completa. Pertanto non è possibile quantificare una perdita di traffico o garantire l'assenza di oscillazioni. Il campione HTTP del sito storico comprende tutte le 61 URL nelle sitemap pagine/articoli; non tutti gli archivi o allegati sono stati verificati sul vecchio server. Sull'anteprima sono invece state provate tutte le 147 URL delle sitemap storiche.

## 2. Risultato del confronto URL

L'indice Yoast attuale pubblica sei sitemap:

| Sitemap storica | URL | Destinazioni 200 sull'anteprima | Destinazioni 404 sull'anteprima |
|---|---:|---:|---:|
| Articoli | 26 | 0 | 26 |
| Pagine | 35 | 3 | 32 |
| Categorie | 4 | 0 | 4 |
| Tag | 4 | 0 | 4 |
| Autori | 2 | 0 | 2 |
| Pagine allegato | 76 | 0 | 76 |
| **Totale** | **147** | **3** | **144** |

Le tre destinazioni funzionanti sono `/`, `/contatti/` e `/tour/`. Le ultime due ricevono prima un 308 verso la versione senza slash. Tutte le altre 144 URL, sempre dopo la normalizzazione dello slash dove applicata, terminano con un vero HTTP 404. Per le sole pagine/articoli il risultato è **58 URL mancanti su 61**.

Questo non significa «perderemo il 98% del traffico»: il traffico per URL non è noto. Significa che quasi tutti i percorsi inventariati oggi non raggiungono una pagina equivalente nell'applicazione che li sostituirebbe.

Esempi verificati, mantenendo lo stesso percorso sull'anteprima:

| Percorso storico | Risultato finale attuale | Intervento necessario |
|---|---|---|
| `/tour/castello/` | 404 | Conservare il percorso o creare redirect puntuale a una scheda equivalente |
| `/tour/comunismo/` | 404 | Ripristinare la scheda e il relativo contenuto |
| `/tour/terezin/` | 404 | Ripristinare la scheda e il relativo contenuto |
| `/tour/citta-nuova-di-praga/` | 404 | Ripristinare la scheda e il relativo contenuto |
| `/tour/tour-praga-esoterica/` | 404 | Ripristinare la scheda e il relativo contenuto |
| `/dove-mangiare-a-praga/` | 404 | Importare l'articolo conservando preferibilmente la URL |
| `/cambio-euro-corona-ceca/` | 404 | Importare l'articolo; la breve nuova guida non dimostra equivalenza |
| `/come-raggiungerci-dallaeroporto/` | 404 | Importare l'articolo |
| `/blog-de-praga/` | 404 | Conservare archivio e paginazione o trasferirli con redirect |
| `/politica-sulla-privacy/` | 404 | Conservare o collegare con redirect alla nuova informativa equivalente |
| `/prenotazioni/free-tour/` | 404 | Conservare o indirizzare al flusso specifico dello stesso tour |

La nuova sitemap contiene **16 URL: 9 pagine generali, 3 tour e 4 articoli**. Il codice di `src/app/sitemap.ts` genera esclusivamente queste famiglie. Non include una riconciliazione delle URL WordPress.

Sono emerse anche URL interne esterne alle sitemap: pagine 2 e 3 dell'archivio blog, alias di tour/prenotazioni e quattro PDF. Occorre integrare l'inventario con crawl completo, esportazione WordPress, Search Console e log: le 147 righe sono una base verificata, non l'intero patrimonio storico.

## 3. Redirect: manca la migrazione pagina per pagina

`next.config.mjs` non contiene `redirects()` o `rewrites()` per il sito storico. Non sono presenti `proxy.ts` o middleware che realizzino quella mappa; non risultano regole equivalenti nel manifest Railway analizzato. Eventuali regole esterne non documentate non sono state ispezionate; le richieste all'anteprima dimostrano che attualmente non recuperano le URL provate.

Il 308 automatico `/tour/castello/ → /tour/castello` rimuove solo lo slash. La destinazione resta inesistente: non è una migrazione alla nuova `/tour/castello-praga-mala-strana`.

`src/app/informazioni-utili/page.tsx` usa `redirect("/#informazioni-utili")`: nell'anteprima restituisce **307**, temporaneo. Inoltre non intercetta il percorso storico `/informazioni-utili-per-il-tuo-viaggio-a-praga/`. La sezione nella home non mantiene automaticamente la funzione della precedente pagina autonoma.

`BlogHashRedirect` esegue una navigazione JavaScript da `/blog#slug` a `/blog/slug`. Non gestisce gli articoli storici pubblicati alla radice e non restituisce un redirect HTTP 301. I frammenti `#...` non arrivano al server.

Strategia raccomandata: conservare le URL storiche che hanno contenuto, traffico o backlink e servirle direttamente con 200. Dove il cambio è necessario, usare un solo redirect permanente verso la pagina semanticamente equivalente. Evitare invii indistinti alla home, ai contatti o al catalogo: potrebbero essere interpretati come soft 404 e comunque non soddisfano la ricerca dell'utente.

La documentazione Next.js installata conferma che `permanent: true` produce **308**, non 301. Google tratta entrambi come redirect permanenti. Se il requisito di consegna richiede precisamente 301, va implementato e verificato quel codice HTTP esplicito, con il meccanismo supportato dalla versione in uso. Le guide locali rilevanti sono `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md` e `04-functions/redirect.md`.

Le regole devono vivere anche nel nuovo hosting: al cambio DNS le richieste storiche raggiungeranno Railway, non il precedente `.htaccess`. Mantenere le regole per almeno un anno, preferibilmente indefinitamente per gli indirizzi ancora usati. Testare slash, HTTP/HTTPS, alias, query di campagne e affiliazione, loop e numero di passaggi. Se si conservano gli slash storici, allineare route, canonical, sitemap e link interni; non aggiungere soltanto una nuova normalizzazione in conflitto con quella di Next.js.

## 4. Contenuti: il rischio non si risolve soltanto con redirect

L'anteprima non contiene il catalogo storico completo: presenta tre tour, contro le numerose schede attualmente raggiungibili sul sito pubblico. Fra gli argomenti assenti figurano Comunismo/Bunker, Terezín, Città Nuova, tour serale, Petřín, interni del Castello e Mercatini di Natale.

La home storica è una pagina specifica sul Free Tour in italiano, con spiegazioni, itinerario, orari, incontro e prenotazione. La nuova home presenta il servizio nel suo insieme. L'H1 passa da un riferimento esplicito al Free Tour a una frase generale sulla scoperta di Praga. Il titolo HTML diventa anch'esso più generale. La URL `/` rimane, ma il suo intento e la sua rilevanza per le query storiche possono cambiare.

Occorre mantenere nella home la sostanza utile per chi cerca il Free Tour: modalità a offerta libera, lingua, percorso, punto di ritrovo, durata, disponibilità e prenotazione specifica. Verificare che la nuova scheda Città Vecchia/Ponte Carlo corrisponda realmente al prodotto precedente: il vecchio itinerario menziona Città Vecchia e quartiere ebraico. Non approvare equivalenze basandosi soltanto su nomi simili.

I 26 elementi della sitemap articoli non sono stati conservati ai loro percorsi. Le quattro guide dell'anteprima non sostituiscono quell'archivio. Tre nuove guide hanno solo circa **27–32 parole nel contenitore principale**, inclusi titolo e collegamenti, mentre una quarta è sviluppata. Il conteggio non è un fattore di ranking in sé: documenta che alcune pagine sono al momento introduzioni molto brevi, non equivalenti agli articoli dettagliati precedenti.

Prima del lancio importare testi, titoli, sezioni, immagini e collegamenti utili. Gli aggiornamenti editoriali necessari vanno valutati pagina per pagina, senza eliminare insieme URL, contenuto e intento di ricerca. Per i servizi non più disponibili, conservare una pagina informativa utile o scegliere una gestione della rimozione consapevole; non inventare un equivalente per evitare un 404.

## 5. Indicizzazione, canonical e dominio di anteprima

Aspetti già presenti e positivi nel sorgente:

- Pagine pubbliche renderizzate dal server, titoli e descrizioni configurabili.
- Canonical specifiche sulle principali pagine, schede tour e articoli.
- HTML `lang="it"`, sitemap e robots generati dall'applicazione.
- JSON-LD per organizzazione, sito, tour, breadcrumb e FAQ.
- `noindex` sulle pagine operative di accesso, carrello, checkout e prenotazione.
- Pagina 404 con risposta effettiva 404 nei percorsi inesistenti provati.
- Protezione dell'anteprima attraverso `SITE_PREVIEW`.

Nell'anteprima tutte le 16 pagine della sitemap hanno attualmente `noindex, nofollow`; `/robots.txt` restituisce `Disallow: /`. È coerente con la revisione privata, ma sarebbe un blocco grave se rimanesse dopo l'attivazione del dominio pubblico. Verificare entrambi i livelli e qualsiasi eventuale `X-Robots-Tag` sull'HTML definitivo.

`src/lib/site.ts:3` legge `NEXT_PUBLIC_SITE_URL` e, se manca, usa `http://localhost:3000`. Questo valore alimenta metadataBase, canonical, sitemap, JSON-LD e altri link assoluti. Nell'anteprima le canonical e la sitemap puntano correttamente al dominio Railway di revisione; al lancio devono puntare **tutte a `https://it.freetourpraga.com`**. Configurare la variabile anche nella build Docker e ricostruire l'artefatto, verificando l'HTML servito: non basta presumere che una modifica a runtime aggiorni ogni uso di una variabile `NEXT_PUBLIC_*`.

Il layout assegna una canonical `/` come default. Le principali pagine pubbliche analizzate la sovrascrivono correttamente; nuove pagine dovranno farlo esplicitamente per non ereditare la home. Non è stato rilevato un errore generalizzato di canonical verso la home nelle pagine attuali.

Dopo il lancio proteggere separatamente il dominio tecnico Railway: redirect permanente al dominio ufficiale preservando percorso e query, oppure ambiente preview distinto. Oggi il flag è globale: spegnerlo rende potenzialmente indicizzabile anche il dominio tecnico se rimane accessibile. La canonical aiuta, ma non sostituisce una decisione esplicita su host di anteprima e produzione.

## 6. Stabilità editoriale, sitemap e media

**Slug degli articoli instabili.** `findGuide()` in `src/lib/guides.ts` trova gli articoli tramite `guideAnchor(guide.title)`. Anche link e sitemap sono derivati dal titolo. Cambiare il titolo nel CMS cambia quindi la URL e rende inesistente quella precedente, senza redirect automatico. Serve uno slug persistente separato dal titolo, univoco, con storico degli alias per i cambi intenzionali.

**Slug dei tour modificabili senza storico SEO.** L'API vieta il cambio quando esistono prenotazioni collegate, ma lo permette negli altri casi. Un tour indicizzato può non avere prenotazioni: il suo vecchio indirizzo può quindi andare perso. Occorre proteggere anche le URL pubblicate e registrarne i cambi.

**Sitemap.** `lastModified` è impostato a `new Date()` per ogni URL e ogni richiesta, anche senza modifiche editoriali. Usare date di aggiornamento reali o omettere il dato. Il vecchio `/sitemap_index.xml` restituisce 404 sull'anteprima: prevedere un indice compatibile o un redirect verso la sitemap definitiva e aggiornare Search Console. L'assenza del vecchio nome non è da sola una penalizzazione, ma è un riferimento già pubblicato da gestire. Pubblicare in sitemap solo URL canoniche 200 indicizzabili; durante la preview evitarne l'uso come sitemap di produzione.

**Immagini e PDF storici.** Le sitemap contengono 96 URL immagine distinte e le pagine rimandano anche a PDF, fra cui un catalogo tour del 2026. Le prove su una foto storica e quel PDF, mantenendo il percorso `/wp-content/uploads/...` sull'anteprima, restituiscono 404. La copia degli asset `public` nella build è presente nello script di sanitizzazione, ma non equivale all'importazione degli upload WordPress. Trasferire gli asset e conservare i percorsi o creare mapping individuali. Le 76 pagine allegato sono URL HTML distinte dai file: valutarle separatamente usando traffico, backlink e destinazione attuale.

**Media CMS.** Le immagini caricate nel database sono pubblicate sotto `/api/media/...`. Il robots di produzione blocca `/api/` e gli header globali di `next.config.mjs` applicano a quel percorso `X-Robots-Tag: noindex`. Una richiesta diretta a un'immagine CMS conferma `200`, `noindex` e `Cache-Control: no-store`, nonostante l'handler imposti cache lunga. Questo ostacola l'indicizzazione dell'originale e la sua cache. L'immagine ottimizzata `/_next/image?...` provata risponde invece 200 senza quell'header e con cache: non è corretto affermare che tutte le immagini mostrate siano bloccate. Serve comunque una policy specifica per i media pubblici, distinta dalle API riservate, anche per immagini in Open Graph e dati strutturati.

**Metadati secondari.** I tag Open Graph sono più completi sulle schede tour che sugli articoli; controllare URL, immagine e lingua per ogni template. Non risultano `hreflang` nelle pagine vecchie e nuove analizzate: non è una perdita osservata della migrazione. Valutarli solo per equivalenti reali delle versioni italiana, inglese e spagnola. JSON-LD e file per motori AI non compensano pagine perse; i dati strutturati vanno validati e non garantiscono rich result.

## 7. DNS e posta: dipendenze effettivamente rilevate

Risposte pubbliche, confermate sul nameserver autorevole al momento dell'analisi:

```text
it.freetourpraga.com.  A      92.60.33.37
freetourpraga.com.     A      92.60.33.37
freetourpraga.com.     MX 0   freetourpraga.com.
mail.freetourpraga.com. CNAME freetourpraga.com.
en.freetourpraga.com.  A      92.60.33.37
```

**Conseguenza operativa: modificare il record A del dominio principale sposterebbe anche la destinazione della posta ricevuta e del nome `mail`, pur lasciando invariato l'MX.** Inoltre il record SPF del dominio principale contiene `a` e `mx`: cambiarne le risoluzioni modifica indirettamente anche l'autorizzazione dei mittenti.

Per questo progetto l'hostname da collegare è soltanto **`it.freetourpraga.com`**. Lasciare invariati dominio principale, versione inglese, nameserver, MX, nomi dei server di posta, SPF/DKIM/DMARC e gli altri record non coinvolti. Non trasferire il dominio o sostituire l'intera zona DNS per questa operazione. Non disdire il vecchio hosting se ospita ancora posta o altre lingue.

**Conflitto da risolvere prima di predisporre la modifica DNS:** su `it.freetourpraga.com` esiste anche un TXT SPF:

```text
v=spf1 +a +mx +ip4:92.60.33.37 +include:relay.mailchannels.net +ip4:85.208.102.209 +include:relay.dns-es.com ~all
```

Un CNAME DNS standard non può coesistere con un TXT sullo stesso nome. Non è quindi corretto promettere «sostituiamo solo A con CNAME e lasciamo tutti gli altri record identici». Prima verificare con il gestore DNS/posta se esistono invii con envelope sender o HELO sul sottodominio `it`, ed eventuali dipendenze da quel record SPF. Valutare una modalità di instradamento supportata dal provider che mantenga il TXT, se disponibile; altrimenti definire esplicitamente una soluzione con il gestore della posta. Non cancellare l'SPF alla cieca e non inventare un indirizzo IP statico di Railway.

La documentazione Railway consultata prevede CNAME e TXT di verifica per il dominio personalizzato. Usare **i nomi e i valori effettivi mostrati per quel dominio** nel pannello, verificando la posizione del TXT di ownership e la compatibilità con la zona esistente; non confonderlo con l'SPF. Non sono stati creati domini né ricavati valori di destinazione nuovi durante questo audit.

Il TTL web osservato è 14.400 secondi, circa quattro ore. Abbassarlo per tempo sul solo record coinvolto, attendere la scadenza del precedente TTL e preparare il ripristino al valore originale. Il TTL non garantisce da solo la propagazione completa: controllare resolver diversi.

Nel codice l'indirizzo di contatto è su `unitedworldtours.eu`; il DNS pubblico di questo dominio mostra MX Google e una zona distinta. Questo non dimostra quali altre caselle l'organizzazione utilizzi. Mantenere anche quella configurazione e l'attuale provider SMTP. Il trasferimento del web non richiede un trasferimento delle caselle.

## 8. Railway, prestazioni, misurazione e collaudo

Docker standalone, copia degli asset, processo in ascolto su `PORT`, healthcheck e migrazioni database sono una base adeguata per ospitare l'applicazione. Questi controlli non verificano però la continuità SEO.

Le pagine dipendono dal database e sono dinamiche. La cache React delle letture deduplica lavoro nella renderizzazione, ma non sostituisce necessariamente una cache persistente o CDN. Verificare tempi di risposta, capacità sotto carico, regione, errori database, restart e comportamento durante deploy. Non sono state misurate Core Web Vitals, LCP, INP o CLS: le durate delle singole richieste HTTP non costituiscono un audit prestazionale del browser.

Il preflight accetta qualsiasi dominio HTTPS valido e si limita ad avvisare quando `SITE_PREVIEW=true`; non certifica che il dominio sia quello ufficiale, che il sito sia indicizzabile o che le URL storiche funzionino. I test HTTP controllano le nuove pagine, non l'intero inventario storico; il fetch con redirect automatici può inoltre far passare un 307 quando si voleva verificare una pagina o un redirect permanente.

Serve un controllo di rilascio dedicato che per ogni URL del CSV verifichi prima risposta, catena completa, pagina finale corretta, canonical, robots, contenuto essenziale e assenza di destinazioni tecniche. Integrare nel manifest anche le URL recuperate fuori sitemap e quelle importanti da Search Console/log.

Verificare la proprietà Search Console: un token DNS resta valido se conservato; un file HTML o meta tag di verifica deve essere ripubblicato se attualmente utilizzato. Nessun meta `google-site-verification` è emerso nelle pagine esaminate; ciò non prova l'assenza di una verifica DNS o di altro tipo.

Non risulta una configurazione GA4 nel componente di tracking analizzato: è presente Google Ads e `analytics_storage` è negato. Definire la continuità della misurazione con la proprietà già usata, ove applicabile e nel rispetto delle preferenze. Non attribuire ad Analytics un ruolo diretto di ranking: serve a misurare il passaggio. Conservare query UTM e parametri di affiliazione nei redirect.

## 9. Condizioni di via libera e sequenza del passaggio

1. **Inventario completo:** esportare WordPress, URL Search Console con clic/impressioni e backlink principali; unire sitemap, crawl e log. Assegnare a ogni URL una destinazione o una rimozione intenzionale motivata.
2. **Contenuti e URL:** ripristinare il catalogo e gli articoli necessari, la rilevanza Free Tour della home e gli asset. Conservare i percorsi storici importanti. Gestire con redirect permanenti solo i cambi necessari.
3. **Stabilità CMS:** introdurre slug persistenti e storico redirect; impedire che modificare un titolo rompa un articolo pubblicato.
4. **Configurazione di produzione:** dominio ufficiale nelle variabili di build/runtime, flag preview disattivato sul sito definitivo, host tecnico gestito separatamente; aggiornare anche URL worker e integrazioni dipendenti dal dominio.
5. **Prova prima del DNS:** testare la configurazione finale in ambiente isolato, anche con override locale dell'host o instradamento di prova appropriato e TLS valido. Non rendere indicizzabile pubblicamente l'anteprima per effettuare il test. Verificare tutte le URL della mappa e i flussi essenziali.
6. **Piano DNS approvabile:** esportare zona e valori originali; risolvere il conflitto TXT/CNAME di `it`; predisporre soltanto le modifiche necessarie all'host italiano e alla sua verifica Railway. Lasciare intatti root, mail, MX e autenticazione posta. Verificare certificato e porta del dominio personalizzato.
7. **Finestra di passaggio:** pubblicare il build già verificato, applicare le modifiche DNS pianificate, controllare immediatamente HTTPS, robots, canonical, sitemap, vecchie URL, immagini, PDF e prenotazioni. Provare ricezione e invio email reali su caselle controllate. La presenza degli MX non sostituisce queste prove.
8. **Monitoraggio:** controlli giornalieri iniziali su 404, 5xx, log, indicizzazione, clic e impressioni delle pagine principali; poi confronti regolari per almeno 4–8 settimane tenendo conto di stagionalità e domanda. Conservare le baseline precedenti.
9. **Ripristino pronto:** vecchio sito e configurazione disponibili durante la propagazione, con attenzione alle prenotazioni create sul nuovo sistema. Il ritorno DNS non riconcilia da solo i dati raccolti dopo il passaggio. Non spegnere servizi email o altre lingue insieme al WordPress italiano.

Per la stessa origine `https://it.freetourpraga.com` non occorre il cambio di indirizzo in Search Console: mantenere la proprietà e aggiornare la sitemap. Anche se il dominio resta uguale, il cambiamento dei percorsi e dei contenuti rende questo progetto una migrazione più ampia di un semplice trasferimento di hosting.

**Priorità bloccanti:** contenuti e URL storiche, mappa permanente verificata, indicizzazione/canonical di produzione, piano DNS compatibile con la posta. **Priorità successive:** slug stabili, asset e policy media, sitemap affidabile, misurazione e prestazioni. Queste ultime vanno comunque risolte prima del lancio quando coinvolgono pagine o risorse già importanti.

Nessun fornitore può garantire posizioni Google immutabili. È possibile eliminare i rischi tecnici evitabili e limitare il cambiamento al necessario. Il progetto attuale richiede questo lavoro prima di sostituire il sito storico.

## 10. Riferimenti ufficiali

- [Google: cambio hosting senza cambiare URL](https://developers.google.com/search/docs/crawling-indexing/site-move-no-url-changes).
- [Google: migrazione con cambio URL, contenuti, asset e redirect](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
- [Google: redirect e segnali permanenti](https://developers.google.com/search/docs/crawling-indexing/301-redirects).
- [Google: meta robots e X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- [Railway: domini personalizzati, verifica DNS, TLS e porte](https://docs.railway.com/networking/domains/working-with-domains).
- [RFC 2181, sezione 10.1: esclusività del CNAME](https://www.rfc-editor.org/rfc/rfc2181#section-10.1).
