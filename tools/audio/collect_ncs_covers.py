from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import urllib.request,json,re
ROOT=Path(__file__).resolve().parents[2]
class Meta(HTMLParser):
 def __init__(self):super().__init__();self.cover=None
 def handle_starttag(self,t,attrs):
  d=dict(attrs)
  if t=='meta' and d.get('property')=='og:image':self.cover=d.get('content')
sources=json.loads((ROOT/'audio/catalog-ncs/sources.json').read_text())
folder=ROOT/'public/music/artwork';folder.mkdir(parents=True,exist_ok=True)
existing={c['id']:c for c in json.loads((ROOT/'audio/catalog-ncs/covers.json').read_text())}
def fetch(s):
 if s['id'] in existing and (ROOT/('public'+existing[s['id']]['cover'])).exists():return existing[s['id']]
 parser=Meta();page=urllib.request.urlopen(s['sourceUrl'],timeout=30).read().decode();parser.feed(page)
 if not parser.cover or 'amazonaws.com/tracks/' not in parser.cover:raise ValueError(s['title'])
 ext=parser.cover.split('.')[-1];path=folder/(s['isrc']+'.'+ext)
 if not path.exists():path.write_bytes(urllib.request.urlopen(parser.cover,timeout=30).read())
 return {'id':s['id'],'cover':'/music/artwork/'+path.name,'coverSource':parser.cover}
with ThreadPoolExecutor(max_workers=3) as pool:covers=list(pool.map(fetch,sources))
(ROOT/'audio/catalog-ncs/covers.json').write_text(json.dumps(covers,indent=2)+'\n')
print('COVERS',len(covers))
