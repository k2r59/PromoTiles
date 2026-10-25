import test from 'node:test'
import assert from 'node:assert/strict'
import { playbackProblem, isComplete } from '../src/lib/playback-health.js'
test('an ended event from a truncated mobile audio cannot complete a round',()=>{
 assert.equal(isComplete(.05,91.25),false)
 assert.equal(playbackProblem({duration:.05,expected:91.25,current:.05}), 'duration-mismatch')
 assert.equal(playbackProblem({duration:NaN,expected:91.25,current:0}), 'duration-mismatch')
 assert.equal(isComplete(91.1,91.25),true)
})
test('media clock jumps fail before scoring while normal playback, stalls and resumed playback remain valid',()=>{
 const state={duration:91.25,expected:91.25,current:91.25,previous:0,elapsed:.1}
 assert.equal(playbackProblem(state),'clock-jump')
 for(const change of [{current:.1},{current:0},{current:45.1,previous:45},{current:15,elapsed:15}])assert.equal(playbackProblem({...state,...change}),null)
 assert.equal(isComplete(NaN,91.25),false)
})
