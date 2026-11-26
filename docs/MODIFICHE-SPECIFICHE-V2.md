# Specifiche V1/V2 — matrice di attuazione

**Stato aggiornato al 26 novembre 2026. 172 righe, 167 ✅ e 5 ❌.** L’invio Resend è attivo su Railway (D07). Il campo prezzo si può svuotare durante la digitazione (V3B09).

✅ = comportamento realizzato e verificato nel perimetro descritto. ❌ = dato/approvazione ancora necessari, lavoro residuo, oppure requisito espressamente escluso dal contratto. Le esclusioni E03/E04 e V3F01 (Accedi) non sono debito tecnico da completare.

## Decisioni e accessi

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| D01 | Nessun account cliente | Non ripristinare Accedi/registrati; /account resta escluso. | Utente 1 | ✅ — esclusione esplicita dell’account conforme alla decisione utente; filtro menu in navigation.ts e 404 in proxy.ts. |
| D02 | Gestione tramite email | Conservare link personale firmato per consultare, spostare e cancellare. | Utente 1 | ✅ — gestione firmata della singola prenotazione in booking.ts e ManageBooking.tsx; scenari move/cancel nel collaudo precedente. |
| D03 | Valuta | EUR come default; conservare CZK dove il volantino lo specifica esplicitamente, senza conversioni arbitrarie. | Utente 4 + volantino | ✅ — currency EUR come fallback, CZK esplicito nei sei listini pagati del volantino; valuta salvata in quote/ordine/prenotazione. Carrelli misti rifiutati, senza conversione. |
| D04 | Dati mancanti | Campi amministrabili, niente indirizzi/social/partner inventati; sezioni omesse se vuote. | Utente 6 | ✅ — i campi indirizzi/social/recensioni sono predisposti; i valori reali assenti non sono sostituiti con dati fittizi. Completamento operativo distinto nelle ❌ dedicate (N09; social generici N06 in coda). |
| D05 | Identità visiva | Conservare palette coerente esistente; icone uniformi; palette definitiva rinviata ai materiali cliente. | V2 p.3, B1; V1 p.1 | ✅ — scelta provvisoria consentita dall’utente: mantenuta la palette esistente. Non equivale all’applicazione dell’identità definitiva: D06. |
| D06 | Identità visiva definitiva | Applicare uniformemente palette e set di icone definitivi una volta ricevuti. | V2 p.3, B1; V1 p.1 | ❌ — Dato: la palette/set definitivi annunciati nei documenti non sono disponibili; l’aspetto provvisorio D05 non chiude questo requisito. |
| D07 | Recapito reale delle email operative | Configurare un provider transazionale e il mittente per consegnare conferme e link personali ai clienti. | Utente 1 + verifica Railway/Resend | ✅ — Provider Resend nel codice (`email-delivery.ts`); su Railway attivo con `RESEND_API_KEY` e mittente `RESEND_FROM` (default di progetto `info@freetourpraga.com`, sovrascrivibile). Prova di trasporto HTML+ICS consegnata a Gmail (Resend ID `01a21821-c010-71c7-b806-338629b2b684`). Restano da collaudare la conferma generata da una prenotazione reale e l’invio dal WordPress pubblico. |

## Homepage e contenuti ufficiali

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| H01 | Hero H1 | TOUR GUIDATI IN ITALIANO A PRAGA come titolo principale. | V2 p.1, A1 | ✅ — H1 ufficiale presente in defaultSiteContent(), archivio locale e rendering home; le interruzioni di riga sono solo grafiche. |
| H02 | Sottotitolo hero | Scopri l’anima autentica di Praga, in totale sicurezza. | V2 p.1, A1 | ✅ — testo ufficiale presente come heroEyebrow e visualizzato sopra l’H1. La posizione è una scelta grafica, il testo è conservato. |
| H03 | Descrizione hero | Testo ufficiale guide locali, prenotazione, email e WhatsApp. | V2 p.1, A1 | ✅ — descrizione ufficiale presente in defaultSiteContent(), archivio locale e home. |
| H04 | CTA hero | I nostri tour e Scrivici su WhatsApp con destinazioni corrette. | V2 p.1, A1 | ✅ — HeroTourCta e collegamento contentWhatsapp; etichette ufficiali presenti. Destinazione WhatsApp costruita dal recapito configurato. |
| H05 | Barra punti di forza | Quattro testi ufficiali e quattro icone illustrative. | V2 p.1, A2 | ✅ — quattro coppie titolo/testo in home.stats e quattro icone nel rendering home. |
| H06 | Esperienze | Titoli, introduzione e gruppi del documento. | V2 p.1, A3 | ✅ — quattro gruppi richiesti presenti in home.groups; tours mancanti dal catalogo rimandano a richiesta informazioni. Possono comparire anche tour/categorie già esistenti. |
| H07 | Rotazione esperienze | Gruppi cliccabili con rotazione e intervallo amministrabile. | V2 p.1, A3 | ✅ — ExperienceRotator gestisce gruppi e rotazione con intervallo; ExperienceGroupsEditor è presente. Accesso diretto all’editor home corretto e verificato: E12. |
| H08 | Perché sceglierci | Titolo e introduzione ufficiali. | V2 p.2, A4 | ✅ — titolo e corpo ufficiali presenti nell’archivio locale e nella sezione home.trust. |
| H09 | Quattro box fiducia | Tutela, gruppi, ritrovi, assistenza 9–19 con testi ufficiali. | V2 p.2, A4 | ✅ — Titolo ufficiale «Assistenza diretta 7 giorni su 7» nei default e nella normalizzazione dei vecchi contenuti; conservati i testi personalizzati diversi. Verificato anche su Railway. |
| H10 | Guide e consigli | Titolo, sottotitolo e introduzione ufficiali. | V2 p.2, A5 | ✅ — galleryEyebrow/galleryTitle/galleryBody corrispondono ai contenuti richiesti, con normalizzazione tipografica dell’apostrofo. |
| H11 | Prima di prenotare | Sei risposte ufficiali del documento. | V2 p.2, A6 | ✅ — sei risposte ufficiali in aiQuestions/content.answers e rendering HomeAnswers. Modifica tramite editor FAQ corretto e verificato: E12. |
| H12 | Banner B2B | Titolo, corpo, pulsante e link Partner Europa. | V2 p.2, A7 | ✅ — titolo, corpo, CTA e link /partner-europa presenti nella home e nei dati locali. |
| H13 | Recensioni | Dicono di noi e sottotitolo ufficiale. | V2 p.2, A7 | ✅ — globals.tripAdvisorTitle e tripAdvisorBody corrispondono a V2; TripAdvisorSection li passa al widget. |
| H14 | Invito Google | Pulsante recensione Google con URL configurabile. | V2 p.3, B2; V1 p.2 | ✅ — URL ufficiale `https://g.page/r/CY2Houtn8d4XEBM/review` in defaultSiteContent, normalizzazione specifiche e editor Recensioni; pulsante Google attivo. |
| H15 | Invito Tripadvisor | Pulsante recensione Tripadvisor con URL configurabile. | V2 p.3, B2; V1 p.2 | ✅ — WriteReviewCta usa il profilo ufficiale Tripadvisor configurabile. Il requisito parla di collegamento alla pagina ufficiale, non impone una specifica URL del modulo recensione. |
| H16 | Mappa homepage | Mappa interattiva con selettore laterale dei punti e link indicazioni. | V2 p.3, B2; V1 p.2 | ✅ — MeetingPoints contiene iframe interattivo, radio e indicazioni del punto selezionato. Attualmente iframe con loading lazy, non caricamento dietro pulsante; tale pulsante non è richiesto dai PDF. |
| H17 | Punto standard | Teatro degli Stati, Rytířská 22, 110 00 Staré Město, Praga. | V2 p.3, B2; V1 p.2 | ✅ — indirizzo del Teatro degli Stati esatto nei dati globali e nell’importazione delle specifiche. |
| H18 | Punto Castello interni | Punto alternativo configurabile; nessun indirizzo fittizio. | V2 p.3, B2; V1 p.2 | ✅ — Indirizzo ufficiale Terzo cortile del Castello di Praga e link Maps `https://maps.app.goo.gl/W3UdjsUfZNNMmhKF7` su home, Contatti e tour; salvataggio globale sincronizza meetingAddress/mappe e toglie il blocco prenotazioni. |

