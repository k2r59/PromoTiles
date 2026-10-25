const numbers=new Set(['at','current','duration','readyState','networkState','expected','resumeAt','score','inputs','status','elapsedMs','chartStatus','audioStatus','bytes','notes'])
const booleans=new Set(['paused','ended','seeking','muted','hidden','standalone','controlled','redirected','shared','verified'])
const strings=new Set(['id','build','event','song','mode','phase','previous','next','code','reason','platform','route','audioType','backend','contextState'])
export function cleanDiagnostic(entry){
 const safe={}
 if(!entry||typeof entry!=='object')return safe
 for(const [key,value] of Object.entries(entry)){
  if(numbers.has(key)&&Number.isFinite(value))safe[key]=value
  else if(booleans.has(key)&&typeof value==='boolean')safe[key]=value
  else if(strings.has(key)&&typeof value==='string'&&/^[a-zA-Z0-9_./;= -]{1,100}$/.test(value))safe[key]=value
 }
 return safe
}
