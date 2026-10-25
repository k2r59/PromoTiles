import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { generateKeyPair, SignJWT } from 'jose'
import { createWorker } from '../worker/index.js'
import { cleanDiagnostic } from '../worker/diagnostics.js'
import { normalizeEmail, verifyAccess, verifyAccessToken, validateIdentity, fail } from '../worker/auth.js'
import {AMBIENT_TRACK} from '../src/lib/ambient-track.js'
function database(){
 const db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'))
 const wrap=(sql,args=[])=>({bind:(...values)=>wrap(sql,values),first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})})
 return {prepare:wrap,batch:async statements=>{db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}},raw:db}
}
const song={id:'test',revision:'r1',audioSha256:'audio',chartRoot:'/music/test'}
const chart={songId:'test',mode:'normal',audioSha256:'audio',durationSeconds:10,notes:[{id:'a',timeSeconds:1,lane:0,type:'hold',durationSeconds:1},{id:'b',timeSeconds:4,lane:1,type:'tap',durationSeconds:0}],scoring:{maxPoints:1000}}
const replay=[{kind:'hit',lane:0,time:1},{kind:'release',lane:0,time:2},{kind:'hit',lane:1,time:4},{kind:'release',lane:1,time:4.1}]
test('diagnostics retain playback facts but discard credentials, emails and unexpected data',()=>{
 assert.deepEqual(cleanDiagnostic({event:'audio.ended',current:.02,email:'alice@promo.dev',token:'secret',code:'alice@promo.dev',duration:NaN,hidden:true}),{event:'audio.ended',current:.02,hidden:true})
})
test('Cloudflare identity fails closed and enforces an exact verified email domain',async()=>{
 assert.equal(normalizeEmail(' Alice@PROMO.DEV '),'alice@promo.dev')
 for(const email of ['alice@promo.dev.evil','alice@sub.promo.dev','alice@@promo.dev','@promo.dev','alice@other.dev'])assert.throws(()=>normalizeEmail(email))
 assert.throws(()=>validateIdentity({email:'alice@promo.dev'},'promo.dev'))
 await assert.rejects(()=>verifyAccess(new Request('https://noel.promo.dev'),{}),{status:503})
 await assert.rejects(()=>verifyAccess(new Request('https://noel.promo.dev',{headers:{'Cf-Access-Authenticated-User-Email':'alice@promo.dev'}}),{ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'aud'}),{status:401})
 const worker=createWorker();let assetsRead=false
 const response=await worker.fetch(new Request('https://noel.promo.dev/music/catalog/audio.mp3'),{ASSETS:{fetch:()=>{assetsRead=true}},DB:database()})
 assert.equal(response.status,503);assert.equal(assetsRead,false)
})
test('D1 worker keeps one profile per verified email, immutable identity and private leaderboard',async()=>{
 const DB=database(),env={DB,ASSETS:{fetch:async()=>Response.json(chart)}}
 const worker=createWorker({songs:[song],identity:async req=>({email:normalizeEmail(req.headers.get('Test-Email'))})})
 const call=(path,body,email='Alice@promo.dev',headers={})=>worker.fetch(new Request('https://noel.promo.dev/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','Test-Email':email,...headers},body:body===undefined?undefined:JSON.stringify(body)}),env)
 try {
  const [a,b]=await Promise.all([call('session',{}).then(r=>r.json()),call('session',{},'alice@PROMO.DEV').then(r=>r.json())]);assert.equal(a.id,b.id)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) AS n FROM players').get().n,1)
  assert.equal((await call('profile',{avatar:'h-brun',name:'Camille',email:'someone@promo.dev'})).status,200)
  const profile=await (await call('me')).json();assert.equal(profile.email,'alice@promo.dev');assert.equal(profile.name,'Camille')
  assert.throws(()=>DB.raw.prepare('INSERT INTO players(id,email,name,created) VALUES(?,?,?,?)').run('x','ALICE@PROMO.DEV','Other',1))
  assert.equal((await call('me',undefined,'x@evil.dev')).status,403)
  assert.equal((await call('profile',{avatar:'h-brun',name:'Camille'},'alice@promo.dev',{Origin:'https://evil.dev'})).status,403)
  assert.equal((await call('profile',{})).status,400)
  assert.equal((await call('profile',[])).status,400)
  assert.equal((await call('leaderboard?mode=invalid')).status,400)
 }finally{DB.raw.close()}
})
test('D1 scores are recomputed, atomic under duplicate submission, revision-aware and persistent',async()=>{
 let clock=100000;const DB=database(),songs=[{...song}],env={DB,ASSETS:{fetch:async()=>Response.json(chart)}}
 const worker=createWorker({songs,now:()=>clock,identity:async req=>({email:normalizeEmail(req.headers.get('Test-Email'))})})
 const call=(path,body,email='alice@promo.dev')=>worker.fetch(new Request('https://noel.promo.dev/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','Test-Email':email},body:body===undefined?undefined:JSON.stringify(body)}),env)
 try{
  await call('profile',{avatar:'h-brun',name:'Alice'});
  const round=await(await call('rounds',{songId:'test',mode:'normal'})).json()
  assert.equal((await call('scores',{roundId:round.roundId,replay})).status,400)
  clock+=15000
  assert.equal((await call('scores',{roundId:round.roundId,replay},'bob@promo.dev')).status,409)
  assert.equal((await call('scores',{roundId:round.roundId,replay:[{kind:'hit',lane:8,time:1}]})).status,400)
  const responses=await Promise.all([call('scores',{roundId:round.roundId,replay,score:999999}),call('scores',{roundId:round.roundId,replay})])
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);const accepted=await responses.find(r=>r.status===200).json();assert.equal(accepted.result.score,1000)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM performances').get().n,1)
  assert.equal(DB.raw.prepare('SELECT used FROM rounds').get().used,1)
  const lower=await(await call('rounds',{songId:'test',mode:'normal'})).json();clock+=15000
  assert.equal((await call('scores',{roundId:lower.roundId,replay:[]})).status,200)
  const board=await(await call('leaderboard?song=test&mode=normal')).json();assert.equal(board.rows[0].score,1000);assert.ok(!('email' in board.rows[0]))
  assert.equal((await(await call('history')).json()).rows.length,2)
  assert.equal((await(await call('history',undefined,'bob@promo.dev')).json()).rows.length,0)
  const pending=await(await call('rounds',{songId:'test',mode:'normal'})).json();songs[0].revision='r2';clock+=15000
  assert.equal((await call('scores',{roundId:pending.roundId,replay})).status,409)
  assert.deepEqual((await(await call('leaderboard')).json()).rows,[])
  songs[0].revision='r1';assert.equal((await(await call('leaderboard')).json()).rows[0].score,1000)
  clock+=3*86400000;await worker.scheduled({},env)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM performances').get().n,2)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM rounds WHERE used=0').get().n,0)
 }finally{DB.raw.close()}
})