## Navigazione, contatti, guide e partner pubblici

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| N01 | Menu mobile | Richiusura alla scelta di link, anche dopo navigazione client. | V1 p1 | ✅ — MobileNavigation chiude details alla selezione di un link e al cambio pathname; percorso mobile verificato nel collaudo precedente. |
| N02 | Header | Tour, Chi siamo, Informazioni utili, Contatti e Altro; carrello. | V2 p.3, B1; V1 p.1 | ✅ — Header usa siteNavigation con le quattro voci principali, Altro e carrello. Il pulsante account è escluso per decisione dell’utente. |
| N03 | Altro | Partner Europa, Agenzie e scuole, Blog, FAQ e Aiuto. | V2 p.3, B1; V1 p.1 | ✅ — defaultNavigation raggruppa Partner Europa, Agenzie e scuole, Blog, FAQ e Aiuto sotto Altro; esiste /aiuto. |
| N04 | Torna su | Contrasto e bordo visibili anche sul footer scuro. | V2 p.3, B1; V1 p.1 | ✅ — bordo bianco del Torna su in globals.css e collocazione sopra gli altri contatti; nessuna dipendenza dal colore scuro del footer. |
| N05 | Instagram Direct | Pulsante tra WhatsApp e Torna su, solo con URL valido. | V2 p.3, B1; V1 p.1 | ✅ — floating-instagram tra WhatsApp e Torna su; ig.me usa l’handle ricavato dal volantino. Controllata la configurazione, non il recapito di messaggi su Instagram. |
| N06 | Social footer | Icone e link Facebook, Instagram, TikTok, YouTube, LinkedIn. | V2 p.3, B1; V1 p.1 | ✅ — Cinque icone attive: Instagram/Facebook ufficiali; TikTok, YouTube e LinkedIn con URL piattaforma standard finché non arrivano i profili ufficiali. Modificabili da CMS Homepage e Menu e social. |
| N07 | Guide informazioni utili | Card con immagine, anteprima e link articolo completo. | V2 p.4, B4; V1 p.5–7 | ✅ — Informazioni utili usa BlogGuideList in modalità elenco a righe, con immagine, anteprima e link all’articolo (V5I02). |
| N08 | Contatti: ritrovi | Tutti i punti di partenza pubblicati con link mappa. | V2 p.4, B4; V1 p.5–7 | ✅ — Contatti raccoglie gli indirizzi dei tour pubblicati, rimuove i duplicati e mostra anche il ritrovo del Castello interni (H18). |
| N09 | Contatti: ufficio | Indirizzo configurabile e dicitura previo appuntamento. | V2 p.4, B4; V1 p.5–7 | ❌ — La sede dell’ufficio non compare nella pagina Contatti su Railway. Compilare **Contenuti → Dati e contatti → Sede ufficio (previo appuntamento)** quando sarà disponibile l’indirizzo reale. |
| N10 | Contatti: social | Icone e collegamenti Facebook, Instagram, TikTok, YouTube e LinkedIn nei Contatti. | V2 p.4, B4; V1 p.5–7 | ✅ — Stessi cinque collegamenti di N06 riusati in Contatti; URL ufficiali sostituibili dal CMS senza tocchi al codice. |
| N11 | Telefono form | Input telefono, invio API, validazione, persistenza e visibilità staff. | V2 p.4, B4; V1 p.5–7 | ✅ — campo tel in InquiryForm, validazione API, persistenza phone, visualizzazione nelle richieste staff e pulizia per retention. |
| N12 | Partner Europa | Griglia partner sotto il form esistente. | V2 p.4, B4; V1 p.5–7 | ✅ — griglia partner collocata dopo CollaborationPage/form; nessuna scheda fittizia pubblicata. Con zero partner approvati la griglia è omessa. |
| N13 | Scheda partner | Nome, foto/logo, descrizione, contatti e sito esterno. | V2 p.4, B4; V1 p.5–7 | ✅ — scheda pubblica con nome, immagine opzionale, descrizione, contatti e link tracciato; CRUD e rendering esaminati. |

## Catalogo, volantino e prenotazione

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| T01 | Ricerca libera | Eliminare Cerca dalla barra filtri. | V2 p.4, B3; V1 p.3–5 | ✅ — TourFilters non contiene più il campo Cerca né il filtro testuale libero. |
| T02 | Filtro partecipanti | Pulsanti meno/più accessibili con limiti configurati. | V2 p.4, B3; V1 p.3–5 | ✅ — TourFilters usa meno/più, minimo 1 e massimo derivato dalla capienza dei tour. |
| T03 | Dati volantino | Scaricare e verificare tutte le pagine del PDF ufficiale. | V1 p4 | ✅ — riesaminati testo e struttura del volantino di 10 pagine; conservati URL e SHA256 nel JSON di importazione. |
| T04 | Itinerari completi | Importare descrizioni e tappe per i sette tour del volantino. | V2 p.4, B3; V1 p.3–5 | ✅ — sette descrizioni e relativi highlights nel JSON; confronto dei dieci campi editoriali/operativi con i sette record locali senza differenze. |
| T05 | Giorni operativi | Riportare giorni esatti per ogni tour. | V2 p.4, B3; V1 p.3–5 | ✅ — giorni riportati nel JSON e nei sette record locali, con weekdays coerenti nell’importazione. Coerenza dopo le modifiche verificata in T22. |
| T06 | Orari e anticipo | Orario corretto e presentarsi 15 minuti prima. | V2 p.4, B3; V1 p.3–5 | ✅ — orari e anticipo 15 minuti nel JSON, schede e record locali; il testo pubblico segue le partenze effettivamente disponibili. |
| T07 | Durata | 150/120/180 minuti secondo volantino. | V2 p.4, B3; V1 p.3–5 | ✅ — durate di 150/120/180 minuti allineate al volantino e ai record locali. |
| T08 | Servizi inclusi | Guida, ingressi e trasporti secondo ciascun tour. | V2 p.4, B3; V1 p.3–5 | ✅ — inclusioni per guida, bunker, trasporto, Biblioteca, funicolare/San Nicola e ingressi Castello presenti nei listini pertinenti. |
| T09 | Note pratiche | Biglietto mezzi 39 CZK e varianti stagionali Strahov. | V2 p.4, B3; V1 p.3–5 | ✅ — nota 39 CZK/30 minuti e varianti stagionali Strahov conservate in descrizione e safetyNotes. |
| T10 | Listini originali | Prezzi e fasce esatti; CZK esplicito nel volantino. | V2 B3 + Utente 4 | ✅ — importi e categorie dei sei tour pagati confrontati con il volantino e con i dati locali; nessuna conversione EUR. Il volantino non indica un prezzo per minori di 7 anni al Castello interni. |
| T11 | Offerte volantino | Conservare sei offerte, adulti soltanto, non applicabili online. | Volantino p9 | ✅ — sei offerte e condizioni originali conservate; specialOffers nel CMS e onlineDiscounts=false sui tour del volantino. Editor home corretto e verificato (E12). |
| T12 | Card tour | Giorni, orario, anticipo, durata, inclusioni, note e riepilogo prezzi. | V2 p.4, B3; V1 p.3–5 | ✅ — Corretto e verificato: tourHeadlinePrice deriva il prezzo dalla categoria adults, o dalla prima categoria configurata in assenza di adults. Card, testata, catalogo pubblico, gestionale, SEO e testi AI usano la stessa fonte. Cambio via editor da 400 a 999 CZK e poi EUR verificato; prenotazione preesistente conservata a 400 CZK. |
| T13 | Fasce dinamiche | Categorie specifiche per tour: aggiunta, modifica, rimozione e prezzo. | V2 p.6, C4; V1 (1) p.5 | ✅ — TourCommercialEditor e tourSchema supportano aggiunta/rimozione, nome, età e prezzo di categorie per tour; calcolo server tramite selectedPrices. Coerenza del prezzo in evidenza verificata in T12/T22. |
| T14 | Fasce sovrapposte | Mostrare tutte le categorie configurate, comprese sovrapposizioni. | Utente 4 | ✅ — categorie sovrapposte restano visibili e selezionabili; test dedicato su adulti/studenti/over 65. Non si introduce un filtro automatico per età. |
| T15 | Selettore prenotazione | Prezzo unitario e meno/più per ciascuna categoria. | V2 p.4, B3; V1 p.3–5 | ✅ — QuickBooking, usato anche nella pagina tour, mostra prezzo unitario e meno/più per ogni categoria; preventivo ricalcolato dal server. |
| T16 | Carrello e checkout | Quantità dinamiche, totale server, valuta coerente, capienza e snapshot storico. | V2 B3/C4 | ✅ — carrello e checkout trasmettono categorie/quantità, il server controlla capienza e salva snapshot/valuta; collaudo precedente con tre categorie in CZK. |
| T17 | Tipo tour | Scelta Free Tour o a pagamento gestibile dall’admin. | V2 p.6, C4; V1 (1) p.5 | ✅ — selettore Free Tour/a pagamento in TourOperationsEditor; isFreeTour influenza le regole di calcolo. Configurazione dei metodi di pagamento distinta in T21. |
| T18 | Regola gruppi free | Soglia, modalità contatto/prezzo e importo configurabili. | Utente 3 + volantino | ✅ — freeGroupLimit/freeGroupMode/freeGroupPriceCents configurabili, con controlli server e regola contatto oltre 6 per il Free Tour del volantino. |
| T19 | Limiti capienza | Rimuovere limite rigido 25 da frontend, API e disponibilità. | Utente 3 | ✅ — capienza per prenotazione e per partenza modificabili; rimosso il tetto funzionale 25. Rimane il limite tecnico di validazione 10.000. |
| T20 | Importazione prudente | Procedura ripetibile con anteprima, preservando prenotazioni e dati cliente. | Requisito tecnico | ✅ — importazione locale con dry run, backup e revisione idempotente; non esegue automaticamente la stessa revisione sui dati Railway. |
| T21 | Gestione dei pagamenti del tour pagato | Rendere esplicito il perimetro di configurazione dei pagamenti richiesto per il tour a pagamento. | V2 p.6, C4; V1 (1) p.5 | ✅ — La configurazione per tour supporta contanti e bonifico, con istruzioni obbligatorie per il bonifico. Il checkout pubblico attuale usa il flusso WhatsApp per i tour a pagamento, come richiesto da V3F17–V3F19. La scelta contanti/bonifico e il congelamento delle istruzioni sono coperti dal flusso API precedente. Stripe resta escluso. |
| T22 | Coerenza listino, prezzo in evidenza e dati operativi | Una modifica amministrativa non deve lasciare prezzi o dati pubblici in disaccordo con quelli prenotabili. | Derivato da V1 p.8 e V2 p.4 B3/p.6 C4 | ✅ — Giorni e orari pubblici derivati dalle partenze effettive, comprese eccezioni, chiusure e anticipo minimo di prenotazione. Nessun aggiornamento separato del testo operativo. Prezzo dinamico T12 conservato; regression test su disponibilità e listino. |

