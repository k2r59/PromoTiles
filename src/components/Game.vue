<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Pause, Play, ArrowLeft, RotateCcw, Headphones, Check, X, Sparkles } from '@lucide/vue'
import { judgementFeedback } from '../lib/game-feedback.js'
import { GameEngine, saveResult } from '../lib/game-engine.js'
import { diagnostic, flushDiagnostics } from '../lib/diagnostics.js'
import { decodeGameAudio } from '../lib/buffer-audio.js'
import { playbackProblem, isComplete } from '../lib/playback-health.js'
import { LaneInput } from '../lib/game-input.js'
import { beginRound, submitRound } from '../lib/community.js'
const props=defineProps({mode:String,sound:Boolean,motion:Boolean,song:{type:Object,required:true},playerName:String,offsetMs:{type:Number,default:0}}),emit=defineEmits(['exit','finish'])
const canvas=ref(null),phase=ref('loading'),error=ref(''),score=ref(0),combo=ref(0),remaining=ref('—'),countdown=ref(3),feedback=ref(''),active=ref([false,false,false,false]),holds=ref([null,null,null,null]),progress=ref(0)
let audio,engine,chart,ctx,raf,observer,w=400,h=600,time=-3,startAt=0,resumeAt=0,lastUI=0,disposed=false,finishing=false,feedbackUntil=0,beginToken=0,roundPromise,clockPrevious=0,clockWall=0,lastHeartbeat=0,lastFrame=0
const dialog=ref(null),feedbackDetail=ref(''),feedbackTone=ref('perfect'),feedbackKey=ref(0),laneEffects=ref([null,null,null,null])
const isOverlay=computed(()=>['loading','priming','ready','paused','error','saving'].includes(phase.value))
watch(phase,async(value,previous)=>{log('game.phase',{previous,next:value});await nextTick();if(disposed)return;if(isOverlay.value){cancelAnimationFrame(raf);raf=0}else if(!raf){lastFrame=0;raf=requestAnimationFrame(frame)};if(isOverlay.value)(dialog.value?.querySelector('.primary-button')||dialog.value?.querySelector('h1'))?.focus();else if(phase.value==='playing')canvas.value?.focus({preventScroll:true})})
const sparks=[],controller=new AbortController(),input=new LaneInput(press,release)
const mediaState=()=>({backend:'web-audio',contextState:audio?.context.state,current:audio?.currentTime,duration:audio?.duration,readyState:audio?.readyState,networkState:audio?.networkState,paused:audio?.paused,ended:audio?.ended,seeking:audio?.seeking,muted:audio?.muted,expected:chart?.durationSeconds})
function log(event,detail={}){diagnostic(event,{song:props.song.id,mode:props.mode,phase:phase.value,...mediaState(),...detail})}
function playbackFailed(code){log('audio.failure',{code});beginToken++;audio?.pause();input.clear();active.value=[false,false,false,false];phase.value='error';error.value='La lecture du morceau a été interrompue. Aucune partie n’a été enregistrée. Revenez au catalogue et relancez le titre.';flushDiagnostics()}
function audioEnded(){log('audio.ended');if(phase.value!=='playing')return;if(!isComplete(gameTime(),chart.durationSeconds)){playbackFailed('premature-end');return}finish('ended')}
const gameTime=()=>Math.max(0,(audio?.currentTime||0)-props.offsetMs/1000)
function resize(){if(!canvas.value)return;const r=canvas.value.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio,2);canvas.value.width=w*d;canvas.value.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw()}
function rounded(x,y,width,height,r=9){ctx.beginPath();ctx.roundRect(x,y,width,height,r)}
function draw(){
 if(!ctx||!engine)return
 ctx.clearRect(0,0,w,h)
 const lane=w/4,line=h*.81,travel=line/chart.approachTimeSeconds
 for(let i=0;i<4;i++){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(61,116,171,.01)');g.addColorStop(1,holds.value[i]?'rgba(239,195,108,.23)':active.value[i]?'rgba(135,198,255,.22)':'rgba(36,77,125,.13)');ctx.fillStyle=g;ctx.fillRect(i*lane,0,lane,h);ctx.strokeStyle='rgba(185,215,255,.14)';ctx.beginPath();ctx.moveTo(i*lane+.5,0);ctx.lineTo(i*lane+.5,h);ctx.stroke()
 }
 const flashNow=performance.now()
 for(let i=0;i<4;i++){
  const effect=laneEffects.value[i];if(!effect)continue
  const strength=Math.max(0,(effect.until-flashNow)/320)
  if(!strength){laneEffects.value[i]=null;continue}
  const color=effect.tone==='error'?'255,105,126':effect.tone==='perfect'?'255,220,153':'129,232,220'
  if(props.motion){const flash=ctx.createLinearGradient(0,line-160,0,line+30);flash.addColorStop(0,`rgba(${color},0)`);flash.addColorStop(1,`rgba(${color},${strength*.32})`);ctx.fillStyle=flash;ctx.fillRect(i*lane,line-160,lane,190)}
  if(props.motion){
   const age=1-strength,cx=(i+.5)*lane,radius=12+age*48
   ctx.save();ctx.globalAlpha=strength*.8;ctx.strokeStyle=`rgb(${color})`;ctx.lineWidth=2.5
   ctx.beginPath();ctx.ellipse(cx,line,radius,radius*.35,0,0,Math.PI*2);ctx.stroke()
   if(effect.tone==='error'){const size=7+age*7;ctx.beginPath();ctx.moveTo(cx-size,line-size);ctx.lineTo(cx+size,line+size);ctx.moveTo(cx+size,line-size);ctx.lineTo(cx-size,line+size);ctx.stroke()}
   ctx.restore()
  }
  ctx.strokeStyle=`rgba(${color},${props.motion?strength:1})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(i*lane+5,line);ctx.lineTo((i+1)*lane-5,line);ctx.stroke()
 }
 for(const n of engine.notes){
  if(n.state==='hit'||n.state==='miss')continue
  const isHold=n.type==='hold',holding=n.state==='holding'
  let y=holding?line:line-(n.timeSeconds-time)*travel
  const length=isHold?Math.max(6,(holding?n.timeSeconds+n.durationSeconds-time:n.durationSeconds)*travel):Math.max(22,Math.min(52,travel*.16))
  if(y<0||y-length>h)continue
  const x=n.lane*lane+lane*.12,top=y-length,width=lane*.76
  const g=ctx.createLinearGradient(x,top,x+width,y)
  if(isHold){g.addColorStop(0,holding?'#fff2c2':'#9e793c');g.addColorStop(.55,'#e7c584');g.addColorStop(1,'#fff2cf')}
  else{g.addColorStop(0,n.lane%2?'#d6ecff':'#f8f7ec');g.addColorStop(.5,n.lane%2?'#8fc4f4':'#d6e5f1');g.addColorStop(1,n.lane%2?'#528cde':'#97b8d6')}
  ctx.fillStyle=g;ctx.shadowColor=isHold?'#f7d081':'#80c6ff';ctx.shadowBlur=props.motion?(holding?22:10):0
  rounded(x,top,width,length);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=isHold?'#fff2caaa':'#ffffffbb';ctx.lineWidth=1;ctx.stroke()
  if(isHold){
   ctx.save();rounded(x,top,width,length);ctx.clip();ctx.strokeStyle='#fff3c780';ctx.lineWidth=2
   for(let chevron=y-22;chevron>Math.max(top+10,-30);chevron-=32){ctx.beginPath();ctx.moveTo(x+width*.32,chevron-5);ctx.lineTo(x+width*.5,chevron+2);ctx.lineTo(x+width*.68,chevron-5);ctx.stroke()}
   ctx.fillStyle='#fff8e5';ctx.fillRect(x+4,y-5,width-8,3);ctx.restore()
   if(holding){const fraction=Math.min(1,(time-n.timeSeconds)/n.durationSeconds);ctx.strokeStyle='#fff1b8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+width/2,line-5,15,-Math.PI/2,-Math.PI/2+fraction*Math.PI*2);ctx.stroke()}
  }else{ctx.fillStyle='#ffffff66';rounded(x+4,top+4,width-8,3,1);ctx.fill()}
 }
 const glow=ctx.createLinearGradient(0,line-14,0,line+14);glow.addColorStop(0,'rgba(255,222,162,0)');glow.addColorStop(.5,'rgba(255,227,175,.4)');glow.addColorStop(1,'rgba(255,222,162,0)');ctx.fillStyle=glow;ctx.fillRect(0,line-14,w,28);ctx.shadowColor='#ffe4af';ctx.shadowBlur=20;ctx.fillStyle='#fff1d4';ctx.fillRect(0,line-1,w,2);ctx.shadowBlur=0
 if(props.motion){const now=performance.now();for(let i=sparks.length-1;i>=0;i--){const p=sparks[i],age=(now-p.born)/600;if(age>1){sparks.splice(i,1);continue}ctx.globalAlpha=1-age;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x+p.vx*age,line+p.vy*age+60*age*age,p.size*(1-age*.7),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
}
function updateUI(){
 score.value=engine.score;combo.value=engine.combo
 const s=Math.ceil(Math.max(0,chart.durationSeconds-Math.max(0,time)));remaining.value=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
 progress.value=Math.max(0,Math.min(100,time/chart.durationSeconds*100))
 holds.value=[0,1,2,3].map(lane=>{const n=engine.notes.find(n=>n.state==='holding'&&n.lane===lane);return n?{progress:Math.max(0,Math.min(1,(time-n.timeSeconds)/n.durationSeconds))}:null})
}
function frame(now){
 raf=0
 if(disposed||document.hidden||isOverlay.value)return
 // ProMotion displays need no extra rendering above 60 fps; timing stays audio-based.
 if(now-lastFrame<1000/60-1){raf=requestAnimationFrame(frame);return}
 lastFrame=now
 if(phase.value==='countdown'){
  time=resumeAt-(startAt-now)/1000;countdown.value=Math.max(1,Math.ceil((startAt-now)/1000))
  if(now>=startAt){audio.currentTime=Math.max(0,resumeAt+props.offsetMs/1000);phase.value='starting';audio.play().then(()=>{if(disposed||phase.value!=='starting'){audio.pause();return}clockPrevious=Math.max(0,resumeAt+props.offsetMs/1000);clockWall=performance.now();phase.value='playing';log('audio.started')}).catch(cause=>{log('audio.play-rejected',{code:cause.name});error.value='La lecture a été interrompue. Touchez Reprendre pour réessayer.';phase.value='paused'})}
 }
 if(phase.value==='playing'){
  const problem=playbackProblem({duration:audio.duration,expected:chart.durationSeconds,current:audio.currentTime,previous:clockPrevious,elapsed:(now-clockWall)/1000});if(problem){playbackFailed(problem);raf=requestAnimationFrame(frame);return}
  clockPrevious=audio.currentTime;clockWall=now;time=gameTime();const events=engine.advance(time)
  if(now-lastHeartbeat>5000){lastHeartbeat=now;log('game.heartbeat',{score:engine.score,inputs:engine.journal.length})}
  for(const event of events)feedbackHit(event,true)
  if(audio.ended)audioEnded();else if(time>=chart.durationSeconds-.03)finish('timeline')
 }
 if(engine){draw();if(now-lastUI>50){updateUI();lastUI=now}if(now>feedbackUntil)feedback.value=''}
 raf=requestAnimationFrame(frame)
}
async function begin(){
 if(!['ready','paused'].includes(phase.value)||disposed)return
 log('game.begin',{resumeAt});const token=++beginToken;error.value='';phase.value='priming'
 roundPromise??=beginRound(props.song.id,props.mode,props.playerName).then(round=>{log('round.created');return round}).catch(cause=>{log('round.unavailable',{code:cause.name,status:cause.status});return null})
 try{await audio.unlock();if(disposed||token!==beginToken){audio.pause();return}audio.pause();const problem=playbackProblem({duration:audio.duration,expected:chart.durationSeconds,current:audio.currentTime});if(problem){playbackFailed(problem);return}audio.muted=!props.sound;startAt=performance.now()+3000;time=resumeAt-3;phase.value='countdown';countdown.value=3}
 catch(cause){log('audio.prime-rejected',{code:cause.name});if(disposed||token!==beginToken)return;audio.muted=!props.sound;error.value='La musique ne peut pas démarrer. Réessayez.';phase.value='paused'}
}
function pause(){
 log('game.pause',{hidden:document.hidden})
 if(!['playing','countdown','starting','priming'].includes(phase.value))return
 beginToken++;audio.pause()
 if(phase.value==='playing'){resumeAt=engine.rewindTo(Math.max(0,gameTime()-2));for(let lane=0;lane<4;lane++)engine.release(lane,resumeAt)}
 time=resumeAt;active.value=[false,false,false,false];input.clear();phase.value='paused';updateUI()
}
function feedbackHit(event,automatic=false){
 const message=judgementFeedback(event);if(!message)return
 const now=performance.now();laneEffects.value[event.lane]={tone:message.tone,until:now+320}
 // A missed note should not instantly hide the judgement of the player's tap.
 if(!automatic||now>feedbackUntil-300){
  feedback.value=message.text;feedbackDetail.value=message.detail;feedbackTone.value=message.tone;feedbackKey.value++
  feedbackUntil=now+(message.tone==='error'?1100:950)
 }
 if(['perfect','good','hold-complete'].includes(event.type)&&props.motion)for(let i=0;i<18;i++)sparks.push({x:(event.lane+.5)*w/4,vx:(Math.random()-.5)*140,vy:-Math.random()*95-15,size:Math.random()*2+1,born:now,color:i%3?'#f8dfac':'#b5dfff'})
}
function press(lane){if(phase.value!=='playing'||active.value[lane])return;active.value[lane]=true;feedbackHit(engine.hit(lane,gameTime()));updateUI()}
function release(lane){if(phase.value==='playing'){feedbackHit(engine.release(lane,gameTime()));updateUI()}active.value[lane]=false}
function down(e,lane){if(phase.value!=='playing')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);input.down('pointer-'+e.pointerId,lane)}
function up(e){input.up('pointer-'+e.pointerId)}
function keydown(e){if(isOverlay.value&&e.key==='Tab'){const controls=[...dialog.value.querySelectorAll('button:not([disabled]),[tabindex="0"]')];const first=controls[0],last=controls.at(-1);if(e.shiftKey&&(document.activeElement===first||!controls.includes(document.activeElement))){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(document.activeElement===last||!controls.includes(document.activeElement))){e.preventDefault();first?.focus()}return}if(e.code==='Space'&&e.target.closest?.('button,input,select'))return;const lane=['KeyD','KeyF','KeyJ','KeyK'].indexOf(e.code);if(lane>=0&&phase.value==='playing'){e.preventDefault();if(!e.repeat)input.down(e.code,lane)}if(e.code==='Space'||e.code==='Escape'){e.preventDefault();if(e.repeat)return;if(phase.value==='playing'||phase.value==='countdown')pause();else if(phase.value==='paused')begin()}}
function keyup(e){input.up(e.code)}
function hidden(){if(document.hidden)pause()}
async function finish(reason){
 log('game.finish-request',{reason:typeof reason==='string'?reason:'event',inputs:engine?.journal.length})
 if(finishing||disposed||phase.value!=='playing')return
 const problem=playbackProblem({duration:audio.duration,expected:chart.durationSeconds,current:audio.currentTime,previous:clockPrevious,elapsed:(performance.now()-clockWall)/1000});
 if(problem||!isComplete(gameTime(),chart.durationSeconds)){playbackFailed(problem||'premature-finish');return}
 finishing=true;audio.pause();phase.value='saving';engine.advance(chart.durationSeconds+1)
 const result=engine.result();result.saved=saveResult(result)
 try{const round=await roundPromise;if(round){await submitRound(round.roundId,engine.journal);result.shared=true;log('score.saved',{score:result.score})}else result.shared=false}catch(cause){result.shared=false;log('score.failed',{code:cause.name,status:cause.status})}
 log('game.finished',{shared:result.shared,score:result.score});flushDiagnostics();if(!disposed)emit('finish',result)
}
function retry(){engine.reset();resumeAt=0;time=-3;score.value=combo.value=0;feedback.value='';laneEffects.value=[null,null,null,null];sparks.length=0;input.clear();active.value=[false,false,false,false];roundPromise=null;begin()}
onMounted(async()=>{
 log('game.load');ctx=canvas.value.getContext('2d');observer=new ResizeObserver(resize);observer.observe(canvas.value);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hidden)
 try{
  const [response,music]=await Promise.all([fetch(`${props.song.chartRoot}/${props.mode}.json?v=${props.song.revision}`,{signal:controller.signal}),fetch(props.song.audio+'?v='+props.song.revision,{signal:controller.signal})])
  log('assets.response',{chartStatus:response.status,audioStatus:music.status,audioType:music.headers.get('Content-Type'),bytes:Number(music.headers.get('Content-Length')),redirected:music.redirected||response.redirected});
  if(!response.ok||!music.ok||music.redirected||response.redirected||music.headers.get('Content-Type')?.includes('text/html'))throw Error('assets')
  const [data,blob]=await Promise.all([response.json(),music.blob()]);if(disposed)return
  if(!Number.isFinite(data.durationSeconds)||data.durationSeconds<10||!Array.isArray(data.notes)||data.songId!==props.song.id||data.mode!==props.mode)throw Error('chart-invalid');
  log('assets.loaded',{bytes:blob.size,expected:data.durationSeconds,notes:data.notes.length});
  if(blob.size<10000)throw Error('audio-incomplete');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
  log('assets.integrity',{verified:hash===props.song.audioSha256});if(hash!==props.song.audioSha256)throw Error('audio-integrity');
  chart=data;engine=new GameEngine(chart);audio=await decodeGameAudio(await blob.arrayBuffer());if(disposed){await audio.dispose();return}audio.volume=.8;audio.muted=!props.sound;log('audio.decoded');
  const problem=playbackProblem({duration:audio.duration,expected:chart.durationSeconds,current:0});if(problem)throw Error(problem)
  audio.addEventListener('ended',audioEnded);audio.addEventListener('interrupted',()=>{log('audio.interrupted');pause()});
  for(const event of ['playing','pause','statechange'])audio.addEventListener(event,()=>{if(!disposed)log('audio.'+event)})
  phase.value='ready';updateUI();resize();raf=requestAnimationFrame(frame)
 }catch(cause){log('assets.failed',{code:cause.message});if(!disposed){phase.value='error';error.value='Le morceau n’a pas pu être chargé. Vérifiez votre connexion ou choisissez un titre déjà joué hors ligne.'}}
})
onUnmounted(()=>{log('game.dispose');disposed=true;beginToken++;controller.abort();cancelAnimationFrame(raf);observer?.disconnect();audio?.pause();if(audio){audio.removeEventListener('ended',audioEnded);audio.dispose().catch(()=>{})}window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hidden)})
</script>
<template>
<section class="game-screen" :class="{'has-dialog':isOverlay}">
 <header class="game-hud" :inert="isOverlay"><button class="icon-button" aria-label="Mettre en pause" @click="pause"><Pause :size="24"/></button><div><span>SCORE</span><strong>{{score.toLocaleString('fr-FR')}}</strong><b :class="{lit:combo>4}">{{combo>1?'COMBO ×'+combo:'À VOUS DE BRILLER'}}</b></div><span class="game-time">✧ {{remaining}}</span></header>
 <div class="song-progress" role="progressbar" aria-label="Progression du morceau" :aria-valuenow="Math.round(progress)" aria-valuemin="0" aria-valuemax="100"><i :style="{width:progress+'%'}"></i></div>
 <div class="feedback-band" aria-live="off"><div :key="feedbackKey" class="hit-feedback" :class="[{visible:feedback},'judgement-'+feedbackTone,{'judgement-animated':motion&&feedback}]"><X v-if="feedbackTone==='error'" :size="20"/><Sparkles v-else-if="feedbackTone==='perfect'" :size="20"/><Check v-else :size="20"/><div><strong>{{feedback}}</strong><small>{{feedbackDetail}}</small></div></div></div>
 <div class="track-wrap" :inert="isOverlay"><canvas ref="canvas" tabindex="0" class="game-canvas" aria-label="Quatre pistes de notes. Jouez avec D, F, J, K ou les touches en bas."/><div class="piano-controls"><button v-for="(key,i) in ['D','F','J','K']" :key="key" :class="{pressed:active[i],holding:!!holds[i],'judged-error':laneEffects[i]?.tone==='error','judged-perfect':laneEffects[i]?.tone==='perfect','judged-good':laneEffects[i]?.tone==='good'}" :style="{'--hold-progress':(holds[i]?.progress||0)*100+'%'}" :aria-pressed="active[i]" :aria-label="'Touche '+(i+1)+' — '+key" @pointerdown="down($event,i)" @pointerup="up" @pointercancel="up" @lostpointercapture="up"><span>{{holds[i]?'TENEZ':key}}</span><i></i></button></div></div>
 <footer class="game-song" :inert="isOverlay"><span class="song-mini"><img v-if="song.cover" :src="song.cover" alt=""/><template v-else>✦</template></span><div><strong>{{song.title}}</strong><span>{{song.artist}} · {{mode}}</span></div><div class="equalizer" :class="{running:phase==='playing'&&motion}"><i v-for="i in 5" :key="i" :style="{'--i':i}"></i></div></footer>
 <div v-if="isOverlay" ref="dialog" role="dialog" aria-modal="true" aria-labelledby="game-dialog-title" class="game-overlay"><button class="icon-button dialog-back" aria-label="Retour au choix du niveau" title="Retour" @click="emit('exit')"><ArrowLeft :size="22" :stroke-width="2.2"/></button><div class="game-dialog"><Headphones :size="32"/><p class="eyebrow">{{phase==='paused'?'UN INSTANT SUSPENDU':'LA SCÈNE EST À VOUS'}}</p><h1 id="game-dialog-title" tabindex="-1">{{phase==='error'?'Morceau indisponible':phase==='saving'?'Votre performance…':['loading','priming'].includes(phase)?'La magie arrive…':phase==='paused'?'Reprenez le rythme.':'Prêt à briller ?'}}</h1><p v-if="phase!=='paused'&&phase!=='error'">Appuyez sur les touches du bas quand une note atteint la ligne dorée.<br>Les rubans dorés se maintiennent jusqu’au bout. Vous pouvez jouer une autre touche en même temps.</p><p v-else-if="phase==='paused'">La musique reprend deux secondes plus tôt pour retrouver vos repères.</p><div class="key-guide" v-if="phase==='ready'"><kbd>D</kbd><kbd>F</kbd><kbd>J</kbd><kbd>K</kbd></div><p class="error-message" v-if="error" role="alert">{{error}}</p><button v-if="phase==='ready'||phase==='paused'" class="primary-button" @click="begin"><Play :size="18"/>{{phase==='paused'?'Reprendre':'Lancer la musique'}}</button><button v-if="phase==='paused'" class="text-button" @click="retry"><RotateCcw :size="15"/> Recommencer</button></div></div>
 <div v-if="phase==='countdown'" class="countdown-overlay" aria-live="assertive"><strong :key="countdown">{{countdown}}</strong><span>Suivez la lumière</span></div>
</section>
</template>
<style scoped>
.song-progress{height:2px;background:#abcfff18;margin:0 24px}.song-progress i{height:100%;display:block;background:#eace9c;transition:width .1s linear}.piano-controls button.holding{border-color:#f7d994;background:linear-gradient(0deg,#bd8b38aa var(--hold-progress),#d8bb7240 var(--hold-progress));box-shadow:0 0 25px #e9bd6266,inset 0 0 15px #ffdf9866}.piano-controls button.holding span{opacity:1;color:#fff2c9;font-size:10px;letter-spacing:1px}

.game-screen{position:relative;max-width:580px;margin:auto;height:100svh;min-height:540px;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(1,13,28,.75),rgba(4,21,42,.45));box-shadow:0 0 100px #0008;overflow:hidden}.game-hud{padding:26px 22px 10px;padding-top:max(26px,env(safe-area-inset-top));display:flex;justify-content:space-between;align-items:flex-start;z-index:2}.game-hud>div{text-align:center;display:flex;flex-direction:column}.game-hud span{font-size:11px;letter-spacing:2px;color:#c4d4e8}.game-hud strong{font-size:46px;line-height:1.15;font-weight:700;color:#fff5e1;font-variant-numeric:tabular-nums}.game-hud b{font-size:11px;color:#d6bc85;margin-top:7px;letter-spacing:1px}.game-hud b.lit{text-shadow:0 0 14px #ffc864}.game-time{padding-top:13px!important;letter-spacing:0!important;min-width:62px;text-align:right}.track-wrap{flex:1;position:relative;min-height:0;margin:0 22px}.game-canvas{width:100%;height:100%;display:block}.piano-controls{position:absolute;bottom:2%;height:14%;left:0;right:0;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:0 6px;touch-action:none}.piano-controls button{position:relative;touch-action:none;user-select:none;border:1px solid #b3d3f8;border-radius:8px;background:linear-gradient(135deg,#cedff15c,#38659955);box-shadow:inset 0 0 13px #e6f2ff44,0 4px 0 #122e50;transform:perspective(250px) rotateX(14deg);color:#e3edf8;font-size:13px;transition:background .08s,box-shadow .08s}.piano-controls button.pressed{background:#a9d8ffaa;box-shadow:0 0 35px #b8e1ff99,inset 0 0 18px white;transform:perspective(250px) rotateX(14deg) translateY(3px)}.piano-controls span{opacity:.5}.piano-controls i{position:absolute;bottom:8px;left:30%;width:40%;height:2px;background:#c5e2ff88}.hit-feedback{position:absolute;top:48%;left:0;right:0;text-align:center;font-family:'Cormorant Garamond',serif;font-size:29px;color:#ffe1a2;text-shadow:0 0 22px #ecc17a;opacity:0;transform:translateY(8px);transition:opacity .12s,transform .18s;pointer-events:none}.hit-feedback.visible{opacity:1;transform:none}.game-song{display:flex;align-items:center;gap:13px;padding:15px 28px max(22px,env(safe-area-inset-bottom));background:#03101ccc}.song-mini{width:43px;height:43px;border-radius:8px;background:linear-gradient(40deg,#143966,#487690);display:grid;place-items:center;color:#f9d79c;font-size:26px;border:1px solid #93b3d2}.game-song>div:nth-child(2){display:flex;flex-direction:column;gap:4px}.game-song strong{font-size:12px}.game-song span:not(.song-mini){font-size:11px;color:#9db2c9}.equalizer{margin-left:auto;display:flex;align-items:center;gap:3px;height:30px}.equalizer i{width:2px;height:calc(8px + var(--i)*3px);background:#d6e7ff;box-shadow:0 0 6px #6eabff}.equalizer.running i{animation:eq .8s ease-in-out infinite alternate;animation-delay:calc(var(--i)*-.17s)}@keyframes eq{to{transform:scaleY(.3)}}.game-overlay{position:absolute;inset:0;display:grid;place-items:center;background:#020d1cd9;backdrop-filter:blur(14px);z-index:5;padding:25px}.game-dialog{text-align:center;max-width:360px;width:100%}.game-dialog>svg{color:#dbbf88;margin-bottom:22px}.game-dialog h1{font-family:'Cormorant Garamond',serif;font-size:45px;line-height:1;margin:18px 0}.game-dialog>p:not(.eyebrow){font-size:13px;line-height:1.8;color:#b9cce0;margin:18px 0 25px}.game-dialog .text-button{display:flex;align-items:center;justify-content:center;gap:8px}.key-guide{display:flex;justify-content:center;gap:12px;margin:20px 0 30px}.key-guide kbd{padding:10px 15px;border:1px solid #8aa9c759;background:#a3c5e911;border-radius:6px}.countdown-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;pointer-events:none;background:#03111b44}.countdown-overlay strong{font:120px 'Cormorant Garamond',serif;color:#fff0d4;text-shadow:0 0 45px #dbb875;animation:count .9s ease-out both}.countdown-overlay span{color:#c9d9e9;font-size:12px;letter-spacing:3px;text-transform:uppercase}@keyframes count{from{opacity:0;transform:scale(1.2)}30%{opacity:1}to{opacity:.7;transform:scale(.95)}}@media(max-width:600px){.game-hud{padding:20px 18px 8px}.game-hud strong{font-size:42px}.piano-controls{gap:9px}.track-wrap{margin:0 14px}.piano-controls span{opacity:.3}.game-song{padding-left:20px;padding-right:20px}}
</style>

<style scoped>
.game-screen{background:linear-gradient(180deg,#031122ed,#061a30ed)}.game-canvas:focus{outline:none}.hit-feedback{top:4px;font-family:'Manrope',sans-serif;font-size:14px;font-weight:600;text-shadow:0 2px 10px #000;background:#061426c9;border-radius:30px;width:max-content;max-width:90%;padding:8px 16px;left:50%;right:auto;transform:translate(-50%,4px)}.hit-feedback.visible{transform:translate(-50%,0)}.piano-controls span{opacity:.8}.piano-controls button{background:linear-gradient(135deg,#cedff186,#38659988)}.game-song strong{font-size:13px}.game-dialog h1:focus{outline:none}.game-overlay{overflow:auto}.game-dialog{margin:auto}.game-screen{min-height:min(540px,100svh)}@media(max-height:600px){.game-hud{padding:8px 18px 5px}.game-hud strong{font-size:28px}.game-hud b{font-size:9px;margin-top:2px}.game-song{padding:7px 20px}.song-mini{height:30px;width:30px;font-size:18px}.piano-controls{height:19%;bottom:1%}.game-dialog>svg{display:none}.game-dialog h1{font-size:30px;margin:10px 0}.game-dialog>p:not(.eyebrow){margin:8px 0;font-size:11px}.key-guide{margin:8px 0}.key-guide kbd{padding:5px 12px}.game-overlay{padding:12px}.game-dialog .primary-button{min-height:42px}.game-dialog .text-button{padding:8px}.hit-feedback{font-size:11px;padding:5px 10px}}@media(max-width:600px){.piano-controls span{opacity:.8}}
</style>

<style scoped>
.feedback-band{height:29px;flex-shrink:0;position:relative;margin:0 22px;background:#061426}.feedback-band .hit-feedback{position:static;width:auto;max-width:none;padding:4px 10px;line-height:21px;transform:none;font-size:13px;border-radius:0}.game-dialog .eyebrow{justify-content:center;text-align:center}@media(max-height:600px){.feedback-band{height:23px}.feedback-band .hit-feedback{font-size:11px;line-height:17px;padding:3px 10px}}
</style>

<style scoped>
.song-mini{flex-shrink:0;overflow:hidden}.song-mini img{width:100%;height:100%;object-fit:cover}.game-song>div:nth-child(2){min-width:0}.game-song strong,.game-song>div>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>

<style scoped>
.feedback-band{height:52px;display:grid;place-items:center;background:#061426;flex-shrink:0;margin:0 22px}
.feedback-band .hit-feedback{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:5px 12px;background:none;color:#ffe1a5;line-height:1.15}
.hit-feedback>div{display:flex;flex-direction:column;gap:3px}.hit-feedback strong{font-size:18px;font-weight:800;letter-spacing:.025em}.hit-feedback small{font-size:10px;font-weight:500;color:#d4dfed}
.hit-feedback.judgement-error{color:#ff9aaa}.hit-feedback.judgement-good{color:#9cf0df}
.judgement-animated{animation:judgement-pop .18s ease-out}
.piano-controls button.judged-error{border-color:#ff9aaa;background:#693143;box-shadow:inset 0 0 0 2px #ffb4bf,0 0 17px #f55c7966}
.piano-controls button.judged-perfect{border-color:#ffe4a9;box-shadow:inset 0 0 0 1px #ffeac1,0 0 18px #e9bd6266}
.piano-controls button.judged-good{border-color:#9cf0df;box-shadow:inset 0 0 0 1px #9cf0df,0 0 16px #75ddcb55}
@keyframes judgement-pop{from{transform:translateY(3px) scale(.96)}to{transform:translateY(0) scale(1)}}
@media(max-height:600px){.feedback-band{height:42px}.feedback-band .hit-feedback{padding:3px 8px;line-height:1.1}.hit-feedback strong{font-size:15px}.hit-feedback small{font-size:9px}}
@media(prefers-reduced-motion:reduce){.judgement-animated{animation:none}}
</style>

<style scoped>
/* Centered arcade judgements never intercept the player's taps. */
.game-screen>.feedback-band{position:absolute;z-index:3;top:50%;left:0;right:0;height:auto;margin:0;background:none;transform:translateY(-50%);pointer-events:none}
.game-screen .hit-feedback{position:static;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:none;padding:5px 6px;border-radius:0;background:none;transform:none;color:#ffe2a0;text-shadow:0 2px 2px #03101c,0 0 5px #03101c,0 0 12px #03101c,0 0 24px #03101c}
.game-screen .hit-feedback>svg{width:30px;height:30px;stroke-width:3;filter:drop-shadow(0 2px 3px #03101c)}
.game-screen .hit-feedback strong{display:block;font-size:clamp(27px,6.8vw,38px);line-height:1.08;font-weight:800;font-style:italic;letter-spacing:-.025em;-webkit-text-stroke:.4px currentColor}
.game-screen .hit-feedback small{font-size:12px;line-height:1.4;font-weight:600;color:#f1f6fb;text-shadow:0 1px 3px #000,0 0 8px #000}
.game-screen .hit-feedback.judgement-error{color:#ff9cad}.game-screen .hit-feedback.judgement-good{color:#91ffdf}
.game-screen .judgement-animated{animation:judgement-burst .34s cubic-bezier(.2,.8,.3,1) both}
.game-screen .judgement-animated.judgement-error{animation:judgement-error .32s ease-out both}
@keyframes judgement-burst{0%{opacity:0;transform:translateY(12px) scale(.72)}55%{opacity:1;transform:translateY(-5px) scale(1.08)}100%{opacity:1;transform:none}}
@keyframes judgement-error{0%{opacity:0;transform:translateY(5px) scale(.86)}25%{opacity:1;transform:translateX(-6px) scale(1.04)}45%{transform:translateX(5px)}65%{transform:translateX(-3px)}100%{opacity:1;transform:none}}
@media(max-width:350px){.game-screen .hit-feedback{gap:6px}.game-screen .hit-feedback strong{font-size:25px}.game-screen .hit-feedback>svg{width:23px;height:23px}.game-screen .hit-feedback small{font-size:11px}}
@media(max-height:500px){.game-screen .hit-feedback strong{font-size:25px}.game-screen .hit-feedback small{font-size:10px}.game-screen .hit-feedback>svg{width:23px;height:23px}}
@media(prefers-reduced-motion:reduce){.game-screen .judgement-animated{animation:none}}
</style>

<style scoped>
.game-screen{background:linear-gradient(180deg,#0311228c,#061a3099)}
</style>

<style scoped>
.game-screen.has-dialog{background:transparent;box-shadow:none}
.game-screen.has-dialog>.game-hud,.game-screen.has-dialog>.song-progress,.game-screen.has-dialog>.feedback-band,.game-screen.has-dialog>.track-wrap,.game-screen.has-dialog>.game-song{visibility:hidden}
.game-overlay{background:linear-gradient(180deg,#03112430,#03112460);backdrop-filter:none}
.game-overlay .dialog-back{position:absolute;top:max(12px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));width:44px;height:44px;display:grid;place-items:center;border:1.5px solid #ffebc4;background:#f5d69a;color:#14233b;box-shadow:0 3px 12px #0006;border-radius:50%}
.game-dialog{text-shadow:0 2px 10px #020c1c,0 0 20px #020c1c}
.game-dialog>p:not(.eyebrow){color:#d7e4f1}
</style>