test('Access JWT verification rejects forged signatures, wrong audiences, issuers, domains and expiry',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256'),other=await generateKeyPair('RS256')
 const env={ACCESS_TEAM_DOMAIN:'promodev.cloudflareaccess.com',ACCESS_AUD:'test-aud',ALLOWED_EMAIL_DOMAIN:'promo.dev'}
 const sign=({email='alice@promo.dev',aud='test-aud',issuer='https://promodev.cloudflareaccess.com',expiry='5m',key=privateKey}={})=>new SignJWT({email}).setProtectedHeader({alg:'RS256'}).setSubject('verified-user').setAudience(aud).setIssuer(issuer).setExpirationTime(expiry).sign(key)
 assert.equal((await verifyAccessToken(await sign(),env,publicKey)).email,'alice@promo.dev')
 for(const options of [{aud:'other'},{issuer:'https://evil.dev'},{expiry:1},{key:other.privateKey},{email:'alice@promo.dev.evil'}])await assert.rejects(()=>sign(options).then(token=>verifyAccessToken(token,env,publicKey)))
})


test('nicknames are mandatory, normalized and atomically unique without losing identity',async()=>{
 const DB=database(),env={DB},worker=createWorker({songs:[song],identity:async req=>({email:req.headers.get('Test-Email')})})
 const call=(email,path,data)=>worker.fetch(new Request('https://noel.promo.dev/api/'+path,{method:data?'POST':'GET',headers:{'Test-Email':email,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined}),env)
 try{
  assert.equal((await call('a@promo.dev','rounds',{songId:'test',mode:'normal'})).status,403)
  for(const name of ['', ' ', 'a', 'a'.repeat(25), '<script>'])assert.equal((await call('a@promo.dev','profile',{name})).status,400)
  const results=await Promise.all([call('a@promo.dev','profile',{avatar:'h-brun',name:'Étoile'}),call('b@promo.dev','profile',{avatar:'h-brun',name:'  ETOILE '})])
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409])
  const winner=results[0].status===200?'a@promo.dev':'b@promo.dev',loser=winner==='a@promo.dev'?'b@promo.dev':'a@promo.dev'
  assert.equal((await call(winner,'profile',{avatar:'h-brun',name:'éTOILE'})).status,200)
  assert.equal((await call(loser,'profile',{avatar:'h-brun',name:'Étoile'})).status,409)
  assert.equal((await call(loser,'profile',{avatar:'h-brun',name:'Comète'})).status,200)
  assert.equal((await (await call(winner,'me')).json()).nicknameReady,true)
  assert.equal((await call(winner,'rounds',{songId:'test',mode:'normal'})).status,201)
 }finally{DB.raw.close()}
})

