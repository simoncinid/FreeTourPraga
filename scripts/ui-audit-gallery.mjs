import { readFile, writeFile, access } from "node:fs/promises";
const rows = [
  [
    "01-home",
    "Home",
    "/",
    "Titolo spezzato, schede future vuote, immagine incoerente sul cambio e ritmo delle sezioni troppo largo.",
    "Hero e sezioni preservate. Titolo rifinito, spazi ridotti, dettagli sulle icone, illustrazioni originali, hover e focus. Un tour a prezzo fisso non viene più presentato come gratuito.",
  ],
  [
    "02-tour",
    "Catalogo",
    "/tour",
    "Filtri senza indicazione del numero di risultati, recupero debole dallo stato vuoto, schede poco rifinite.",
    "Griglia originale a tre colonne. Risultati e azzeramento dei filtri, immagini con hover, testi e azioni allineati.",
  ],
  [
    "03-tour-citta",
    "Tour · Città Vecchia",
    "/tour/citta-vecchia-ponte-carlo",
    "Riquadri poco gerarchizzati, mappa non caricata completamente vuota e widget recensioni troppo compresso.",
    "Foto, sezioni e colonna di prenotazione nelle posizioni originali. Bordi, tipografia, stato della mappa, prenotazione e recensioni rifiniti.",
  ],
  [
    "04-tour-castello",
    "Tour · Castello",
    "/tour/castello-praga-mala-strana",
    "Controllo separato del titolo, del ritaglio fotografico e dei contenuti più lunghi.",
    "Verificato con lo stesso componente rifinito della scheda precedente; nessuno spostamento di sezioni.",
  ],
  [
    "05-tour-birra",
    "Tour · Birra ceca",
    "/tour/birra-ceca-storie-locali",
    "Controllo separato di fotografia, titolo breve e informazioni del percorso serale.",
    "Riquadri, gerarchia, mappa e prenotazione coerenti con le altre schede, conservando contenuti e fotografia.",
  ],
  [
    "06-chi-siamo",
    "Chi siamo",
    "/chi-siamo",
    "Quattro riquadri molto standard, icone isolate e gerarchia poco caratterizzata.",
    "Stessa composizione centrale e griglia 2×2. Icone incorniciate, dettagli numerati, bordi e interazioni leggere.",
  ],
  [
    "07-informazioni",
    "Informazioni utili",
    "/informazioni-utili",
    "Numerazione poco caratterizzata e blocchi di testo densi.",
    "Stessa griglia a sei riquadri, numeri circolari, interlinea e spaziature più regolari.",
  ],
  [
    "08-contatti",
    "Contatti",
    "/contatti",
    "Icone piccole e modulo con campi troppo anonimi e poco gerarchizzati.",
    "Due colonne originali. Icone con sfondo, gerarchia dei campi, esempi, bordo di accento e focus leggibile.",
  ],
  [
    "09-partner",
    "Partner Europa",
    "/partner-europa",
    "Titolo a tre righe con separazione scomoda e vantaggi visivamente indistinti.",
    "Titolo adattato alla colonna originale, vantaggi separati con dettagli grafici e modulo rifinito.",
  ],
  [
    "10-privati",
    "Tour privati",
    "/tour-privati",
    "Titolo tecnico e poco orientato al viaggiatore, riquadri generici.",
    "Stessa struttura: introduzione, CTA e tre vantaggi. Copy più chiaro, dettagli sulle icone e superfici calde.",
  ],
  [
    "11-blog",
    "Blog",
    "/blog",
    "Titolo con ultima parola isolata, foto di birre sul cambio e link tutti generici.",
    "Tre schede orizzontali preservate; titolo bilanciato, nuova illustrazione e link verso i contenuti pertinenti.",
  ],
  [
    "12-aiuto",
    "Assistenza",
    "/aiuto",
    "Email tutta maiuscola e link di supporto poco riconoscibili.",
    "Composizione centrale preservata, email leggibile e collegamenti verticali con separatori e frecce.",
  ],
  [
    "13-faq",
    "FAQ",
    "/faq",
    "Espansione poco riconoscibile e risposte poco distinte dalle domande.",
    "Stessa lista espandibile. Indicatori +/×, stato aperto, focus da tastiera e collegamento di recupero.",
  ],
  [
    "14-privacy",
    "Privacy",
    "/privacy",
    "Testo lungo con sezioni poco scandite.",
    "Stesso contenuto, stessa colonna. Gerarchia dei sottotitoli, righe divisorie e ritmo di lettura.",
  ],
  [
    "15-termini",
    "Termini",
    "/termini",
    "Stesse criticità di lettura della privacy.",
    "Contenuto intatto; tipografia, interlinea e separatori coerenti.",
  ],
  [
    "16-accesso",
    "Accesso staff",
    "/accesso",
    "Modulo anonimo e campi con gerarchia debole.",
    "Stesso modulo centrale; bordo di accento, campi rifiniti, placeholder ed errore accessibile.",
  ],
  [
    "17-carrello-empty",
    "Carrello · vuoto",
    "/carrello",
    "Stato vuoto senza dettagli e titolo con ultima parola isolata.",
    "Stesso riquadro centrale; icona di orientamento, titolo bilanciato e CTA conservata.",
  ],
  [
    "17-carrello-filled",
    "Carrello · con tour",
    "/carrello",
    "Rimozione disallineata, data con secondi, placeholder codice partner troncato e riepilogo poco distinto.",
    "Stesse due colonne; rimozione allineata, data leggibile con ora di Praga e riepilogo evidenziato. Dati di prova nel browser.",
  ],
  [
    "18-checkout-empty",
    "Checkout · vuoto",
    "/checkout",
    "Stato di recupero da un checkout senza esperienze.",
    "Stato vuoto coerente con il carrello, senza forzare il proseguimento.",
  ],
  [
    "18-checkout-filled",
    "Checkout · con tour",
    "/checkout",
    "Campi e opzione di pagamento poco gerarchizzati.",
    "Stesso modulo e riepilogo; campi coerenti, pagamento selezionato visibile e totali più leggibili. Dati di prova nel browser.",
  ],
  [
    "19-conferma-empty",
    "Conferma · senza ricevuta",
    "/prenotazione/confermata",
    "Ringraziamento potenzialmente ambiguo in assenza di una prenotazione verificata.",
    "Titolo neutro finché il riepilogo non è verificato; messaggio e azioni di assistenza conservati.",
  ],
  [
    "19-conferma-filled",
    "Conferma · verificata",
    "/prenotazione/confermata",
    "Stato confermato poco evidente e dettagli molto uniformi.",
    "Indicatore di conferma e badge verde, dati di viaggio e azioni rifiniti. Ricevuta simulata nel browser.",
  ],
  [
    "19-conferma-pending",
    "Conferma · pagamento atteso",
    "/prenotazione/confermata",
    "Da distinguere chiaramente da una prenotazione confermata.",
    "Titolo e badge dedicati al pagamento in attesa; nessun indicatore verde di conferma. Ricevuta simulata nel browser.",
  ],
  [
    "20-gestione-filled",
    "Gestisci prenotazione",
    "/gestisci-prenotazione/…",
    "Stato, azioni disabilitate e cancellazione poco distinguibili.",
    "Stessa sequenza di riquadri; badge, campi, azioni disabilitate e cancellazione più chiari. Prenotazione simulata nel browser.",
  ],
  [
    "20-gestione-invalid",
    "Gestione · link non valido",
    "/gestisci-prenotazione/…",
    "Errore e percorso di recupero da rendere riconoscibili.",
    "Riquadro di errore evidenziato e contatto del team nella posizione originale. Risposta di prova nel browser.",
  ],
  [
    "21-not-found",
    "Pagina non trovata",
    "/pagina-non-esistente",
    "404 generica in inglese, grande vuoto e nessuna azione di recupero.",
    "Stato 404 in italiano con illustrazione originale e link verso home e tour, dentro header e footer esistenti.",
  ],
];
const has = async (f) => {
  try {
    await access("output/ui-audit/" + f);
    return true;
  } catch {
    return false;
  }
};
const data = await Promise.all(
  rows.map(async ([id, title, path, problem, change]) => ({
    id,
    title,
    path,
    problem,
    change,
    after: id + "-final.png",
    before: id !== "20-gestione-invalid" && (await has(id + "-current-before.png"))
      ? id + "-current-before.png"
      : null,
  })),
);
const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FreeTourPraga · Revisione UI desktop</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f0e9;color:#102747;font:14px/1.6 system-ui,sans-serif}header{padding:24px 32px;background:#071a35;color:white}header strong{font:26px Georgia,serif}header p{margin:6px 0 0;color:#c6cfdc;font-size:12px}nav{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 32px;background:#fbfaf7;border-bottom:1px solid #d9d9d3}select,button{font:inherit;padding:10px 14px;border:1px solid #c7c8c5;border-radius:6px;background:white;color:#102747;cursor:pointer}select{max-width:100%;min-width:260px}button[aria-pressed=true]{background:#071a35;color:white;border-color:#071a35}button:disabled{opacity:.4;cursor:default}button:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #ff4812;outline-offset:3px}.notes{max-width:1100px;margin:24px auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:32px}.notes p{margin:7px 0}.notes strong{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#a43b21}.frame{max-width:1440px;margin:auto;background:white;box-shadow:0 8px 40px #071a3510}.frame img{display:block;width:100%;height:auto}a{color:inherit;text-underline-offset:4px}.meta{margin-left:auto;font-size:12px}.caption{text-align:center;padding:20px;font-size:12px} @media(max-width:650px){header,nav{padding:18px}.notes{grid-template-columns:1fr;gap:12px}.meta{margin-left:0}}</style><header><strong>FreeTourPraga · Revisione UI desktop</strong><p>Screenshot a 1440 × 1000 px, pagina completa. Hero, ordine delle sezioni e griglie principali conservati. Gli stati di prenotazione compilati usano fixture nel browser.</p></header><nav aria-label="Revisione schermate"><button id="prev" aria-label="Schermata precedente">←</button><select id="pages" aria-label="Scegli schermata"></select><button id="next" aria-label="Schermata successiva">→</button><button id="before" aria-pressed="false">Prima</button><button id="after" aria-pressed="true">Dopo</button><a id="full" class="meta" target="_blank" rel="noreferrer">Apri screenshot completo ↗</a></nav><section class="notes"><div><strong>Criticità riscontrata</strong><p id="problem"></p></div><div><strong>Intervento</strong><p id="change"></p></div></section><div class="frame"><img id="shot" alt="Screenshot della schermata selezionata"></div><p class="caption">Le iterazioni precedenti al chiarimento strutturale restano archiviate nella cartella; questa galleria usa solo gli screenshot finali della revisione conservativa. <a href="README.md">Note e verifiche</a> · <a href="../imagegen/prompts.md">Asset e prompt imagegen</a></p><script>const data=${JSON.stringify(data).replaceAll("<", "\\u003c")};let index=0,version='after';const el=id=>document.getElementById(id);data.forEach((d,i)=>{const o=document.createElement('option');o.value=i;o.textContent=d.title;el('pages').append(o)});function render(){const d=data[index];if(!d.before)version='after';el('pages').value=index;el('before').disabled=!d.before;el('prev').disabled=index===0;el('next').disabled=index===data.length-1;el('before').setAttribute('aria-pressed',version==='before');el('after').setAttribute('aria-pressed',version==='after');el('problem').textContent=d.problem;el('change').textContent=d.change;el('shot').src=d[version];el('shot').alt=d.title+' · '+(version==='after'?'dopo':'prima');el('full').href=d[version]}el('pages').onchange=e=>{index=Number(e.target.value);render()};el('prev').onclick=()=>{index--;render()};el('next').onclick=()=>{index++;render()};el('before').onclick=()=>{version='before';render()};el('after').onclick=()=>{version='after';render()};render();</script></html>`;
await writeFile("output/ui-audit/index.html", html);
await writeFile("output/ui-audit/review.json", JSON.stringify(data, null, 2));
console.log("Gallery prepared: " + data.length + " pages and states");
