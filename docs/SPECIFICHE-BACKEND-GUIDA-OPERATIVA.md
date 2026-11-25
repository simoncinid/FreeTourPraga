# FreeTourPraga — Specifiche backend vs versione attuale

Guida operativa: per ogni punto delle specifiche, **stato** e **passaggi concreti** da fare oggi nel gestionale.

**Accesso tipico:** https://web-production-f3beeaff.up.railway.app/accesso (oppure locale http://localhost:3100/accesso) → menu laterale.

**Legenda stato**

| Simbolo | Significato |
|--------|-------------|
| ✅ | Fattibile così com’è |
| ⚠️ | Parziale: c’è in parte, oppure il codice c’è ma l’UI è nascosta |
| ❌ | Non c’è (o solo via configurazione tecnica, non dal gestionale) |

---

## Verdetto sintetico

**Quasi tutto è fattibile con la versione attuale.**

Gap principali:

1. Scorciatoie data / intervallo vista / selezione multi-giorno sulla griglia → **nascoste in UI** (codice presente, commentato).
2. ~~Registrazione utenti staff dal gestionale~~ → **risolto**: pagina **Account staff** (`/admin/utenti`).
3. Feed storico completo sul calendario → solo riga «Ultima modifica» nel drawer del giorno (audit globale fuori Fase 1).

Il resto (calendario, programmazione, tutela prenotazioni, scheda tour, offerte, commissioni, supporto ticket, email posti bassi) è operativo.

---

# SEZIONE 1 — Pagina principale Calendario

Vai a: **Calendario** (`/admin/calendario`).

---

## 1.1 Selettore superiore, navigazione, fuso orario

### Selettore perimetro tour (1 / più / tutti) — ✅

1. Apri **Calendario**.
2. In alto apri il menu tour (etichetta tipo «Tutti i tour» o «N tour»).
3. Per **tutti**: lascia/spunta tutti i tour (o usa il controllo «Tutti»).
4. Per **più tour**: spunta solo quelli che ti servono.
5. Per **un solo tour**: spunta solo quel tour (o deseleziona gli altri).
6. La griglia e le azioni successive si applicano solo ai tour selezionati.

### Collegamento rapido «Modifica impostazioni tour» — ✅

1. Nel selettore lascia **un solo tour** attivo.
2. Compare il pulsante **Modifica impostazioni tour**.
3. Cliccalo → apri la scheda completa di quel tour (`/admin/tour/{slug}`).

### Frecce mese / anno — ✅

1. In **Calendario**, usa **Mese precedente** (`<`) e **Mese successivo** (`>`).
2. Il titolo (es. «Novembre - 2026») e le celle si aggiornano di conseguenza.
3. Il fuso usato è **Europe/Prague** (date/orari di Praga).

### Filtri rapidi (Oggi, Ieri, Questo mese, …) — ⚠️

**Stato:** previsti in specifica; nel codice ci sono, ma **oggi sono commentati** e non compaiono in UI.

**Cosa puoi fare oggi al posto loro**

1. Usa le frecce mese per spostarti.
2. Per periodi lunghi (maggio–settembre, mese, anno) usa il drawer **Programmazione** (vedi 1.4), non i filtri sulla griglia.

### Intervallo di date personalizzato come filtro vista griglia — ⚠️

**Stato:** campi Dal/Al + «Intervallo» esistono nel codice ma sono **nascosti** insieme alle scorciatoie.

**Cosa puoi fare oggi**

1. Apri **Programmazione**.
2. Imposta **Dal** e **Al** lì.
3. Applica l’operazione sull’intervallo (non filtra la sola vista griglia, applica regole/azioni).

### Fuso orario Europe/Prague — ✅

Nessun passaggio utente: date, orari e cut-off usano Praga lato sistema.

---

## 1.2 Celle del calendario (semaforo, turni, notifiche)

### Coerenza dati in tempo reale — ✅

