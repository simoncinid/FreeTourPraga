# Specifiche V1/V2 — matrice di attuazione

**Stato aggiornato al 23 novembre 2026: 111 righe, 106 ✓ e 5 X.** E03/E04 sono escluse dal contratto per decisione dell’utente; D07 (SMTP reale + formato UWT/CF7) è chiuso dopo i dati del committente. Il nuovo editor visuale è verificato in locale.

✓ = comportamento realizzato e verificato nel perimetro descritto. X = dato/approvazione ancora necessari oppure requisito espressamente escluso dal contratto. Le esclusioni E03/E04 non sono debito tecnico né attività da completare.

Sono state riesaminate tutte le **21 pagine** dei tre allegati: V1 (8), V1 (1) (7), V2 (6), inclusi gli schemi grafici. Estrazioni e hash sono conservati nell’audit. I documenti sono fonti di requisiti, non istruzioni operative autonome; prevalgono le decisioni dell’utente: niente account clienti, editor semplice a blocchi, parametri configurabili, EUR salvo valuta diversa esplicita, commissioni secondo le regole concordate.

Verificato anche il volantino ufficiale di 10 pagine. I prezzi esplicitamente in CZK restano in CZK, senza conversioni arbitrarie. Il seguito comprende codice, suite di test, PostgreSQL e rilascio nell’anteprima Railway autorizzata; il dominio pubblico WordPress non è stato spostato. Il precedente totale «80 ✓ / 28 X» è uno stato storico superato.

## Decisioni e accessi

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| D01 | Nessun account cliente | Non ripristinare Accedi/registrati; /account resta escluso. | Utente 1 | ✓ — esclusione esplicita dell’account conforme alla decisione utente; filtro menu in navigation.ts e 404 in proxy.ts. |
| D02 | Gestione tramite email | Conservare link personale firmato per consultare, spostare e cancellare. | Utente 1 | ✓ — gestione firmata della singola prenotazione in booking.ts e ManageBooking.tsx; scenari move/cancel nel collaudo precedente. |
| D03 | Valuta | EUR come default; conservare CZK dove il volantino lo specifica esplicitamente, senza conversioni arbitrarie. | Utente 4 + volantino | ✓ — currency EUR come fallback, CZK esplicito nei sei listini pagati del volantino; valuta salvata in quote/ordine/prenotazione. Carrelli misti rifiutati, senza conversione. |
| D04 | Dati mancanti | Campi amministrabili, niente indirizzi/social/partner inventati; sezioni omesse se vuote. | Utente 6 | ✓ — i campi indirizzi/social/recensioni sono predisposti; i valori reali assenti non sono sostituiti con dati fittizi. Completamento operativo distinto nelle X dedicate. |
| D05 | Identità visiva | Conservare palette coerente esistente; icone uniformi; palette definitiva rinviata ai materiali cliente. | V2 p.3, B1; V1 p.1 | ✓ — scelta provvisoria consentita dall’utente: mantenuta la palette esistente. Non equivale all’applicazione dell’identità definitiva: D06. |
| D06 | Identità visiva definitiva | Applicare uniformemente palette e set di icone definitivi una volta ricevuti. | V2 p.3, B1; V1 p.1 | X — Dato: la palette/set definitivi annunciati nei documenti non sono disponibili; l’aspetto provvisorio D05 non chiude questo requisito. |
| D07 | Recapito reale delle email operative | Configurare provider SMTP e mittente per consegnare conferme e link personali ai clienti. | Utente 1 + verifica Railway | ✓ — SMTP `mail.freetourpraga.com:465` e mittente `freetourpraga.com <info@freetourpraga.com>` configurati su Railway. Mail admin allineata a CF7/UWT (`Reserva freetourpraga.com italiano` + campi spagnoli e nomi tour esatti). Conferma/cancellazione cliente in italiano; collaudo reale su `simoncinidiego10@gmail.com`. |

