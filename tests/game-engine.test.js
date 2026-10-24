import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GameEngine, saveResult } from '../src/lib/game-engine.js'

const note = (timeSeconds, lane = 0, durationSeconds = 0) => ({
  id: `${timeSeconds}-${lane}`, timeSeconds, lane, durationSeconds,
  type: durationSeconds ? 'hold' : 'tap',
})
const fixture = (notes, mode = 'normal') => ({
  mode, notes, songDifficulty: { coefficient: 1.5 },
  scoring: { maxPoints: { facile: 1500, normal: 2250, difficile: 3000 }[mode] },
})
function playPerfect(engine, notes = engine.chart.notes) {
  const actions = notes.flatMap(n => [
    { kind: 'hit', lane: n.lane, time: n.timeSeconds },
    ...(n.type === 'hold' ? [{ kind: 'release', lane: n.lane, time: n.timeSeconds + n.durationSeconds }] : []),
  ]).sort((a, b) => a.time - b.time || (a.kind === 'release' ? -1 : 1))
  for (const a of actions) engine[a.kind](a.lane, a.time)
  engine.advance(Math.max(...notes.map(n => n.timeSeconds + n.durationSeconds)) + 1)
}

for (const [mode, maximum] of [['facile', 1500], ['normal', 2250], ['difficile', 3000]]) {
  test(`${mode}: real chart can be completed perfectly at its exact score ceiling`, () => {
    const chart = JSON.parse(readFileSync(new URL(`../public/music/${mode}.json`, import.meta.url)))
    const original = JSON.stringify(chart)
    const engine = new GameEngine(chart)
    playPerfect(engine)
    assert.equal(engine.score, maximum)
    assert.equal(engine.judged, chart.notes.length)
    assert.equal(engine.result().accuracy, 100)
    assert.equal(engine.result().songId, chart.songId, 'saved result must identify the actual track')
    assert.equal(engine.perfect, chart.notes.length)
    assert.equal(engine.wrong, 0)
    assert.equal(engine.misses, 0)
    assert.equal(JSON.stringify(chart), original, 'play must not mutate the source chart')
  })
}

test('an ambiguous input judges the closest note on the requested lane', () => {
  const engine = new GameEngine(fixture([note(1), note(1.2), note(1.19, 1)]))
  engine.hit(0, 1.11)
  assert.equal(engine.notes[0].state, 'pending')
  assert.equal(engine.notes[1].state, 'hit')
  assert.equal(engine.notes[2].state, 'pending')
  assert.equal(engine.judged, 1)
})

test('correct timing on another lane cannot hit the note', () => {
  const engine = new GameEngine(fixture([note(1)]))
  assert.equal(engine.hit(1, 1).type, 'wrong')
  assert.equal(engine.notes[0].state, 'pending')
  assert.equal(engine.score, 0)
})

test('a note cannot be scored twice and repeated input does not inflate score', () => {
  const engine = new GameEngine(fixture([note(1), note(3)]))
  engine.hit(0, 1)
  const firstScore = engine.score
  for (let i = 0; i < 10; i++) engine.hit(0, 1 + i * .001)
  assert.equal(engine.perfect, 1)
  assert.equal(engine.judged, 1)
  assert.equal(engine.wrong, 1, 'rapid repeated wrong inputs are debounced')
  assert.ok(engine.score <= firstScore)
  engine.hit(0, 1.3)
  assert.equal(engine.wrong, 2, 'a later wrong input is still penalized')
})

test('late notes are missed exactly once and reset current combo', () => {
  const engine = new GameEngine(fixture([note(1), note(2), note(3)]))
  engine.hit(0, 1)
  assert.deepEqual(engine.advance(2.3), [{ type: 'miss', lane: 0 }])
  assert.equal(engine.combo, 0)
  assert.equal(engine.maxCombo, 1)
  assert.equal(engine.misses, 1)
  assert.deepEqual(engine.advance(2.4), [])
  assert.equal(engine.misses, 1)
  engine.advance(10)
  assert.equal(engine.misses, 2)
  assert.equal(engine.judged, 3)
})

