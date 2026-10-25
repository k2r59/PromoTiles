import {createServer} from 'node:http'
import {DatabaseSync} from 'node:sqlite'
import {readFileSync,readdirSync,existsSync,mkdirSync,writeFileSync,statSync} from 'node:fs'
import {resolve,dirname,extname,sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import {randomBytes} from 'node:crypto'
import {createWorker} from '../worker/index.js'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
export function createNativeServer({database=resolve(root,'data/promotiles-native.sqlite'),sendEmail,staticRoot=resolve(root,'dist')}={}){
 if(database!==':memory:')mkdirSync(dirname(database),{recursive:true})
 const db=new DatabaseSync(database)
 db.exec('PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)')
 for(const name of readdirSync(resolve(root,'migrations')).filter(s=>s.endsWith('.sql')).sort()){
  if(db.prepare('SELECT name FROM local_migrations WHERE name=?').get(name))continue
  db.exec('BEGIN');try{db.exec(readFileSync(resolve(root,'migrations',name),'utf8'));db.prepare('INSERT INTO local_migrations VALUES(?)').run(name);db.exec('COMMIT')}catch(error){db.exec('ROLLBACK');throw error}
 }
 const wrap=(sql,args=[])=>({bind:(...v)=>wrap(sql,v),first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})})
 const DB={prepare:wrap,batch:async statements=>{db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());db.exec('COMMIT');return result}catch(error){db.exec('ROLLBACK');throw error}}}
 const env={DB,AUTH_MODE:'native',LOCAL_AUTH:'true',AUTH_PEPPER:randomBytes(32).toString('hex'),ALLOWED_EMAIL_DOMAIN:'promo.dev',EMAIL:{send:sendEmail|| (async message=>{mkdirSync(resolve(root,'data'),{recursive:true});writeFileSync(resolve(root,'data/dev-auth-email.json'),JSON.stringify(message,null,2),{mode:0o600});console.log('Code local disponible dans data/dev-auth-email.json (aucun e-mail envoyé).')})},ASSETS:{fetch:async request=>{
  const url=new URL(request.url),base=url.pathname.startsWith('/music/')?resolve(root,'public'):staticRoot
  let path=resolve(base,'.'+decodeURIComponent(url.pathname))
  if(!path.startsWith(base+sep))path=resolve(base,'index.html')
  if(!existsSync(path)||statSync(path).isDirectory()){if(extname(url.pathname))return new Response('Introuvable',{status:404});path=resolve(base,'index.html')}
  if(!existsSync(path))return new Response('Build requis',{status:404})
  const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.webmanifest':'application/manifest+json'}
  return new Response(readFileSync(path),{headers:{'Content-Type':types[extname(path)]||'application/octet-stream'}})
 }}}
 const worker=createWorker()
 const server=createServer(async(req,res)=>{
  try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>300000){res.writeHead(413);res.end();return}chunks.push(chunk)}
   const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})})
   const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))
  }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Serveur local indisponible.'}))}
 })
 server.on('close',()=>db.close());return server
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createNativeServer().listen(Number(process.env.PORT||5175),'0.0.0.0',()=>console.log('PromoTiles : authentification locale prête'))