## Homepage e contenuti ufficiali

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| H01 | Hero H1 | TOUR GUIDATI IN ITALIANO A PRAGA come titolo principale. | V2 p.1, A1 | ✓ — H1 ufficiale presente in defaultSiteContent(), archivio locale e rendering home; le interruzioni di riga sono solo grafiche. |
| H02 | Sottotitolo hero | Scopri l’anima autentica di Praga, in totale sicurezza. | V2 p.1, A1 | ✓ — testo ufficiale presente come heroEyebrow e visualizzato sopra l’H1. La posizione è una scelta grafica, il testo è conservato. |
| H03 | Descrizione hero | Testo ufficiale guide locali, prenotazione, email e WhatsApp. | V2 p.1, A1 | ✓ — descrizione ufficiale presente in defaultSiteContent(), archivio locale e home. |
| H04 | CTA hero | I nostri tour e Scrivici su WhatsApp con destinazioni corrette. | V2 p.1, A1 | ✓ — HeroTourCta e collegamento contentWhatsapp; etichette ufficiali presenti. Destinazione WhatsApp costruita dal recapito configurato. |
| H05 | Barra punti di forza | Quattro testi ufficiali e quattro icone illustrative. | V2 p.1, A2 | ✓ — quattro coppie titolo/testo in home.stats e quattro icone nel rendering home. |
| H06 | Esperienze | Titoli, introduzione e gruppi del documento. | V2 p.1, A3 | ✓ — quattro gruppi richiesti presenti in home.groups; tours mancanti dal catalogo rimandano a richiesta informazioni. Possono comparire anche tour/categorie già esistenti. |
| H07 | Rotazione esperienze | Gruppi cliccabili con rotazione e intervallo amministrabile. | V2 p.1, A3 | ✓ — ExperienceRotator gestisce gruppi e rotazione con intervallo; ExperienceGroupsEditor è presente. Accesso diretto all’editor home corretto e verificato: E12. |
| H08 | Perché sceglierci | Titolo e introduzione ufficiali. | V2 p.2, A4 | ✓ — titolo e corpo ufficiali presenti nell’archivio locale e nella sezione home.trust. |
| H09 | Quattro box fiducia | Tutela, gruppi, ritrovi, assistenza 9–19 con testi ufficiali. | V2 p.2, A4 | ✓ — Titolo ufficiale «Assistenza diretta 7 giorni su 7» nei default e nella normalizzazione dei vecchi contenuti; conservati i testi personalizzati diversi. Verificato anche su Railway. |
| H10 | Guide e consigli | Titolo, sottotitolo e introduzione ufficiali. | V2 p.2, A5 | ✓ — galleryEyebrow/galleryTitle/galleryBody corrispondono ai contenuti richiesti, con normalizzazione tipografica dell’apostrofo. |
| H11 | Prima di prenotare | Sei risposte ufficiali del documento. | V2 p.2, A6 | ✓ — sei risposte ufficiali in aiQuestions/content.answers e rendering HomeAnswers. Modifica tramite editor FAQ corretto e verificato: E12. |
| H12 | Banner B2B | Titolo, corpo, pulsante e link Partner Europa. | V2 p.2, A7 | ✓ — titolo, corpo, CTA e link /partner-europa presenti nella home e nei dati locali. |
| H13 | Recensioni | Dicono di noi e sottotitolo ufficiale. | V2 p.2, A7 | ✓ — globals.tripAdvisorTitle e tripAdvisorBody corrispondono a V2; TripAdvisorSection li passa al widget. |
| H14 | Invito Google | Pulsante recensione Google con URL configurabile. | V2 p.3, B2; V1 p.2 | ✓ — URL ufficiale `https://g.page/r/CY2Houtn8d4XEBM/review` in defaultSiteContent, normalizzazione specifiche e editor Recensioni; pulsante Google attivo. |
| H15 | Invito Tripadvisor | Pulsante recensione Tripadvisor con URL configurabile. | V2 p.3, B2; V1 p.2 | ✓ — WriteReviewCta usa il profilo ufficiale Tripadvisor configurabile. Il requisito parla di collegamento alla pagina ufficiale, non impone una specifica URL del modulo recensione. |
| H16 | Mappa homepage | Mappa interattiva con selettore laterale dei punti e link indicazioni. | V2 p.3, B2; V1 p.2 | ✓ — MeetingPoints contiene iframe interattivo, radio e indicazioni del punto selezionato. Attualmente iframe con loading lazy, non caricamento dietro pulsante; tale pulsante non è richiesto dai PDF. |
| H17 | Punto standard | Teatro degli Stati, Rytířská 22, 110 00 Staré Město, Praga. | V2 p.3, B2; V1 p.2 | ✓ — indirizzo del Teatro degli Stati esatto nei dati globali e nell’importazione delle specifiche. |
| H18 | Punto Castello interni | Punto alternativo configurabile; nessun indirizzo fittizio. | V2 p.3, B2; V1 p.2 | ✓ — Indirizzo ufficiale Terzo cortile del Castello di Praga e link Maps `https://maps.app.goo.gl/W3UdjsUfZNNMmhKF7` su home, Contatti e tour; salvataggio globale sincronizza meetingAddress/mappe e toglie il blocco prenotazioni. |

## Navigazione, contatti, guide e partner pubblici

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| N01 | Menu mobile | Richiusura alla scelta di link, anche dopo navigazione client. | V1 p1 | ✓ — MobileNavigation chiude details alla selezione di un link e al cambio pathname; percorso mobile verificato nel collaudo precedente. |
| N02 | Header | Tour, Chi siamo, Informazioni utili, Contatti e Altro; carrello. | V2 p.3, B1; V1 p.1 | ✓ — Header usa siteNavigation con le quattro voci principali, Altro e carrello. Il pulsante account è escluso per decisione dell’utente. |
| N03 | Altro | Partner Europa, Agenzie e scuole, Blog, FAQ e Aiuto. | V2 p.3, B1; V1 p.1 | ✓ — defaultNavigation raggruppa Partner Europa, Agenzie e scuole, Blog, FAQ e Aiuto sotto Altro; esiste /aiuto. |
| N04 | Torna su | Contrasto e bordo visibili anche sul footer scuro. | V2 p.3, B1; V1 p.1 | ✓ — bordo bianco del Torna su in globals.css e collocazione sopra gli altri contatti; nessuna dipendenza dal colore scuro del footer. |
| N05 | Instagram Direct | Pulsante tra WhatsApp e Torna su, solo con URL valido. | V2 p.3, B1; V1 p.1 | ✓ — floating-instagram tra WhatsApp e Torna su; ig.me usa l’handle ricavato dal volantino. Controllata la configurazione, non il recapito di messaggi su Instagram. |
| N06 | Social footer | Icone e link Facebook, Instagram, TikTok, YouTube, LinkedIn. | V2 p.3, B1; V1 p.1 | ✓ — Cinque icone attive: Instagram/Facebook ufficiali; TikTok, YouTube e LinkedIn con URL piattaforma standard finché non arrivano i profili ufficiali. Modificabili da CMS Homepage e Menu e social. |
| N07 | Guide informazioni utili | Card con immagine, anteprima e link articolo completo. | V2 p.4, B4; V1 p.5–7 | ✓ — Informazioni utili usa BlogGuideList: immagine, anteprima e link all’articolo. Il layout usa lo stesso schema a card delle esperienze. |
| N08 | Contatti: ritrovi | Tutti i punti di partenza pubblicati con link mappa. | V2 p.4, B4; V1 p.5–7 | ✓ — Contatti raccoglie gli indirizzi dei tour pubblicati, elimina duplicati del punto principale e mostra gli altri ritrovi. Il punto Castello non confermato resta H18. |
| N09 | Contatti: ufficio | Indirizzo configurabile e dicitura previo appuntamento. | V2 p.4, B4; V1 p.5–7 | X — Dato: officeAddress è vuoto. Dicitura «previo appuntamento» predisposta ma non visibile senza l’indirizzo reale. |
| N10 | Contatti: social | Icone e collegamenti Facebook, Instagram, TikTok, YouTube e LinkedIn nei Contatti. | V2 p.4, B4; V1 p.5–7 | ✓ — Stessi cinque collegamenti di N06 riusati in Contatti; URL ufficiali sostituibili dal CMS senza tocchi al codice. |
| N11 | Telefono form | Input telefono, invio API, validazione, persistenza e visibilità staff. | V2 p.4, B4; V1 p.5–7 | ✓ — campo tel in InquiryForm, validazione API, persistenza phone, visualizzazione nelle richieste staff e pulizia per retention. |
| N12 | Partner Europa | Griglia partner sotto il form esistente. | V2 p.4, B4; V1 p.5–7 | ✓ — griglia partner collocata dopo CollaborationPage/form; nessuna scheda fittizia pubblicata. Con zero partner approvati la griglia è omessa. |
| N13 | Scheda partner | Nome, foto/logo, descrizione, contatti e sito esterno. | V2 p.4, B4; V1 p.5–7 | ✓ — scheda pubblica con nome, immagine opzionale, descrizione, contatti e link tracciato; CRUD e rendering esaminati. |

