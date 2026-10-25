import test from 'node:test'
import assert from 'node:assert/strict'
import { GLASS, createSnow, shakeSnow, stepSnow, settleSnow, releaseSnow, turnPose, TURN_DURATION } from '../src/lib/snow-globe-physics.js'

function randomSequence() {
  let seed = 59
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296)
}

test('snow stays inside the glass through repeated shakes at different frame rates', () => {
  for (const dt of [1 / 120, 1 / 60, .04]) {
    const random = randomSequence(), flakes = createSnow(240, random)
    for (let frame = 0; frame < 800; frame++) {
      if (frame % 80 === 0) shakeSnow(flakes, random)
      stepSnow(flakes, dt, frame * dt, Math.exp(-(frame % 80) * dt * .85))
      for (const flake of flakes) {
        const distance = Math.hypot((flake.x - GLASS.x) / GLASS.rx, (flake.y - GLASS.y) / GLASS.ry)
        assert.ok(distance <= 1, `flake escaped the glass: ${distance}`)
      }
    }
  }
})

test('snow settles, remains still, then lifts again on the next click', () => {
  const random = randomSequence(), flakes = createSnow(240, random)
  shakeSnow(flakes, random)
  for (let frame = 0; frame < 2400; frame++) {
    stepSnow(flakes, 1 / 60, frame / 60, Math.exp(-frame / 60 * .85))
  }
  assert.ok(flakes.every(flake => flake.settled), 'all flakes should settle after the shake')
  const positions = flakes.map(({ x, y }) => ({ x, y }))
  stepSnow(flakes, 1 / 60, 41, 0)
  assert.deepEqual(flakes.map(({ x, y }) => ({ x, y })), positions)
  shakeSnow(flakes, random)
  stepSnow(flakes, 1 / 60, 42, 1)
  assert.ok(flakes.every((flake, i) => !flake.settled && flake.y < positions[i].y))
  assert.equal(flakes.length, 240, 'clicking must reuse the snow, not accumulate particles')
})

test('the globe starts with no airborne snow and releases it only after turning upright', () => {
  const random = randomSequence(), flakes = createSnow(180, random)
  settleSnow(flakes)
  assert.ok(flakes.every(flake => flake.settled))
  assert.equal(turnPose(0).angle, 0)
  assert.equal(turnPose(.8).angle, 180)
  assert.equal(turnPose(TURN_DURATION).angle, 0)
  assert.equal(turnPose(TURN_DURATION + 10).scale, 1)
  releaseSnow(flakes, random)
  assert.ok(flakes.every(flake => !flake.settled && flake.y < .4 && flake.vy > 0))
  for (let frame = 0; frame < 2400; frame++) stepSnow(flakes, 1 / 60, frame / 60, .22 * Math.exp(-frame / 60 * .85))
  assert.ok(flakes.every(flake => flake.settled))
})
