# Prompt base — Mobile Admin UI (MV)

Usa questo documento come brief di partenza per sistemare sezioni admin/gestionale in **mobile responsive**.  
Desktop (DV) resta invariato salvo dove è scritto esplicitamente **MV + DV**.

Breakpoint di riferimento usato nel progetto: **`max-width: 700px`** = Mobile View (MV).

---

## Obiettivo generale

Su mobile ogni schermata lista/gestione deve:

1. Occupare **esattamente l’altezza utile del viewport** (niente page scroll “vuoto”, niente overflow di pagina).
2. Avere **scroll solo dentro l’area lista/tabella**.
3. Essere **compatta, leggibile, senza clutter**.
4. Usare **righe collassate espandibili** quando la riga ha molti dettagli/azioni.
5. Sostituire le **pill di stato** con **pallini colorati**.
6. Far sì che **search e filtri aggiornino subito** i risultati (nessun bottone “Applica” / “Aggiorna” per filtrare).

---

## 1. Layout viewport (100vh / 100dvh)

### Regola
- Il contenuto principale della sezione deve riempire l’altezza disponibile.
- **Non meno** di un viewport pieno (niente “buco” bianco sotto).
- **Non di più** (niente scroller sulla pagina intera).

### Implementazione tipica
- Shell admin: `height: 100dvh; max-height: 100dvh; overflow: hidden`.
- Main content sotto header mobile fisso:  
  `height: calc(100dvh - <altezza-header-mobile>); overflow: hidden; display: flex; flex-direction: column`.
- Header pagina (titolo + azioni): `flex-shrink: 0`.
- Stage / contenuto: `flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column`.
- Lista/tabella: `flex: 1; min-height: 0; overflow: auto` (+ `scrollbar-width: thin`, `-webkit-overflow-scrolling: touch`).

### Attenzione
- Usa `100dvh` (non solo `100vh`) per mobile browser chrome.
- Conta l’header sticky/hamburger nella sottrazione altezza.
- Riduci padding bottom eccessivi su MV che “mangiano” spazio utile.

---

## 2. Header pagina: titolo + azioni icona

### Regola (MV; su alcune sezioni anche DV)
- Togli il bottone testo **«Aggiorna»** / refresh generico dalla sezione.
- Azioni primarie della pagina (es. **Esporta**, **Nuovo / +**) diventano **solo icone in un box**, **senza testo**.
- Stanno sulla **stessa riga del titolo**, allineate a **estrema destra**.
- Dimensione / altezza delle icone **allineata al titolo** (non bottoni enormi sotto il titolo).

### Esempi
- Esporta CSV → icona download in box verde (o stile brand export).
- Nuovo partner / aggiungi → icona `+` in box primary/arancio.
- Non lasciare bottoni testo tipo «Esporta CSV», «Nuovo partner», «Aggiorna» nell’header MV.

### DV
- Dove richiesto esplicitamente: **stesso pattern icone** anche in desktop (titolo a sinistra, icone a destra, niente Aggiorna).
- Dove non richiesto: desktop può restare con bottoni testo.

---

## 3. Switch / tab (Partner–Statistiche, Template–Coda, ecc.)

### Regola MV
- Lo switch/tab deve essere **full width**.
- Le opzioni interne devono essere **equamente distribuite e centrate** (`flex: 1; text-align: center`), non ammassate a sinistra con vuoto a destra.

### Dove vale
- Tab di lista (es. Partner / Statistiche).
- Tab dentro drawer/modal di edit (es. Dati partner / Foto o logo; Testo / HTML / Variabili).

### Extra
- Se «Nuovo …» era accanto allo switch, su MV lo sposti nell’header come icona `+`, e lo switch resta da solo a tutta larghezza.

---

## 4. Search + filtri

### Pattern A — search + select sulla stessa riga
- Riduci la larghezza del selettore (stato, ecc.).
- Allarga la searchbar nello spazio liberato.
- Esempio: search `flex: 1`, select `max-width` stretta / `flex: 0 0 auto`.

### Pattern B — due righe (date / filtri “pesanti”)
- **Riga 1:** filtri periodo o select principali a **tutta larghezza** (es. Dal + Al affiancati full width).
- **Riga 2:** searchbar a **tutta larghezza**.

### Pattern C — coda / richieste
- **Riga 1:** select stato full width.
- **Riga 2:** search full width.

### Comportamento obbligatorio
- Search e filtri devono **modificare subito i risultati** al change/input.
- Niente debounce obbligatorio che “sembra rotto”; niente dipendenza da bottone Aggiorna.
- Preferisci stato locale del componente lista per re-render immediato (evita di far dipendere il filtro da un parent enorme se rallenta).

### Default filtri (se richiesto)
- Esempio Richieste: default select = **«Da gestire»** (sia MV che DV).
- Togli pill riepilogo tipo **«7 da gestire»** se ridondante col filtro.

---

## 5. Lista: niente paginazione, scroll interno