1. Seleziona i tour in alto.
2. Ogni cella mostra orari / posti / stato relativi a quella selezione.
3. Il calendario si aggiorna da solo (poll circa ogni 10 secondi) e subito dopo un salvataggio.

### Autonomia fasce orarie — ✅

1. Clicca un giorno.
2. Nel drawer vedi **ogni orario** con i suoi posti prenotati / capienza / liberi / stato.
3. Puoi intervenire su un orario senza toccare gli altri (posti, elimina, riapri; chiusura mirata via «Azione su tutte le partenze» con orario indicato).

### Semaforo verde / giallo / rosso — ✅

| Colore | Significato tipico |
|--------|--------------------|
| Verde | Aperto, buona disponibilità |
| Giallo/arancio | Ultimi posti (soglia critica) |
| Rosso | Chiuso o sold-out |

1. Guarda la legenda / il colore delle celle nel mese.
2. Dopo ogni modifica, i colori si ricalcolano.

### Aggiornamento immediato dopo salvataggio — ✅

1. Modifica giorno / posti / programmazione.
2. Conferma l’azione.
3. Griglia, contatori e colori si aggiornano senza ricaricare a mano (se non vedi il cambio: clicca **Aggiorna** in alto).

### Notifica automatica soglia esaurimento posti — ✅

**Quando:** posti liberi ≤ max(2, 25% della capienza) e ancora > 0.

**Cosa fa il sistema**

1. Scrive un avviso nel gestionale (calendario, notices).
2. Accoda email «Posti in esaurimento» ai destinatari admin (`BOOKING_ADMIN_EMAILS` / `ADMIN_EMAIL`).

**Passaggi utente**

1. Nessuna azione manuale: scatta dopo prenotazioni / spostamenti / operazioni calendario.
2. Controlla le notice in alto nel calendario e la casella email admin.
3. Verifica che i destinatari email siano configurati in produzione.

---

## 1.3 Interazione sulle caselle del giorno

### Click singolo giorno — ✅

1. Clicca una casella del mese.
2. Si apre il drawer **Operazioni sul giorno** con data e lista partenze.

### Selezione multipla di più giorni sulla griglia — ⚠️

**Stato:** logica «Più giorni» + «Gestisci» presente ma **nascosta** (stesso blocco commentato delle scorciatoie).

**Workaround oggi**

1. Usa **Programmazione** con **Dal–Al** (e giorni settimana) per agire su più date insieme.
2. Oppure ripeti l’operazione giorno per giorno dal drawer.

### Visualizzazione stato del giorno (orari, PAX, residui) — ✅

1. Clicca il giorno.
2. In **Partenze del giorno** espandi una riga (o usa il filtro tour).
3. Leggi prenotati / capienza / liberi / stato (aperto, chiuso, …).

### Apertura / chiusura indipendente — ✅

**Chiudere un solo orario**

1. Apri il giorno.
2. Scorri a **Azione su tutte le partenze**.
3. Operazione: **Chiudi partenze**.
4. In **Orari coinvolti** scrivi solo quell’ora (es. `10:00`).
5. **Applica al giorno**.

**Riaprire un orario chiuso**

1. Espandi la riga dell’orario.
2. Clicca l’icona **Riapri partenza**.

**Chiudere / riaprire l’intera data**

1. **Azione su tutte le partenze** → Chiudi (oppure Apri) con **Orari coinvolti** vuoto (= tutti).
2. **Applica al giorno**.

### Aggiunta / eliminazione orario — ✅

**Aggiungere**

1. Apri il giorno.
2. Sezione **Aggiungi un orario**.
3. Seleziona il **Tour** (solo tour già presenti quel giorno).
4. Imposta **Orario** e **Posti disponibili**.
5. **Aggiungi orario**.

**Eliminare**

1. Espandi la partenza.
2. Icona cestino **Elimina orario**.
3. Se ci sono prenotazioni, il sistema non le cancella: blocca le nuove e avvisa.

### Modifica capienza (PAX) — ✅

