#!/usr/bin/env python3
"""Convert the read-only WordPress snapshot to the app's existing tour/article/page models.
Only writes reviewable local JSON; never connects to WordPress, a database or hosting.
"""
import json,pathlib,re,urllib.parse
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
snapshot=json.loads((ROOT/'src/content/wordpress.json').read_text())
routefile=ROOT/'src/content/wordpress-routes.json'
routes=json.loads(routefile.read_text())
routes['redirects'].pop('/informazioni-utili/',None)
pages={p['path']:p for p in snapshot['pages']}
# Prices below come from the individual published detail pages, not the older index.
configs=[
 ('/', 'free-tour-praga',150,0,0,'Gli essenziali'),
 ('/tour/castello/','castello-praga-mala-strana',150,1600,800,'Gli essenziali'),
 ('/tour/citta-nuova-di-praga/','citta-nuova-di-praga',120,1600,800,'Gli essenziali'),
 ('/tour/comunismo/','comunismo',150,2700,1200,'Tuffo nella storia'),
 ('/tour/tour-praga-esoterica/','tour-praga-esoterica',120,2000,1200,'Tuffo nella storia'),
 ('/tour-di-petrin-e-monastero-di-strahov/','petrin-monastero-strahov',210,3600,1200,'Gli angoli nascosti'),
 ('/tour-degli-interni-del-castello-di-praga/','interni-castello-praga',180,5000,2000,'Gli essenziali'),
 ('/tour/terezin/','terezin',420,8000,4000,'Escursioni Fuori Porta'),
 ('/tour/tour-dei-mercatini-di-natale/','mercatini-natale',180,1600,0,'Gli angoli nascosti'),
 ('/free-tour-del-castello-di-praga/','free-tour-castello-praga',90,0,0,'Gli essenziali'),
]
def text(html):return BeautifulSoup(html,'html.parser').get_text(' ',strip=True)
def cover(page):
 if page['image'] and (ROOT/'public'/urllib.parse.unquote(page['image']).lstrip('/')).is_file():return page['image']
 soup=BeautifulSoup(page['html'],'html.parser');img=soup.select_one('img[src]')
 return img['src'] if img else '/wp-content/uploads/2015/01/free-tour-praga-1.jpg'
def slug(path):return path.strip('/').replace('/','-')
booking={
 '/prenotazioni/free-tour/':'/tour/free-tour-praga',
 '/prenotazioni/castello/':'/tour/castello/',
 '/prenotazioni/citta-nuova/':'/tour/citta-nuova-di-praga/',
 '/prenotazioni/tour-del-comunismo/':'/tour/comunismo/',
 '/prenotazioni/terezin/':'/tour/terezin/',
 '/prenotazioni/tour-serale/':'/tour/tour-praga-esoterica/',
 '/prenotazioni/tour-mercatini-natale/':'/tour/tour-dei-mercatini-di-natale/',
 '/prenotazioni-tour-degli-interni-del-castello-di-praga/':'/tour-degli-interni-del-castello-di-praga/',
 '/tour-monastero-di-strahov-e-chiesa-di-san-nicola/':'/tour-di-petrin-e-monastero-di-strahov/',
 '/free-tour-del-castello-di-praga-2/':'/free-tour-del-castello-di-praga/',
 '/prenotazioni-free-tour-del-castello-di-praga/':'/free-tour-del-castello-di-praga/',
 '/prenotazioni/tour-degli-interni-del-castello-di-praga/':'/tour-degli-interni-del-castello-di-praga/',
 '/prenotazioni/tour-monastero-di-strahov-e-chiesa-di-san-nicola/':'/tour-di-petrin-e-monastero-di-strahov/',
}
tours=[]
for path,internal,duration,adult,child,category in configs:
 p=pages[path];s=BeautifulSoup(p['html'],'html.parser');meeting='Teatro degli Stati';address='Rytířská 22, 110 00 Staré Město, Praga';lat,lon=50.0858,14.4239
 if 'free-tour-del-castello' in path:meeting='Belvedere di Hradčanské náměstí, vicino alla statua di Masaryk';address='Hradčanské náměstí, 118 00 Praha 1-Hradčany';lat,lon=50.0891,14.3979
 if 'tour-degli-interni' in path:meeting='Ingresso della Cattedrale di San Vito';address='III. nádvoří 48/2, 119 01 Praha 1';lat,lon=50.0909,14.4005
 lists=s.find_all('ul');highlights=[]
 for ul in lists:
  highlights=[li.get_text(' ',strip=True) for li in ul.find_all('li',recursive=False) if li.get_text(' ',strip=True)]
  if highlights:break
 if not highlights:highlights=[p['heading']]
 images=list(dict.fromkeys(img['src'] for img in s.select('img[src]') if img['src'].startswith('/wp-content/uploads/')))
 canonical='/tour/free-tour-praga' if path=='/' else path
 tours.append({'id':'wp-tour-'+internal,'slug':internal,'canonicalPath':canonical,'title':p['heading'] if path!='/' else 'Free Tour Praga: Città Vecchia e quartiere ebraico','category':category,'shortDescription':p['description'][:1000],'description':text(p['html']),'descriptionHtml':p['html'],'imageUrl':cover(p),'galleryImages':[{'url':i,'alt':p['heading']} for i in images[:20]],'meetingPoint':meeting,'meetingAddress':address,'mapUrl':'https://www.google.com/maps/search/?api=1&query='+urllib.parse.quote(address),'mapEmbedUrl':f'https://www.google.com/maps?q={lat},{lon}&z=16&output=embed','latitude':lat,'longitude':lon,'durationMinutes':duration,'basePriceCents':adult,'childPriceCents':child,'infantPriceCents':0,'maxGuests':10 if internal=='comunismo' else 14,'walkingDifficulty':2,'rating':0,'reviewCount':0,'language':'Italiano','seoTitle':p['title'],'seoDescription':p['description'][:500],'highlights':highlights[:30],'inclusions':['Guida in italiano'],'safetyNotes':[],'slots':[],'published':True,'adultMinAge':13,'childMinAge':6,'bookingCutoffHours':2,'guide':'','sourceUrl':p['sourceUrl'],'sourceUpdatedAt':p['modified'],'priceLabel':'Offerta libera' if adult==0 else None,'importedFromWordpress':True,'operationalReviewRequired':True})
 if tours[-1]['priceLabel'] is None:del tours[-1]['priceLabel']
 # The detail page and administrative internal slug share one published canonical URL.
 internal_path='/tour/'+internal
 if internal_path.rstrip('/')!=canonical.rstrip('/'):routes['redirects'][internal_path+'/']=canonical
