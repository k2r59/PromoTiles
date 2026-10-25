from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,urllib.request,re
ROOT=Path(__file__).resolve().parents[2]
rows=json.loads((ROOT/'audio/catalog-ncs/candidates.json').read_text())
slugs=['onandon','makememove','Royalty','WhyDoI','savannah','Seasons','Howling','Dreams2','RedLine','FeelAgain','P10','WhereWeStarted','tropiclove','WillowTree','NoRival','WILDFIRE','Bittersweet','GoEasy','YourStories','CCYouAndI','Candy','Vision2','Escape','SuperheroInMySleep','PaperCrowns','ChasingDreams','FoundYou','twentyone','RunningOutOfTime','Fairytale','DOTM','Darkness','StockholmLights','Walls','LiveALie','JSSlowDown','SayTheWords','TenMoreMinutes','EchoesD','wakingup','Superhero','CarryOn','Change','LonelyWay','Universe','Volcano','TTT','Letter','LikeAMelody','FindYouThere']
# Compare source URLs case-insensitively, never infer download paths.
selected=[]
for slug in slugs:
 matches=[r for r in rows if r.get('sourceUrl','').rstrip('/').split('/')[-1].lower()==slug.lower() and not re.search('instrumental|remix|slowed|sped up',r['track'],re.I)]
 if not matches:raise ValueError(slug)
 selected.append(matches[0])
assert len(selected)==50 and len({r['url'] for r in selected})==50
folder=ROOT/'artifacts/catalog/ncs-originals';folder.mkdir(parents=True,exist_ok=True)
def fetch(r):
 path=folder/(r['tid']+'.mp3')
 if not path.exists():
  data=urllib.request.urlopen(r['url'],timeout=60).read();tmp=path.with_suffix('.part');tmp.write_bytes(data);tmp.replace(path)
 print(r['track'],path.stat().st_size,flush=True)
 return dict(title=r['track'].strip(),artist=r['artistraw'],id='ncs-'+r['tid'],isrc=r['tid'],prefix='ncs',sourceUrl=r['sourceUrl'],downloadUrl=r['url'],filePath=str(path.relative_to(ROOT)),genreLabel=r['genre'] or 'Électro',officialPreviewSeconds=float(r.get('preview') or 0),license='NCS — conditions spécifiques',licenseUrl='https://ncs.io/usage-policy',rightsStatus='Local internal evaluation. No game distribution licence obtained.',credit=r['track'].strip()+' — '+r['artistraw']+'. Music provided by NoCopyrightSounds. '+r['sourceUrl'],excerptStart=0,excerptDuration=90)
with ThreadPoolExecutor(max_workers=3) as pool:sources=list(pool.map(fetch,selected))
(ROOT/'audio/catalog-ncs/sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n')
