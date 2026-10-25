import test from 'node:test'
import assert from 'node:assert/strict'
import {AmbientMusic} from '../src/lib/ambient-music.js'
const settle=()=>new Promise(resolve=>setImmediate(resolve))
function setup(play){
 const win=new EventTarget(),doc=new EventTarget();doc.hidden=false
 const audio={paused:true,plays:0,play(){this.plays++;this.paused=false;return play?.()??Promise.resolve()},pause(){this.paused=true}}
 return {win,doc,audio,music:new AmbientMusic(audio,{window:win,document:doc})}
}
test('ambience waits for an interaction, loops, and pauses for games, previews and mute',async()=>{
 const {music,audio,win}=setup();music.setActive(true)
 assert.equal(audio.plays,0);assert.equal(audio.loop,true);assert.equal(audio.preload,'none')
 win.dispatchEvent(new Event('click'));await settle();assert.equal(audio.paused,false)
 for(const reason of ['game','preview','mute']){
  music.setActive(false);assert.equal(audio.paused,true,reason)
  win.dispatchEvent(new Event('click'));assert.equal(audio.paused,true,reason)
  music.setActive(true);await settle();assert.equal(audio.paused,false,reason)
 }
 music.dispose()
})
test('ambience stops in background and resumes only when eligible',async()=>{
 const {music,audio,win,doc}=setup();music.setActive(true);win.dispatchEvent(new Event('click'));await settle()
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(audio.paused,true)
 win.dispatchEvent(new Event('click'));assert.equal(audio.paused,true)
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));await settle();assert.equal(audio.paused,false)
 win.dispatchEvent(new Event('pagehide'));assert.equal(audio.paused,true)
 music.setActive(false);win.dispatchEvent(new Event('pageshow'));assert.equal(audio.paused,true)
 music.dispose()
})
test('late audio startup cannot restart ambience after entering a game',async()=>{
 let resolve;const {music,audio,win}=setup(()=>new Promise(r=>{resolve=r}))
 music.setActive(true);win.dispatchEvent(new Event('click'));music.setActive(false)
 audio.paused=false;resolve();await settle();assert.equal(audio.paused,true)
 music.dispose();win.dispatchEvent(new Event('click'));assert.equal(audio.plays,1)
})
test('Safari playback rejection is retried on the next gesture without a retry loop',async()=>{
 let fail=true;const {music,audio,win}=setup(()=>{if(fail){audio.paused=true;return Promise.reject(Error('NotAllowedError'))}})
 music.setActive(true);win.dispatchEvent(new Event('click'));await settle();assert.equal(audio.plays,1)
 fail=false;win.dispatchEvent(new Event('keydown'));await settle();assert.equal(audio.plays,2);assert.equal(audio.paused,false)
 music.dispose()
})
