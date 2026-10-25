export const DIAGNOSTIC_BUILD = '2026-10-24-mobile-3'
const key='promotiles-diagnostics-v1',id=crypto.randomUUID(),events=[],queue=[]
let timer,sending=false
try { const old=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(old))events.push(...old.slice(-160)) } catch {}
export function diagnostic(event, detail={}) {
 const entry={at:Date.now(),id,build:DIAGNOSTIC_BUILD,event,...detail}
 events.push(entry);if(events.length>240)events.shift()
 queue.push(entry);if(queue.length>80)queue.shift()
 console.info('[PromoTiles] '+JSON.stringify(entry))
 clearTimeout(timer);timer=setTimeout(flushDiagnostics,1500)
 // Persist only low-volume lifecycle events, never on every frame or every key.
 try { localStorage.setItem(key,JSON.stringify(events)) } catch {}
}
export async function flushDiagnostics(){
 if(sending||!queue.length||location.hostname!=='noel.promo.dev')return
 sending=true;const batch=queue.splice(0,40)
 try {const response=await fetch('/api/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch}),keepalive:true,signal:AbortSignal.timeout(7000)});if(!response.ok)throw Error('diagnostics-unavailable')}
 catch { /* The local export remains available even when login or network fails. */ }
 finally {sending=false;if(queue.length)timer=setTimeout(flushDiagnostics,2000)}
}
export function exportDiagnostics(){
 const blob=new Blob([JSON.stringify({build:DIAGNOSTIC_BUILD,userAgent:navigator.userAgent,events},null,2)],{type:'application/json'})
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='promotiles-diagnostic.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)
}
diagnostic('app.boot',{platform:/iPhone|iPad/.test(navigator.userAgent)?'ios':/Android/.test(navigator.userAgent)?'android':'desktop',standalone:matchMedia('(display-mode: standalone)').matches,controlled:!!navigator.serviceWorker?.controller})
window.addEventListener('pagehide',flushDiagnostics)
document.addEventListener('visibilitychange',()=>{diagnostic('app.visibility',{hidden:document.hidden});if(document.hidden)flushDiagnostics()})