### Regola
- Su MV (e dove richiesto anche DV): **togli la paginazione**.
- Mostra **tutti gli elementi** filtrati.
- Lo **scroll è interno** al contenitore lista/tabella, non alla pagina e non (di default) al modal intero.

### Tabella classica
- `overflow: auto` sul wrapper tabella.
- Header sticky (`thead th { position: sticky; top: 0; z-index: 1; }`) consigliato.

### Storico / sotto-tabelle in modal
- Se la tabella ha molte righe: **scroll interno alla tabella**, non scroll del modal.
- Il modal ha altezza massima fissa; la tabella cresce e scrolla dentro.

---

## 6. Colonne tabella (quando resta una table)

### Nascondi colonne non essenziali su MV
- Lascia visibili solo ciò che serve a scan rapido.
- Esempio partner: solo **Nome**, **Stato**, **Click**, **icone edit/delete**.
- Nascondi Contatto, Visitatori-giorno, ecc.

### Larghezze
- **Colonna nome più larga** delle altre, così si legge.
- Colonne numeriche/stato più strette.

### Intestazioni lunghe
- Su MV usa **parole singole corte** (non “Click totali”, “Visitatori-giorno”, “Senza consenso”).
- Esempi: `Click`, `Visite`, `Anon`.
- Desktop può tenere le label lunghe; su MV mostra la versione corta (dual label full/short).

---

## 7. Stato: no pill, solo pallino colorato

### Regola MV
- Togli badge/pill testuali tipo «Pubblicato», «Attivo», «Da gestire», «Testo + HTML», «Inviata».
- Metti **solo un pallino** (`~10px`, `border-radius: 50%`) **a destra del nome/titolo**.

### Eccezione — stato modificabile inline
- Se lo stato si cambia **direttamente dalla riga** (menu/select/pill cliccabile, es. Prenotazioni con `StatusMenu`), **lascia la pill/menu editabile**: non sostituirla col solo pallino.
- Il pallino resta il default per stati **sola lettura**.

### Colori tipici
- Attivo / pubblicato / ok / inviata → **verde**
- Bozza / sospeso / neutro / in coda → **grigio**
- Da gestire / warning → **arancio/ambra**
- Errore / failed → **rosso**
- In elaborazione → **ambra**

### Accessibilità
- `title` + `aria-label` con lo stato testuale sul pallino.

### Dove
- Nella riga lista collassata, accanto al nome.
- Nei modal dettaglio: pallino accanto al **titolo**, non pill nel footer.

---

## 8. Righe collassate espandibili

### Regola MV (e sezioni dense anche DV se richiesto)
- Lista = **un unico contenitore** (tabella o “table-div”), non card sparse.
- Ogni riga parte **collassata**.
- Freccia **verso il basso** (`ChevronDown`) a destra; ruota 180° quando aperta.
- Tap sulla riga/header espande/chiude.

### Collassata (minimo)
- Nome (+ pallino stato) + freccia  
  (eventuale azione rapida tipo QR solo se già essenziale)

### Espansa
- Meta secondarie (email, codice, date, importi, link, messaggio preview, ecc.)
- Azioni in basso

### Bottoni azioni nell’expand
- I bottoni (es. Modifica / Sospendi / Liquida, Dettagli / Gestita) devono **prendere insieme tutta la width** disponibile.
- Tipico: `display: flex; width: 100%` e ogni bottone `flex: 1 1 0`.

---

## 9. Sezioni form collassabili (anche DV se richiesto)

### Regola
- Blocchi secondari tipo «Aggiungi un orario», «Azione su tutte le partenze» diventano `<details>` / accordion.
- Partono **chiusi**.
- Summary = titolo + freccia giù.
- Vale **MV e DV** quando richiesto.

### Jump links / nav rapida
- Se esistono bottoni che scrollano a queste sezioni, all’click devono anche **aprirle**.

---

## 10. Testi / diciture da togliere su MV

Rimuovi o nascondi su mobile:

- Note lunghe in fondo alle liste (es. spiegazioni statistiche, “Scegli un modello per modificarlo…”).
- Pill conteggio ridondanti («7 da gestire») se il filtro già esprime lo stesso concetto.
- Bottoni Aggiorna / refresh generici.
- Su Email MV: anche l’icona refresh «Elabora coda» accanto alle tab (se sembra un Aggiorna e non serve in header).

Desktop può tenere hint e bottoni operativi testuali dove ha senso.

---

## 11. Modal / drawer dettaglio su MV

### Altezza
- Per dettagli con molto testo (es. messaggio richiesta): modal a **~80% height** (`height: 80dvh; max-height: 80dvh`).
- Il campo messaggio/textarea usa lo spazio rimanente (`flex: 1; min-height` adeguata).

### Header modal
- Titolo + **pallino stato** accanto al titolo.
- Niente pill stato nel footer.

### Footer modal
- Azione primaria (es. «Segna come gestita») a larghezza piena o dominante.
- Chiudi con X in alto a destra.