1. Espandi l’orario.
2. Modifica il campo **Posti**.
3. **Salva posti**.
4. Se riduci sotto i prenotati, la capienza non scende sotto i posti già confermati (vedi 1.5).

### Storico ultima modifica — ✅

1. Apri il giorno.
2. In fondo al drawer leggi:  
   `Ultima modifica: [utente] il [data/ora]` (fuso Praga).

---

## 1.4 Programmazione massiva e regole

### Applicare su intervallo / mese / anno — ✅

1. Seleziona i tour in alto (1, più, o tutti).
2. Clicca **Programmazione**.
3. Scegli **Operazione** (chiudi / apri / capienza / elimina orari).
4. Imposta **Dal** e **Al** (intervallo libero).
5. Oppure usa:
   - **Applica al mese (…)**
   - **Applica a tutto il {anno}**
6. Conferma **Applica all’intervallo** (o la scorciatoia scelta).

### Filtro giorni della settimana — ✅

1. In **Programmazione**, spunta solo i giorni interessati (es. Ven–Dom).
2. Applica sull’intervallo / mese / anno.
3. Le date fuori da quei weekdays non vengono toccate.

### Programmazione base + eccezioni + priorità — ✅

**Concetto operativo**

1. La **programmazione base** del tour si imposta nella scheda tour (orari ricorrenti / schedule).
2. Le azioni da **Programmazione** o dal drawer giorno diventano **eccezioni salvate** (regole).
3. Priorità: **singolo giorno** > **eccezione di periodo** > **base annuale**.

**Vedere / modificare una regola già salvata**

1. Seleziona **un solo tour**.
2. Apri **Programmazione**.
3. Nel menu **Regole salvate** scegli la regola.
4. Il form si riempie con periodo, giorni, orari, azione.
5. Modifica e **Salva regola sull’intervallo**.

### Ripristino programmazione base — ✅

1. **Programmazione** → **Ripristina orari base sull’intervallo**  
   oppure nel giorno: **Azione su tutte le partenze** → **Ripristina programmazione base**.
2. L’eccezione sul periodo/giorno viene rimossa o ritagliata.
3. Tornano i parametri standard del tour (senza cancellare le prenotazioni esistenti).

---

## 1.5 Protezione prenotazioni confermate — ✅

Nessun passaggio speciale: è automatico.

1. Chiudi un giorno/orario con gente già prenotata → prenotazioni restano; nuove vendite bloccate; avviso operatore.
2. Riduci PAX sotto i prenotati → la capienza resta almeno pari ai posti già presi; messaggio chiaro.
3. Elimina un orario con prenotazioni → non cancella i clienti; gestisce lo slot in modo sicuro.

Messaggio tipico dopo un’operazione: prenotazioni esistenti conservate.

---

# SEZIONE 2 — Scheda singolo tour

Vai a: **Tour e orari** → apri un tour (`/admin/tour/{slug}`).

---

## 2.1 Pop-up Availability / Calendario nella scheda — ✅

1. Apri la scheda del tour.
2. Vai al tab **Calendario** (o equivalente «Gestione calendario» / Availability).
3. Si apre il **pop-up** con il calendario **solo di quel tour**.
4. Opera come nel calendario generale (giorni, posti, programmazione).
5. **Chiudi** il pop-up: resti sulla scheda tour (testi/prezzi non salvati non si perdono per il solo fatto di aver aperto Availability).

---

## 2.2 Tipologia, categorie tariffarie, commissioni — ✅

### Free Tour vs Tour a pagamento

1. Scheda tour → sezione **Orari** / **Dettagli e regole** (o campi tipologia commerciale).
2. Imposta Free tour (offerta libera / regole gruppo) oppure tour a pagamento.
3. **Salva tour**.

### Categorie / slot tariffari

1. Tab **Prezzi** (Categorie e prezzi).
2. Aggiungi / modifica / rimuovi fasce (Adulti, Bambini, Over 65, …).
3. Per ciascuna: etichetta, prezzo, età se prevista.
4. **Salva tour**.

### Commissioni affiliati