test('missing an entire chart ends with zero score and zero accuracy', () => {
  const engine = new GameEngine(fixture([note(1), note(2, 1, 1)]))
  engine.advance(10)
  assert.equal(engine.score, 0)
  assert.equal(engine.result().accuracy, 0)
  assert.equal(engine.misses, 2)
})

test('a fully held note receives full score only on completion', () => {
  const engine = new GameEngine(fixture([note(1, 0, 1)]))
  assert.equal(engine.hit(0, 1).hold, true)
  assert.equal(engine.judged, 0)
  assert.ok(engine.score < 2250)
  assert.deepEqual(engine.advance(2), [{ type: 'hold-complete', lane: 0 }])
  engine.release(0, 2)
  assert.equal(engine.score, 2250)
  assert.equal(engine.judged, 1)
  assert.equal(engine.perfect, 1)
})

test('early release awards partial credit and cannot be repaired with a second press', () => {
  const engine = new GameEngine(fixture([note(1, 0, 2)]))
  engine.hit(0, 1)
  assert.equal(engine.release(0, 2).type, 'early-release')
  assert.ok(Math.abs(engine.notes[0].quality - .65) < 1e-10)
  assert.equal(engine.combo, 0)
  const partial = engine.notes[0].quality
  engine.hit(0, 2.1)
  engine.advance(4)
  assert.equal(engine.notes[0].quality, partial)
  assert.equal(engine.judged, 1)
  assert.ok(engine.score < 2250)
})

test('immediate release/cancel stops a hold and preserves only head credit', () => {
  const engine = new GameEngine(fixture([note(1, 0, 2)]))
  engine.hit(0, 1)
  engine.release(0, 1)
  engine.advance(10)
  assert.equal(engine.notes[0].quality, .3)
  assert.equal(engine.notes[0].state, 'hit')
  assert.equal(engine.combo, 0)
})

test('pressing again while holding does not duplicate head credit or add a wrong hit', () => {
  const engine = new GameEngine(fixture([note(1, 0, 2)]))
  engine.hit(0, 1)
  assert.equal(engine.hit(0, 1.1).type, 'ignored')
  assert.equal(engine.perfect, 1)
  assert.equal(engine.wrong, 0)
  engine.release(0, 3)
  assert.equal(engine.score, 2250)
})

test('two simultaneous lanes can be scored independently', () => {
  const engine = new GameEngine(fixture([note(1), note(1, 3)]))
  engine.hit(0, 1)
  engine.hit(3, 1)
  assert.equal(engine.score, 2250)
  assert.equal(engine.maxCombo, 2)
})

test('rewind and replay reproduce the same result without duplicate score or journal entries', () => {
  const chart = fixture([note(1), note(2, 1), note(3, 2), note(4, 3)])
  const engine = new GameEngine(chart)
  playPerfect(engine)
  const expected = engine.result()
  assert.equal(engine.rewindTo(2), 2)
  assert.equal(engine.judged, 1, 'input exactly at rewind target must be replayed')
  playPerfect(engine, chart.notes.filter(n => n.timeSeconds >= 2))
  assert.deepEqual(engine.result(), expected)
  assert.equal(engine.journal.length, 4)
})

test('rewinding through a hold restores a playable beginning of that hold', () => {
  const chart = fixture([note(.2, 1), note(1, 0, 2), note(4, 3)])
  const engine = new GameEngine(chart)
  playPerfect(engine)
  const target = engine.rewindTo(2)
  assert.ok(target < 1)
  assert.equal(engine.notes[1].state, 'pending')
  assert.equal(engine.notes[0].state, 'hit')
  playPerfect(engine, chart.notes.filter(n => n.timeSeconds >= target))
  assert.equal(engine.score, 2250)
  assert.equal(engine.perfect, 3)
})