test('native email login protects data, consumes OTP once, revokes logout and limits guesses',async()=>{
 let now=1000000;const DB=database(),mail=[]
 const env={DB,AUTH_MODE:'native',AUTH_PEPPER:'test-only-pepper',EMAIL:{send:async m=>mail.push(m)},ASSETS:{fetch:async()=>new Response('shell')}}
 const worker=createWorker({now:()=>now})
 const call=(path,data,cookie,extra={})=>worker.fetch(new Request('https://noel.promo.dev'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},body:data?JSON.stringify(data):undefined}),env)
 const send=async email=>{const response=await call('/api/auth/code',{email});assert.equal(response.status,200);const result=await response.json();assert.ok(!('code' in result));return {challenge:result.challenge,code:mail.at(-1).text.match(/\d{6}/)[0]}}
 try{
  assert.equal((await call('/')).status,200)
  for(const path of ['/api/me','/api/leaderboard','/music/catalog/audio.mp3','/%6dusic/catalog/audio.mp3'])assert.equal((await call(path)).status,401)
  assert.equal((await call('/api/auth/code',{email:'intrus@evil.dev'})).status,403)
  assert.equal((await call('/api/auth/code',{email:'a@promo.dev'},null,{Origin:'https://evil.dev'})).status,403)
  const proof=await send(' Alice@PROMO.DEV ')
  assert.equal((await call('/api/auth/code',{email:'alice@promo.dev'})).status,429)
  const attempts=await Promise.all([call('/api/auth/verify',proof),call('/api/auth/verify',proof)])
  assert.deepEqual(attempts.map(r=>r.status).sort(),[200,400])
  const response=attempts.find(r=>r.status===200),header=response.headers.get('Set-Cookie')
  for(const part of ['__Host-promotiles_session=','HttpOnly','Secure','SameSite=Strict','Path=/'])assert.ok(header.includes(part))
  const cookie=header.split(';')[0],me=await(await call('/api/me',undefined,cookie)).json()
  assert.equal(me.email,'alice@promo.dev');assert.equal(me.nicknameReady,false)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM players').get().n,1)
  assert.equal((await call('/api/auth/logout',{},cookie)).status,200)
  assert.equal((await call('/api/me',undefined,cookie)).status,401)
  now+=61000
  const proof2=await send('alice@promo.dev')
  const wrong=proof2.code==='000000'?'111111':'000000'
  for(let i=0;i<5;i++)assert.equal((await call('/api/auth/verify',{...proof2,code:wrong})).status,400)
  assert.equal((await call('/api/auth/verify',proof2)).status,400)
  now+=61000
  const proof3=await send('alice@promo.dev');now+=600001
  assert.equal((await call('/api/auth/verify',proof3)).status,400)
  now+=61000
  const proof4=await send('alice@promo.dev'),signed=await call('/api/auth/verify',proof4)
  const cookie2=signed.headers.get('Set-Cookie').split(';')[0]
  assert.equal((await(await call('/api/me',undefined,cookie2)).json()).id,me.id)
  now+=7*86400000+1
  assert.equal((await call('/api/me',undefined,cookie2)).status,401)
 }finally{DB.raw.close()}
})


