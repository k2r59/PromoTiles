<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({ active: Boolean, catalog: Boolean })
const canvas = ref(null)
let ctx, sleigh, raf = 0, width = 0, height = 0, loadedAt = null
let nextMeteor = Infinity, meteor = null, disposed = false, wakeTimer = 0, last = 0
const SANTA_DELAY = 5, SANTA_DURATION = 12, FIRST_METEOR_GAP = 3

function loaded() {
  if (loadedAt !== null || disposed) return
  // One clock for this page load. Navigation inside the app cannot replay Santa.
  const navigation = performance.getEntriesByType('navigation')[0]
  loadedAt = navigation?.loadEventEnd || performance.now()
  nextMeteor = props.catalog ? performance.now() / 1000 + 2 + Math.random() * 3 : loadedAt / 1000 + SANTA_DELAY + SANTA_DURATION + FIRST_METEOR_GAP
}
function resize() {
  width = innerWidth; height = innerHeight
  const dpr = Math.min(devicePixelRatio || 1, 1.5)
  canvas.value.width = Math.round(width * dpr)
  canvas.value.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
function spawnMeteor(now) {
  const right = Math.random() > .5
  const x = right ? .04 + Math.random() * .35 : .61 + Math.random() * .35
  meteor = {
    start: now, duration: .95 + Math.random() * .7,
    x, y: .04 + Math.random() * .19,
    dx: (right ? 1 : -1) * (.26 + Math.random() * .30),
    dy: .10 + Math.random() * .20,
  }
  nextMeteor = now + (props.catalog ? 7 + Math.random() * 12 : 9 + Math.random() * 19)
}
function draw(nowMs) {
  raf = 0
  if (!props.active || disposed) return
  if (nowMs - last < 1000 / 30 - 1) { raf = requestAnimationFrame(draw); return }
  last = nowMs
  ctx.clearRect(0, 0, width, height)
  const now = nowMs / 1000
  if (loadedAt !== null) {
    const flight = (nowMs - loadedAt) / 1000 - SANTA_DELAY
    if (!props.catalog && flight >= 0 && flight < SANTA_DURATION && sleigh.complete && sleigh.naturalWidth) {
      const progress = flight / SANTA_DURATION
      const w = Math.min(420, Math.max(210, width * .29)), h = w * sleigh.naturalHeight / sleigh.naturalWidth
      const x = -w + (width + w * 2) * progress
      const y = height * (width < 600 ? .09 - progress * .045 : .18 - progress * .08) + Math.sin(progress * Math.PI * 4) * 5
      ctx.save()
      ctx.globalAlpha = Math.min(1, progress * 9, (1 - progress) * 9) * .88
      ctx.translate(x, y)
      ctx.rotate(-.06)
      ctx.drawImage(sleigh, 0, 0, w, h)
      ctx.restore()
    }
    if (now >= nextMeteor) spawnMeteor(now)
  }
  if (meteor) {
    const progress = (now - meteor.start) / meteor.duration
    if (progress >= 1) meteor = null
    else {
      const dx = meteor.dx * width, dy = meteor.dy * height
      const length = Math.hypot(dx, dy)
      const x = meteor.x * width + dx * progress, y = meteor.y * height + dy * progress
      const tail = Math.min(130, width * .22) * Math.min(1, progress * 6)
      const tx = x - dx / length * tail, ty = y - dy / length * tail
      ctx.save()
      ctx.globalAlpha = Math.sin(progress * Math.PI) * .88
      const trail = ctx.createLinearGradient(tx, ty, x, y)
      trail.addColorStop(0, 'rgba(157,207,255,0)')
      trail.addColorStop(.7, 'rgba(201,229,255,.4)')
      trail.addColorStop(1, '#fff5d9')
      ctx.strokeStyle = trail; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke()
      ctx.shadowColor = '#d1ecff'; ctx.shadowBlur = 9
      ctx.fillStyle = '#fff9e9'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }
  // Sleep between visitors instead of clearing a full-screen canvas continuously.
  const santaStart = loadedAt === null ? Infinity : loadedAt / 1000 + SANTA_DELAY
  const santaFlying = !props.catalog && now >= santaStart && now < santaStart + SANTA_DURATION
  if (meteor || santaFlying) raf = requestAnimationFrame(draw)
  else {
    const next = Math.min(nextMeteor, !props.catalog && now < santaStart ? santaStart : Infinity)
    wakeTimer = window.setTimeout(() => { wakeTimer = 0; if (props.active && !disposed) raf = requestAnimationFrame(draw) }, Number.isFinite(next) ? Math.max(16, (next - now) * 1000) : 1000)
  }
}
function restart() {
  cancelAnimationFrame(raf); clearTimeout(wakeTimer); wakeTimer = 0; last = 0
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  if (props.active) {
    if (props.catalog) nextMeteor = Math.min(nextMeteor, performance.now() / 1000 + 2 + Math.random() * 3)
    raf = requestAnimationFrame(draw)
  }
  else meteor = null
}
onMounted(() => {
  ctx = canvas.value.getContext('2d')
  sleigh = new Image(); sleigh.src = '/santa-sleigh.webp'
  resize()
  window.addEventListener('resize', resize)
  if (document.readyState === 'complete') loaded()
  else window.addEventListener('load', loaded, { once: true })
  restart()
})
watch(() => [props.active, props.catalog], restart)
onUnmounted(() => {
  disposed = true
  clearTimeout(wakeTimer)
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  window.removeEventListener('load', loaded)
})
</script>

<template><canvas ref="canvas" class="sky-visitors" aria-hidden="true"></canvas></template>

<style scoped>
.sky-visitors { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