## Editor e struttura contenuti

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| E01 | Editor semplice | Blocchi/sezioni ordinati come pagina pubblica; evitare editor a tre colonne. | Utente 2 | ✅ — Aggiornamento utente 23/11: il CMS mostra la pagina pubblica stessa, incorporata nel gestionale, con doppio clic su testi e foto modificabili. Anteprime desktop/tablet/mobile, bozza e salvataggio esplicito. Verificato in locale. |
| E02 | Pagine e tour | Esperienza coerente per testi, immagini, itinerario, prezzi, galleria, FAQ. | V2 p.5, C1; V1 (1) p.4–5 | ✅ — Editor visuale per homepage, pagine informative/commerciali, pagine storiche, blog e singoli articoli; configurazione condivisa separata. I tour si gestiscono a parte in **Tour e orari → Modifica**, con schede **Dati tour**, **Editor visuale**, **Card visuale**, **Prezzi**, **Prenotabilità**, **Orari**, **Commissioni**, **SEO**, **Calendario**. |
| E03 | Blocchi aggiuntivi | Aggiungere blocchi testo, immagine e testo+foto. | V2 p.5, C1; V1 (1) p.4–5 | ❌ — FUORI CONTRATTO, escluso dall’utente il 23/11. Comandi di aggiunta sezioni nascosti tramite CONTENT_SECTION_STRUCTURE_ENABLED=false; sorgenti e modelli conservati, contenuti esistenti mantenuti. L’editor visuale non consente di aggiungere blocchi. |
| E04 | Riordino blocchi | Spostare su/giù e rimuovere senza modificare codice. | V2 p.5, C1; V1 (1) p.4–5 | ❌ — FUORI CONTRATTO, escluso dall’utente il 23/11. Comandi di spostamento e rimozione delle sezioni nascosti; ordine e struttura fissi. Restano modificabili i testi e le foto delle sezioni esistenti. Nessuna attività di riordino da completare. |
| E05 | Rendering pubblico | Blocchi salvati visibili nelle pagine e nelle schede tour. | V2 p.5, C1; V1 (1) p.4–5 | ✅ — Le sezioni esistenti continuano a essere renderizzate dal sito pubblico. Il CMS usa quegli stessi componenti, senza una copia grafica separata. Modifiche pubblicate e rilette su tutte le pagine e negli articoli storici, comprese foto interne all’HTML. |
| E06 | Autonomia CMS | Testi, immagini, prezzi, età, orari, durate e note configurabili. | V1 p.8; V1 (1) p.1–2 | ✅ — Doppio clic sui campi editoriali consentiti; testo formattato e foto sostituibili anche negli articoli importati. Alt immagini, destinazioni dei pulsanti, dati condivisi e SEO conservati. Nessun comando per modificare la struttura delle sezioni. |
| E07 | Albero contenuti | Pagine ordinate e raggruppate come menu pubblico. | V2 p.5, C2; V1 (1) p.4 | ✅ — Selettore delle pagine ordinato e raggruppato con siteNavigation come il menu pubblico, più pagine storiche e articoli del blog. La replica comprende lo stesso header/footer del sito. Le schede tour restano nel loro gestionale. |
| E08 | Menu dinamico | Riordino voci principali e sottomenu con frecce su/giù. | V1 p.8; V1 (1) p.1–2 | ✅ — NavigationEditor e schema supportano frecce su/giù per voci principali e sottovoci; header legge gli stessi dati salvati. |
| E09 | Nuove voci menu | Aggiungere/rimuovere voci e raggruppamenti dal pannello. | V1 (1) p2–3 | ✅ — aggiunta/rimozione di voci principali e sottovoci implementata; non comprende la creazione automatica delle pagine di destinazione, non richiesta da questo punto. |
| E10 | Validazione editor | Salvataggio validato, anteprima dei blocchi, errori chiari e mantenimento dati storici; modalità semplice scelta dall’utente. | V2 p.5, C1; V1 (1) p.4–5 | ✅ — Salvataggio atomico dei soli campi modificati, validazione server e permessi admin. Conflitti concorrenti rifiutati senza perdere la bozza; avviso prima di abbandonare modifiche non salvate. HTML sanitizzato, URL storici preservati e struttura fissa verificati. |
| E11 | Affinamento successivo | Predisporre editor estensibile; prova e approvazione del cliente rimangono successive. | V2 p.5, C1; V1 (1) p.4–5 | ✅ — Editor visuale pronto, collaudato e in uso (E01/E14): replica pagina, doppio clic, bozza/pubblicazione. Non resta debito tecnico: l’eventuale feedback editoriale del committente non è una X di prodotto. Da **Contenuti** aprire la pagina, fare doppio clic sul campo, premere **Applica alla bozza** e poi **Salva** nell’intestazione. |
| E12 | Instradamento degli editor home/blog/FAQ | I collegamenti CMS devono aprire gli editor strutturati previsti e salvarne davvero i campi. | Derivato da V2 p.5, C1–C2 | ✅ — Percorsi home/blog/FAQ aprono la replica della pagina corrispondente e modificano i campi strutturati corretti. Il salvataggio visuale usa un endpoint dedicato, evitando il vecchio equivoco tra contenuti e soli metadati. |
| E13 | Copertura di tutte le pagine pubbliche | Ogni sezione pubblica, comprese pagine B2B e collaborazione, deve avere il corrispondente editor raggiungibile. | V1 p.8; V1 (1) p.1 e p.4 | ✅ — Copertura visuale di dodici pagine pubbliche, pagina storica e singoli articoli. Testo, copertina, alt, foto nell’HTML e schede partner modificati nel browser e verificati nello stato persistente; dati tour invariati. |
| E14 | Replica pubblica modificabile a doppio clic | Per ogni pagina e articolo: stessa grafica pubblica, modifica dei soli testi/foto consentiti, bozza e pubblicazione; editor tour invariato. | Utente 23/11/2026 | ✅ — Iframe della pagina reale con viewport desktop di 1440 px ridotto allo spazio disponibile. Header e richiami blog servono per navigare. Le offerte si modificano in Catalogo tour. Il collaudo locale del 23/11 ha verificato bozza, pubblicazione riservata agli amministratori e conservazione degli a capo. |



### Dove modificare i campi di un tour

Da desktop: **Tour e orari → Modifica** sulla riga del tour.

| Scheda | Campi e comandi |
|---|---|
| Dati tour | Titolo, slug, categoria, pubblicazione, lingua, durata, percorso, accessibilità, punto d’incontro, anticipo di arrivo, intensità. |
| Editor visuale | Replica della scheda pubblica: testi, itinerario, incluso/escluso, note pratiche, foto di copertina e galleria a doppio clic. |
| Card visuale | Testi e info della card home/catalogo: titolo, intro, itinerario, elenco informazioni, etichette pulsanti, foto card, riga Guida. |
| Prezzi | Tipo Free/a pagamento, valuta, categorie, pagamenti, offerte. |
| Prenotabilità | Limiti e anticipo, regole gruppi Free Tour, policy/clausola di cancellazione. |
| Orari | Programmazione, chiusure, sigla calendario e riepilogo pubblico. |
| Commissioni | Regole affiliati e abbinamenti di pacchetto. |
| SEO | Titolo, descrizione e parole chiave. |
| Calendario | Vista partenze e operazioni sul tour selezionato (fuori dal form). |

**Salva tour e programmazione** salva le modifiche della scheda tour. Le operazioni in Calendario hanno i propri comandi di applicazione.

