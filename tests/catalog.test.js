import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { songs } from '../src/lib/songs.js'
import { GameEngine } from '../src/lib/game-engine.js'
import { LaneInput } from '../src/lib/game-input.js'
import { starsFor, progressFor, readFavorites, dailySong } from '../src/lib/progress.js'
const file=path=>new URL('../public'+path,import.meta.url)
test('catalogue: 100 distinct real recordings, 300 playable charts, exact hold endings and onset provenance',()=>{
 assert.equal(songs.length,100);assert.equal(new Set(songs.map(s=>s.id)).size,100)
 const digests=new Set()
 for(const song of songs){
  const digest=createHash('sha256').update(readFileSync(file(song.audio))).digest('hex');digests.add(digest);assert.equal(digest,song.audioSha256)
  const evidence=JSON.parse(readFileSync(file(song.chartRoot+'/analysis.json'))),attacks=new Map(evidence.onsets.map(x=>[x.frame,x.time]))
  for(const mode of ['facile','normal','difficile']){
   const chart=JSON.parse(readFileSync(file(song.chartRoot+'/'+mode+'.json')));assert.equal(chart.audioSha256,digest);assert.equal(chart.songId,song.id)
   const busy=[-1,-1,-1,-1];let previous=-1
   for(const n of chart.notes){
    assert.ok(n.timeSeconds>previous,`${song.title}: sorted attacks`);previous=n.timeSeconds
    assert.equal(n.timeSeconds,attacks.get(n.sourceOnsetFrame));assert.ok(n.lane>=0&&n.lane<=3);assert.ok(n.timeSeconds>busy[n.lane]+.13)
    assert.ok(n.timeSeconds+n.durationSeconds<chart.durationSeconds-.3)
    if(n.type==='hold'){assert.ok(n.durationSeconds>=.5);busy[n.lane]=n.timeSeconds+n.durationSeconds}
   }
   const actions=chart.notes.flatMap(n=>[{kind:'hit',lane:n.lane,time:n.timeSeconds},{kind:'release',lane:n.lane,time:n.timeSeconds+(n.durationSeconds||.04)}]).sort((a,b)=>a.time-b.time||(a.kind==='release'?-1:1))
   const engine=new GameEngine(chart)
   for(const a of actions)engine[a.kind](a.lane,a.time)
   engine.advance(chart.durationSeconds+1)
   assert.equal(engine.score,chart.scoring.maxPoints,`${song.title}/${mode}: maximum`)
   assert.equal(engine.result().holdsCompleted,chart.notes.filter(n=>n.type==='hold').length,`${song.title}/${mode}: exact holds`)
   assert.equal(engine.result().holdsBroken,0)
   assert.equal(chart.notes.length,song.modes[mode].notes)
  }
  assert.ok(song.modes.facile.notes<song.modes.normal.notes)
  assert.ok(song.modes.difficile.notes>song.modes.normal.notes*1.2,`${song.title}: meaningful difficulty spread`)
 }
 assert.equal(digests.size,100)
})
test('holding ownership survives one finger release and mixed keyboard/touch',()=>{
 const events=[],input=new LaneInput(lane=>events.push(['down',lane]),lane=>events.push(['up',lane]))
 input.down('KeyD',0);input.down('KeyD',0);input.down('pointer-1',0);input.up('KeyD');assert.deepEqual(events,[['down',0]])
 input.down('pointer-2',2);input.up('pointer-1');input.up('pointer-1');input.up('pointer-2')
 assert.deepEqual(events,[['down',0],['down',2],['up',0],['up',2]])
 input.down('KeyD',0);input.clear();input.down('KeyD',0);assert.equal(events.filter(e=>e[0]==='down').length,4)
})
test('interrupted long notes are explicitly counted and are not reported as perfect',()=>{
 const engine=new GameEngine({mode:'normal',notes:[{id:'hold',lane:0,timeSeconds:1,durationSeconds:1,type:'hold'}],scoring:{maxPoints:1000}})
 engine.hit(0,1);engine.release(0,1.1)
 assert.equal(engine.result().perfect,0);assert.equal(engine.result().holdsBroken,1);assert.equal(engine.result().holdsCompleted,0);assert.ok(engine.score<500)
})
test('favorites tolerate blocked localStorage getter',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('denied')}})
 try{assert.deepEqual(readFavorites(),[])}finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage}
})
test('progress and daily challenge are deterministic without fake scores',()=>{
 assert.equal(starsFor(59),0);assert.equal(starsFor(60),1);assert.equal(starsFor(80),2);assert.equal(starsFor(95),3)
 assert.deepEqual(progressFor([],songs[0].id),{played:false,stars:0,accuracy:0,score:0})
 assert.equal(dailySong(songs,new Date('2026-10-24T10:00:00Z')).id,dailySong(songs,new Date('2026-10-24T15:00:00Z')).id)
})
