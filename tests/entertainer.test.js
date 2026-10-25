import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { GameEngine } from '../src/lib/game-engine.js'
import { legacySongs as songs, songRecords } from '../src/lib/songs.js'
const root = new URL('../public/music/the-entertainer/', import.meta.url)
const digest = createHash('sha256').update(readFileSync(new URL('piano.mp3', root))).digest('hex')

// Read actual MIDI note attacks so charts cannot silently drift from the rendered performance.
function midiAttacks(buffer) {
  const ppq = buffer.readUInt16BE(12), attacks = new Set()
  let offset = 14, tempo
  while (offset < buffer.length) {
    assert.equal(buffer.toString('ascii', offset, offset + 4), 'MTrk')
    const end = offset + 8 + buffer.readUInt32BE(offset + 4)
    offset += 8
    let tick = 0, running
    const variable = () => { let value = 0, byte; do { byte = buffer[offset++]; value = (value << 7) | (byte & 127) } while (byte & 128); return value }
    while (offset < end) {
      tick += variable()
      let status = buffer[offset]
      if (status & 128) offset++; else status = running
      if (status === 255) {
        const type = buffer[offset++], length = variable()
        if (type === 81) tempo = buffer.readUIntBE(offset, length)
        offset += length
      } else if (status === 240 || status === 247) { offset += variable() }
      else {
        running = status
        const pitch = buffer[offset++], velocity = (status & 240) === 192 || (status & 240) === 208 ? 0 : buffer[offset++]
        if ((status & 240) === 144 && velocity) attacks.add(`${tick}:${pitch}`)
      }
    }
  }
  return { attacks, ppq, tempo }
}
const midi = midiAttacks(readFileSync(new URL('performance.mid', root)))
for (const mode of ['facile', 'normal', 'difficile']) {
  test(`Entertainer ${mode}: every tile matches the rendered MIDI and is playable`, () => {
    const chart = JSON.parse(readFileSync(new URL(`${mode}.json`, root)))
    assert.equal(chart.audioSha256, digest)
    assert.equal(chart.songId, songs[0].id)
    assert.ok(chart.durationSeconds > 60 && chart.durationSeconds < 90)
    let previous = -1
    const engine = new GameEngine(chart)
    for (const note of chart.notes) {
      assert.ok(midi.attacks.has(`${note.sourceTick}:${note.midiPitch}`))
      assert.ok(Math.abs(note.timeSeconds - note.sourceTick / midi.ppq * midi.tempo / 1e6) < .000001)
      assert.ok(note.timeSeconds > previous)
      assert.ok(note.timeSeconds < chart.durationSeconds - 2)
      assert.ok(note.lane >= 0 && note.lane < 4)
      engine.hit(note.lane, note.timeSeconds)
      previous = note.timeSeconds
    }
    assert.equal(engine.score, chart.scoring.maxPoints)
    assert.equal(engine.result().accuracy, 100)
    assert.equal(engine.misses, 0)
  })
}
test('records remain separated between the demo and the previous song', () => {
  const records = songs.map((song, i) => ({ songId: song.id, mode: 'normal', score: 100 + i }))
  assert.deepEqual(songRecords(records, songs[0].id), [records[0]])
  assert.deepEqual(songRecords(records, songs[1].id), [records[1]])
})
