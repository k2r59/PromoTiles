import { fail, normalizeEmail } from './auth.js'
import { loginEmail } from './login-email.js'
const MINUTE=60000, SESSION_MS=7*86400000
// Explicit delivery alias only. Challenges, sessions and profiles retain the login email.
const codeRecipient=email=>email==='test@promo.dev'?'herve.colard@promo.dev':email
const encoder=new TextEncoder()
export async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),b=>b.toString(16).padStart(2,'0')).join('')}
function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')}
function otp(){let n;do{n=crypto.getRandomValues(new Uint32Array(1))[0]}while(n>=4294000000);return String(n%1000000).padStart(6,'0')}
function cookieName(env){return env.LOCAL_AUTH==='true'?'promotiles_session':'__Host-promotiles_session'}
function cookie(request,env){return request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(env)+'='))?.split('=')[1]}
function cookieHeader(value,env,maxAge){return `${cookieName(env)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${env.LOCAL_AUTH==='true'?'':'; Secure'}`}
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}})
export function sameOrigin(request){
 const origin=request.headers.get('Origin')
 if(origin&&origin!==new URL(request.url).origin)throw fail(403,'Origine non autorisée.')
 if(request.headers.get('Sec-Fetch-Site')==='cross-site')throw fail(403,'Origine non autorisée.')
}
async function limit(env,key,max,period,now){
 const bucket=`auth:${key}:${Math.floor(now/period)}`
 const row=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+period*2).first()
 if(row.count>max)throw fail(429,'Trop de tentatives. Patientez quelques minutes avant de réessayer.')
}
export async function verifySession(request,env,now=Date.now()){
 const token=cookie(request,env)
 if(!token||!/^[a-f0-9]{64}$/.test(token))throw fail(401,'Connectez-vous pour retrouver votre espace.')
 const row=await env.DB.prepare('SELECT email FROM auth_sessions WHERE digest=? AND expires>?').bind(await digest(token),now).first()
 if(!row)throw fail(401,'Votre session a expiré. Reconnectez-vous.')
 return {email:normalizeEmail(row.email,env.ALLOWED_EMAIL_DOMAIN||'promo.dev')}
}
export async function authRoute(request,env,readBody,now=Date.now()){
 const path=new URL(request.url).pathname
 if(!path.startsWith('/api/auth/'))return null
 if(request.method!=='POST')throw fail(405,'Méthode indisponible.')
 sameOrigin(request)
 if(path==='/api/auth/logout'){
  const token=cookie(request,env)
  if(token)await env.DB.prepare('DELETE FROM auth_sessions WHERE digest=?').bind(await digest(token)).run()
  return json({ok:true},200,{'Set-Cookie':cookieHeader('',env,0)})
 }
 const input=await readBody(request)
 const ip=await digest(request.headers.get('CF-Connecting-IP')||'local')
 await limit(env,'ip:'+ip,60,10*MINUTE,now)
 if(path==='/api/auth/code'){
  const email=normalizeEmail(input.email,env.ALLOWED_EMAIL_DOMAIN||'promo.dev')
  await limit(env,'send:'+await digest(email),1,MINUTE,now)
  await limit(env,'hour:'+await digest(email),8,60*MINUTE,now)
  if(!env.EMAIL?.send||!env.AUTH_PEPPER)throw fail(503,'L’envoi des codes est momentanément indisponible. Réessayez un peu plus tard.')
  const id=randomToken(),code=otp(),expires=now+10*MINUTE
  await env.DB.prepare('UPDATE auth_codes SET consumed=1 WHERE email=?').bind(email).run()
  await env.DB.prepare('INSERT INTO auth_codes(id,email,digest,expires) VALUES(?,?,?,?)').bind(id,email,await digest(env.AUTH_PEPPER+':'+id+':'+code),expires).run()
  try{
   await env.EMAIL.send({from:{email:env.AUTH_FROM||'connexion@noel.promo.dev',name:'promoTiles · Promo.dev'},to:codeRecipient(email),...loginEmail(code)})
  }catch{
   await env.DB.prepare('UPDATE auth_codes SET consumed=1 WHERE id=?').bind(id).run()
   throw fail(503,'L’e-mail n’a pas pu être envoyé. Réessayez dans une minute.')
  }
  return json({challenge:id,expiresIn:600,resendAfter:60})
 }
 if(path==='/api/auth/verify'){
  if(typeof input.challenge!=='string'||!/^[a-f0-9]{64}$/.test(input.challenge)||typeof input.code!=='string'||!/^\d{6}$/.test(input.code))throw fail(400,'Saisissez le code à 6 chiffres reçu par e-mail.')
  if(!env.AUTH_PEPPER)throw fail(503,'Connexion momentanément indisponible.')
  const hash=await digest(env.AUTH_PEPPER+':'+input.challenge+':'+input.code)
  // Atomic attempt counter and consumption: only one concurrent request can claim a code.
  const row=await env.DB.prepare('UPDATE auth_codes SET attempts=attempts+1,consumed=CASE WHEN digest=? THEN 1 ELSE 0 END WHERE id=? AND consumed=0 AND expires>? AND attempts<5 RETURNING email,consumed').bind(hash,input.challenge,now).first()
  if(!row?.consumed)throw fail(400,'Code incorrect ou expiré. Après 5 essais, demandez un nouveau code.')
  const token=randomToken(),old=cookie(request,env)
  if(old)await env.DB.prepare('DELETE FROM auth_sessions WHERE digest=?').bind(await digest(old)).run()
  await env.DB.prepare('INSERT INTO auth_sessions(digest,email,created,expires) VALUES(?,?,?,?)').bind(await digest(token),row.email,now,now+SESSION_MS).run()
  return json({ok:true},200,{'Set-Cookie':cookieHeader(token,env,SESSION_MS/1000)})
 }
 throw fail(404,'Route inconnue.')
}