## Catalogo, volantino e prenotazione

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| T01 | Ricerca libera | Eliminare Cerca dalla barra filtri. | V2 p.4, B3; V1 p.3–5 | ✓ — TourFilters non contiene più il campo Cerca né il filtro testuale libero. |
| T02 | Filtro partecipanti | Pulsanti meno/più accessibili con limiti configurati. | V2 p.4, B3; V1 p.3–5 | ✓ — TourFilters usa meno/più, minimo 1 e massimo derivato dalla capienza dei tour. |
| T03 | Dati volantino | Scaricare e verificare tutte le pagine del PDF ufficiale. | V1 p4 | ✓ — riesaminati testo e struttura del volantino di 10 pagine; conservati URL e SHA256 nel JSON di importazione. |
| T04 | Itinerari completi | Importare descrizioni e tappe per i sette tour del volantino. | V2 p.4, B3; V1 p.3–5 | ✓ — sette descrizioni e relativi highlights nel JSON; confronto dei dieci campi editoriali/operativi con i sette record locali senza differenze. |
| T05 | Giorni operativi | Riportare giorni esatti per ogni tour. | V2 p.4, B3; V1 p.3–5 | ✓ — giorni riportati nel JSON e nei sette record locali, con weekdays coerenti nell’importazione. Coerenza dopo le modifiche verificata in T22. |
| T06 | Orari e anticipo | Orario corretto e presentarsi 15 minuti prima. | V2 p.4, B3; V1 p.3–5 | ✓ — orari e anticipo 15 minuti nel JSON, schede e record locali; il testo pubblico segue le partenze effettivamente disponibili. |
| T07 | Durata | 150/120/180 minuti secondo volantino. | V2 p.4, B3; V1 p.3–5 | ✓ — durate di 150/120/180 minuti allineate al volantino e ai record locali. |
| T08 | Servizi inclusi | Guida, ingressi e trasporti secondo ciascun tour. | V2 p.4, B3; V1 p.3–5 | ✓ — inclusioni per guida, bunker, trasporto, Biblioteca, funicolare/San Nicola e ingressi Castello presenti nei listini pertinenti. |
| T09 | Note pratiche | Biglietto mezzi 39 CZK e varianti stagionali Strahov. | V2 p.4, B3; V1 p.3–5 | ✓ — nota 39 CZK/30 minuti e varianti stagionali Strahov conservate in descrizione e safetyNotes. |
| T10 | Listini originali | Prezzi e fasce esatti; CZK esplicito nel volantino. | V2 B3 + Utente 4 | ✓ — importi e categorie dei sei tour pagati confrontati con il volantino e con i dati locali; nessuna conversione EUR. Il volantino non indica un prezzo per minori di 7 anni al Castello interni. |
| T11 | Offerte volantino | Conservare sei offerte, adulti soltanto, non applicabili online. | Volantino p9 | ✓ — sei offerte e condizioni originali conservate; specialOffers nel CMS e onlineDiscounts=false sui tour del volantino. Editor home corretto e verificato (E12). |
| T12 | Card tour | Giorni, orario, anticipo, durata, inclusioni, note e riepilogo prezzi. | V2 p.4, B3; V1 p.3–5 | ✓ — Corretto e verificato: tourHeadlinePrice deriva il prezzo dalla categoria adults, o dalla prima categoria configurata in assenza di adults. Card, testata, catalogo pubblico, gestionale, SEO e testi AI usano la stessa fonte. Cambio via editor da 400 a 999 CZK e poi EUR verificato; prenotazione preesistente conservata a 400 CZK. |
| T13 | Fasce dinamiche | Categorie specifiche per tour: aggiunta, modifica, rimozione e prezzo. | V2 p.6, C4; V1 (1) p.5 | ✓ — TourCommercialEditor e tourSchema supportano aggiunta/rimozione, nome, età e prezzo di categorie per tour; calcolo server tramite selectedPrices. Coerenza del prezzo in evidenza verificata in T12/T22. |
| T14 | Fasce sovrapposte | Mostrare tutte le categorie configurate, comprese sovrapposizioni. | Utente 4 | ✓ — categorie sovrapposte restano visibili e selezionabili; test dedicato su adulti/studenti/over 65. Non si introduce un filtro automatico per età. |
| T15 | Selettore prenotazione | Prezzo unitario e meno/più per ciascuna categoria. | V2 p.4, B3; V1 p.3–5 | ✓ — QuickBooking, usato anche nella pagina tour, mostra prezzo unitario e meno/più per ogni categoria; preventivo ricalcolato dal server. |
| T16 | Carrello e checkout | Quantità dinamiche, totale server, valuta coerente, capienza e snapshot storico. | V2 B3/C4 | ✓ — carrello e checkout trasmettono categorie/quantità, il server controlla capienza e salva snapshot/valuta; collaudo precedente con tre categorie in CZK. |
| T17 | Tipo tour | Scelta Free Tour o a pagamento gestibile dall’admin. | V2 p.6, C4; V1 (1) p.5 | ✓ — selettore Free Tour/a pagamento in TourOperationsEditor; isFreeTour influenza le regole di calcolo. Configurazione dei metodi di pagamento distinta in T21. |
| T18 | Regola gruppi free | Soglia, modalità contatto/prezzo e importo configurabili. | Utente 3 + volantino | ✓ — freeGroupLimit/freeGroupMode/freeGroupPriceCents configurabili, con controlli server e regola contatto oltre 6 per il Free Tour del volantino. |
| T19 | Limiti capienza | Rimuovere limite rigido 25 da frontend, API e disponibilità. | Utente 3 | ✓ — capienza per prenotazione e per partenza modificabili; rimosso il tetto funzionale 25. Rimane il limite tecnico di validazione 10.000. |
| T20 | Importazione prudente | Procedura ripetibile con anteprima, preservando prenotazioni e dati cliente. | Requisito tecnico | ✓ — importazione locale con dry run, backup e revisione idempotente; non esegue automaticamente la stessa revisione sui dati Railway. |
| T21 | Gestione dei pagamenti del tour pagato | Rendere esplicito il perimetro di configurazione dei pagamenti richiesto per il tour a pagamento. | V2 p.6, C4; V1 (1) p.5 | ✓ — Metodi per singolo tour: contanti predefiniti e bonifico configurabile con istruzioni obbligatorie. Checkout propone soltanto metodi comuni ai tour selezionati e il server li ricontrolla. Istruzioni congelate nella prenotazione, conferma/email, registrazione incasso, cancellazione e rimborso manuale collaudati. Stripe rimane escluso dal perimetro preesistente; nessun provider attivato. |
| T22 | Coerenza listino, prezzo in evidenza e dati operativi | Una modifica amministrativa non deve lasciare prezzi o dati pubblici in disaccordo con quelli prenotabili. | Derivato da V1 p.8 e V2 p.4 B3/p.6 C4 | ✓ — Giorni e orari pubblici derivati dalle partenze effettive, comprese eccezioni, chiusure e anticipo minimo di prenotazione. Nessun aggiornamento separato del testo operativo. Prezzo dinamico T12 conservato; regression test su disponibilità e listino. |

