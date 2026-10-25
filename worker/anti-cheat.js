import {fail} from './auth.js'
import {digest} from './native-auth.js'
// These checks only validate submissions. They never alter scoring or input windows.
export async function auditReplay(song,mode,chart,replay){
 const laneHits=[[],[],[],[]],canonical=[],offsets=[]
 for(const event of replay){
  canonical.push([event.kind,event.lane,event.time])
  if(event.kind!=='hit')continue
  const times=laneHits[event.lane];times.push(event.time)
  while(times.length&&times[0]<event.time-1)times.shift()
  if(times.length>60)throw Object.assign(fail(400,'Partie non validée : fréquence d’actions incohérente.'),{antiCheat:'input-rate'})
  const nearest=chart.notes.filter(n=>n.lane===event.lane).reduce((best,n)=>Math.abs(n.timeSeconds-event.time)<Math.abs(best)?n.timeSeconds-event.time:best,Infinity)
  if(Math.abs(nearest)<=.2)offsets.push(nearest)
 }
 const hits=replay.filter(a=>a.kind==='hit').length
 // Full precision, no rounding. Empty/short rounds are exempt: two genuine missed
 // performances can be identical. An exact long recording cannot be submitted twice.
 const fingerprint=hits>=16?await digest(JSON.stringify([song.id,mode,song.revision,canonical])):null
 const flags=[]
 // A clue for review, never an automatic punishment for a skilled player.
 if(offsets.length>=30&&offsets.filter(d=>Math.abs(d)<.000001).length/offsets.length>.95)flags.push('exact-chart-timing')
 return {fingerprint,flags}
}
