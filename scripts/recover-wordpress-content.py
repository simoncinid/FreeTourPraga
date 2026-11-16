#!/usr/bin/env python3
"""Read public WordPress pages and copy a sanitized, offline snapshot into this checkout.
Never authenticates, posts to WordPress, changes DNS or deploys. Requires beautifulsoup4.
Run manually to refresh; review the diff before accepting editorial changes.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import re
import xml.etree.ElementTree as ET
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[1]
ORIGIN = 'https://it.freetourpraga.com'
HOST = 'it.freetourpraga.com'
CACHE = ROOT / 'tmp' / 'wordpress-recovery'
CACHE.mkdir(parents=True, exist_ok=True)
OUT = ROOT / 'src' / 'content'
OUT.mkdir(parents=True, exist_ok=True)
ALLOWED = {'p','h2','h3','h4','h5','h6','a','img','figure','figcaption','ul','ol','li','strong','b','em','i','br','hr','blockquote','table','thead','tbody','tr','th','td','dl','dt','dd','div','span','section','sup','sub'}
DROP = 'script,style,form,input,select,textarea,button,iframe,object,embed,svg,noscript,.wpcf7,.sharedaddy,.post-navigation,.comments-area,.entry-meta,.jp-relatedposts'
ASSETS = set()
FAILURES = []

def fetch(url):
    key = hashlib.sha256(url.encode()).hexdigest()
    file = CACHE / (key + '.json')
    if file.exists():
        cached = json.loads(file.read_text())
        if cached['status'] < 500: return cached
    try:
        request = urllib.request.Request(url, headers={'User-Agent':'FreeTourPraga-Content-Recovery/1.0'})
        try: response = urllib.request.urlopen(request, timeout=45)
        except urllib.error.HTTPError as e: response = e
        result = {'url':url, 'final':response.url, 'status':response.status,'body':response.read().decode('utf-8',errors='replace')}
        file.write_text(json.dumps(result,ensure_ascii=False))
        return result
    except Exception as e: return {'url':url, 'error':str(e), 'status':0}

def asset_path(url):
    u=urllib.parse.urlsplit(url)
    return ('/wp-content/uploads/_shared/'+u.path.split('/wp-content/uploads/',1)[1]) if u.hostname=='freetourpraga.com' else u.path

def local_url(value, base=ORIGIN):
    if not value: return ''
    value = value.strip()
    absolute = urllib.parse.urljoin(base,value)
    u = urllib.parse.urlsplit(absolute)
    if u.scheme not in ('http','https','mailto','tel'): return ''
    if u.scheme in ('mailto','tel'): return value
    if u.hostname == 'freetourpraga.com' and u.path.startswith('/wp-content/uploads/'):
        ASSETS.add(urllib.parse.urlunsplit(('https',u.netloc,u.path,'','')))
        return asset_path(absolute)
    if u.hostname == HOST:
        if u.path.startswith('/wp-content/uploads/'): ASSETS.add('https://' + HOST + urllib.parse.urlunsplit(('', '', u.path, '', '')))
        return urllib.parse.urlunsplit(('', '', u.path or '/',u.query,u.fragment))
    return absolute

def clean_html(value,base):
    s = BeautifulSoup(value,'html.parser')
    for node in list(s.select(DROP)):
        if node.parent: node.decompose()
    for node in list(s.find_all(True)):
        if node.name is None: continue
        if node.name == 'h1': node.name='h2'
        if node.name not in ALLOWED:
            node.unwrap(); continue
        original = dict(node.attrs); node.attrs = {}
        if node.name == 'a':
            href = local_url(original.get('href',''),base)
            # Drop administrative and dead plugin entry points, not their surrounding content.
            if '/wp-login.php' in href or '/wp-admin' in href: node.unwrap();continue
            if href: node['href']=href
            if href.startswith('https://'): node['rel']='noopener noreferrer'
        if node.name == 'img':
            src = local_url(original.get('src',''),base)
            if not src: node.decompose();continue
            node['src']=src;node['alt']=original.get('alt','');node['loading']='lazy';node['decoding']='async'
            for key in ('width','height'):
                if str(original.get(key,'')).isdigit():node[key]=original[key]
        for key in ('colspan','rowspan'):
            if str(original.get(key,'')).isdigit():node[key]=original[key]
        identifier=original.get('id','')
        if re.fullmatch(r'[A-Za-z][\w:-]{0,99}',str(identifier)):node['id']=identifier
    return str(s).strip()

def extract(r):
    if r['status']!=200: return None
    s=BeautifulSoup(r['body'],'html.parser'); path=urllib.parse.urlsplit(r['final']).path
    if '/wp-content/' in path: return None
    entry=s.select_one('main') if len(s.select('main article')) > 1 else s.select_one('.entry-content')
    if entry is None: entry=s.select_one('main')
    if entry is None: raise RuntimeError('No content container '+r['url'])
    heading=s.select_one('h1')
    title=s.title.get_text(' ',strip=True) if s.title else path
    def met(name,prop=False):
        x=s.find('meta',attrs={('property' if prop else 'name'):name});return x.get('content','') if x else ''
    html=clean_html(str(entry),r['final'])
    canonical=s.select_one('link[rel=canonical]')
    canonical_path=urllib.parse.urlsplit(canonical.get('href','')).path if canonical else path
    # Only consolidate pages that the current site itself declares equivalent.
    return {'path':path,'canonicalPath':canonical_path or path,'sourceUrl':r['url'],'sourceFinalUrl':r['final'],'title':title,'heading':heading.get_text(' ',strip=True) if heading else title.split(' - Free Tour')[0],'description':met('description') or BeautifulSoup(html,'html.parser').get_text(' ',strip=True)[:250],'image':local_url(met('og:image',True),r['final']),'modified':met('article:modified_time',True) or None,'html':html,'kind':'article' if path in post_paths else 'page'}

inventory=json.loads((ROOT/'docs/evidenze/seo-audit-2026-11-16.json').read_text())
urls=[ORIGIN+r['old_path'] for r in inventory['legacy_checks']]
urls+= [u for u in inventory['extra_urls_from_old_internal_links'] if '/wp-login.php' not in u and '/wp-content/' not in u]
# Public REST GET only; no account credentials are necessary for published content.
rest=[]
for kind in ('posts','pages'):
    r=fetch(ORIGIN+'/wp-json/wp/v2/'+kind+'?per_page=100')
    if r['status']!=200:raise RuntimeError('Cannot read published '+kind)
    rest+=json.loads(r['body'])
post_paths={urllib.parse.urlsplit(x['link']).path for x in rest if x['type']=='post'}
urls+= [x['link'] for x in rest]; urls=sorted(set(urls))
print('Reading',len(urls),'public URLs',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: responses=list(pool.map(fetch,urls))
pages={};redirects={};routes=[]
for r in responses:
    path=urllib.parse.urlsplit(r['url']).path
    if r['status']!=200:
        FAILURES.append({k:r.get(k) for k in ('url','status','error')});continue
    final=urllib.parse.urlsplit(r['final']).path
    if final.startswith('/wp-content/uploads/'):
        local_url(r['final']);redirects[path]=final;routes.append({'path':path,'destination':final,'status':301});continue
    entry=extract(r)
    if not entry:continue
    if path!=final:redirects[path]=final
    # Preserve same-origin canonical aliases as permanent redirects.
    if entry['canonicalPath']!=final:redirects[final]=entry['canonicalPath']
    pages.setdefault(final,entry)
    routes.append({'path':path,'destination':entry['canonicalPath'],'status':301 if path!=entry['canonicalPath'] else 200})
# Transfer original dates from public WordPress records where available.
for record in rest:
    path=urllib.parse.urlsplit(record['link']).path
    if path in pages:pages[path]['modified']=record.get('modified_gmt','')+'Z'
# Include downloadable documents and all image URLs declared in the source sitemaps.
for u in inventory['extra_urls_from_old_internal_links']:
    if '/wp-content/uploads/' in u:local_url(u)
# Images declared by Yoast include original files that existing image-search links may use.
index=ET.fromstring(fetch(ORIGIN+'/sitemap_index.xml')['body'])
for loc in index.findall('{*}sitemap/{*}loc'):
    xml=ET.fromstring(fetch(loc.text)['body'])
    for image in xml.findall('.//{http://www.google.com/schemas/sitemap-image/1.1}loc'):local_url(image.text)
# Discover downloads in metadata inventory and linked pages, including sizes and originals.
for page in pages.values():
    for node in BeautifulSoup(page['html'],'html.parser').select('[src],[href]'):
        local_url(node.get('src') or node.get('href'),page['sourceFinalUrl'])
# Flatten redirect chains and reject loops before generating any source data.
for path in redirects:
    dest=redirects[path];seen={path}
    while dest in redirects:
        if dest in seen:raise RuntimeError('Redirect loop '+path)
        seen.add(dest);dest=redirects[dest]
    redirects[path]=dest
print('Pages',len(pages),'redirects',len(redirects),'assets',len(ASSETS),flush=True)

def download(url):
    path=urllib.parse.unquote(asset_path(url))
    target=ROOT/'public'/path.lstrip('/')
    if not target.resolve().is_relative_to((ROOT/'public/wp-content/uploads').resolve()):raise RuntimeError('Unsafe asset path')
    if target.exists():data=target.read_bytes()
    else:
        try:
            encoded=urllib.parse.quote(url,safe=':/%?=&')
            r=urllib.request.urlopen(encoded,timeout=60)
            if not r.headers.get('Content-Type','').startswith(('image/','application/pdf')):raise RuntimeError('Unexpected asset type')
            data=r.read();target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        except Exception as e:
            # Some Italian pages reference files still present on the owner's main site.
            # Keep the historical Italian asset path and recover the same named original.
            if isinstance(e, urllib.error.HTTPError) and e.code == 404 and urllib.parse.urlsplit(url).hostname == HOST:
                fallback = url.replace('https://'+HOST, 'https://freetourpraga.com', 1)
                try:
                    response=urllib.request.urlopen(urllib.parse.quote(fallback,safe=':/%?=&'),timeout=30)
                    if not response.headers.get('Content-Type','').startswith(('image/','application/pdf')):raise RuntimeError('Unexpected fallback type')
                    data=response.read();target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
                    return {'url':url,'path':asset_path(url),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'recoveredFrom':fallback}
                except Exception:pass
            return {'url':url,'error':str(e)}
    return {'url':url,'path':asset_path(url),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:assets=list(pool.map(download,sorted(ASSETS)))
errors=[a for a in assets if 'error' in a]
# Already missing source images are not replaced with unrelated pictures. Remove broken tags.
missing_paths={asset_path(a['url']) for a in errors if '404' in a['error']}
for page in pages.values():
    soup=BeautifulSoup(page['html'],'html.parser')
    for node in soup.select('img[src]'):
        if node['src'] in missing_paths:node.decompose()
    page['html']=str(soup)
# Two broken published links have precise surviving equivalents.
redirects.update({'/aeroporto-di-praga/':'/come-raggiungerci-dallaeroporto/', '/prenotazioni-free-tour-del-castello-di-praga/':'/free-tour-del-castello-di-praga-2/'})
result={'capturedAt':datetime.now(timezone.utc).isoformat(),'sourceOrigin':ORIGIN,'pages':sorted(pages.values(),key=lambda x:x['path']),'redirects':redirects,'routes':routes,'assets':assets,'failures':FAILURES}
(OUT/'wordpress.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Saved snapshot. Failed pages:',FAILURES,'Failed assets:',errors,flush=True)
route_manifest={'paths':sorted(pages), 'redirects':redirects, 'gone':[urllib.parse.urlsplit(x['url']).path for x in FAILURES if x['status']==410], 'wordpressIds':{str(x['id']):urllib.parse.urlsplit(x['link']).path for x in rest}}
(OUT/'wordpress-routes.json').write_text(json.dumps(route_manifest,ensure_ascii=False,indent=2)+'\n')
if any('404' not in x['error'] for x in errors) or any((x['status']>=500 or x['status']==0) and not x['url'].endswith('/hotel-a-praga/hotel-u-krale-karla/') for x in FAILURES):raise SystemExit(1)