test('reset makes a completely fresh round, including penalties and saved input history', () => {
  const engine = new GameEngine(fixture([note(1)]))
  engine.hit(2, .5)
  engine.advance(3)
  engine.reset()
  assert.equal(engine.score, 0)
  assert.equal(engine.wrong, 0)
  assert.equal(engine.misses, 0)
  assert.deepEqual(engine.journal, [])
  assert.equal(engine.notes[0].state, 'pending')
  engine.hit(0, 1)
  assert.equal(engine.score, 2250)
})

function memoryStorage(initial = null) {
  let value = initial
  return { getItem: () => value, setItem: (key, next) => { assert.equal(key, 'promodev-records-v1'); value = next }, read: () => JSON.parse(value) }
}
test('saveResult handles corrupt JSON and non-array stored values', () => {
  for (const initial of ['{broken', '{}', 'null', '42']) {
    const storage = memoryStorage(initial)
    assert.equal(saveResult({ score: 500, mode: 'normal' }, storage), true)
    assert.equal(storage.read().length, 1)
    assert.equal(storage.read()[0].score, 500)
    assert.ok(Number.isFinite(Date.parse(storage.read()[0].date)))
  }
})

test('saveResult discards corrupt entries and retains the latest 50 valid rounds', () => {
  const storage = memoryStorage(JSON.stringify([null, {}, { score: '900' }, ...Array.from({ length: 55 }, (_, score) => ({ score }))]))
  assert.equal(saveResult({ score: 1000 }, storage), true)
  assert.equal(storage.read().length, 50)
  assert.equal(storage.read()[0].score, 6)
  assert.equal(storage.read().at(-1).score, 1000)
})

test('saveResult reports denied/full storage instead of throwing', () => {
  const storage = { getItem() { throw new Error('denied') }, setItem() { throw new Error('quota') } }
  assert.equal(saveResult({ score: 200 }, storage), false)
  assert.equal(saveResult({ score: 200 }, undefined), false)
})

test('all-time records for each level survive more than 50 later inferior rounds', () => {
  const storage = memoryStorage()
  for (const [mode, score] of [['facile', 1500], ['normal', 2250], ['difficile', 3000]]) {
    assert.equal(saveResult({ mode, score }, storage), true)
  }
  for (let i = 0; i < 80; i++) {
    assert.equal(saveResult({ mode: ['facile', 'normal', 'difficile'][i % 3], score: 500 }, storage), true)
  }
  assert.equal(storage.read().length, 53, 'retain 50 recent rounds and three older records')
  for (const [mode, score] of [['facile', 1500], ['normal', 2250], ['difficile', 3000]]) {
    assert.equal(Math.max(...storage.read().filter(r => r.mode === mode).map(r => r.score)), score)
  }
  assert.equal(storage.read().at(-1).score, 500)
})

test('record retention keeps distinct songs and prefers the latest equally good result', () => {
  const storage = memoryStorage()
  saveResult({ mode: 'normal', songId: 'song-a', score: 2000, attempt: 1 }, storage)
  saveResult({ mode: 'normal', songId: 'song-b', score: 1000 }, storage)
  saveResult({ mode: 'normal', songId: 'song-a', score: 2000, attempt: 2 }, storage)
  for (let i = 0; i < 55; i++) saveResult({ mode: 'normal', songId: 'song-a', score: 100 }, storage)
  assert.equal(storage.read().length, 52)
  assert.equal(storage.read().find(r => r.songId === 'song-b').score, 1000)
  assert.equal(storage.read().find(r => r.score === 2000).attempt, 2)
  assert.equal(storage.read().filter(r => r.score === 2000).length, 1)
})

test('saveResult catches a throwing localStorage property getter', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError') } })
    assert.equal(saveResult({ mode: 'normal', score: 200 }), false)
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  }
})