test('fresh app entry bypasses old navigation caches without exposing private routes',async()=>{
 const DB=database(),paths=[],env={DB,AUTH_MODE:'native',ASSETS:{fetch:async req=>{paths.push(new URL(req.url).pathname);return new Response('<!doctype html><title>promoTiles</title>',{headers:{'Content-Type':'text/html'}})}}}
 const worker=createWorker()
 try{
  const page=await worker.fetch(new Request('https://noel.promo.dev/api/app'),env)
  assert.equal(page.status,200);assert.equal(page.headers.get('Cache-Control'),'private, no-store');assert.deepEqual(paths,['/'])
  assert.equal((await worker.fetch(new Request('https://noel.promo.dev'+AMBIENT_TRACK),env)).status,200)
  for(const path of ['/api/me','/api/app/private','/music/private.mp3'])assert.equal((await worker.fetch(new Request('https://noel.promo.dev'+path),env)).status,401)
  assert.equal((await worker.fetch(new Request('https://noel.promo.dev/api/app',{method:'POST'}),env)).status,405)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM players').get().n,0)
 }finally{DB.raw.close()}
})

test('deleted accounts revoke sessions and pending codes and cannot be recreated by an old cookie',async()=>{
 let now=1000000;const DB=database(),mail=[],env={DB,AUTH_MODE:'native',AUTH_PEPPER:'test-only-pepper',EMAIL:{send:async m=>mail.push(m)},ASSETS:{fetch:async()=>new Response('private asset')}}
 const worker=createWorker({now:()=>now})
 const call=(path,data,cookie)=>worker.fetch(new Request('https://noel.promo.dev'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined}),env)
 const code=async()=>{const response=await call('/api/auth/code',{email:'deleted@promo.dev'});assert.equal(response.status,200);return {...await response.json(),code:mail.at(-1).text.match(/\d{6}/)[0]}}
 try{
  const proof=await code(),signed=await call('/api/auth/verify',proof)
  const cookie=signed.headers.get('Set-Cookie').split(';')[0]
  const first=await(await call('/api/me',undefined,cookie)).json()
  now+=61000;const pendingCode=await code()
  DB.raw.prepare('DELETE FROM players WHERE id=?').run(first.id)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM auth_sessions').get().n,0)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM auth_codes').get().n,0)
  for(const [path,data] of [['/api/me'],['/api/session',{}],['/api/profile',{name:'Resurrected',avatar:'h-brun'}],['/api/rounds',{songId:'test',mode:'normal'}],['/music/private.mp3']]){
   const result=await call(path,data,cookie);assert.equal(result.status,401);assert.equal((await result.json()).code,'SESSION_INVALID');assert.ok(result.headers.get('Set-Cookie').includes('Max-Age=0'))
  }
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM players').get().n,0)
  assert.equal((await call('/api/auth/verify',pendingCode)).status,400)
  now+=61000;const fresh=await call('/api/auth/verify',await code())
  const freshCookie=fresh.headers.get('Set-Cookie').split(';')[0]
  const second=await(await call('/api/me',undefined,freshCookie)).json()
  assert.notEqual(second.id,first.id);assert.equal(second.email,'deleted@promo.dev')
  assert.equal((await call('/api/me',undefined,cookie)).status,401)
 }finally{DB.raw.close()}
})

