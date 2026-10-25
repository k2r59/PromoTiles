import { diagnostic } from './diagnostics.js'
let session, pending
try { localStorage.removeItem('promodev-session') } catch {}
async function request(path,data,authenticated=true){
 const started=performance.now();diagnostic('api.request',{route:path.split('?')[0]});
 let response;try{response=await fetch('/api/'+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...(authenticated&&session?.token?{Authorization:'Bearer '+session.token}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(7000)})}catch(error){diagnostic('api.network-error',{route:path.split('?')[0],code:error.name});throw error}
 diagnostic('api.response',{route:path.split('?')[0],status:response.status,elapsedMs:Math.round(performance.now()-started),redirected:response.redirected})
 if(response.redirected||!response.headers.get('Content-Type')?.includes('application/json'))throw Object.assign(Error('Votre connexion a expiré. Rechargez le jeu pour vous reconnecter.'),{status:401})
 if(!response.ok){let message='Le classement partagé est indisponible.';try{message=(await response.json()).error||message}catch{};throw Object.assign(Error(message),{status:response.status})}
 return response.json()
}
export async function connect(){
 pending??=request('me').then(value=>{session=value;return value}).finally(()=>pending=null)
 return pending
}
export async function saveNickname(name,avatar){const value=await request('profile',{name,avatar});session={...session,...value};return session}
export function requestCode(email){return request('auth/code',{email},false)}
export function verifyCode(challenge,code){return request('auth/verify',{challenge,code},false)}
export async function beginRound(songId,mode){await connect();return request('rounds',{songId,mode})}
export function submitRound(roundId,replay){return request('scores',{roundId,replay})}
export function leaderboard(songId,mode){const params=new URLSearchParams();if(songId)params.set('song',songId);if(mode)params.set('mode',mode);return request('leaderboard?'+params,undefined,false)}
export function currentPlayer(){return session?.id}

export async function loadIdentity(){
 try { const value=await request('me');session=value;return value }
 catch(error){if(error.status===401)return null;throw error}
}
export async function logout(){
 await request('auth/logout',{});session=null;try{localStorage.removeItem('promodev-session')}catch{}
 if('caches' in window)for(const key of await caches.keys())await caches.delete(key)
 location.assign('/')
}
