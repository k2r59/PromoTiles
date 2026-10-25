// Never treat a truncated file or an implausible media-clock jump as a played round.
export function playbackProblem({duration, expected, current, previous, elapsed}) {
 if (!Number.isFinite(duration) || duration < expected - .75 || duration > expected + 2) return 'duration-mismatch'
 if (!Number.isFinite(current) || current < 0) return 'invalid-clock'
 if (Number.isFinite(previous) && (current - previous > elapsed + 1.25 || current < previous - .5)) return 'clock-jump'
 return null
}
export function isComplete(current, expected) {
 return Number.isFinite(current) && Number.isFinite(expected) && expected > 0 && current >= expected - .35
}