test('test email delivery alias preserves a separate account and cannot redirect other identities',async()=>{
 const DB=database(),mail=[],env={DB,AUTH_MODE:'native',AUTH_PEPPER:'test-only-pepper',EMAIL:{send:async m=>mail.push(m)}}
 const worker=createWorker({now:()=>1000000})
 const call=(path,data,cookie)=>worker.fetch(new Request('https://noel.promo.dev/api/'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined}),env)
 async function login(email){
  const sent=await call('auth/code',{email,to:'intruder@evil.dev',recipient:'intruder@evil.dev'})
  assert.equal(sent.status,200)
  const {challenge}=await sent.json(),message=mail.at(-1)
  const signed=await call('auth/verify',{challenge,code:message.text.match(/\d{6}/)[0]})
  assert.equal(signed.status,200)
  const cookie=signed.headers.get('Set-Cookie').split(';')[0]
  return {message,profile:await(await call('me',undefined,cookie)).json()}
 }
 try{
  const alias=await login(' TEST@PROMO.DEV ')
  assert.equal(alias.message.to,'herve.colard@promo.dev')
  assert.equal(alias.profile.email,'test@promo.dev')
  assert.equal(DB.raw.prepare('SELECT email FROM auth_codes').get().email,'test@promo.dev')
  assert.equal(DB.raw.prepare('SELECT email FROM auth_sessions').get().email,'test@promo.dev')
  assert.equal((await call('auth/code',{email:'test@promo.dev'})).status,429)
  const owner=await login('herve.colard@promo.dev')
  assert.equal(owner.message.to,'herve.colard@promo.dev')
  assert.equal(owner.profile.email,'herve.colard@promo.dev')
  assert.notEqual(owner.profile.id,alias.profile.id)
  const ordinary=await login('test.other@promo.dev')
  assert.equal(ordinary.message.to,'test.other@promo.dev')
  assert.equal(ordinary.profile.email,'test.other@promo.dev')
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM players').get().n,3)
 }finally{DB.raw.close()}
})

test('score audit rejects copied long recordings and impossible input rates without changing scoring',async()=>{
 let now=100000;const DB=database(),longChart={...chart,notes:Array.from({length:20},(_,i)=>({id:String(i),timeSeconds:1+i*.35,lane:i%4,type:'tap',durationSeconds:0}))}
 const env={DB,ASSETS:{fetch:async()=>Response.json(longChart)}},worker=createWorker({songs:[song],now:()=>now,identity:async()=>({email:'qa@promo.dev'})})
 const call=(path,data)=>worker.fetch(new Request('https://noel.promo.dev/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),env)
 const makeRound=async()=>{const r=await(await call('rounds',{songId:'test',mode:'normal'})).json();now+=15000;return r.roundId}
 const replay=longChart.notes.flatMap(n=>[{kind:'hit',lane:n.lane,time:n.timeSeconds},{kind:'release',lane:n.lane,time:n.timeSeconds+.03}])
 try{
  assert.equal((await call('profile',{name:'QA',avatar:'unknown'})).status,400)
  assert.equal((await call('profile',{name:'QA',avatar:'h-chauve'})).status,200)
  const first=await call('scores',{roundId:await makeRound(),replay,score:999999})
  assert.equal(first.status,200);assert.equal((await first.json()).result.score,1000)
  const copy=await call('scores',{roundId:await makeRound(),replay});assert.equal(copy.status,409)
  assert.equal(DB.raw.prepare('SELECT COUNT(*) n FROM performances').get().n,1)
  const legitimate=replay.map(action=>({...action,time:action.time+.002}))
  const distinct=await call('scores',{roundId:await makeRound(),replay:legitimate});assert.equal(distinct.status,200);assert.equal((await distinct.json()).result.score,1000)
  const spam=Array.from({length:61},(_,i)=>[{kind:'hit',lane:0,time:i*.01},{kind:'release',lane:0,time:i*.01+.001}]).flat()
  assert.equal((await call('scores',{roundId:await makeRound(),replay:spam})).status,400)
  const reasons=DB.raw.prepare('SELECT reason FROM anti_cheat_events').all().map(r=>r.reason)
  assert.ok(reasons.includes('reused-recording'));assert.ok(reasons.includes('input-rate'))
 }finally{DB.raw.close()}
})
