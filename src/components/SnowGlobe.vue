<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { GLASS, createSnow, settleSnow, releaseSnow, stepSnow, turnPose, TURN_DURATION } from '../lib/snow-globe-physics.js'

const props = defineProps({ motion: Boolean, active: { type: Boolean, default: true } })
const host = ref(null), sculpture = ref(null), canvas = ref(null)
const hidden = ref(false), systemReduced = ref(false), shaken = ref(false)
const animated = computed(() => props.motion && props.active && !hidden.value && !systemReduced.value)
let ctx, observer, media, raf = 0, timer = 0, last = 0, time = 0, size = 0
let targetX = 0, targetY = 0, currentX = 0, currentY = 0, impulse = 0, shakeAge = TURN_DURATION
let turning = false, snowfallAge = 1
const ribbon = ref(null)
let ribbonRoutes = [], sparks = []
// Only the visible sections of the photographed ribbon, in source-image pixels.
const ribbonPaths = [
  'M 594 277 C 510 265 494 323 578 335 C 650 347 752 340 735 379',
  'M 501 384 C 419 395 455 438 480 447',
  'M 731 380 C 789 385 805 412 775 435',
  'M 464 513 C 365 520 386 563 406 576',
  'M 531 515 C 629 550 862 536 839 600',
  'M 444 646 C 398 664 415 682 464 692',
  'M 463 651 C 584 674 697 730 827 751',
]
function prepareRibbon() {
  ribbonRoutes = [...ribbon.value.querySelectorAll('path')].map(path => {
    const length = path.getTotalLength()
    return Array.from({ length: 121 }, (_, i) => {
      const point = path.getPointAtLength(length * i / 120)
      return { x: point.x / 1254, y: point.y / 1254 }
    })
  })
  sparks = Array.from({ length: 9 }, () => newSpark(true))
}
function newSpark(initial = false) {
  return { route: Math.floor(Math.random() * ribbonRoutes.length), start: time + (initial ? -Math.random() * 5 : Math.random() * 2), duration: 2.5 + Math.random() * 3, phase: Math.random() * 6.28 }
}
function drawRibbon() {
  if (!animated.value) return
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < sparks.length; i++) {
    let spark = sparks[i]
    if (time > spark.start + spark.duration) sparks[i] = spark = newSpark()
    const progress = (time - spark.start) / spark.duration
    if (progress <= 0 || progress >= 1) continue
    const points = ribbonRoutes[spark.route]
    const fade = Math.sin(progress * Math.PI) * (.55 + .45 * Math.sin(time * 9 + spark.phase) ** 2)
    for (let tail = 3; tail >= 0; tail--) {
      const index = Math.max(0, progress * 120 - tail * 2)
      const a = points[Math.floor(index)], b = points[Math.min(120, Math.ceil(index))]
      const fraction = index % 1
      const x = (a.x + (b.x - a.x) * fraction) * size
      const y = (a.y + (b.y - a.y) * fraction) * size
      const radius = size * (tail ? .003 : .005)
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3)
      glow.addColorStop(0, `rgba(255,249,220,${fade * (tail ? .22 : .9)})`)
      glow.addColorStop(.25, `rgba(255,205,110,${fade * .35})`)
      glow.addColorStop(1, 'rgba(255,185,70,0)')
      ctx.fillStyle = glow
      ctx.fillRect(x - radius * 3, y - radius * 3, radius * 6, radius * 6)
    }
  }
  ctx.restore()
}
let flakes = []
const glints = [
  { x: 71, y: 13.4, scale: .8, delay: -3.7, duration: 8.2 },
  { x: 13.7, y: 32, scale: .45, delay: -6.5, duration: 10.1 },
  { x: 85.2, y: 28, scale: .5, delay: -2.4, duration: 9.7 },
  { x: 51, y: 55, scale: .4, delay: -5, duration: 7.3 },
  { x: 50, y: 79.5, scale: .3, delay: -7, duration: 11.4 },
]