## Editor e struttura contenuti

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| E01 | Editor semplice | Blocchi/sezioni ordinati come pagina pubblica; evitare editor a tre colonne. | Utente 2 | ✓ — Aggiornamento utente 23/11: il CMS mostra la pagina pubblica stessa, incorporata nel gestionale, con doppio clic su testi e foto modificabili. Anteprime desktop/tablet/mobile, bozza e salvataggio esplicito. Verificato in locale. |
| E02 | Pagine e tour | Esperienza coerente per testi, immagini, itinerario, prezzi, galleria, FAQ. | V2 p.5, C1; V1 (1) p.4–5 | ✓ — Editor visuale per homepage, pagine informative/commerciali, pagine storiche, blog e singoli articoli; configurazione condivisa separata. L’editor dei tour resta quello esistente, come richiesto. |
| E03 | Blocchi aggiuntivi | Aggiungere blocchi testo, immagine e testo+foto. | V2 p.5, C1; V1 (1) p.4–5 | X — FUORI CONTRATTO, escluso dall’utente il 23/11. Comandi di aggiunta sezioni nascosti tramite CONTENT_SECTION_STRUCTURE_ENABLED=false; sorgenti e modelli conservati, contenuti esistenti mantenuti. L’editor visuale non consente di aggiungere blocchi. |
| E04 | Riordino blocchi | Spostare su/giù e rimuovere senza modificare codice. | V2 p.5, C1; V1 (1) p.4–5 | X — FUORI CONTRATTO, escluso dall’utente il 23/11. Comandi di spostamento e rimozione delle sezioni nascosti; ordine e struttura fissi. Restano modificabili i testi e le foto delle sezioni esistenti. Nessuna attività di riordino da completare. |
| E05 | Rendering pubblico | Blocchi salvati visibili nelle pagine e nelle schede tour. | V2 p.5, C1; V1 (1) p.4–5 | ✓ — Le sezioni esistenti continuano a essere renderizzate dal sito pubblico. Il CMS usa quegli stessi componenti, senza una copia grafica separata. Modifiche pubblicate e rilette su tutte le pagine e negli articoli storici, comprese foto interne all’HTML. |
| E06 | Autonomia CMS | Testi, immagini, prezzi, età, orari, durate e note configurabili. | V1 p.8; V1 (1) p.1–2 | ✓ — Doppio clic sui campi editoriali consentiti; testo formattato e foto sostituibili anche negli articoli importati. Alt immagini, destinazioni dei pulsanti, dati condivisi e SEO conservati. Nessun comando per modificare la struttura delle sezioni. |
| E07 | Albero contenuti | Pagine ordinate e raggruppate come menu pubblico. | V2 p.5, C2; V1 (1) p.4 | ✓ — Selettore delle pagine ordinato e raggruppato con siteNavigation come il menu pubblico, più pagine storiche e articoli del blog. La replica comprende lo stesso header/footer del sito. Le schede tour restano nel loro gestionale. |
| E08 | Menu dinamico | Riordino voci principali e sottomenu con frecce su/giù. | V1 p.8; V1 (1) p.1–2 | ✓ — NavigationEditor e schema supportano frecce su/giù per voci principali e sottovoci; header legge gli stessi dati salvati. |
| E09 | Nuove voci menu | Aggiungere/rimuovere voci e raggruppamenti dal pannello. | V1 (1) p2–3 | ✓ — aggiunta/rimozione di voci principali e sottovoci implementata; non comprende la creazione automatica delle pagine di destinazione, non richiesta da questo punto. |
| E10 | Validazione editor | Salvataggio validato, anteprima dei blocchi, errori chiari e mantenimento dati storici; modalità semplice scelta dall’utente. | V2 p.5, C1; V1 (1) p.4–5 | ✓ — Salvataggio atomico dei soli campi modificati, validazione server e permessi admin. Conflitti concorrenti rifiutati senza perdere la bozza; avviso prima di abbandonare modifiche non salvate. HTML sanitizzato, URL storici preservati e struttura fissa verificati. |
| E11 | Affinamento successivo | Predisporre editor estensibile; prova e approvazione del cliente rimangono successive. | V2 p.5, C1; V1 (1) p.4–5 | X — Decisione del committente: resta la prova e approvazione dell’editor da parte vostra. Editor estensibile pronto, corretto e collaudato; nessuna dipendenza tecnica residua per sottoporvelo. |
| E12 | Instradamento degli editor home/blog/FAQ | I collegamenti CMS devono aprire gli editor strutturati previsti e salvarne davvero i campi. | Derivato da V2 p.5, C1–C2 | ✓ — Percorsi home/blog/FAQ aprono la replica della pagina corrispondente e modificano i campi strutturati corretti. Il salvataggio visuale usa un endpoint dedicato, evitando il vecchio equivoco tra contenuti e soli metadati. |
| E13 | Copertura di tutte le pagine pubbliche | Ogni sezione pubblica, comprese pagine B2B e collaborazione, deve avere il corrispondente editor raggiungibile. | V1 p.8; V1 (1) p.1 e p.4 | ✓ — Copertura visuale di dodici pagine pubbliche, pagina storica e singoli articoli. Testo, copertina, alt, foto nell’HTML e schede partner modificati nel browser e verificati nello stato persistente; dati tour invariati. |
| E14 | Replica pubblica modificabile a doppio clic | Per ogni pagina e articolo: stessa grafica pubblica, modifica dei soli testi/foto consentiti, bozza e pubblicazione; editor tour invariato. | Utente 23/11/2026 | ✓ — Implementata e collaudata in locale, con iframe della pagina reale e viewport desktop di 1440 px ridotto allo spazio disponibile. Header e richiami blog solo navigabili; offerte editabili dal catalogo; testi rispettano gli a capo. Il pubblico non vede strumenti di editing; pubblicazione riservata agli amministratori. Nessun deploy Railway per questo seguito. |

