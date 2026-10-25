// Coordinates follow the cleaned photograph; the pedestal is outside the mask.
export const GLASS = { x: .495, y: .42, rx: .394, ry: .355 }

function floorAt(flake) {
  const edge = GLASS.y + GLASS.ry * Math.sqrt(Math.max(0, 1 - ((flake.x - GLASS.x) / GLASS.rx) ** 2))
  return Math.min(.75 + flake.floorOffset, edge - .006)
}

export function createSnow(count, random = Math.random) {
  return Array.from({ length: count }, () => {
    const depth = random()
    const y = .10 + random() * .59
    const width = GLASS.rx * Math.sqrt(1 - ((y - GLASS.y) / GLASS.ry) ** 2)
    return {
      x: GLASS.x + (random() * 2 - 1) * width * .96, y,
      vx: 0, vy: .012 + depth * .025,
      radius: .0014 + depth * .0027,
      depth, phase: random() * Math.PI * 2,
      floorOffset: random() * .018, settled: false,
    }
  })
}

export function settleSnow(flakes) {
  for (const flake of flakes) {
    flake.y = floorAt(flake)
    flake.vx = flake.vy = 0
    flake.settled = true
  }
}

export function releaseSnow(flakes, random = Math.random) {
  for (const flake of flakes) {
    flake.y = .10 + random() * .27
    const width = GLASS.rx * Math.sqrt(1 - ((flake.y - GLASS.y) / GLASS.ry) ** 2)
    flake.x = GLASS.x + (random() * 2 - 1) * width * .94
    flake.vx = (random() - .5) * .10
    flake.vy = .012 + random() * .035
    flake.settled = false
  }
}

export const TURN_DURATION = 1.8
export function turnPose(age) {
  const ease = value => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, value)))) / 2
  const progress = age < .7 ? ease(age / .7) : age < 1 ? 1 : 1 - ease((age - 1) / .8)
  return { angle: 180 * progress, scale: 1 - Math.sin(progress * Math.PI) * .22 }
}

export function shakeSnow(flakes, random = Math.random) {
  for (const flake of flakes) {
    flake.settled = false
    flake.vx = (random() - .5) * 1.25
    flake.vy = -.65 - random() * .8
  }
}

export function stepSnow(flakes, dt, time, turbulence) {
  const drag = Math.exp(-2.4 * dt)
  for (const flake of flakes) {
    if (flake.settled) continue
    // Drag in liquid dissipates the shake; gravity then gives a slow, varied fall.
    const flow = Math.sin(time * 2.6 + flake.phase + flake.y * 12)
    flake.vx = flake.vx * drag + (flow * (.012 + turbulence * .42)) * dt
    flake.vy = flake.vy * drag + (.06 + flake.depth * .055 + Math.cos(time * 3 + flake.phase) * turbulence * .16) * dt
    flake.x += flake.vx * dt
    flake.y += flake.vy * dt

    // Reflect at the inside of the glass instead of teleporting flakes to the top.
    const dx = (flake.x - GLASS.x) / GLASS.rx
    const dy = (flake.y - GLASS.y) / GLASS.ry
    const distance = Math.hypot(dx, dy)
    if (distance > .985) {
      flake.x = GLASS.x + dx / distance * GLASS.rx * .985
      flake.y = GLASS.y + dy / distance * GLASS.ry * .985
      const nx = dx / GLASS.rx, ny = dy / GLASS.ry
      const outward = (flake.vx * nx + flake.vy * ny) / (nx * nx + ny * ny)
      if (outward > 0) {
        flake.vx -= 1.35 * outward * nx
        flake.vy -= 1.35 * outward * ny
      }
    }
    const floor = floorAt(flake)
    if (flake.y >= floor && flake.vy >= 0) {
      flake.y = floor
      flake.vx = flake.vy = 0
      flake.settled = true
    }
  }
}