function resize() {
  if (!ctx || !sculpture.value) return
  size = sculpture.value.clientWidth
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.value.width = Math.round(size * ratio)
  canvas.value.height = Math.round(size * ratio)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  // Keep particle positions on resize: a layout change must not shake the globe.
  if (!flakes.length) {
    flakes = createSnow(size < 450 ? 260 : 340)
    settleSnow(flakes)
  }
  draw(0)
}
function draw(dt) {
  if (!ctx || !size) return
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  // The animated particles follow the actual glass boundary, not the image rectangle.
  ctx.beginPath()
  ctx.ellipse(size * GLASS.x, size * GLASS.y, size * GLASS.rx, size * GLASS.ry, 0, 0, Math.PI * 2)
  ctx.clip()
  drawRibbon()
  if (dt && !turning) stepSnow(flakes, dt, time, impulse)
  for (let i = 0; i < flakes.length; i++) {
    const flake = flakes[i]
    if (turning || flake.settled) continue
    const alpha = (.48 + flake.depth * .48) * Math.min(1, snowfallAge / .35)
    const radius = Math.max(.5, flake.radius * size)
    // A soft fringe and a bright irregular core read as snow, not golden glitter.
    if (flake.depth > .65 && !flake.settled) {
      ctx.beginPath()
      ctx.arc(flake.x * size, flake.y * size, radius * 1.8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232,244,255,${alpha * .13})`
      ctx.fill()
    }
    ctx.beginPath()
    ctx.ellipse(flake.x * size, flake.y * size, radius, radius * .78, flake.phase + (flake.settled ? 0 : time * .35), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(247,251,255,${alpha})`
    ctx.fill()
  }
  ctx.restore()
}
function frame(now) {
  raf = 0
  if (!animated.value) return
  if (now - last < 1000 / 30 - 1) { raf = requestAnimationFrame(frame); return }
  const dt = Math.min((now - last) / 1000, .04) || .016
  last = now
  time += dt
  impulse *= Math.exp(-dt * .85)
  shakeAge += dt
  snowfallAge += dt
  if (turning && shakeAge >= TURN_DURATION) {
    turning = false
    releaseSnow(flakes)
    impulse = .22
    snowfallAge = 0
  }
  const ease = 1 - Math.exp(-dt * 5)
  currentX += (targetX - currentX) * ease
  currentY += (targetY - currentY) * ease
  const pose = turnPose(shakeAge)
  sculpture.value.style.transform = `translate3d(${currentX * 3}px,${currentY * 2 + Math.sin(time * .55) * 1.4}px,0) rotate(${pose.angle}deg) scale(${pose.scale})`
  draw(dt)
  raf = requestAnimationFrame(frame)
}
function resetPointer() { targetX = 0; targetY = 0 }
function restart() {
  cancelAnimationFrame(raf)
  raf = 0
  if (!ctx) return
  last = performance.now()
  if (animated.value) raf = requestAnimationFrame(frame)
  else {
    resetPointer()
    currentX = currentY = impulse = 0
    shakeAge = TURN_DURATION
    turning = false
    settleSnow(flakes)
    sculpture.value.style.transform = 'translate3d(0,0,0)'
    shaken.value = false
    clearTimeout(timer)
    draw(0)
  }
}
function move(event) {
  if (!animated.value) return
  const bounds = host.value.getBoundingClientRect()
  targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
  targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
}
function shake() {
  if (!animated.value || turning) return
  turning = true
  impulse = 0
  shakeAge = 0
  shaken.value = true
  clearTimeout(timer)
  timer = window.setTimeout(() => { shaken.value = false }, 27000)
}
function visibility() { hidden.value = document.hidden }
function preference() { systemReduced.value = media.matches }
onMounted(() => {
  hidden.value = document.hidden
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference()
  media.addEventListener('change', preference)
  ctx = canvas.value.getContext('2d')
  prepareRibbon()
  observer = new ResizeObserver(resize)
  observer.observe(sculpture.value)
  document.addEventListener('visibilitychange', visibility)
  resize()
  restart()
})
watch(animated, restart)
onUnmounted(() => {
  cancelAnimationFrame(raf)
  clearTimeout(timer)
  observer?.disconnect()
  media?.removeEventListener('change', preference)
  document.removeEventListener('visibilitychange', visibility)
})
</script>

<template>
  <div class="globe-wrap" :class="{ 'globe-still': !animated, 'globe-awake': shaken }">
    <button ref="host" class="globe-canvas" type="button"
      :aria-label="animated ? 'Retourner la boule à neige' : 'Boule de Noël, sapin en touches de piano et cadeaux'"
      :aria-disabled="!animated" @pointermove="move" @pointerleave="resetPointer" @pointerup="resetPointer" @click="shake">
      <span class="sculpture-position">
        <span ref="sculpture" class="sculpture">
          <img class="globe-art" src="/piano-snowglobe-clear.webp" alt="" width="1100" height="1100" fetchpriority="high" decoding="async" draggable="false" />
          <img class="globe-star" src="/piano-snowglobe-clear.webp" alt="" aria-hidden="true" width="1100" height="1100" draggable="false" />
          <svg ref="ribbon" class="ribbon-map" viewBox="0 0 1254 1254" aria-hidden="true"><path v-for="path in ribbonPaths" :key="path" :d="path" /></svg>
          <span class="star-halo" aria-hidden="true"></span>
          <span class="star-flash" aria-hidden="true"></span>
          <canvas ref="canvas" class="globe-snow" aria-hidden="true"></canvas>
          <span v-for="(glint, index) in glints" :key="index" class="globe-glint" aria-hidden="true"
            :style="{ left: `${glint.x}%`, top: `${glint.y}%`, '--glint-size': glint.scale, animationDelay: `${glint.delay}s`, animationDuration: `${glint.duration}s` }"></span>
          <span class="glass-light" aria-hidden="true"></span>
        </span>
      </span>
    </button>
    <p class="globe-hint" :class="{ active: shaken }"><span aria-hidden="true">✧</span>{{ animated ? (shaken ? 'Un peu de magie, juste pour vous.' : 'Touchez la boule. Réveillez la magie.') : 'Un instant suspendu.' }}</p>
  </div>
</template>

<style scoped>
.globe-canvas { overflow: visible; }
.sculpture-position { position: absolute; height: 100%; aspect-ratio: 1; left: 50%; top: 0; transform: translateX(-50%); pointer-events: none; }
.sculpture { display: block; position: relative; width: 100%; height: 100%; will-change: transform; transform-origin: 50% 50%; }
.ribbon-map { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none; }
.globe-art { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; -webkit-user-drag: none; filter: drop-shadow(0 14px 17px rgba(0,5,15,.24)); }
.globe-snow { z-index: 1; }
.globe-star { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; clip-path: polygon(50% 8%,51.4% 12.4%,54.2% 9.6%,52.1% 13.2%,57.2% 13.8%,52.5% 15.1%,54.2% 19.4%,51.2% 16.5%,50.1% 20.2%,48.9% 16.2%,45.5% 19.3%,47.8% 15.3%,43.1% 13.9%,47.8% 12.9%,45.3% 9.6%,48.7% 12.2%); filter: brightness(1.65) saturate(.7); opacity: .12; animation: star-twinkle 4.6s ease-in-out infinite; }
.star-halo { position: absolute; z-index: 2; left: 39.5%; top: 4.4%; width: 20%; aspect-ratio: 1; pointer-events: none; background: radial-gradient(circle,rgba(255,246,206,.65),rgba(255,205,108,.20) 30%,transparent 67%); mix-blend-mode: screen; opacity: .2; animation: star-halo 3.2s ease-in-out infinite; }
.star-flash { position: absolute; z-index: 3; left: 49.5%; top: 14.4%; width: 16%; aspect-ratio: 1; transform: translate(-50%,-50%); pointer-events: none; opacity: 0; animation: star-flash 3.2s ease-in-out infinite; }
.star-flash::before,.star-flash::after { content: ''; position: absolute; left: 49%; top: 0; width: 2%; height: 100%; border-radius: 50%; background: linear-gradient(transparent 4%,#ffe1a6 28%,#fffef5 50%,#ffe1a6 72%,transparent 96%); box-shadow: 0 0 7px #ffe1a677; }
.star-flash::after { transform: rotate(90deg) scaleY(.85); }
.globe-awake .star-flash { animation-duration: 2s; }
.globe-awake .globe-star,.globe-awake .star-halo { animation-duration: 2.3s; }
.globe-glint { position: absolute; z-index: 2; width: 8%; aspect-ratio: 1; margin: -4% 0 0 -4%; border-radius: 50%; background: radial-gradient(circle,rgba(255,250,229,.88),rgba(255,213,144,.18) 25%,transparent 65%); transform: scale(var(--glint-size)); opacity: .16; animation: jewel-breath 8s ease-in-out infinite; }
.globe-glint::before,.globe-glint::after { content: ''; position: absolute; left: 48%; top: 5%; width: 4%; height: 90%; background: linear-gradient(transparent,rgba(255,251,228,.84),transparent); border-radius: 50%; }
.globe-glint::after { transform: rotate(90deg); }
.glass-light { position:absolute; left: 9%; top: 4%; width: 82%; height: 73%; border-radius:50%; background: radial-gradient(ellipse at 21% 34%,rgba(224,245,255,.08),transparent 26%),radial-gradient(ellipse at 80% 20%,rgba(255,232,190,.08),transparent 23%); mix-blend-mode: screen; opacity: .5; animation: glass-breath 12s ease-in-out infinite alternate; }
.globe-awake .glass-light { opacity: .8; }
.globe-still .sculpture { will-change: auto; }
.globe-still .globe-glint,.globe-still .glass-light { animation-play-state: paused; }
.globe-still .globe-star,.globe-still .star-halo,.globe-still .star-flash { animation: none; opacity: 0; }
@keyframes star-flash { 0%,25%,80%,100% { opacity: 0; transform: translate(-50%,-50%) scale(.65); } 40%,62% { opacity: .95; transform: translate(-50%,-50%) scale(1.08); } 50%,72% { opacity: .18; transform: translate(-50%,-50%) scale(.8); } }
@keyframes star-twinkle { 0%,100% { opacity: .12; } 38% { opacity: .35; } 48% { opacity: 1; } 58% { opacity: .3; } 65% { opacity: .8; } 78% { opacity: .12; } }
@keyframes star-halo { 0%,100% { opacity: .16; transform: scale(.88); } 48% { opacity: .85; transform: scale(1.12); } 58% { opacity: .28; transform: scale(.95); } 65% { opacity: .6; transform: scale(1.05); } }
@keyframes jewel-breath { 0%,60%,100% { opacity: .08; transform: scale(calc(var(--glint-size) * .72)); } 78% { opacity:.75; transform:scale(var(--glint-size)); } 90% { opacity:.18; transform:scale(calc(var(--glint-size) * .85)); } }
@keyframes glass-breath { from { opacity:.2; } to { opacity:.7; } }
@media(prefers-reduced-motion:reduce) { .sculpture { transform:none!important; will-change:auto; } .globe-glint,.glass-light,.globe-star,.star-halo,.star-flash { animation:none!important; } .globe-star,.star-halo,.star-flash { opacity:0; } }
</style>
