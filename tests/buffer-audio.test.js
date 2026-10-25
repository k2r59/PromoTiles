import test from 'node:test'
import assert from 'node:assert/strict'
import { BufferAudio } from '../src/lib/buffer-audio.js'
class Context extends EventTarget {
 currentTime=0;state='suspended';sources=[]
 createGain(){return {gain:{value:1},connect(){},disconnect(){}}}
 createBufferSource(){const source={connect(){},disconnect(){},start(when,offset){this.offset=offset},stop(){this.stopped=true}};this.sources.push(source);return source}
 async resume(){this.state='running'}
 async close(){this.state='closed'}
}
test('decoded playback keeps duration and clock across countdown, pause, seek and resume',async()=>{
 const context=new Context(),audio=new BufferAudio(context,{duration:91.25});let ended=0;audio.addEventListener('ended',()=>ended++)
 await audio.unlock();context.currentTime=3;assert.equal(audio.currentTime,0);assert.equal(context.sources.length,0)
 await audio.play();context.currentTime=13;assert.equal(audio.currentTime,10)
 const oldEnd=context.sources[0].onended;audio.pause();audio.currentTime=8;context.currentTime=16
 oldEnd();assert.equal(ended,0);assert.equal(audio.duration,91.25);assert.equal(audio.currentTime,8)
 await audio.play();assert.equal(context.sources[1].offset,8);context.currentTime=20;assert.equal(audio.currentTime,12)
 context.sources[1].onended();assert.equal(ended,1);assert.equal(audio.ended,true);assert.equal(audio.currentTime,91.25)
 await audio.dispose();assert.equal(context.state,'closed')
})
test('pause cancels a pending audio resume without starting a late source',async()=>{
 const context=new Context(),audio=new BufferAudio(context,{duration:91.25});let resolve
 context.resume=()=>new Promise(r=>resolve=r)
 const started=audio.play();audio.pause();resolve();await started
 assert.equal(context.sources.length,0);assert.equal(audio.paused,true)
 await audio.dispose()
})
test('interruptions notify the game and volume respects mute',async()=>{
 const context=new Context(),audio=new BufferAudio(context,{duration:91.25});let interrupted=0
 audio.addEventListener('interrupted',()=>{interrupted++;audio.pause()})
 audio.volume=.8;audio.muted=true;assert.equal(audio.gain.gain.value,0)
 audio.muted=false;assert.equal(audio.gain.gain.value,.8)
 await audio.play();context.state='interrupted';context.dispatchEvent(new Event('statechange'))
 assert.equal(interrupted,1);assert.equal(audio.paused,true);await audio.dispose()
})