### Tabelle dentro modal
- Scroll interno alla tabella, non al modal intero, se ci sono molte righe.

### Tab editor nel modal
- Full width, opzioni centrate/equispaziate (come gli switch di lista).

---

## 12. Paginazione (solo se ancora presente temporaneamente)

Se per qualche motivo resta una paginazione breve su MV:

- Centrata orizzontalmente.
- Formato compatto: **`< 1/2 >`** (icone prev/next senza box/bordo).
- Preferenza forte del prodotto: **meglio nessuna paginazione**, lista completa + scroll interno.

Su DV, se richiesto «come MV»: togli paginazione anche lì e usa scroll interno.

---

## 13. Checklist per ogni nuova sezione lista admin

Copia e spunta:

- [ ] Page shell MV a altezza viewport, no page scroll
- [ ] Scroll solo nella lista/tabella
- [ ] Niente paginazione su MV (lista completa)
- [ ] Niente bottone Aggiorna (e niente refresh ambiguo in header)
- [ ] Azioni header = icone in box, stessa riga del titolo, a destra
- [ ] Switch/tab full width con opzioni centrate
- [ ] Search + filtri layout MV (una o due righe full width come da pattern)
- [ ] Filtri/search aggiornano subito i risultati
- [ ] Default filtro impostato se richiesto (es. “Da gestire”)
- [ ] Niente pill stato: solo pallino colorato a dx del nome (salvo stato editabile inline, es. Prenotazioni)
- [ ] Righe collassate + freccia giù; expand con dettagli
- [ ] Bottoni azioni expand a tutta larghezza
- [ ] Colonne ridotte / label corte / nome più largo (se table)
- [ ] Diciture lunghe / hint di fondo nascoste su MV
- [ ] Modal dettaglio: 80dvh se c’è testo lungo; pallino sul titolo; no pill footer
- [ ] DV invariato salvo richieste esplicite MV+DV

---

## 14. Pattern CSS / struttura ricorrenti

### Classe pagina
Aggiungi una classe dedicata alla sezione (`admin-*-page`) per isolare regole 100dvh senza rompere altre pagine.

### Mobile list vs desktop table
- DV: table + eventuale paginazione (se ancora voluta).
- MV: lista accordion (`article` + toggle + body), niente table densa.

### Evita bug CSS classici
- Non mettere `display: none` **dopo** un `@media (max-width)` che fa `display: block` sulla stessa classe: in mobile la lista sparisce.
- Preferisci:
  - default nascosto solo in `@media (min-width: 701px)`, oppure
  - default visibile e hide solo desktop.

### MatchMedia JS
- `matchMedia("(max-width: 700px)")` per scegliere rendering mobile/desktop.
- Su switch a desktop, resetta riga espansa.

---

## 15. Prompt operativo (copia-incolla per un agente)

```text
Sistema la sezione admin [NOME] in mobile (max-width: 700px).
Desktop resta identico salvo dove indico MV+DV.

Obbligatorio su MV:
1) Contenuto a 100dvh utile: no page scroll; scroll solo dentro lista/tabella.
2) Togli Aggiorna / refresh generici dall’header.
3) Azioni Esporta/Nuovo (se presenti) = sole icone in box, stessa riga del titolo a destra, size coerente col titolo.
4) Switch/tab full width con opzioni equispaziate e centrate.
5) Search + filtri: layout pulito (select stretta + search larga, oppure filtri sopra e search sotto full width). Aggiornamento risultati immediato al change.
6) Niente paginazione: tutti gli item filtrati, scroller interno.
7) Righe collassate espandibili con freccia giù; in expand i bottoni azioni occupano tutta la width.
8) Niente pill di stato: solo pallino colorato a destra del nome (e nel modal accanto al titolo). Eccezione: se lo stato è modificabile inline dalla riga (es. Prenotazioni), tieni la pill/menu editabile.
9) Nascondi hint/diciture lunghe di fondo.
10) Se c’è modal dettaglio con testo lungo: height ~80dvh, messaggio più leggibile, pill footer rimossa.

Se la sezione ha tabella:
- Nascondi colonne non essenziali
- Label colonne corte su MV
- Colonna nome più larga

Se la sezione ha blocchi form secondari densi:
- Collassabili con freccia (anche DV se richiesto), partono chiusi.

Consegna: solo MV cambia (o MV+DV dove specificato); niente regressioni desktop non richieste.
```

---

## 16. Esempi di sezioni già sistemate con questo brief

- Partner Europa (lista + statistiche + drawer)
- Calendario giorno (sezioni Aggiungi orario / Azione bulk collassabili MV+DV)
- Affiliati (da card a lista accordion MV)
- Email Template/Coda
- Richieste (default filtro “Da gestire”, modal 80dvh)
- Prenotazioni (pill stato editabili OK; no pager MV; shell 100dvh)
- Tour e orari (lista accordion MV)
- Account staff / Supporto

Usa questi come riferimento di comportamento, non come vincolo di markup identico.
