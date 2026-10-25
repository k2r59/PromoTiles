// A lane remains held until its last keyboard/pointer owner releases it.
export class LaneInput {
  constructor(press, release) { this.owners = new Map(); this.press = press; this.release = release }
  down(owner, lane) {
    if (this.owners.has(owner)) return
    const held = [...this.owners.values()].includes(lane)
    this.owners.set(owner, lane)
    if (!held) this.press(lane)
  }
  up(owner) {
    const lane = this.owners.get(owner)
    if (lane === undefined) return
    this.owners.delete(owner)
    if (![...this.owners.values()].includes(lane)) this.release(lane)
  }
  clear() { this.owners.clear() }
}