## Calendario operativo condiviso

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| C01 | Navigazione mesi | Frecce mese precedente/successivo anche al cambio anno. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — Frecce, selettore Mese e campo Anno. Le frecce attraversano il cambio d’anno. |
| C02 | Intervallo date | Intervallo personalizzato e filtri/scorciatoie temporali con significato corretto, sia come operazione sia come vista. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — Dal e Al aggiornano la vista quando l’intervallo è valido. Oggi riporta al mese attuale di Praga. In Programmazione le azioni sull’intervallo, sul mese e sull’anno applicano le modifiche al periodo indicato. |
| C03 | Selettore tour | Uno, più o tutti con perimetro esplicito prima di applicare. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — Menu Filtra tour con checkbox per singolo tour e voce Tutti i tour. Il calendario generale parte con tutti selezionati. Il calendario della scheda è limitato al tour aperto. |
| C04 | Dettaglio giorno | Click giorno con tour singolo apre dettaglio partenze. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — con un tour selezionato, il click sul giorno apre un pannello con le partenze; il PDF ammette pannello o modale. |
| C05 | Nuova partenza | Aggiungere orario e capienza per giorno e tour. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — operazione open con orari espliciti crea partenze per i giorni selezionati; test API su un nuovo orario. |
| C06 | Chiudi orario | Chiudere/riaprire un singolo orario senza toccare gli altri. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — Apertura/chiusura per orario con precedenza cronologica delle regole anche su closures legacy. Riapertura di un orario e conservazione degli altri chiusi verificate; disponibilità realmente prenotabile dopo più letture. |
| C07 | Capienza per partenza | Modificare posti per orario senza scendere sotto prenotati. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — modifica capienza per orario e validazione server contro i posti già riservati; rigetto 409 verificato nei test precedenti. |
| C08 | Operazioni per periodo | Aprire/chiudere tour/orari su intervalli, mesi e anno. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — Operazioni per periodo e orari con compatibilità delle chiusure precedenti. Regole persistenti, ambito esplicito e controllo atomico della capienza; nessuna cancellazione implicita di prenotazioni. |
| C09 | Eccezioni stagionali | Capienza/orari extra limitati al periodo scelto. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — nuove regole da/al, giorni e orari applicano eccezioni di capienza e partenze extra nel solo intervallo selezionato; test dedicati. Compatibilità con chiusure legacy verificata in C06/C10. |
| C10 | Regole persistenti | Rigenerazione automatica non annulla chiusure ed eccezioni. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — Rigenerazione conserva chiusure e capienze manuali e riapplica le regole nell’ordine. Riaperture esplicite superano le chiusure legacy; tre rigenerazioni consecutive verificate. Confronto JSONB evita false modifiche della programmazione. |
| C11 | Calendario dentro tour | Stessa UI e API del calendario generale, preselezione tour. | V2 p.6, C4; V1 (1) p.5 | ✅ — Calendario condiviso, limitato al tour, separato dal form editoriale; risposta API riallinea solo i dati operativi senza perdere la bozza. Nel browser: titolo non salvato, riapertura, salvataggio scheda e rilettura PostgreSQL senza 409 impropri. |
| C12 | Prenotazioni conservate | Nessuna cancellazione/spostamento implicito; controlli atomici su occupazione. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — posti riservati conservati, controlli atomici e divieto di eliminare/spostare implicitamente partenze occupate; aperture e chiusure non cancellano le prenotazioni. |
| C13 | Programmazione annuale | Regola base su giorni settimanali/orari/capienza e periodo annuale. | V2 p.5–6, C3; V1 (1) p.6–7 | ✅ — schedule con giorni settimanali, orari, capienza e intervallo; generazione fino a 366 giorni e test di un anno completo. Non è una ricorrenza pluriennale infinita, che non è richiesta dal PDF. |
| C14 | Calendario di un tour nuovo non salvato | Il calendario interno non deve consentire operazioni su altri tour mentre si sta creando un nuovo tour. | Controllo tecnico derivato da V2 p.6, C4 e V1 (1) p.6 §2 | ✅ — Prima di salvare un nuovo tour il suo calendario non è utilizzabile. **Tour e orari → Crea un tour** salva una bozza con identità propria. Aprirla dall’elenco con **Modifica** e usare la scheda **Calendario**. |

## Affiliazione e commissioni

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| A01 | Regole dentro tour | Configurazione per guide, agenzie, hotel e promoter. | V2 p.6, C4; V1 (1) p.5 | ✅ — commissionRules modificabili nella scheda tour per guide, agenzie, hotel e promoter. Tipologie ulteriori configurabili: A09. |
| A02 | Prodotto e beneficiario | Regole per free, singolo pagato e pacchetto, con eventuale affiliato specifico. | V2 p.6, C4; V1 (1) p.5 | ✅ — regole per free/paid/package e filtro facoltativo per codice affiliato. Beneficiario è l’affiliato associato alla vendita; non è implementata una ripartizione verso terzi. |
| A03 | Fisso o percentuale | Fisso per partecipante; percentuale sul totale realmente addebitato. | Utente 5 | ✅ — fisso × partecipanti oppure percentuale del totale del tour dopo gli sconti; test commissionFor. Non è richiesta la conferma manuale di incasso cash per calcolare la commissione. |
| A04 | Pacchetto differenziato | Commissione diversa da singolo senza duplicazione del totale. | V2 p.6, C4; V1 (1) p.5 | ✅ — Identificazione esplicita: un tour forma pacchetto commissionale solo con gli abbinamenti selezionati dal gestionale. Nessuna selezione = singolo; due partenze dello stesso tour non diventano pacchetto. Regole applicate alle singole quote senza duplicare totali; nessuno sconto implicito al cliente. |
| A05 | Maturazione | Dopo fine tour, prenotazione valida; esclusi cancellati e no-show. | Utente 5 | ✅ — commissionMatured controlla fine tour e stato confirmed/present; cancelled/no_show esclusi. Coerente con il criterio operativo indicato dall’utente. |
| A06 | Storno | Cancellazione azzera diritto alla commissione, anche nel riepilogo storico. | Utente 5 | ✅ — cancelReservation azzera commissionCents; riepilogo esclude cancellati. Non equivale a un sistema contabile di recupero commissioni già pagate, non descritto nei PDF. |
| A07 | Rendiconto e saldo | Separare previste/maturate/pagate e impedire pagamento anticipato. | Utente 5 | ✅ — riepilogo previste/maturate/liquidate per valuta; endpoint pay ricontrolla maturazione, impedendo la liquidazione prima della fine del tour. |
| A08 | Snapshot commissione | Regola e valore fissati alla vendita; modifiche future non cambiano lo storico. | Requisito tecnico | ✅ — regola scelta copiata in commissionRuleSnapshot e importo salvato nella prenotazione; test verifica che un cambio successivo della regola non cambi lo snapshot. |
| A09 | Altre categorie di affiliato | Supportare altre tipologie di partner oltre a guide, agenzie e hotel, come previsto nella versione estesa. | V1 (1) p.5 §4 | ✅ — Tipologie personalizzate inseribili nell’anagrafica e nelle regole del tour, con suggerimenti per i quattro tipi iniziali. Testata una associazione culturale con regola fissa e snapshot alla vendita. |

## Partner e misurazione

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| P01 | Anagrafica | Creare, modificare, eliminare, pubblicare/nascondere schede partner. | V2 p.6, C5; V1 (1) p.3 | ✅ — partnerSchema, API PUT/DELETE e PartnersManager gestiscono schede, bozza/pubblicazione ed eliminazione logica. |
| P02 | Upload partner | Foto/logo con uploader esistente. | V2 p.6, C5; V1 (1) p.3 | ✅ — ImageSourceField collegato all’immagine partner e al caricamento media esistente; immagini ammesse dallo schema. |
| P03 | Click totali | Registrare uscita per ciascun partner con destinazione validata. | V2 p.6, C5; V1 (1) p.3 | ✅ — link pubblico passa dal redirect del partner, valida la destinazione HTTPS e registra il conteggio. Bot/prefetch riconoscibili esclusi. |
| P04 | Visitatori unici | Deduplicare per partner/visitatore/giorno con consenso alle statistiche; senza consenso contare soltanto i click totali, senza identificativo. Niente IP o email nelle statistiche. | Utente 7 | ✅ — deduplica partner/giorno/visitatore con consenso; senza consenso solo click totali. Sono visitatori-giorno misurabili, non utenti unici nell’intero periodo: scelta esplicitata. |
| P05 | Storico | Persistenza eventi e dati anche se partner eliminato. | V2 p.6, C5; V1 (1) p.3 | ✅ — eliminazione logica conserva anagrafica di riferimento e conteggi storici; caso partner eliminato coperto nei test. |
| P06 | Periodo statistiche | Filtro dal/al, totali per partner e storico giornaliero. | V2 p.6, C5; V1 (1) p.3 | ✅ — filtro dal/al e aggregati giornalieri in partnerStats e PartnersManager. |
| P07 | Esportazione | CSV con periodo, partner, click e visitatori unici. | V2 p.6, C5; V1 (1) p.3 | ✅ — endpoint stats?format=csv esporta periodo, partner, totali e visitatori-giorno; caso verificato nel collaudo precedente. |

