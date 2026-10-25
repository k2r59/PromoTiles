import concurrent.futures,json,urllib.request,urllib.parse,pathlib,time
ROOT=pathlib.Path(__file__).resolve().parents[2]
folder=ROOT/'artifacts/catalog/originals';folder.mkdir(parents=True,exist_ok=True)
def fetch(x):
 p=folder/x['filename']
 if not p.exists():
  url='https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+urllib.parse.quote(x['filename'])
  for attempt in range(3):
   try:
    with urllib.request.urlopen(url,timeout=60) as r:p.write_bytes(r.read())
    break
   except Exception:
    if attempt==2:raise
    time.sleep(1)
 print(x['title'],p.stat().st_size,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(fetch,json.load(open(ROOT/'audio/catalog/sources.json'))))
