import test from 'node:test'
import assert from 'node:assert/strict'
import { GameEngine } from '../src/lib/game-engine.js'
import { judgementFeedback } from '../src/lib/game-feedback.js'
const chart={mode:'normal',notes:[{id:'one',timeSeconds:2,lane:0,type:'tap',durationSeconds:0}],scoring:{maxPoints:1000}}
test('judgements distinguish early, late and wrong lane without awarding credit',()=>{
 for(const [lane,time,reason] of [[0,1.7,'early'],[0,2.3,'late'],[1,2,'wrong-lane']]){
  const engine=new GameEngine(chart),event=engine.hit(lane,time)
  assert.equal(event.type,'wrong');assert.equal(event.reason,reason);assert.equal(engine.score,0)
  assert.equal(judgementFeedback(event).tone,'error')
 }
})
test('a note ready on another lane takes precedence over an approaching note on the pressed lane',()=>{
 const engine=new GameEngine({...chart,notes:[...chart.notes,{id:'two',timeSeconds:2.3,lane:1,type:'tap',durationSeconds:0}]})
 assert.equal(engine.hit(1,2).reason,'wrong-lane')
})
test('good and perfect feedback match timing; missed and released notes remain explicit',()=>{
 assert.equal(judgementFeedback(new GameEngine(chart).hit(0,2)).text,'Parfait !')
 assert.equal(judgementFeedback(new GameEngine(chart).hit(0,2.1)).text,'Bien !')
 assert.equal(judgementFeedback(new GameEngine(chart).advance(2.3)[0]).text,'Raté !')
 assert.equal(judgementFeedback({type:'early-release'}).text,'Relâché trop tôt')
 assert.equal(judgementFeedback({type:'ignored'}),null)
})
