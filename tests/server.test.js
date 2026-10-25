import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameServer } from '../server/app.mjs'
const chart={songId:'test',mode:'normal',durationSeconds:10,notes:[{id:'a',timeSeconds:1,lane:0,type:'hold',durationSeconds:1},{id:'b',timeSeconds:4,lane:1,type:'tap',durationSeconds:0}],scoring:{maxPoints:1000}}
test('shared server recomputes scores, rejects forged/duplicate/early submissions and separates players',async()=>{
 let clock=100000;const catalog=[{id:'test'}]
 const server=createGameServer({database:':memory:',now:()=>clock,catalog,chartLoader:()=>chart})
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
 const base='http://127.0.0.1:'+server.address().port
 const post=async(path,body,token)=>fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)})
 try{
  const session=await(await post('session',{})).json()
  assert.equal((await post('profile',null,session.token)).status,400)
  assert.equal((await post('rounds',{songId:'test',mode:'normal'},'bad')).status,401)
  assert.equal((await post('profile',{name:'Camille'},session.token)).status,200)
  const round=await(await post('rounds',{songId:'test',mode:'normal'},session.token)).json()
  const replay=[{kind:'hit',lane:0,time:1},{kind:'release',lane:0,time:2},{kind:'hit',lane:1,time:4},{kind:'release',lane:1,time:4.1}]
  assert.equal((await post('scores',{roundId:round.roundId,replay},session.token)).status,400)
  clock+=15000
  assert.equal((await post('scores',{roundId:round.roundId,replay:[{kind:'hit',lane:7,time:1}]},session.token)).status,400)
  const result=await(await post('scores',{roundId:round.roundId,replay,score:999999},session.token)).json()
  assert.equal(result.result.score,1000);assert.equal(result.result.holdsCompleted,1)
  assert.equal((await post('scores',{roundId:round.roundId,replay},session.token)).status,409)
  const second=await(await post('session',{})).json(),round2=await(await post('rounds',{songId:'test',mode:'normal'},second.token)).json()
  clock+=15000;await post('scores',{roundId:round2.roundId,replay:[]},second.token)
  const board=await(await fetch(base+'/api/leaderboard?song=test&mode=normal')).json()
  assert.equal(board.rows.length,2);assert.equal(board.rows[0].name,'Camille');assert.equal(board.rows[0].score,1000);assert.equal(board.rows[1].score,0)
  const invalidOrigin=await fetch(base+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://unrelated.example'},body:'{}'})
  assert.equal(invalidOrigin.status,403)
  const pending=await(await post('rounds',{songId:'test',mode:'normal'},session.token)).json()
  catalog.splice(0);clock+=15000
  assert.equal((await post('scores',{roundId:pending.roundId,replay},session.token)).status,409)
  assert.deepEqual((await(await fetch(base+'/api/leaderboard')).json()).rows,[])
  catalog.push({id:'test'})
  assert.equal((await(await fetch(base+'/api/leaderboard')).json()).rows[0].score,1000)
 }finally{await new Promise(resolve=>server.close(resolve))}
})