## Calendario operativo condiviso

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| C01 | Navigazione mesi | Frecce mese precedente/successivo anche al cambio anno. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — frecce e input mese gestiscono anche il cambio anno; codice di shift basato su Date.UTC. |
| C02 | Intervallo date | Intervallo personalizzato e filtri/scorciatoie temporali con significato corretto, sia come operazione sia come vista. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — Dal/al filtra la vista con pulsante dedicato; scorciatoie aggiornano anche i giorni mostrati. Questo mese/Mese scorso/Intero anno partono dalla data attuale di Praga. Verificato un intervallo a cavallo di due mesi dopo aver sfogliato un anno diverso. |
| C03 | Selettore tour | Uno, più o tutti con perimetro esplicito prima di applicare. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — select multiplo più Seleziona tutti/Deseleziona e ambito testuale; selezione iniziale vuota. È una lista nativa, non un dropdown personalizzato. |
| C04 | Dettaglio giorno | Click giorno con tour singolo apre dettaglio partenze. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — con un tour selezionato, il click sul giorno apre un pannello con le partenze; il PDF ammette pannello o modale. |
| C05 | Nuova partenza | Aggiungere orario e capienza per giorno e tour. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — operazione open con orari espliciti crea partenze per i giorni selezionati; test API su un nuovo orario. |
| C06 | Chiudi orario | Chiudere/riaprire un singolo orario senza toccare gli altri. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — Apertura/chiusura per orario con precedenza cronologica delle regole anche su closures legacy. Riapertura di un orario e conservazione degli altri chiusi verificate; disponibilità realmente prenotabile dopo più letture. |
| C07 | Capienza per partenza | Modificare posti per orario senza scendere sotto prenotati. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — modifica capienza per orario e validazione server contro i posti già riservati; rigetto 409 verificato nei test precedenti. |
| C08 | Operazioni per periodo | Aprire/chiudere tour/orari su intervalli, mesi e anno. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — Operazioni per periodo e orari con compatibilità delle chiusure precedenti. Regole persistenti, ambito esplicito e controllo atomico della capienza; nessuna cancellazione implicita di prenotazioni. |
| C09 | Eccezioni stagionali | Capienza/orari extra limitati al periodo scelto. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — nuove regole da/al, giorni e orari applicano eccezioni di capienza e partenze extra nel solo intervallo selezionato; test dedicati. Compatibilità con chiusure legacy verificata in C06/C10. |
| C10 | Regole persistenti | Rigenerazione automatica non annulla chiusure ed eccezioni. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — Rigenerazione conserva chiusure e capienze manuali e riapplica le regole nell’ordine. Riaperture esplicite superano le chiusure legacy; tre rigenerazioni consecutive verificate. Confronto JSONB evita false modifiche della programmazione. |
| C11 | Calendario dentro tour | Stessa UI e API del calendario generale, preselezione tour. | V2 p.6, C4; V1 (1) p.5 | ✓ — Calendario condiviso, limitato al tour, separato dal form editoriale; risposta API riallinea solo i dati operativi senza perdere la bozza. Nel browser: titolo non salvato, riapertura, salvataggio scheda e rilettura PostgreSQL senza 409 impropri. |
| C12 | Prenotazioni conservate | Nessuna cancellazione/spostamento implicito; controlli atomici su occupazione. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — posti riservati conservati, controlli atomici e divieto di eliminare/spostare implicitamente partenze occupate; aperture e chiusure non cancellano le prenotazioni. |
| C13 | Programmazione annuale | Regola base su giorni settimanali/orari/capienza e periodo annuale. | V2 p.5–6, C3; V1 (1) p.6–7 | ✓ — schedule con giorni settimanali, orari, capienza e intervallo; generazione fino a 366 giorni e test di un anno completo. Non è una ricorrenza pluriennale infinita, che non è richiesta dal PDF. |
| C14 | Calendario di un tour nuovo non salvato | Il calendario interno non deve consentire operazioni su altri tour mentre si sta creando un nuovo tour. | Controllo tecnico derivato da V2 p.6, C4 e V1 (1) p.6 §2 | ✓ — Calendario disabilitato prima del primo salvataggio: nessun selettore di altri tour. Creazione assegna identità propria, non copia le vecchie regole e porta alla scheda salvata per gestirne le partenze. |