## Verifiche e consegna

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza |
|---|---|---|---|---|
| Q01 | Controlli statici | Lint e TypeScript. | Collaudo | ✅ — Lint e TypeScript superati nei collaudi precedenti. TypeScript supera anche la verifica locale della modifica che riserva gli editor al desktop. |
| Q02 | Test logiche | Categorie, valute, prezzi, commissioni, calendario e statistiche. | Collaudo | ✅ — 108 test automatici superati con `npm test` sulla versione locale riesaminata (26/11/2026). I collaudi PostgreSQL delle versioni precedenti sono riportati nelle evidenze datate. |
| Q03 | Test integrazione | API autenticate, persistenza, booking e invarianti posti. | Collaudo | ✅ — Suite HTTP su bundle produzione e PostgreSQL isolato: checkout, gestione firmata, staff/permessi, inventario, categorie, prezzi, commissioni, CMS, upload, CSV e bonifico. Email e ICS ricevuti dal server SMTP STARTTLS locale, senza invii su Internet. |
| Q04 | Build | Compilazione produzione standalone. | Collaudo | ✅ — Build standalone superata nei collaudi precedenti. Il rilascio del 22/11 è documentato sotto Q07. Il test del 26/11 ha verificato Resend sul runtime Railway (D07). |
| Q05 | Browser | Desktop/mobile: menu, filtri, booking, CMS e calendario. | Collaudo | ✅ — Suite desktop/mobile e HTTP completate anche sul nuovo CMS: doppio clic, bozze, salvataggio, foto/alt, dodici pagine, articoli storici, schede partner, permessi e conflitti. Tour e inventario confrontati prima/dopo senza modifiche. |
| Q06 | Tabella finale | Aggiornare ogni riga con ✅ oppure ❌ e motivazione/evidenza. | Utente | ✅ — Stati ricalcolati dopo la verifica di codice, etichette e comandi. Le voci ancora aperte sono riportate in fondo. |
| Q07 | Rilascio e verifica Railway | Pubblicare il codice verificato, aggiornare i dati senza perdere prenotazioni e ricontrollare il servizio remoto. | Ultima richiesta utente | ✅ — Backup privato prima della modifica; aggiornamento idempotente e transazionale dell’anteprima, servizio web sano, catalogo/CMS verificati e prenotazione/ordine preesistenti conservati. Dettagli nel rapporto di completamento. |



## Comportamento dei pagamenti

Per i tour a pagamento il checkout pubblico apre il flusso WhatsApp, con scelta fra link carta e pagamento in ufficio. Il gestionale registra l’incasso e gli eventuali rimborsi. Contanti e bonifico restano configurabili in **Tour e orari → Modifica → Prezzi → Pagamenti** per il flusso API precedente (T21).



### Correzioni delle quattro schermate — 23 novembre

- ✅ **Richiami blog:** titolo, anteprima e foto delle schede in homepage e nell’elenco blog provengono dall’articolo e non sono modificabili da quelle schede. Un clic apre l’articolo nel CMS; lì restano modificabili titolo, anteprima, copertina e contenuto.
- ✅ **Anteprima Desktop:** viewport reale di 1440 px, ridotto proporzionalmente allo spazio disponibile nel gestionale. I breakpoint e il menu sono quelli desktop; Tablet usa 768 px e Mobile 390 px. Corretto anche lo stile dei campi vuoti che rendeva visibile la foto mobile sopra quella desktop durante l’editing.
- ✅ **Offerte speciali:** dati importati dal volantino e già configurabili nel gestionale. Ora si modificano direttamente da **Contenuti → Catalogo tour**, nel riquadro «Offerte speciali tramite servizio clienti» in fondo alla pagina: doppio clic su titolo, condizioni, nomi delle offerte, prezzi e testo del pulsante. I prezzi usano un campo numerico nella valuta configurata e vengono salvati in centesimi; titolo e testo del pulsante sono ora campi configurabili.
- ✅ **Header:** logo e voci di navigazione non aprono la modifica a doppio clic; i collegamenti continuano a selezionare le rispettive pagine nel CMS.
- ✅ **A capo:** tutti i testi semplici modificabili rispettano le nuove righe nella bozza e nel sito pubblico. Eliminato il taglio dei titoli al numero di righe originario; conservate anche le righe vuote nei titoli. L’incolla nell’editor formattato converte gli a capo in interruzioni HTML.

Collaudo dedicato: menu cliccabile, schede collegate all’articolo, viewport desktop/mobile, foto desktop/mobile separate, titolo su tre righe riletto nella pagina pubblica, titoli multilinea con riga vuota su tutte le dodici pagine, modifica e persistenza dei campi delle offerte. Nessuna nuova esclusione contrattuale: E03 ed E04 restano ❌ per la struttura fissa delle sezioni.

### Revisione del layout del gestionale — 23 novembre

Le cinque schermate indicate dall’utente sono state riviste singolarmente mediante screenshot locali. Su desktop da 1100 px di larghezza occupano **100dvh**: intestazione e azioni rimangono nella schermata, i contenuti lunghi scorrono nei pannelli. Nel codice attuale, su mobile **Tour e orari**, **Articoli** e **Contenuti** sono riservati al desktop. I link diretti mostrano un avviso.

- ✅ **Prenotazione:** cliente e partecipanti su righe di tre campi; riepilogo compatto, note richiudibili, spostamento e cancellazione nel pannello laterale. Aggiornamenti, notifica, rimborso, spostamento e cancellazione conservati.
- ✅ **Tour:** schede Dati tour, Editor visuale, Card visuale, Prezzi, Prenotabilità, Orari, Commissioni, SEO e Calendario. Un solo pannello visibile alla volta su desktop; salvataggio sempre disponibile. Le sezioni conservano tutti i campi, le immagini, le categorie, le regole e le operazioni del calendario.
- ✅ **Calendario:** due righe di controlli. Selezione multipla dei tour in menu con caselle e selezione globale; periodo in tendina; date; operazione; orari; giorni in menu; capienza quando necessaria. Due azioni distinte per mostrare il periodo e applicare la modifica. Dettagli delle partenze in pannello laterale; intervalli lunghi scorrono dentro la griglia.
- ✅ **Affiliati:** creazione/modifica richiudibile, elenco a due colonne con scorrimento interno, importi raggruppati, QR e azioni conservati; report espandibili.
- ✅ **Email** (`/admin/pre-tour`): scelta del modello in tendina, testo e HTML affiancati, firma e guida alle variabili richiudibili, salvataggio visibile; coda e anteprime in pannello separato con scorrimento interno.



## Chi Siamo (documento istituzionale)

Fonte: `Chi Siamo.docx.md`. Pagina pubblica `/chi-siamo` già in menu.

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| CS01 | Pagina istituzionale Chi siamo | Testi ufficiali: 13+ anni, 100.000 clienti, «Come lavoriamo» (4 punti), «Perché scegliere noi a Praga». | Chi Siamo | ✅ — contenuti in `aboutContentPage()` / `content.ts` e rendering in `src/app/chi-siamo/page.tsx`; voci menu in `navigation.ts`. | Pubblico: aprire `/chi-siamo`. Modifica: **Admin → Contenuti → Chi siamo** (editor visuale a doppio clic su titoli/testi/benefici) → Applica bozza → Salva. |
| CS02 | Widget Tripadvisor su Chi siamo | Sezione «Dicono di noi» con widget ufficiale Tripadvisor. | Chi Siamo | ✅ — sotto «Dicono di noi» è montato `TripAdvisorOfficial`. | Nessuna azione staff se il widget globale è già configurato. Profilo/URL Tripadvisor: **Contenuti → Recensioni** (stesso widget riusato in home e schede tour). |
| CS03 | Metadati SEO Chi siamo | Meta title ≤60 e description ≤155; URL `/chi-siamo`. | Chi Siamo | ✅ — `generateMetadata` legge `seoTitle`/`seoDescription`; default allineati al documento; canonical `/chi-siamo`. | **Contenuti → Chi siamo** → pulsante **SEO** → aggiornare **Titolo SEO** e **Descrizione SEO** → **Salva** nell’intestazione. Verificare anteprima con View Source / strumento SEO. |

## Nuove Correzioni V3 — Frontend (UI/UX sito pubblico)

