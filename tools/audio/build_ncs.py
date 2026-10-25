"""Build the private vocal-music evaluation catalogue. Do not publish its recordings."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json,argparse
from build_catalog import build,ROOT
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int,default=100);parser.add_argument('--reuse-audio',action='store_true');parser.add_argument('--only-new',action='store_true');args=parser.parse_args()
 sources=json.loads((ROOT/'audio/catalog-ncs/sources.json').read_text())[:args.limit]
 for source in sources:source['reuseAudio']=args.reuse_audio
 active={s['id']:s for s in json.loads((ROOT/'src/data/catalog.json').read_text())}
 pending=[s for s in sources if not args.only_new or s['id'] not in active]
 with ThreadPoolExecutor(max_workers=3) as pool:new=list(pool.map(build,pending))
 by_id={**active,**{s['id']:s for s in new}}
 catalog=[by_id[s['id']] for s in sources]
 # Leave active catalogue untouched until every recording has completed.
 dest=ROOT/'artifacts/catalog/ncs-catalog.json';dest.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 print('VOCAL CATALOG READY',len(catalog),flush=True)