articles=[]
for p in snapshot['pages']:
 if p['kind']!='article':continue
 articles.append({'id':'wp-article-'+slug(p['path']),'slug':slug(p['path']),'canonicalPath':p['path'],'title':p['heading'],'caption':p['description'][:5000],'imageUrl':cover(p),'imageAlt':p['heading'],'intro':'','blocks':[{'type':'text','heading':'','text':text(p['html']),'html':p['html']}],'ctaEnabled':False,'ctaLabel':'','ctaHref':'','seoTitle':p['title'],'seoDescription':p['description'][:500],'updatedAt':p['modified'],'sourceUrl':p['sourceUrl']})
 routes['redirects']['/blog/'+slug(p['path'])+'/']=p['path']
excluded={p for p,*_ in configs}|set(booking)|{'/tour/','/contatti/'}
content_pages={}
for p in snapshot['pages']:
 if p['path'] in excluded or p['kind']=='article':continue
 content_pages['legacy:'+p['path']]={'title':p['heading'],'subtitle':'','body':text(p['html']),'bodyHtml':p['html'],'seoTitle':p['title'],'seoDescription':p['description'][:500],'published':True,'canonicalPath':p['path'],'updatedAt':p['modified'],'sourceUrl':p['sourceUrl']}
routes['redirects'].update(booking)
for old in ['/post-sitemap.xml','/page-sitemap.xml','/category-sitemap.xml','/post_tag-sitemap.xml','/author-sitemap.xml','/attachment-sitemap.xml','/wp-sitemap.xml']:routes['redirects'][old+'/']='/sitemap.xml'
for key in list(routes['redirects']):
 dest=routes['redirects'][key];seen={key}
 while (dest if dest.endswith('/') else dest+'/') in routes['redirects']:
  lookup=dest if dest.endswith('/') else dest+'/'
  if lookup in seen:raise RuntimeError('Redirect loop '+key)
  seen.add(lookup);dest=routes['redirects'][lookup]
 routes['redirects'][key]=dest
# An attachment whose source returns 500 points to an image also already missing (404).
removed='/hotel-a-praga/hotel-u-krale-karla/'
if removed not in routes['gone']:routes['gone'].append(removed)
result={'version':1,'sourceCapturedAt':snapshot['capturedAt'],'tours':tours,'articles':articles,'pages':content_pages,'homepageSeo':{'title':pages['/']['title'],'description':pages['/']['description']},'unavailableSourceImages':[urllib.parse.urlsplit(a['url']).path for a in snapshot['assets'] if 'error' in a], 'operationalNote':'No availability or capacity is inferred from WordPress forms. New tours have no bookable departures; staff must validate operational configuration. Existing sold departures and bookings must be preserved.'}
def without_null(value):
 if isinstance(value,dict):return {k:without_null(v) for k,v in value.items() if v is not None}
 if isinstance(value,list):return [without_null(v) for v in value]
 return value
result=without_null(result)
(ROOT/'src/content/seo-import.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
routefile.write_text(json.dumps(routes,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'tour_records':len(tours),'article_records':len(articles),'other_pages':len(content_pages),'redirects':len(routes['redirects']),'gone':len(routes['gone'])}))