## Affiliazione e commissioni

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| A01 | Regole dentro tour | Configurazione per guide, agenzie, hotel e promoter. | V2 p.6, C4; V1 (1) p.5 | ✓ — commissionRules modificabili nella scheda tour per guide, agenzie, hotel e promoter. Tipologie ulteriori configurabili: A09. |
| A02 | Prodotto e beneficiario | Regole per free, singolo pagato e pacchetto, con eventuale affiliato specifico. | V2 p.6, C4; V1 (1) p.5 | ✓ — regole per free/paid/package e filtro facoltativo per codice affiliato. Beneficiario è l’affiliato associato alla vendita; non è implementata una ripartizione verso terzi. |
| A03 | Fisso o percentuale | Fisso per partecipante; percentuale sul totale realmente addebitato. | Utente 5 | ✓ — fisso × partecipanti oppure percentuale del totale del tour dopo gli sconti; test commissionFor. Non è richiesta la conferma manuale di incasso cash per calcolare la commissione. |
| A04 | Pacchetto differenziato | Commissione diversa da singolo senza duplicazione del totale. | V2 p.6, C4; V1 (1) p.5 | ✓ — Identificazione esplicita: un tour forma pacchetto commissionale solo con gli abbinamenti selezionati dal gestionale. Nessuna selezione = singolo; due partenze dello stesso tour non diventano pacchetto. Regole applicate alle singole quote senza duplicare totali; nessuno sconto implicito al cliente. |
| A05 | Maturazione | Dopo fine tour, prenotazione valida; esclusi cancellati e no-show. | Utente 5 | ✓ — commissionMatured controlla fine tour e stato confirmed/present; cancelled/no_show esclusi. Coerente con il criterio operativo indicato dall’utente. |
| A06 | Storno | Cancellazione azzera diritto alla commissione, anche nel riepilogo storico. | Utente 5 | ✓ — cancelReservation azzera commissionCents; riepilogo esclude cancellati. Non equivale a un sistema contabile di recupero commissioni già pagate, non descritto nei PDF. |
| A07 | Rendiconto e saldo | Separare previste/maturate/pagate e impedire pagamento anticipato. | Utente 5 | ✓ — riepilogo previste/maturate/liquidate per valuta; endpoint pay ricontrolla maturazione, impedendo la liquidazione prima della fine del tour. |
| A08 | Snapshot commissione | Regola e valore fissati alla vendita; modifiche future non cambiano lo storico. | Requisito tecnico | ✓ — regola scelta copiata in commissionRuleSnapshot e importo salvato nella prenotazione; test verifica che un cambio successivo della regola non cambi lo snapshot. |
| A09 | Altre categorie di affiliato | Supportare altre tipologie di partner oltre a guide, agenzie e hotel, come previsto nella versione estesa. | V1 (1) p.5 §4 | ✓ — Tipologie personalizzate inseribili nell’anagrafica e nelle regole del tour, con suggerimenti per i quattro tipi iniziali. Testata una associazione culturale con regola fissa e snapshot alla vendita. |

## Partner e misurazione

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| P01 | Anagrafica | Creare, modificare, eliminare, pubblicare/nascondere schede partner. | V2 p.6, C5; V1 (1) p.3 | ✓ — partnerSchema, API PUT/DELETE e PartnersManager gestiscono schede, bozza/pubblicazione ed eliminazione logica. |
| P02 | Upload partner | Foto/logo con uploader esistente. | V2 p.6, C5; V1 (1) p.3 | ✓ — ImageSourceField collegato all’immagine partner e al caricamento media esistente; immagini ammesse dallo schema. |
| P03 | Click totali | Registrare uscita per ciascun partner con destinazione validata. | V2 p.6, C5; V1 (1) p.3 | ✓ — link pubblico passa dal redirect del partner, valida la destinazione HTTPS e registra il conteggio. Bot/prefetch riconoscibili esclusi. |
| P04 | Visitatori unici | Deduplicare per partner/visitatore/giorno con consenso alle statistiche; senza consenso contare soltanto i click totali, senza identificativo. Niente IP o email nelle statistiche. | Utente 7 | ✓ — deduplica partner/giorno/visitatore con consenso; senza consenso solo click totali. Sono visitatori-giorno misurabili, non utenti unici nell’intero periodo: scelta esplicitata. |
| P05 | Storico | Persistenza eventi e dati anche se partner eliminato. | V2 p.6, C5; V1 (1) p.3 | ✓ — eliminazione logica conserva anagrafica di riferimento e conteggi storici; caso partner eliminato coperto nei test. |
| P06 | Periodo statistiche | Filtro dal/al, totali per partner e storico giornaliero. | V2 p.6, C5; V1 (1) p.3 | ✓ — filtro dal/al e aggregati giornalieri in partnerStats e PartnersManager. |
| P07 | Esportazione | CSV con periodo, partner, click e visitatori unici. | V2 p.6, C5; V1 (1) p.3 | ✓ — endpoint stats?format=csv esporta periodo, partner, totali e visitatori-giorno; caso verificato nel collaudo precedente. |

## Verifiche e consegna

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| Q01 | Controlli statici | Lint e TypeScript. | Collaudo | ✓ — ESLint senza avvisi e TypeScript superati sulla versione finale. |
| Q02 | Test logiche | Categorie, valute, prezzi, commissioni, calendario e statistiche. | Collaudo | ✓ — 91 test automatici superati anche su PostgreSQL temporaneo. Cinque nuove regressioni coprono pubblicazione visuale, conflitti atomici, sezioni fisse, percorsi consentiti e conservazione di HTML/URL storici. |
| Q03 | Test integrazione | API autenticate, persistenza, booking e invarianti posti. | Collaudo | ✓ — Suite HTTP su bundle produzione e PostgreSQL isolato: checkout, gestione firmata, staff/permessi, inventario, categorie, prezzi, commissioni, CMS, upload, CSV e bonifico. Email e ICS ricevuti dal server SMTP STARTTLS locale, senza invii su Internet. |
| Q04 | Build | Compilazione produzione standalone. | Collaudo | ✓ — Build standalone del nuovo CMS superata. L’ultimo rilascio Railway documentato resta quello del 22/11 (Q07); questo seguito visuale del 23/11 è verificato e disponibile in locale. |
| Q05 | Browser | Desktop/mobile: menu, filtri, booking, CMS e calendario. | Collaudo | ✓ — Suite desktop/mobile e HTTP completate anche sul nuovo CMS: doppio clic, bozze, salvataggio, foto/alt, dodici pagine, articoli storici, schede partner, permessi e conflitti. Tour e inventario confrontati prima/dopo senza modifiche. |
| Q06 | Tabella finale | Aggiornare ogni riga con ✓ oppure X e motivazione/evidenza. | Utente | ✓ — Tutte le righe aggiornate con stato ed evidenza; restano X soltanto per dati mancanti o approvazione del committente. Le evidenze precedenti sono conservate come storiche. |
| Q07 | Rilascio e verifica Railway | Pubblicare il codice verificato, aggiornare i dati senza perdere prenotazioni e ricontrollare il servizio remoto. | Ultima richiesta utente | ✓ — Backup privato prima della modifica; aggiornamento idempotente e transazionale dell’anteprima, servizio web sano, catalogo/CMS verificati e prenotazione/ordine preesistenti conservati. Dettagli nel rapporto di completamento. |

