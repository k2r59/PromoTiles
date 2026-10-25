"""Append the 50 curated energetic recordings, keeping the original catalogue intact."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, urllib.request, re, time
ROOT=Path(__file__).resolve().parents[2]
SLUGS='whywelose irememberu immortality CMasYMas MadeForTheGame OTBOD waitawhile AroundUs DontBeAStranger Whatever C_euphoria allweveeverknown Destiny 2017Linked Courage migraine cantwait waitforyou electricity NotGivingIn DanceWithMe DontBother HollywoodPerfect JungleOfLove Control Inspiration Perseus saviour heavenandhell Unbreakable Geometry GuideYouHome DAReality DAFeelings DHBFalling NobodyAround Throne therevolution DontSurrender RiseUp Mirage WakeUp JGS Fireflypt2 Link everlasting forces StreetLights HMHY PullMeIn'.split()
assert len(SLUGS)==50
rows=json.loads((ROOT/'audio/catalog-ncs/candidates.json').read_text())
sources=json.loads((ROOT/'audio/catalog-ncs/sources.json').read_text())
original=sources[:50]
old_urls={s['sourceUrl'].lower() for s in original}
selected=[]
for slug in SLUGS:
 matches=[r for r in rows if r.get('sourceUrl','').rstrip('/').split('/')[-1].lower()==slug.lower() and not re.search('instrumental|remix|slowed|sped up|mashup',r['track'],re.I)]
 if not matches:raise ValueError(slug)
 row=matches[0]
 assert row['sourceUrl'].lower() not in old_urls,slug
 selected.append(row)
assert len({r['tid'] for r in selected})==50
folder=ROOT/'artifacts/catalog/ncs-originals';folder.mkdir(parents=True,exist_ok=True)
def download(row):
 path=folder/(row['tid']+'.mp3')
 if not path.exists():
  for attempt in range(3):
   try:
    data=urllib.request.urlopen(row['url'],timeout=90).read()
    if len(data)<100000:raise ValueError('Audio too short')
    tmp=path.with_suffix('.part');tmp.write_bytes(data);tmp.replace(path);break
   except Exception:
    if attempt==2:raise
    time.sleep(2*(attempt+1))
 print('DOWNLOADED',row['track'],path.stat().st_size,flush=True)
 return dict(title=row['track'].strip(),artist=row['artistraw'],id='ncs-'+row['tid'],isrc=row['tid'],prefix='ncs',sourceUrl=row['sourceUrl'],downloadUrl=row['url'],filePath=str(path.relative_to(ROOT)),genreLabel=row['genre'] or 'Électro',officialPreviewSeconds=float(row.get('preview') or 0),license='NCS — conditions spécifiques',licenseUrl='https://ncs.io/usage-policy',rightsStatus='Private internal use; no public game distribution licence obtained.',credit=row['track'].strip()+' — '+row['artistraw']+'. Music provided by NoCopyrightSounds. '+row['sourceUrl'],energeticExcerpt=True,excerptDuration=90)
with ThreadPoolExecutor(max_workers=3) as pool:additions=list(pool.map(download,selected))
result=original+additions
assert len({s['id'] for s in result})==100
(ROOT/'audio/catalog-ncs/sources.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('SOURCES READY',len(result))
