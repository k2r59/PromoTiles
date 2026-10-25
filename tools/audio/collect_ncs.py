"""Gather public NCS download metadata for the private, local listening prototype.
This does not grant a game distribution licence; see each source's usage policy.
"""
from html.parser import HTMLParser
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request,json,re
ROOT=Path(__file__).resolve().parents[2]
PAGES=ROOT/'artifacts/catalog/ncs-pages';PAGES.mkdir(parents=True,exist_ok=True)
ARTISTS=['73/cartoon','22/anna-yvette','93/culture-code','466/unknown-brain','279/lost-sky','115/diviners','381/rival','123/egzod','210/jim-yosef','558/time-to-talk','538/shiah-maisel']
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='tr':self.row={}
  if self.row is not None and d.get('data-url') and d.get('data-track'):
   self.row.update({k[5:]:v for k,v in d.items() if k.startswith('data-')})
  if self.row and tag=='a' and d.get('href','').startswith('/') and not d['href'].startswith(('/artist/','/track/')):self.row.setdefault('sourceUrl','https://ncs.io'+d['href'])
 def handle_endtag(self,tag):
  if tag=='tr' and self.row:
   if self.row.get('url'):self.rows.append(self.row)
   self.row=None

def fetch(artist):
 p=PAGES/(artist.split('/')[1]+'.html')
 if not p.exists():p.write_bytes(urllib.request.urlopen('https://ncs.io/artist/'+artist,timeout=30).read())
 parser=Parser();parser.feed(p.read_text());return parser.rows
with ThreadPoolExecutor(max_workers=3) as pool:groups=list(pool.map(fetch,ARTISTS))
rows={r['tid']:r for g in groups for r in g}
(ROOT/'audio/catalog-ncs/candidates.json').write_text(json.dumps(list(rows.values()),ensure_ascii=False,indent=2)+'\n')
for r in rows.values():
 if not re.search('instrumental|remix|slowed|sped up|mashup',r['track'],re.I):print(r['track'],'|',r['artistraw'],'|',r.get('sourceUrl'))