## Correzioni dei rilievi tecnici

L’audit precedente ha identificato difetti reali: il suo verde di test non chiudeva i requisiti. Tutti i rilievi tecnici sono stati corretti e ricollaudati in questo seguito.

- **R1 — Instradamento CMS:** sezioni strutturate prima delle pagine generiche. Salvataggio e rendering di home/blog/FAQ verificati dal browser.
- **R2 — Autonomia CMS:** albero con gli stessi tour dell’header; destinazioni canoniche, articoli e pagine storiche risolte al proprio editor. Introduzioni, benefici, blocchi e SEO delle pagine prima statiche ora modificabili.
- **R3 — Prezzi e dati operativi:** conservata la correzione T12; riepilogo giorni/orari derivato dalle partenze effettive, comprese chiusure e anticipo minimo. I listini modificati non riscrivono le vendite precedenti.
- **R4 — Filtri calendario:** vista dal/al e scorciatoie ancorate al giorno attuale di Praga. Verificato un intervallo che attraversa due mesi.
- **R5 — Chiusure:** riaperture esplicite superano le closures legacy; capienze e chiusure manuali sopravvivono alla generazione. Altri orari e prenotazioni restano conservati.
- **R6 — Scheda/calendario:** API restituisce i tour aggiornati e il draft recepisce soltanto l’inventario operativo. Il calendario è fuori dal form; un nuovo tour deve essere salvato prima di usarlo.
- **R7 — Pacchetti:** abbinamenti espliciti configurabili per la commissione. Un ordine con più righe non viene più considerato automaticamente un pacchetto.
- **R8 — PostgreSQL JSONB:** confronti per valore, indipendenti dall’ordine delle proprietà JSON. Il test di salvataggio dopo la riapertura ha individuato ed eliminato anche questa causa dei falsi 409 e delle false modifiche della programmazione.

## Comportamento dei pagamenti

Ogni tour può proporre contanti e/o bonifico; contanti resta il default. Un bonifico richiede istruzioni salvate e non viene esposto se manca la configurazione. Il checkout usa i metodi comuni ai tour presenti e li ricontrolla sul server. Le istruzioni vengono congelate alla vendita e compaiono nel riepilogo, nella gestione personale e nell’email; il team registra l’incasso e gli eventuali rimborsi. Le commissioni su bonifico non maturano prima dell’incasso. Nessun dato bancario fittizio è stato inserito su Railway. Stripe non è stato attivato: rimane fuori dal perimetro preesistente e non è necessario per i flussi realizzati.

## Requisiti superati dalle decisioni dell’utente

- «Accedi o registrati» nei PDF: sostituito dal solo link personale ricevuto via email, per istruzione esplicita dell’utente; non è una funzione mancante.
- Editor a tre colonne/anteprima completa in V1 (1): non obbligatorio. V2 ammette l’alternativa modulare e l’utente ha scelto la soluzione semplice. L’anteprima dei blocchi è una funzione presente; non viene spacciata per anteprima dell’intera pagina.
- EUR/CZK: EUR predefinito, con CZK conservato dove il volantino lo specifica espressamente. Doppia valuta e cambio automatico non sono richieste confermate.
- Click «univoco per partner»: l’utente ha delegato la definizione tecnica. Sono distinti click totali e visitatori-giorno con consenso; niente promessa di persone uniche nell’intero periodo.
- Testo «Posizione via email e WhatsApp» nei box home: riportato come contenuto fornito dal committente. Non costituisce da solo una richiesta di automazione WhatsApp; non si dichiara implementato tale invio automatico.

## Seguito del 23 novembre 2026 — CMS visuale e sezioni fisse

L’ultima decisione dell’utente sostituisce l’editor a moduli delle pagine con una replica della pagina pubblica dentro il gestionale. Doppio clic su un testo o una foto evidenziata apre la modifica; «Applica alla bozza» aggiorna l’anteprima e «Salva modifiche» pubblica. Sono inclusi homepage, pagine, articoli del blog e pagine storiche. La gestione degli articoli rimane disponibile; l’editor dei tour non viene sostituito.

**Aggiunta e riordino delle sezioni non sono previsti dal contratto**, per rettifica esplicita dell’utente. Sono nascosti anche i relativi comandi di rimozione; modelli e contenuti esistenti sono conservati. Le righe E03 ed E04 passano a X con motivo «fuori contratto»: non indicano difetti da risolvere. Il nuovo endpoint visuale modifica soltanto contenuti di sezioni già esistenti.

La pubblicazione verifica permessi, schema e valore iniziale di ogni campo: una modifica concorrente non viene sovrascritta. Il test browser conserva la bozza dopo un conflitto e dopo aver annullato l’uscita dalla pagina. Le prove comprendono foto di copertina, alt e immagini nell’HTML storico, mantenendo la formattazione e gli URL. Le schede partner sono modificabili senza registrare click di visita durante l’editing. I tour e le partenze sono confrontati prima/dopo e restano invariati.

Questo seguito è **disponibile in locale**, su `http://localhost:3100/admin/contenuti/homepage`. Nessun nuovo deploy Railway in questo passaggio. Non sono stati inseriti contenuti di prova nel database utilizzato dall’utente; i test modificano solo archivi temporanei isolati.

Verifiche: lint, TypeScript, **92 test su PostgreSQL**, build standalone, suite HTTP/browser, **215 controlli SEO** e SMTP STARTTLS locale con 28 messaggi/ICS. Evidenza: [cms-visuale-2026-11-23.json](evidenze/cms-visuale-2026-11-23.json). I risultati del 22/11 qui sotto rimangono evidenza storica del rilascio precedente.

### Correzioni delle quattro schermate — 23 novembre

