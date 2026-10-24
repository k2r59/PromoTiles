export const WINDOWS={facile:.18,normal:.14,difficile:.105}
export class GameEngine {
  constructor(chart){this.chart=chart;this.window=WINDOWS[chart.mode]??.14;this.reset()}
  reset(){this.notes=this.chart.notes.map(n=>({...n,state:'pending',quality:0}));this.combo=0;this.maxCombo=0;this.wrong=0;this.misses=0;this.perfect=0;this.good=0;this.journal=[];this.lastWrong=[-Infinity,-Infinity,-Infinity,-Infinity]}
  get score(){const accuracy=this.notes.reduce((sum,n)=>sum+n.quality,0)/this.notes.length;return Math.max(0,Math.min(this.chart.scoring.maxPoints,Math.round((accuracy*.9+this.maxCombo/this.notes.length*.1-this.wrong*.002)*this.chart.scoring.maxPoints)))}
  get judged(){return this.notes.filter(n=>n.state==='hit'||n.state==='miss').length}
  advance(time){const events=[];for(const n of this.notes){if(n.state==='pending'&&time>n.timeSeconds+this.window){n.state='miss';this.misses++;this.combo=0;events.push({type:'miss',lane:n.lane})}else if(n.state==='holding'&&time>=n.timeSeconds+n.durationSeconds){n.state='hit';n.quality=n.headQuality;events.push({type:'hold-complete',lane:n.lane})}}return events}
  hit(lane,time,record=true){if(record)this.journal.push({kind:'hit',lane,time});this.advance(time);if(this.notes.some(n=>n.state==='holding'&&n.lane===lane))return {type:'ignored'}
    const n=this.notes.filter(n=>n.state==='pending'&&n.lane===lane&&Math.abs(n.timeSeconds-time)<=this.window).sort((a,b)=>Math.abs(a.timeSeconds-time)-Math.abs(b.timeSeconds-time))[0]
    if(!n){if(time-this.lastWrong[lane]>.18){this.wrong++;this.combo=0;this.lastWrong[lane]=time}return {type:'wrong',lane}}
    const quality=Math.abs(n.timeSeconds-time)<=this.window*.46?1:.72;n.headQuality=quality;n.quality=n.type==='hold'?quality*.3:quality;n.state=n.type==='hold'?'holding':'hit';this.combo++;this.maxCombo=Math.max(this.combo,this.maxCombo);quality===1?this.perfect++:this.good++;return {type:quality===1?'perfect':'good',lane,hold:n.type==='hold'}
  }
  release(lane,time,record=true){if(record)this.journal.push({kind:'release',lane,time});this.advance(time);const n=this.notes.find(n=>n.state==='holding'&&n.lane===lane);if(!n)return;const fraction=Math.max(0,Math.min(1,(time-n.timeSeconds)/n.durationSeconds));n.quality=n.headQuality*(.3+.7*fraction);n.state='hit';this.combo=0;return {type:'early-release',lane}}
  rewindTo(target){const history=[...this.journal];let t=Math.max(0,target);const crossing=this.notes.filter(n=>n.state!=='pending'&&n.type==='hold'&&n.timeSeconds<t&&n.timeSeconds+n.durationSeconds>t);if(crossing.length)t=Math.max(0,Math.min(...crossing.map(n=>n.timeSeconds))-.2);this.reset();for(const action of history){if(action.time>=t)break;this[action.kind](action.lane,action.time,true)}this.advance(t);return t}
  result(){return {songId:this.chart.songId,mode:this.chart.mode,score:this.score,maxPoints:this.chart.scoring.maxPoints,perfect:this.perfect,good:this.good,misses:this.misses,wrong:this.wrong,maxCombo:this.maxCombo,total:this.notes.length,accuracy:Math.round(this.notes.reduce((s,n)=>s+n.quality,0)/this.notes.length*100)}}
}
export function saveResult(result,storage){
  // Accessing localStorage itself can throw when browser storage is disabled.
  try{storage??=globalThis.localStorage}catch{return false}
  let previous=[]
  try{previous=JSON.parse(storage.getItem('promodev-records-v1')||'[]');if(!Array.isArray(previous))previous=[]}catch{}
  const item={...result,date:new Date().toISOString()}
  const entries=[...previous.filter(x=>x&&Number.isFinite(x.score)&&x.score>=0),item]
  // Keep the last 50 rounds plus any older all-time best for each song/mode.
  // Preserve chronological order so callers may still show recent results.
  const best=new Map()
  entries.forEach((entry,index)=>{
    if(!Object.hasOwn(WINDOWS,entry.mode))return
    const key=JSON.stringify([entry.songId??'',entry.mode])
    const previousIndex=best.get(key)
    if(previousIndex===undefined||entry.score>=entries[previousIndex].score)best.set(key,index)
  })
  const protectedIndices=new Set(best.values())
  const history=entries.filter((_,index)=>index>=entries.length-50||protectedIndices.has(index))
  try{storage.setItem('promodev-records-v1',JSON.stringify(history));return true}catch{return false}
}
