#!/usr/bin/env python3
"""Prepare reviewed copy for existing UI fields; no database or network writes."""
import json,pathlib
from bs4 import BeautifulSoup
root=pathlib.Path(__file__).resolve().parents[1]
source=json.loads((root/'src/content/wordpress.json').read_text())
castle=next(p for p in source['pages'] if p['path']=='/tour/castello/')
soup=BeautifulSoup(castle['html'],'html.parser')
# Restore the historical descriptive content in the existing experience section.
# Prices, departure times and meeting points remain controlled by the operational record.
for heading in list(soup.find_all(['h2','h3'])):
 if heading.get_text(' ',strip=True)=='Prezzi':
  node=heading
  while node is not None:
   following=node.next_sibling;node.extract();node=following
  break
# The source also places useful access and transport information under the price heading.
notes=BeautifulSoup(castle['html'],'html.parser')
for paragraph in notes.find_all('p'):
 text=paragraph.get_text(' ',strip=True)
 if 'Per effettuare il tour' in text or 'Il tour comprende la visita' in text:soup.append(paragraph)
body=str(soup).strip()
result={
 'version':1,
 'sourceUrl':castle['sourceFinalUrl'],
 'homeSeo':{'seoTitle':next(p for p in source['pages'] if p['path']=='/')['title'],'seoDescription':next(p for p in source['pages'] if p['path']=='/')['description']},
 'home':{
  'heroTitle':'Free Tour Praga in italiano: scopri la città con noi.',
  'heroEyebrow':'Free Tour e visite guidate in italiano',
  'heroBody':'Visita la Città Vecchia e il quartiere ebraico con guide in italiano. Il nostro Free Tour di Praga è a offerta libera: scegli tu il compenso al termine della visita.',
  'toursTitle':'Free Tour e tour di Praga in italiano',
  'toursBody':'Dalla Città Vecchia e il quartiere ebraico al Castello: scopri Praga con i nostri tour in italiano.',
  'answersTitle':'Il Free Tour di Praga: informazioni prima di prenotare',
  'answersBody':'Come funziona l’offerta libera, cosa vedremo e dove incontrare le nostre guide in italiano.',
 },
 'answers':[
  {'question':'Che cos’è il Free Tour di Praga?', 'answer':'È una visita guidata in italiano senza un prezzo fisso: al termine del percorso scegli tu quanto offrire, in base all’esperienza e al lavoro della guida. Il nostro Free Tour di Praga è pensato come introduzione alla città, alla sua storia e ai personaggi che l’hanno resa famosa. L’offerta libera è il compenso per il servizio svolto dalla guida, non un biglietto d’ingresso ai monumenti.'},
  {'question':'Cosa vedremo nella Città Vecchia e nel quartiere ebraico?', 'answer':'Cammineremo nella Piazza della Città Vecchia, davanti all’Orologio Astronomico e alla chiesa di Santa Maria di Týn. Percorreremo via Celetná fino alla Torre delle Polveri e parleremo di Mozart davanti al Teatro degli Stati. Proseguiremo verso Josefov, il quartiere ebraico di Praga, per conoscere la storia delle sinagoghe e del Vecchio Cimitero Ebraico. La visita racconta i monumenti lungo il percorso; gli ingressi ai musei non fanno parte del Free Tour.'},
  {'question':'Dove parte il Free Tour di Praga e a che ora?', 'answer':'Il punto d’incontro del Free Tour è davanti al Teatro degli Stati (Stavovské Divadlo), in Rytířská 22, 110 00 Staré Město. Il programma pubblicato prevede la partenza ogni giorno alle 10:00. Riconoscerai le nostre guide dagli ombrelli verdi. Controlla sempre data, orario e indicazioni nella conferma della tua prenotazione: sono il riferimento per la visita scelta.'},
  {'question':'Quanto dura il Free Tour?', 'answer':'Il percorso dura normalmente fra 2 ore e 30 minuti e 3 ore, con una pausa di circa 20 minuti. La durata può variare secondo il numero di partecipanti e il passo del gruppo. Si tratta di una passeggiata nel centro storico: considera il tempo necessario per raggiungere il punto d’incontro prima della partenza e scegli scarpe comode per camminare.'},
  {'question':'Le guide parlano italiano?', 'answer':'Sì: il Free Tour si svolge in italiano, con guide italiane madrelingua o guide locali che parlano italiano. Durante la visita conoscerai la storia della Città Vecchia, gli avvenimenti più importanti di Praga e le curiosità dei luoghi attraversati. Per preparare il viaggio trovi anche le nostre guide su cambio euro-corona ceca, trasporti, collegamenti dall’aeroporto e ristoranti tipici.'},
  {'question':'Come prenotare e completare la visita di Praga?', 'answer':'Apri la scheda del Free Tour per verificare le partenze proposte e le informazioni della visita. Consigliamo di prenotare in anticipo per concordare giorno e orario e ricevere i dettagli. Se il calendario non propone la data che cerchi, contatta il team per verificare la disponibilità. Per proseguire la scoperta della città trovi il tour del Castello di Praga e Malá Strana e gli altri itinerari in italiano nel nostro catalogo.'},
 ],
 'castle':{'importedFromWordpress':True,'operationalReviewRequired':True,'canonicalPath':'/tour/castello/','description':BeautifulSoup(body,'html.parser').get_text(' ',strip=True),'descriptionHtml':body,'seoTitle':castle['title'],'seoDescription':castle['description'],'sourceUpdatedAt':castle['modified']},
}
(root/'src/content/seo-editorial.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Preparati testi per i blocchi esistenti della home e descrizione Castello; nessuna modifica operativa.')