Fonte: `2b Nuove Correzioni FreeTourPraga V2.docx.md` (intestazione Versione 3). Calendario escluso dal documento fonte.

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V3F01 | Pulsante Accedi nell’header | Aggiungere Accedi / Accedi-Registrati accanto al carrello. | V3 §1 | ❌ — Escluso per decisione utente (D01): niente account clienti; header solo nav + carrello; `/account` 404. Non è debito da implementare finché D01 resta valida. | — |
| V3F02 | Hero home nitida | Rimuovere blur; contrasto leggibile sul testo. Overlay ammesso dove serve leggibilità. | V3 §2 + Utente 26/11 | ✅ — Nessun `blur` sulla foto. Overlay trattenuto per leggibilità del testo: su mobile obbligatorio (gradiente dedicato in `home.module.css`); su desktop resta `.hero-overlay` in `globals.css`. Decisione utente: senza overlay il testo non è accettabile. | Automatico in home. Mobile: overlay sempre presente. Desktop: overlay leggero di contrasto. |
| V3F03 | Cursore pointer su controlli card | `cursor: pointer` su «Itinerario completo» e «Prezzi per persona». | V3 §2 | ✅ — `cursor: pointer` sui riepiloghi espandibili di Itinerario completo e Prezzi, in `public-ui.module.css`. | In home, passare il mouse su **Itinerario completo** e **Prezzi**. |
| V3F04 | Posizione «Itinerario completo» | Pulsante sotto l’anteprima del testo descrittivo. | V3 §2 | ✅ — in `TourCard.tsx` il `<details>` itinerario è subito dopo la descrizione. | Testi/etichetta: **Tour e orari → Modifica → Card visuale** (doppio clic sul pulsante itinerario). |
| V3F05 | Dettagli tour a elenco puntato | Durata, lingua, ritrovo ecc. come lista. | V3 §2 | ✅ — meta card e `TourFacts` usano elenchi `list-disc` / items. | Per l’elenco personalizzato: **Tour e orari → Modifica → Card visuale** → aggiungere/modificare le informazioni della card. |
| V3F06 | Icone informative più grandi | Maggiori dimensioni e contrasto sulle icone meta card. | V3 §2 | ✅ — icone `size={20}` e stile primary su `.tourCardMeta > li > svg`. | Nessuna azione staff; verifica visiva sulle card home/catalogo. |
| V3F07 | Intensità a 5 piedini | Scala 1–5 con piedini arancio/grigio + etichette Molto basso…Molto alto. | V3 §2 | ✅ — cinque `Footprints` + etichette in `TourCard.tsx` da `walkingDifficulty`. | **Tour e orari → Modifica → Dati tour → Dati principali → Intensità del percorso**. Impostare un valore da 1 a 5 e premere **Salva tour e programmazione**. |
| V3F08 | Header scheda tour | Titolo a sinistra; durata, prezzo, lingua a destra. | V3 §3 | ✅ — layout griglia titolo / `detailOffer` in `tour/[slug]/page.tsx`. | Durata e lingua: **Tour e orari → Modifica → Dati tour → Dati principali**. Fasce tariffarie: scheda **Prezzi** del tour. |
| V3F09 | Foto scheda tour nitida | Copertina/galleria senza blur/overlay opaco. | V3 §3 | ✅ — immagine principale senza blur; eventuale `backdrop-filter` solo su frecce UI. | **Tour e orari → Modifica → Editor visuale**: doppio clic sulla copertina o sulle foto della galleria. |
| V3F10 | Micro-menu ancore | Descrizione, Itinerario, Informazioni utili, Cancellazione, Punto di incontro, Recensioni. | V3 §3 | ✅ — nav interna con le sei voci nell’ordine richiesto. | Nessuna config: in scheda tour cliccare le ancore per saltare alle sezioni. |
| V3F11 | Sezioni + box Incluso / Pratiche | Ordine come micro-menu; box Incluso/Non incluso (✅/✗) e Informazioni pratiche. | V3 §3 | ✅ — sezioni ordinate; due box con icone e elenchi incluso/escluso + note pratiche. | **Tour e orari → Modifica → Editor visuale**: doppio clic su **Servizi inclusi**, **Servizi esclusi** e **Informazioni pratiche**. |
| V3F12 | Box assistenza WhatsApp in fondo | Riquadro con link WhatsApp a fondo scheda. | V3 §3 | ✅ — box di contatto WhatsApp in fondo alla colonna principale (copy «Hai dubbi…», non titolo letterale «Assistenza Rapida»). | Impostare il recapito in **Contenuti → Dati e contatti → Numero WhatsApp (solo cifre con prefisso)**. Verificare il link in fondo alla scheda tour. |
| V3F13 | Prenotazione sticky a destra | Modulo prenotazione fisso in colonna destra durante lo scroll. | V3 §3 | ✅ — `BookingForm` / aside con `sticky top-24`. | Comportamento automatico su desktop; su mobile resta flusso verticale. |
| V3F14 | «Aggiungi al carrello» attivo | Stile pieno/attivo solo quando i campi obbligatori sono validi. | V3 §4 | ✅ — `disabled={!valid}`; abilitato usa `button-primary`. | Compilare data/orario/partecipanti nel popup: il pulsante passa da spento ad attivo. |
| V3F15 | Sconto multi-tour in carrello | Sconto pacchetto visibile e applicato nel riepilogo. | V3 §4 | ✅ — quote server calcola `discountCents`; UI mostra «Sconto multi-tour». | **Admin → Regole e tariffe → Regole commerciali**: `Sconto multi-tour (%)` e `Numero minimo di tour a pagamento diversi`. Poi nel carrello con ≥N tour pagati compare la riga sconto. |
| V3F16 | Campo Note al checkout | Rinominare «Note per la guida» in «Note». | V3 §4 | ✅ — label «Note» in `ReservationFlow.tsx`. | Nessuna azione: il checkout mostra già «Note». |
| V3F17 | Niente selettore metodo pagamento | Rimuovere dal form checkout il selettore (incluso «Pagamento sul posto»). | V3 §4 | ✅ — nessun selettore nel checkout; i pagati aprono il flusso WhatsApp. | Nessuna azione cliente; i metodi legacy restano fuori da questo form. |
| V3F18 | Free 0€ vs pagati >0€ | Free: conferma diretta. Pagati: stato attesa + popup WhatsApp. | V3 §4 | ✅ — free → `confirmed`; pagati → `pending` + dialog pagamento WhatsApp. | Free Tour: conferma e stop. Tour a pagamento: dopo «Conferma prenotazione» si apre il popup WhatsApp; in admin la pratica compare come «Nuova» fino a gestione/incasso. |
| V3F19 | Popup WhatsApp a 2 opzioni | Link carta / pagamento in ufficio con messaggi precompilati. | V3 §4 | ✅ — `BookingConfirmation` + `whatsappPayment` con i due template dinamici. | Dopo checkout pagato scegliere un’opzione: si apre WhatsApp con nome, tour, data, orario, partecipanti e importo già nel messaggio. |
| V3F20 | Informazioni utili ≠ Blog | Voce menu e pagina distinte dal Blog. | V3 §5 | ✅ — `/informazioni-utili` in header; Blog sotto «Altro». | Menu: **Contenuti → Menu e social** se serve riordinare. Pagine: `/informazioni-utili` vs `/blog`. |
| V3F21 | Griglia da 6 in Informazioni utili | Anteprime in blocchi da 6 card. | V3 §5 | ✅ storico — la griglia da 6 è stata sostituita dall’elenco a righe richiesto da v5/v6 (V5I02). | Vedi V5I02: `/informazioni-utili` è un elenco a righe, non più una griglia da 6. |
| V3F22 | Layout lista «Tutte le guide» | Elenco blog (foto laterale, titolo, estratto), non stessa griglia. | V3 §5 | ✅ — `/blog` usa `layout="list"`. | CTA «Tutte le guide su Praga» → `/blog` in layout lista. |
| V3F23 | FAQ accordion + Leggi di più | Prime 10 domande, accordion, «Leggi di più» per le successive. | V3 §5 | ✅ — `FaqAccordion`: 10 iniziali, +10 al click, risposta sotto la domanda. | Modifica editoriale: **Contenuti → FAQ e risposte**. Verifica pubblica su `/faq`. |

