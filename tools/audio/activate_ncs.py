from pathlib import Path
import json,re,shutil
ROOT=Path(__file__).resolve().parents[2]
p=ROOT/'src/data/catalog.json'
old=json.loads(p.read_text());catalog=json.loads((ROOT/'artifacts/catalog/ncs-catalog.json').read_text());covers={c['id']:c for c in json.loads((ROOT/'audio/catalog-ncs/covers.json').read_text())}
assert len(catalog)==100
previous={s['id']:s for s in old}
for index,s in enumerate(catalog):
 if s['id'] in previous:
  catalog[index]=previous[s['id']];continue
 s.update({k:v for k,v in covers[s['id']].items() if k!='id'})
 s['originalTitle']=s['title'];s['title']=re.sub(r'\s*\((?:feat\.|ft\.).*?\)','',s['title']).strip()
 s['subgenre']=s['genre']
 genre=s['genre'].lower()
 s['genre']='Pop' if 'pop' in genre or genre=='chill' else 'Dance' if 'house' in genre or genre=='edm' or 'dance' in genre else 'Drum & Bass' if 'drum' in genre else 'Hip-hop' if 'trap' in genre else 'Bass' if 'dubstep' in genre else 'Électro'
 s['description']=s['subgenre']+' · Version de jeu'
 s['hint']='Suivez les attaques de la chanson. Maintenez les rubans dorés jusqu’à leur extrémité.'
 s['previewAt']=min(24,s['durationSeconds']*.3)
retired=ROOT/'artifacts/catalog/retired';retired.mkdir(parents=True,exist_ok=True)
if old and old[0]['id'].startswith('km-'):
 (retired/'catalog.json').write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
 for song in old:
  folder=ROOT/('public'+song['chartRoot'])
  if folder.exists() and not (retired/folder.name).exists():shutil.move(folder,retired/folder.name)
for dest in [p,ROOT/'public/music/credits.json']:dest.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print('Activated',len(catalog),'titles;',len(set(s['artist'] for s in catalog)),'artist credits')
