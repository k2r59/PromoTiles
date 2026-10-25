import catalog from '../src/data/catalog.json' with { type: 'json' }
import { GameEngine, WINDOWS } from '../src/lib/game-engine.js'
import { verifyAccess, fail } from './auth.js'
import { authRoute, verifySession, sameOrigin, clearSessionCookie } from './native-auth.js'
import { auditReplay } from './anti-cheat.js'
import { avatars } from '../src/lib/avatars.js'
import { nickname } from '../src/lib/nickname.js'
import { cleanDiagnostic } from './diagnostics.js'
const DAY = 86400000
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'} })
async function body(request) {
 if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw fail(415, 'Une requête JSON est attendue.')
 const reader=request.body?.getReader(); let size=0; const chunks=[]
 if (!reader) throw fail(400,'Requête invalide.')
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>300000){await reader.cancel();throw fail(413,'Partie trop volumineuse.')}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 let data;try{data=JSON.parse(new TextDecoder().decode(bytes))}catch{throw fail(400,'Requête invalide.')}
 if(!data||typeof data!=='object'||Array.isArray(data))throw fail(400,'Requête invalide.')
 return data
}
export function validateReplay(data,replay) {
 if(!Array.isArray(replay)||replay.length>data.notes.length*12)throw fail(400,'Historique de partie invalide.')
 const engine=new GameEngine(data),held=new Set();let previous=-1
 for(const action of replay){
  if(!action||!['hit','release'].includes(action.kind)||!Number.isInteger(action.lane)||action.lane<0||action.lane>3||!Number.isFinite(action.time)||action.time<previous||action.time<0||action.time>data.durationSeconds+.5)throw fail(400,'Historique de partie invalide.')
  if(action.kind==='hit'){if(held.has(action.lane))throw fail(400,'Touche déjà maintenue.');held.add(action.lane)}else held.delete(action.lane)
  engine[action.kind](action.lane,action.time);previous=action.time
 }
 engine.advance(data.durationSeconds+1);return engine.result()
}
export function createWorker({songs=catalog,identity=null,now=Date.now}={}) {
 const charts=new Map()
 async function getChart(song,mode,request,env){
  const key=song.id+':'+mode+':'+song.revision
  if(!charts.has(key)){
   const response=await env.ASSETS.fetch(new Request(new URL(song.chartRoot+'/'+mode+'.json',request.url)))
   if(!response.ok)throw fail(503,'Partition momentanément indisponible.')
   const chart=await response.json()
   if(chart.songId!==song.id||chart.mode!==mode||chart.audioSha256!==song.audioSha256)throw fail(503,'Partition incohérente.')
   charts.set(key,chart)
  }
  return charts.get(key)
 }
 async function playerFor(email,env,provision,playerId){
  if(provision)await env.DB.prepare('INSERT INTO players(id,email,name,created) VALUES(?,?,?,?) ON CONFLICT(email) DO NOTHING').bind(crypto.randomUUID(),email,'Joueur '+email.split('@')[0].slice(0,16),now()).run()
  const player=await env.DB.prepare('SELECT id,email,name,nickname_key,avatar FROM players WHERE email=?').bind(email).first()
  if(!player||(playerId&&player.id!==playerId))throw Object.assign(fail(401,'Votre compte n’existe plus. Reconnectez-vous.'),{code:'SESSION_INVALID'})
  return {id:player.id,email:player.email,name:player.name,avatar:player.avatar,nicknameReady:!!player.nickname_key}
 }
 return { async fetch(request,env) {
  const url=new URL(request.url),requestId=crypto.randomUUID(),requestStarted=Date.now()
  if(url.pathname.startsWith('/api/'))console.info(JSON.stringify({event:'api.request',requestId,method:request.method,path:url.pathname}))
  try {
   // Only the login shell and its decorative assets are public in native mode.
   const native=env.AUTH_MODE==='native'
   if(native){const response=await authRoute(request,env,body,now());if(response)return response}
   const publicShell=/^\/(?:$|index\.html$|manifest\.webmanifest$|sw\.js$|icon\.svg$|(?:winter-night|winter-mobile|piano-snowglobe-clear|piano-snowglobe|santa-sleigh|crystal-podium)\.webp$|icons\/[a-zA-Z0-9_-]+\.png$|avatars\/[a-z-]+\.webp$|assets\/[a-zA-Z0-9_.-]+$)/.test(url.pathname)
   const protectedPath=!publicShell
   const user=identity?await identity(request,env):native?(protectedPath?await verifySession(request,env,now()):null):await verifyAccess(request,env)
   if(!url.pathname.startsWith('/api/')){
    if(!['GET','HEAD'].includes(request.method))throw fail(405,'Méthode indisponible.')
    const response=await env.ASSETS.fetch(request)
    const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin')
    return new Response(response.body,{status:response.status,headers})
   }
   sameOrigin(request)
   if(request.method==='GET'&&url.pathname==='/api/health')return json({ok:true,songs:songs.length,storage:'D1',auth:native?'email-code':'cloudflare-access'})
   if(!['GET','POST'].includes(request.method))throw fail(405,'Méthode indisponible.')
   const player=await playerFor(user.email,env,!!identity||!native,user.playerId)
   if(request.method==='GET'){
    if(url.pathname==='/api/me')return json(player)
    if(url.pathname==='/api/history'){
     const {results}=await env.DB.prepare('SELECT song,mode,score,accuracy,combo,holds,played FROM performances WHERE player=? ORDER BY played DESC LIMIT 50').bind(player.id).all()
     return json({rows:results})
    }
    if(url.pathname==='/api/leaderboard'){
     const song=url.searchParams.get('song'),mode=url.searchParams.get('mode')
     if(song&&!songs.some(s=>s.id===song))throw fail(400,'Morceau inconnu.')
     if(mode&&!Object.hasOwn(WINDOWS,mode))throw fail(400,'Niveau inconnu.')
     const active=songs.filter(s=>!song||s.id===song)
     const where="EXISTS (SELECT 1 FROM json_each(?) a WHERE json_extract(a.value,'$.id')=s.song AND json_extract(a.value,'$.revision')=s.revision)"
     const args=[JSON.stringify(active.map(s=>({id:s.id,revision:s.revision})))];if(mode)args.push(mode)
     const {results}=await env.DB.prepare(`SELECT p.id,p.name,p.avatar,SUM(s.score) AS score,COUNT(*) AS performances,MAX(s.combo) AS combo FROM scores s JOIN players p ON p.id=s.player WHERE (${where}) ${mode?'AND s.mode=?':''} GROUP BY p.id ORDER BY score DESC,p.name ASC,p.id ASC LIMIT 50`).bind(...args).all()
     return json({rows:results})
    }
    throw fail(404,'Route inconnue.')
   }
   const window=Math.floor(now()/60000),key=player.id+':'+window
   const rate=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now()+120000).first()
   if(rate.count>120)throw fail(429,'Patientez un instant avant de réessayer.')
   const input=await body(request)
   if(url.pathname==='/api/diagnostics'){
    if(!Array.isArray(input.events)||input.events.length>40)throw fail(400,'Diagnostic invalide.')
    console.info(JSON.stringify({event:'client.diagnostics',requestId,events:input.events.map(cleanDiagnostic)}))
    return json({ok:true})
   }
   if(url.pathname==='/api/session')return json(player)
   if(url.pathname==='/api/profile'){
    const {name,key}=nickname(input.name)
    const avatar=input.avatar??player.avatar
    if(!avatars.some(a=>a.id===avatar))throw fail(400,'Choisissez votre avatar de Noël.')
    try{await env.DB.prepare('UPDATE players SET name=?,nickname_key=?,avatar=? WHERE id=?').bind(name,key,avatar,player.id).run()}catch(error){if(String(error.message).includes('UNIQUE constraint failed'))throw fail(409,'Ce pseudo est déjà pris. Choisissez-en un autre.');throw error}
    return json({...player,name,avatar,nicknameReady:true})
   }
   if(url.pathname==='/api/rounds'){
    if(!player.nicknameReady)throw fail(403,'Choisissez votre pseudo avant de lancer une partie.')
    const song=songs.find(s=>s.id===input.songId)
    if(!song||!Object.hasOwn(WINDOWS,input.mode))throw fail(400,'Morceau ou niveau inconnu.')
    const id=crypto.randomUUID()
    await env.DB.prepare('INSERT INTO rounds(id,player,song,mode,revision,started) VALUES(?,?,?,?,?,?)').bind(id,player.id,song.id,input.mode,song.revision,now()).run()
    console.info(JSON.stringify({event:'round.created',requestId,roundId:id,song:song.id,mode:input.mode}))
    return json({roundId:id},201)
   }
   if(url.pathname==='/api/scores'){
    const round=await env.DB.prepare('SELECT * FROM rounds WHERE id=? AND player=?').bind(input.roundId??'',player.id).first()
    if(!round||round.used)throw fail(409,'Cette partie est déjà enregistrée ou n’existe plus.')
    const song=songs.find(s=>s.id===round.song)
    if(!song||song.revision!==round.revision)throw fail(409,'Ce morceau a été mis à jour. Recommencez une partie.')
    const chart=await getChart(song,round.mode,request,env)
    if(now()-round.started<(chart.durationSeconds-1)*1000)throw fail(400,'La partie n’est pas terminée.')
    if(now()-round.started>DAY)throw fail(400,'Cette partie a expiré.')
    let result,audit
    try{result=validateReplay(chart,input.replay);audit=await auditReplay(song,round.mode,chart,input.replay)}catch(error){
     if(error.status===400)await env.DB.prepare('INSERT INTO anti_cheat_events VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),player.id,round.id,error.antiCheat||'invalid-replay',now()).run()
     throw error
    }
    let saved;try{saved=await env.DB.prepare(`INSERT INTO performances(round_id,player,song,mode,revision,score,accuracy,combo,holds,played,result_json,replay_hash,audit_flags) SELECT id,player,song,mode,revision,?,?,?,?,?,?,?,? FROM rounds WHERE id=? AND player=? AND used=0`).bind(result.score,result.accuracy,result.maxCombo,result.holdsCompleted,now(),JSON.stringify(result),audit.fingerprint,JSON.stringify(audit.flags),round.id,player.id).run()}catch(error){
     if(String(error.message).includes('UNIQUE constraint failed')){
      await env.DB.prepare('INSERT INTO anti_cheat_events VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),player.id,round.id,'reused-recording',now()).run()
      throw fail(409,'Cette partie ou cet historique a déjà été enregistré.')
     }throw error
    }
    if(!saved.meta.changes)throw fail(409,'Cette partie est déjà enregistrée.')
    console.info(JSON.stringify({event:'score.saved',requestId,roundId:round.id,score:result.score,inputs:input.replay.length}))
    return json({result})
   }
   throw fail(404,'Route inconnue.')
  }catch(error){
   console.warn(JSON.stringify({event:'request.failed',requestId,path:url.pathname,status:error.status||500,code:error.name,elapsedMs:Date.now()-requestStarted}))
   const response=json({error:error.status?error.message:'Le serveur est momentanément indisponible.',...(error.code==='SESSION_INVALID'?{code:error.code}:{})},error.status||500)
   if(error.code==='SESSION_INVALID'&&env.AUTH_MODE==='native')response.headers.set('Set-Cookie',clearSessionCookie(env))
   return response
  }
 }, async scheduled(_event,env){
  await env.DB.batch([
   env.DB.prepare('DELETE FROM rate_limits WHERE expires<?').bind(now()),
   env.DB.prepare('DELETE FROM auth_codes WHERE expires<?').bind(now()),
   env.DB.prepare('DELETE FROM auth_sessions WHERE expires<?').bind(now()),
   env.DB.prepare('DELETE FROM rounds WHERE used=0 AND started<?').bind(now()-2*DAY)
  ])
 }}
}
export default createWorker()