1. Tab **Commissioni**.
2. Per tipo affiliato (guida / agenzia / hotel / …) e prodotto (free / paid / pacchetto):
   - scegli fisso (€/CZK) o %;
   - imposta il valore.
3. **Salva tour**.

---

## 2.3 Offerte e dettagli operativi — ✅

### Sezione Offerte (% su periodo)

1. Scheda tour → tab **Offerte**.
2. Imposta percentuale sconto.
3. Imposta **Dal** e **Al**.
4. **Salva tour**.  
   (Listino last-minute globale anche in **Last minute** nel menu admin, se usato.)

### Dettagli e regole operative

1. Tab **Dettagli e regole** (in Orari / policy).
2. Configura:
   - **Cut-off** prenotabilità (ore / minuti prima della partenza)
   - **Cancellazione / rimborso** (ore prima + %)
   - **Minimo partecipanti**
   - **Animali** ammessi / no
   - **Barriere architettoniche** / accessibilità
3. **Salva tour**.

---

# SEZIONE 3 — Funzioni di sistema

---

## 3.1 Utenti, account, permessi — ✅

### Multi-utenza peer — ✅

**Stato:** account staff nel database (`AdminUser`). `STAFF_USERS` serve solo come seme iniziale se la tabella è vuota.

**Modello:** tutti i membri staff sono allo stesso livello (peer), con accesso completo al gestionale. Non c’è gerarchia admin/operator.

**Passaggi**

1. Accedi a **/accesso**.
2. Apri **Account staff** (`/admin/utenti`).
3. Crea un account (email + password).
4. Metti in pausa un collega se non deve più entrare (chi è in pausa non può fare login).
5. Nella stessa pagina vedi e aggiorni **solo la tua** password, senza email di reset.

### Pagina di registrazione account nel gestionale — ✅

Vedi **Account staff** sopra.

### Log «Ultima modifica» alimentato dall’account — ✅

1. Ogni operazione calendario registra l’email dell’utente loggato.
2. Nel drawer del giorno vedi chi ha fatto l’ultima variazione.

**Non c’è** un feed storico multi-riga dedicato sul calendario (solo ultima modifica + log tecnico limitato).

---

## 3.2 Ticket / assistenza interna — ✅

1. Menu **Supporto** (`/admin/supporto`).
2. Compila oggetto e descrizione.
3. **Apri ticket**.
4. Aggiorna lo **stato**: Aperto → In lavorazione → Risolto.
5. Tieni traccia dalla stessa sezione.

---

# Riepilogo regole di integrità

| Regola | Stato | Come verificarlo |
|--------|-------|------------------|
| Priorità: giorno > eccezione periodo > base | ✅ | Modifica un giorno dopo una regola di periodo: il giorno vince. Ripristina base: torna lo schedule. |
| Nessuna modifica elimina prenotazioni confermate | ✅ | Chiudi / riduci PAX con clienti sopra: restano, nuove vendite bloccate, avviso. |
| Fuso Europe/Prague + tracciabilità utente | ✅ | Orari e «Ultima modifica» in fuso Praga; actor = email staff. |

---

## Cosa manca per allinearsi al 100% del documento

| Gap | Impatto | Azione suggerita |
|-----|---------|------------------|
| Scorciatoie Oggi/Ieri/mesi + intervallo vista | Non filtrano la griglia | Decommentare / ripristinare UI in `OperationalCalendar.tsx` |
| Selezione multi-giorno sulla griglia | Non si selezionano più caselle a mano | Stesso: ripristinare «Più giorni» / «Gestisci» |
| ~~Registrazione utenti dal gestionale~~ | ✅ | Pagina `/admin/utenti` (peer, pausa, password propria) |
| Feed storico completo modifiche | Solo ultima riga nel drawer | Estendere log UI (o riattivare audit Fase 2) |

---

*Documento generato rispetto al codice e al gestionale della versione corrente (calendario operativo, scheda tour, supporto ticket, notifiche posti bassi).*
