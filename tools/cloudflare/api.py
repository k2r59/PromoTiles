"""Authenticated Cloudflare API helper. Credentials are never printed."""
import json, os, sys, tomllib, urllib.request, urllib.error
from pathlib import Path
ACCOUNT='d5d57d15751e093b840fcd28077f1f1f'
def api(path,method='GET',data=None):
 token=os.environ.get('CLOUDFLARE_API_TOKEN')
 if not token:
  config=Path.home()/'Library/Preferences/.wrangler/config/default.toml'
  token=tomllib.loads(config.read_text())['oauth_token']
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path.lstrip('/'),data=json.dumps(data).encode() if data is not None else None,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method=method)
 try:
  with urllib.request.urlopen(req,timeout=45) as r:return json.load(r)
 except urllib.error.HTTPError as e:return {'status':e.code,'response':json.loads(e.read())}
if __name__=='__main__':
 result=api(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else 'GET',json.loads(Path(sys.argv[3]).read_text()) if len(sys.argv)>3 else None)
 print(json.dumps(result,ensure_ascii=False,indent=2))
