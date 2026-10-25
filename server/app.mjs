import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { readFileSync, existsSync, mkdirSync, statSync, createReadStream } from 'node:fs'
import { dirname, resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GameEngine, WINDOWS } from '../src/lib/game-engine.js'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const hash=value=>createHash('sha256').update(value).digest('hex')
const fail=(status,message)=>Object.assign(new Error(message),{status})
export function createGameServer({database=resolve(root,'data/promotiles.sqlite'),now=Date.now,catalog=JSON.parse(readFileSync(resolve(root,'src/data/catalog.json'))),chartLoader,staticRoot=resolve(root,'dist')}={}) {
 if(database!==':memory:')mkdirSync(dirname(database),{recursive:true})
 const db=new DatabaseSync(database)
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, name TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS rounds(id TEXT PRIMARY KEY, player TEXT NOT NULL REFERENCES players(id), song TEXT NOT NULL, mode TEXT NOT NULL, started INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS scores(player TEXT NOT NULL REFERENCES players(id),song TEXT NOT NULL,mode TEXT NOT NULL,score INTEGER NOT NULL,accuracy INTEGER NOT NULL,combo INTEGER NOT NULL,holds INTEGER NOT NULL,played INTEGER NOT NULL,PRIMARY KEY(player,song,mode));`)
 const cache=new Map(),rate=new Map()
 function chart(song,mode){const key=song.id+mode;if(!cache.has(key))cache.set(key,chartLoader?chartLoader(song,mode):JSON.parse(readFileSync(resolve(root,'public',song.chartRoot.slice(1),mode+'.json'))));return cache.get(key)}
 function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))}
 async function body(req){let text='';for await(const part of req){text+=part;if(Buffer.byteLength(text)>300000)throw fail(413,'Partie trop volumineuse.')}try{return JSON.parse(text)}catch{throw fail(400,'Requête invalide.')}}
 const server=createServer(async(req,res)=>{
  try {
   const url=new URL(req.url,'http://local')
   if(url.pathname.startsWith('/api/')){
    // Same-origin writes only; no cross-origin access to the internal leaderboard.
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw fail(403,'Origine non autorisée.')
    if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,songs:catalog.length})
    if(req.method==='GET'&&url.pathname==='/api/leaderboard'){
     const song=url.searchParams.get('song'),mode=url.searchParams.get('mode')
     if(song&&!catalog.some(s=>s.id===song))throw fail(400,'Morceau inconnu.')
     if(mode&&!Object.hasOwn(WINDOWS,mode))throw fail(400,'Niveau inconnu.')
     const activeIds=catalog.map(s=>s.id)
     const where=[`s.song IN (${activeIds.map(()=>'?').join(',')||'NULL'})`,...(song?['s.song=?']:[]),...(mode?['s.mode=?']:[])].join(' AND ')
     const rows=db.prepare(`SELECT p.id,p.name,SUM(s.score) AS score,COUNT(*) AS performances,MAX(s.combo) AS combo FROM scores s JOIN players p ON p.id=s.player ${where?'WHERE '+where:''} GROUP BY p.id ORDER BY score DESC,p.name ASC LIMIT 50`).all(...activeIds,...[song,mode].filter(Boolean))
     return send(res,200,{rows})
    }
    if(req.method!=='POST')throw fail(404,'Route inconnue.')
    const address=req.socket.remoteAddress,window=Math.floor(now()/60000),key=address+window
    rate.set(key,(rate.get(key)||0)+1);if(rate.get(key)>150)throw fail(429,'Patientez un instant avant de réessayer.')
    if(rate.size>1000)for(const k of rate.keys())if(!k.endsWith(String(window)))rate.delete(k)
    const input=await body(req)
    if(!input||typeof input!=='object'||Array.isArray(input))throw fail(400,'Requête invalide.')
    if(url.pathname==='/api/session'){
     const token=randomBytes(32).toString('hex'),id=randomUUID(),name='Joueur '+id.slice(0,4).toUpperCase()
     db.prepare('INSERT INTO players VALUES(?,?,?)').run(id,hash(token),name)
     return send(res,201,{token,id,name})
    }
    const token=req.headers.authorization?.replace(/^Bearer /,'')
    const player=typeof token==='string'&&db.prepare('SELECT id,name FROM players WHERE token=?').get(hash(token))
    if(!player)throw fail(401,'Reconnectez votre profil.')
    if(url.pathname==='/api/profile'){
     if(typeof input.name!=='string'||input.name.trim().length<2||input.name.trim().length>24)throw fail(400,'Choisissez un pseudo de 2 à 24 caractères.')
     const name=input.name.trim();db.prepare('UPDATE players SET name=? WHERE id=?').run(name,player.id);return send(res,200,{name})
    }
    if(url.pathname==='/api/rounds'){
     const song=catalog.find(s=>s.id===input.songId)
     if(!song||!Object.hasOwn(WINDOWS,input.mode))throw fail(400,'Morceau ou niveau inconnu.')
     db.prepare('DELETE FROM rounds WHERE started<?').run(now()-86400000)
     const id=randomUUID();db.prepare('INSERT INTO rounds(id,player,song,mode,started) VALUES(?,?,?,?,?)').run(id,player.id,song.id,input.mode,now())
     return send(res,201,{roundId:id})
    }
    if(url.pathname==='/api/scores'){
     const round=db.prepare('SELECT * FROM rounds WHERE id=? AND player=?').get(input.roundId,player.id)
     if(!round||round.used)throw fail(409,'Cette partie est déjà enregistrée ou n’existe plus.')
     const song=catalog.find(s=>s.id===round.song)
     if(!song)throw fail(409,'Ce morceau ne fait plus partie de la collection active.')
     const data=chart(song,round.mode)
     if(now()-round.started<(data.durationSeconds-1)*1000)throw fail(400,'La partie n’est pas terminée.')
     if(now()-round.started>86400000)throw fail(400,'Cette partie a expiré.')
     const replay=input.replay
     if(!Array.isArray(replay)||replay.length>data.notes.length*12)throw fail(400,'Historique de partie invalide.')
     const engine=new GameEngine(data),held=new Set();let previous=-1
     for(const action of replay){
      if(!action||!['hit','release'].includes(action.kind)||!Number.isInteger(action.lane)||action.lane<0||action.lane>3||!Number.isFinite(action.time)||action.time<previous||action.time<0||action.time>data.durationSeconds+.5)throw fail(400,'Historique de partie invalide.')
      if(action.kind==='hit'){if(held.has(action.lane))throw fail(400,'Touche déjà maintenue.');held.add(action.lane)}else held.delete(action.lane)
      engine[action.kind](action.lane,action.time);previous=action.time
     }
     engine.advance(data.durationSeconds+1);const result=engine.result()
     db.exec('BEGIN')
     try{
      db.prepare('UPDATE rounds SET used=1 WHERE id=?').run(round.id)
      db.prepare(`INSERT INTO scores VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(player,song,mode) DO UPDATE SET score=excluded.score,accuracy=excluded.accuracy,combo=excluded.combo,holds=excluded.holds,played=excluded.played WHERE excluded.score>=scores.score`).run(player.id,round.song,round.mode,result.score,result.accuracy,result.maxCombo,result.holdsCompleted,now())
      db.exec('COMMIT')
     }catch(e){db.exec('ROLLBACK');throw e}
     return send(res,200,{result})
    }
    throw fail(404,'Route inconnue.')
   }
   if(!['GET','HEAD'].includes(req.method))throw fail(405,'Méthode indisponible.')
   let path=resolve(staticRoot,'.'+decodeURIComponent(url.pathname))
   if(path!==staticRoot&&!path.startsWith(staticRoot+sep))throw fail(403,'Chemin invalide.')
   if(!existsSync(path)||statSync(path).isDirectory()){
    if(extname(url.pathname))throw fail(404,'Fichier introuvable.')
    path=resolve(staticRoot,'index.html')
   }
   if(!existsSync(path))throw fail(404,'Exécutez npm run build avant npm start.')
   const size=statSync(path).size,types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.webmanifest':'application/manifest+json'}
   const headers={'Content-Type':types[extname(path)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':extname(path)==='.html'||path.endsWith('sw.js')?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff'}
   let start=0,end=size-1,status=200
   if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match)throw fail(416,'Plage invalide.');if(!match[1]){start=Math.max(0,size-Number(match[2]))}else{start=Number(match[1]);end=match[2]?Math.min(size-1,Number(match[2])):size-1}if(start>end||start>=size)throw fail(416,'Plage invalide.');status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`}
   headers['Content-Length']=end-start+1;res.writeHead(status,headers)
   if(req.method==='HEAD')res.end();else createReadStream(path,{start,end}).pipe(res)
  }catch(e){if(!res.headersSent)send(res,e.status||500,{error:e.status?e.message:'Le serveur est momentanément indisponible.'});else res.end()}
 })
 server.on('close',()=>db.close())
 return server
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||5175)
 createGameServer({database:process.env.PROMOTILES_DATABASE||resolve(root,'data/promotiles.sqlite')}).listen(port,'0.0.0.0',()=>console.log(`PromoTiles : http://localhost:${port}`))
}