- ✓ **Richiami blog:** titolo, anteprima e foto delle schede in homepage e nell’elenco blog provengono dall’articolo e non sono modificabili da quelle schede. Un clic apre l’articolo nel CMS; lì restano modificabili titolo, anteprima, copertina e contenuto.
- ✓ **Anteprima Desktop:** viewport reale di 1440 px, ridotto proporzionalmente allo spazio disponibile nel gestionale. I breakpoint e il menu sono quelli desktop; Tablet usa 768 px e Mobile 390 px. Corretto anche lo stile dei campi vuoti che rendeva visibile la foto mobile sopra quella desktop durante l’editing.
- ✓ **Offerte speciali:** dati importati dal volantino e già configurabili nel gestionale. Ora si modificano direttamente da **Contenuti → Catalogo tour**, nel riquadro «Offerte speciali tramite servizio clienti» in fondo alla pagina: doppio clic su titolo, condizioni, nomi delle offerte, prezzi e testo del pulsante. I prezzi usano un campo numerico nella valuta configurata e vengono salvati in centesimi; titolo e testo del pulsante sono ora campi configurabili.
- ✓ **Header:** logo e voci di navigazione non aprono la modifica a doppio clic; i collegamenti continuano a selezionare le rispettive pagine nel CMS.
- ✓ **A capo:** tutti i testi semplici modificabili rispettano le nuove righe nella bozza e nel sito pubblico. Eliminato il taglio dei titoli al numero di righe originario; conservate anche le righe vuote nei titoli. L’incolla nell’editor formattato converte gli a capo in interruzioni HTML.

Collaudo dedicato: menu cliccabile, schede collegate all’articolo, viewport desktop/mobile, foto desktop/mobile separate, titolo su tre righe riletto nella pagina pubblica, titoli multilinea con riga vuota su tutte le dodici pagine, modifica e persistenza dei campi delle offerte. Nessuna nuova esclusione contrattuale: E03 ed E04 restano X per la struttura fissa delle sezioni.

### Revisione del layout del gestionale — 23 novembre

Le cinque schermate indicate dall’utente sono state riviste singolarmente mediante screenshot locali. Su desktop da 1100 px di larghezza occupano **100dvh**: intestazione e azioni rimangono nella schermata, i contenuti lunghi scorrono nei pannelli. Su mobile rimane il flusso verticale per mantenere leggibili campi e comandi.

- ✓ **Prenotazione:** cliente e partecipanti su righe di tre campi; riepilogo compatto, note richiudibili, spostamento e cancellazione nel pannello laterale. Aggiornamenti, notifica, rimborso, spostamento e cancellazione conservati.
- ✓ **Tour:** sei schede per informazioni, tariffe, programmazione, contenuti, foto e calendario. Un solo pannello visibile alla volta su desktop; salvataggio sempre disponibile. Le sezioni conservano tutti i campi, le immagini, le categorie, le regole e le operazioni del calendario.
- ✓ **Calendario:** due righe di controlli. Selezione multipla dei tour in menu con caselle e selezione globale; periodo in tendina; date; operazione; orari; giorni in menu; capienza quando necessaria. Due azioni distinte per mostrare il periodo e applicare la modifica. Dettagli delle partenze in pannello laterale; intervalli lunghi scorrono dentro la griglia.
- ✓ **Affiliati:** creazione/modifica richiudibile, elenco a due colonne con scorrimento interno, importi raggruppati, QR e azioni conservati; report espandibili.
- ✓ **Email:** scelta del modello in tendina, testo e HTML affiancati, firma e guida alle variabili richiudibili, salvataggio visibile; coda e anteprime in pannello separato con scorrimento interno.

Verifica visiva su **1366×768** e **1500×1000**, con apertura di tutte le schede tour, selezione del periodo annuale e apertura della modifica affiliato. Nessun salvataggio nei dati dell’utente e nessuna azione di invio eseguita durante gli screenshot. Per richiesta dell’utente **non sono state lanciate nuove suite per questo redesign**; il collaudo CMS precedente resta distinto. Screenshot e metadati: `tmp/admin-layout-qa/` e [layout-gestionale-2026-11-23.json](evidenze/layout-gestionale-2026-11-23.json).

## Collaudo e rilascio del 22 novembre

- ESLint, TypeScript e **86 test**, compreso il passaggio su PostgreSQL temporaneo.
- Build standalone; flussi HTTP, browser desktop/mobile e regressioni dei difetti dell’audit su database isolato.
- SMTP STARTTLS locale: **28 messaggi** ricevuti, con conferme, istruzioni bonifico e allegati ICS. Nessuna email di collaudo su Internet.
- SEO: **215/215** controlli locali e **191/191** sull’anteprima Railway; noindex e sitemap vuota dell’anteprima conservati.
- Railway: deployment `0a0c782d-6cb9-4f27-a2d6-2c165510d491` **SUCCESS**, codice `98dba41`. Backup privato, rilascio del servizio web e aggiornamento transazionale idempotente dei sette tour del volantino. Conservati tour aggiuntivi, articoli, prenotazioni, ordini, affiliati e richieste; i dati di prova restano soltanto nei database locali temporanei.
- Ricontrollo remoto di healthcheck PostgreSQL, catalogo, editor e navigazione desktop/mobile. Identità di prenotazione e ordine preesistenti confrontata anche tramite hash dei dati.

Evidenza corrente: [completamento-tecnico-specifiche-v2-2026-11-22.json](evidenze/completamento-tecnico-specifiche-v2-2026-11-22.json). I tre rapporti precedenti restano storici: [prima attuazione](evidenze/specifiche-v2-2026-11-22.json), [audit di rettifica](evidenze/audit-specifiche-v2-2026-11-22.json), [seguito T12](evidenze/correzione-t12-2026-11-22.json).

## X residue: esclusioni contrattuali e dati/approvazione

| Righe | Cosa manca |
|---|---|
| `E03`, `E04` | Fuori contratto: aggiunta, rimozione e riordino delle sezioni nascosti. La struttura resta fissa; non sono lavorazioni pendenti. |
| `D06` | Palette e set di icone definitivi annunciati dal committente. |
| `N09` | Indirizzo reale dell’ufficio, da mostrare con «previo appuntamento». |
| `E11` | Prova e approvazione dell’editor da parte del committente. |

Nota operativa: TikTok, YouTube e LinkedIn sono pubblicati con URL generici di piattaforma; quando avrete i profili ufficiali basta aggiornarli in **Contenuti → Menu e social**. Non rimangono X attribuite a difetti di codice, calendario, CMS, integrazione PostgreSQL o mancanza di test.