## Nuove Correzioni V3 — Backend (pannello di gestione)

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V3B01 | Editor contenuti card anteprima | Sezione dedicata per testi/elenco/info della card senza codice. | V3 §B1 | ✅ — Scheda **Card visuale** (`TourVisualEditor` variant card): titolo, descrizione breve, itinerario, elenco informazioni ed etichette dei pulsanti. | **Tour e orari → Modifica → Card visuale** → doppio clic sui campi → **Salva tour e programmazione**. Verifica in home/catalogo. |
| V3B02 | Nascondi / Mostra tour | Bozza vs pubblicato senza perdere configurazione. | V3 §B1 | ✅ — toggle `published` «Nascondi»/«Mostra» in lista e impostazioni tour. | **Tour e orari** → usare **Nascondi** o **Mostra** nella riga. Nella scheda: **Modifica → Dati tour → Dati principali → Pubblica sul sito**. |
| V3B03 | Elimina soft con doppia conferma | Soft delete / archiviazione; storico prenotazioni intatto. | V3 §B1 | ✅ — due `confirm()` poi `archivedAt`; prenotazioni storiche conservate. | **Tour e orari → Elimina** → confermare due volte. Il tour esce dall’elenco operativo; le vendite passate restano. |
| V3B04 | Sconto multi-tour lato server | Regola commerciale applicata al totale carrello/ordine. | V3 §B2 | ✅ — `quote` in `booking.ts` applica `multiTourPercent` / `minimumTours`. | **Regole e tariffe → Regole commerciali**. Il server ricalcola lo sconto al preventivo e al checkout. |
| V3B05 | Hold «attesa pagamento» + scadenza | Prenotazione pagata non scala posti come saldati; scadenza configurabile libera i posti. | V3 §B2 | ✅ — checkout pagato → `pending` WhatsApp con `paymentHoldMinutes` (default 120); allo scadere `releaseExpired` libera posti + email scaduta. Lo stato staff «In attesa pagamento» (`awaiting_payment`) non scade in automatico (test dedicato). | **Regole e tariffe → Regole commerciali → Scadenza messaggio WhatsApp (minuti)**. Flusso: cliente conferma → popup WA; se non gestita entro N minuti i posti tornano liberi. |
| V3B06 | Email separate per tour del pacchetto | Un’email di conferma per ciascun tour dell’ordine. | V3 §B2 | ✅ — Una notifica di conferma per ciascuna prenotazione/PNR. I tour in attesa del pagamento WhatsApp ricevono la conferma al passaggio allo stato Confermata. | **Admin → Email** (`/admin/pre-tour`) → **Conferma cliente** per modificare il template. |
| V3B07 | Avviso conferma presenza WhatsApp | In tutte le email di conferma, avviso che il team contatterà su WhatsApp. | V3 §B2 | ✅ — notice WhatsApp inserita nel corpo text/html delle conferme. | Verificare una conferma ricevuta. L’avviso è aggiunto automaticamente dal codice al testo e all’HTML. |
| V3B08 | Formattazione avanzata dei testi editoriali | Font, dimensione, H1–H3, colori, allineamento, elenchi e link dove il contenuto li supporta. La struttura delle pagine, i prezzi e i dati gestionali seguono i rispettivi controlli. | V3 §B3 + chiarimento utente | ✅ — Nei campi editoriali la barra applica font, dimensione, colore, evidenziazione, grassetto, corsivo, sottolineatura e link alla selezione, anche a un solo carattere. Nei testi lunghi offre anche paragrafo, H1–H3, allineamento ed elenchi puntati o numerati. Verificati selezione, salvataggio e rendering pubblico in homepage e scheda tour. | Aprire un testo in **Contenuti**, **Articoli** o **Tour e orari → Modifica → Editor visuale**. Selezionare una lettera o una parola nel campo e usare la barra. Nei testi lunghi, i comandi di struttura agiscono sul paragrafo. |
| V3B09 | Prezzi digitabili senza zero bloccato | Campo prezzo svuotabile in digitazione; 0 solo come placeholder o on blur. | V3 §B4 | ✅ — `PriceInput` conserva il valore nel buffer di digitazione. Svuotando un prezzo obbligatorio il campo resta vuoto e mostra il placeholder 0. Se si esce senza digitare un importo, compare 0. | **Tour e orari → Modifica → Prezzi**. Svuotare **Prezzo (EUR)** o **Prezzo (CZK)**, quindi digitare il nuovo importo. |
| V3B10 | Panoramica prima voce menu | Dashboard in cima al menu laterale, non in fondo. | V3 §B5 | ✅ — prima entry menu: `["", "Panoramica", LayoutDashboard]`. | Aprire `/admin`: prima voce = Panoramica. |
| V3B11 | Metriche Panoramica (ultimo step) | Filtri Oggi/Ieri/Domani/intervallo sui 4 KPI; layout filtri con titolo; sezioni partenze/richieste. | V3 §B5 + Utente 26/11 | ✅ — Filtri KPI (Oggi/Ieri/Domani + Dal/Al) in header accanto al titolo (desktop compact a dx; mobile sotto titolo su 2 righe). Agiscono solo sui 4 KPI (prenotazioni/vendite/incassato/da incassare) per data partenza Prague. Invertite Prossime partenze e Richieste. | **Admin → Panoramica**: usare i filtri in alto; i riquadri KPI si aggiornano subito. |
| V3B12 | Clausola di cancellazione testo libero | Clausola editabile a mano (globale e per tour); tour vuoto → globale; testo usato in scheda, checkout, email e termini. Ore/% restano solo per calcolo rimborso/spostamento. | Utente 26/11/2026 | ✅ — Clausola globale e per tour. Il campo vuoto nel tour usa il testo globale. La clausola della prenotazione viene salvata nello snapshot `booking.policy`. | **Regole e tariffe → Regole commerciali → Clausola di cancellazione (globale)**. Per il singolo tour: **Tour e orari → Modifica → Prenotabilità → Policy di cancellazione → Clausola di cancellazione (tour)**. |

## Specifiche v5 / v6 — Frontend, calendario, prenotazioni, supporto

Fonti: `specifiche-freetourpraga-it-v5.md` e `specifiche-freetourpraga-it-v6.md` (novembre 2026). **v6 non introduce requisiti funzionali nuovi** rispetto a v5: conferma gli stessi 8 capitoli, fissa il sito di riferimento operativo `https://it.freetourpraga.com/`, e chiarisce i mockup della casella giorno (checkbox · giorno · righe `HH:MM SIGLA n/m` · semaforo) e del filtro tour («Filtra tour» accanto a «Programmazione», «Tutti i tour» + `Sigla / Titolo` con checkbox e ordine FT…PRIV). Gli ID restano `V5*` per non duplicare la matrice; dove sotto si cita «v5 §…» vale anche v6.

### 1. Home – struttura card

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5H01 | Ordine elementi card | Foto → Titolo+intro → Itinerario completo → Fasce tariffe → Dettagli operativi (durata, lingua, ritrovo, intensità, giorni, orario/anticipo, guida). | v5 §1 | ✅ — ordine in `TourCard`: foto, titolo, introduzione, itinerario, tendina Prezzi, poi durata, lingua, ritrovo, intensità, giorni, orario con anticipo e guida (solo se valorizzata). | In home, aprire una card. La riga Guida si modifica in **Tour e orari → Modifica → Card visuale** (doppio clic). Se vuota, la riga non compare (la lingua è già in meta). |
| V5H02 | Card anteprima modificabili | Tutti i testi/info della card editabili dal gestionale. | v5 §1 | ✅ — **Card visuale** modifica titolo, descrizione breve, itinerario, elenco informazioni ed etichette. I dati condivisi si modificano nelle altre schede. | **Tour e orari → Modifica → Card visuale**. Per la foto card: doppio clic sull’immagine. Per le fasce: scheda **Prezzi**. Premere **Salva tour e programmazione** e controllare la card in home. |
| V5H03 | Tendina «Prezzi» in fondo | Dopo le info operative, pulsante «Prezzi» che apre la tendina (non lista sempre aperta). | v5 §1 | ✅ — La tendina Prezzi è chiusa al caricamento e segue l’ordine di V5H01, subito dopo l’itinerario. Il prezzo in evidenza rimane in fondo alla card. | Cliccare **Prezzi** sulla card per aprire o chiudere la tendina. Etichetta: **Tour e orari → Modifica → Card visuale** (doppio clic sul pulsante prezzi). |

### 2. Informazioni utili e Blog

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5I01 | Contenuti non mescolati | Dataset/elenco Info utili distinto dal Blog. | v5 §2 | ✅ — ogni articolo ha `channel`: `blog` (default, anche in home) oppure `useful` (solo `/informazioni-utili`). Gli articoli già pubblicati restano nel blog finché non si cambia elenco. | **Articoli** (`/admin/contenuti/articoli`) → aprire un articolo → **Elenco → Informazioni utili** → **Pubblica articoli**. Verificare che compaia in `/informazioni-utili`. |
| V5I02 | Info utili a righe | Layout a righe come il Blog (non griglia a card). | v5 §2 | ✅ — `/informazioni-utili` usa `layout="list"` (foto laterale, titolo, estratto), come `/blog`. Supera la griglia da 6 di V3F21. | Dopo aver assegnato almeno una guida (V5I01), aprire `/informazioni-utili`: ogni voce è una riga, non una card in griglia. |
| V5I03 | Blog a righe coerente | Blog in elenco ordinato a righe. | v5 §2 | ✅ — `/blog` usa `layout="list"` (foto laterale, titolo, estratto), come `/informazioni-utili` (V5I02). | Pubblico: `/blog` o **Tutte le guide su Praga**. Gestionale: **Articoli → Elenco → Blog** nella scheda dell’articolo. |

### 3. Calendario – navigazione date

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5C01 | Settimana europea | Intestazione Lunedì–Domenica. | v5 §3 | ✅ — header `Lun…Dom` e offset `(getUTCDay()+6)%7` in `OperationalCalendar`. | **Admin → Calendario** (o calendario interno tour): la griglia parte da lunedì. |
| V5C02 | Salto anni + «Oggi» | Reach diretto anni lontani (es. 2045) e pulsante «Oggi». | v5 §3 | ✅ — campo Anno (4 cifre, 2020–2099) e pulsante Oggi nella barra del calendario. Le frecce mese restano. | **Admin → Calendario**: scrivere `2045` in Anno (il mese salta a quell’anno). **Oggi** riporta al mese corrente e toglie il filtro settimanale/weekend. |
| V5C03 | Selettore range dates | Range Dal/Al accanto a mese/anno in toolbar. | v5 §3 | ✅ — Dal e Al sono nella toolbar, accanto ad Anno e Oggi. Un intervallo valido (massimo un anno) aggiorna subito la griglia, senza pulsante Applica. | Impostare Dal e Al a cavallo di due mesi: la griglia mostra quel periodo. Un intervallo oltre un anno mostra l’avviso e non cambia la vista. |
| V5C04 | Filtri Settimanale / Weekend | Scorciatoie Lun–Ven e Sab–Dom in filtri superiori. | v5 §3 | ✅ — pulsanti Settimanale (lun–ven) e Weekend (sab–dom). I giorni fuori filtro restano in griglia, senza righe e attenuati. Un secondo click toglie il filtro. | **Admin → Calendario**: Settimanale lascia le righe solo da lunedì a venerdì. Weekend solo sabato e domenica. |

### 4. Layout casella giorno (mockup v5)

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5D01 | Checkbox circolare top-left | Selezione multipla date dalla griglia → caricate in programmazione massiva. | v5 §4 + mockup | ✅ — checkbox circolare in alto a sinistra. Il click sul resto della casella apre ancora il giorno. I giorni spuntati entrano in Programmazione come date esplicite (i giorni in mezzo non vengono toccati). | Spuntare due giorni non consecutivi, aprire **Programmazione**: compare «Solo i N giorni spuntati in griglia», attivo di default. Applicare un’azione e verificare che il giorno in mezzo non cambi. |
| V5D02 | Numero giorno top-right | Giorno in alto a destra della casella. | v5 §4 + mockup | ✅ — il numero è in alto a destra della casella; la checkbox è in alto a sinistra. | **Admin → Calendario**: il numero del giorno sta in alto a destra, anche su mobile. |
| V5D03 | Righe partenza sigla+posti | Ogni partenza: `HH:MM SIGLA prenotati/max` (es. `10:00 FT 15/50`) con colore semaforo per riga. | v5 §4 + mockup | ✅ — una riga per partenza, `HH:MM SIGLA prenotati/max`. Verde = posti ok, giallo = meno del 20% liberi, rosso = chiuso o esaurito. | Con almeno un tour selezionato, leggere una casella con partenze. La sigla è quella del tour (V5N01). Passare il mouse sulla riga mostra il testo intero se è troncato. |
| V5D04 | Altezza proporzionale | Celle che si restringono al contenuto filtrato, non riquadri alti vuoti. | v5 §4 | ✅ — l’altezza segue le righe visibili. La pagina admin resta a 100dvh; se il mese è lungo scorre solo la griglia. | Confrontare un giorno vuoto (casella bassa) con un giorno che ha più partenze (casella più alta). Su telefono la pagina non scorre fuori dal calendario. |

### 5. Semaforo disponibilità

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5S01 | Verde / Giallo / Rosso | Verde = posti ok; Giallo = pochi posti (es. &lt;20% liberi); Rosso = chiuso o sold out. | v5 §5 | ✅ — `slotTone()` applica verde alle partenze disponibili, giallo quando resta meno del 20% dei posti e rosso alle partenze chiuse o esaurite. | Automatico in **Calendario**: legenda Aperto / Ultimi / Chiuso. Nessuna config staff richiesta per i colori base. |

### 6. Nomenclature e ordine filtro tour

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5N01 | Filtro `SIGLA / Titolo` | «Tutti i tour» in cima; voci `SIGLA / Titolo` con checkbox; ordine fisso FT, FC, CM, CN, PE, CB, MS, CI, TZ, PRIV; UI «Filtra tour» accanto a «Programmazione» (mockup v6). | v5/v6 §6 | ✅ — pulsante **Filtra tour** accanto a Programmazione. In cima «Tutti i tour», poi `SIGLA / Titolo` con checkbox, ordine FT, FC, CM, CN, PE, CB, MS, CI, TZ, PRIV. Sigla vuota = dedotta da slug/titolo; FC non è assegnata da sola e si imposta a mano. | **Calendario → Filtra tour**. Per cambiare la sigla: **Tour e orari → Modifica → Orari → Sigla e riepilogo → Sigla calendario** (2–6 caratteri), poi **Salva tour e programmazione**. |

### 7. Tour, Prenotazione, Email, Editor

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5T01 | Tipo Free / A pagamento | Selettore esplicito in creazione/config tour. | v5 §7 | ✅ — Il selettore Tipo di tour offre A pagamento e Free tour · offerta libera. | **Tour e orari → Modifica → Prezzi → Tipo di tour**, poi **Salva tour e programmazione**. |
| V5T02 | Max partecipanti senza 0 bloccato | Campo vuoto/placeholder oppure select-all on focus; no default 0 né `025`. | v5 §7 | ✅ — `CountInput` su partecipanti per prenotazione e su posti per partenza: al focus seleziona tutto, si può svuotare mentre si digita, gli zeri iniziali non restano, lo 0 non viene salvato. | **Tour e orari → Modifica → Prenotabilità → Limiti e anticipo di prenotazione → Partecipanti per prenotazione**. Per la capienza: **Orari → Programmazione → Posti per partenza**, con la programmazione attiva. |
| V5T03 | Azione rapida pagamento colorata | Bottone Rosso=Non pagato, Giallo=Contattato, Verde=Pagato; click diretto. | v5 §7 | ✅ — tre pulsanti che salvano subito: rosso `pending` (anche se era `failed`), giallo `contacted`, verde `paid`. Prenotazioni free (`not_required`) e rimborsate restano un’etichetta, senza i tre pulsanti. | **Admin → Prenotazioni** → aprire una prenotazione a pagamento. Cliccare **Contattato**: il pulsante giallo resta premuto anche riaprendo la pratica. **Pagato** su un hold WhatsApp conferma la prenotazione, come prima faceva il select. |
| V5T04 | Email → WhatsApp modifica/annulla | In conferma: pulsante che apre template WhatsApp precompilato per richiedere modifica/annullo. | v5 §7 | ✅ — variabile `{whatsappModifica}` (wa.me con nome, PNR, tour, data e ora). È nei template Confermata e Aggiornata. Se un template già salvato non la contiene, la mail di conferma o aggiornamento aggiunge comunque il link. Il link firmato di gestione resta. | **Admin → Email** (`/admin/pre-tour`) → **Conferma cliente → Variabili**. La scheda elenca `{whatsappModifica}`, da inserire nel testo o nell’HTML del modello. |
| V5T05 | Editor testuale backend | Formattazioni base (grassetto, corsivo, ecc.) su pagine e tour. | v5 §7 | ✅ — Barra condivisa per la formattazione dei testi editoriali. I comandi di V3B08 sono disponibili secondo il tipo di campo. | Selezionare il testo nel campo, anche una sola lettera, e usare la barra. |

### 8. Supporto e storico modifiche

| ID | Modifica | Comportamento / criterio di accettazione | Fonte | Stato ed evidenza | Come farlo (se ✅) |
|---|---|---|---|---|---|
| V5U01 | Allegati in supporto | Upload screenshot/video brevi con nome file e rimozione pre-invio. | v5 §8 | ✅ — fino a 4 file prima dell’invio: screenshot JPEG/PNG/WebP (max 5 MB) o video MP4/WebM (max 8 MB). Nome visibile e pulsante Rimuovi. In elenco il nome apre il file. | **Supporto → Apri ticket**. Nella finestra **Nuovo ticket**, allegare uno screenshot, verificare il nome e provare **Rimuovi** prima di inviare. |
| V5U02 | Storico modifiche dedicato | Modale/vista: data/ora, utente, tour/data/prenotazione, old vs new. | v5 §8 | ✅ — modale **Storico** nel calendario e **Storico modifiche** nella prenotazione: data/ora di Praga, utente, tour, data, PNR, testo prima/dopo. Le operazioni di calendario, salvataggio tour e aggiornamento prenotazione scrivono prima e dopo. Le voci vecchie restano senza diff. | Cambiare lo stato pagamento di una prenotazione, poi **Storico modifiche**: la riga mostra prima e dopo. Dal calendario, dopo un’operazione, **Storico** elenca la stessa modifica. |

## Voci ancora segnate con ❌

| Righe | Cosa manca |
|---|---|
| `E03`, `E04` | Fuori contratto: aggiunta, rimozione e riordino delle sezioni nascosti. |
| `V3F01` | Accedi/Registrati in header: escluso da D01. |
| `D06` | Palette e set di icone definitivi del committente. |
| `N09` | Indirizzo reale dell’ufficio («previo appuntamento»). |

TikTok, YouTube e LinkedIn usano ancora link generici di piattaforma, aggiornabili in **Contenuti → Menu e social**. Gli articoli già pubblicati rimangono nel blog finché non si cambia **Elenco** in **Articoli**. Per la sigla FC usare il percorso di V5N01. Il sito pubblico WordPress e l’anteprima Railway sono ambienti distinti.
