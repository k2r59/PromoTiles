<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({ motion: Boolean, active: { type: Boolean, default: true } })
const host = ref(null), sculpture = ref(null), canvas = ref(null)
const hidden = ref(false), systemReduced = ref(false), shaken = ref(false)
const animated = computed(() => props.motion && props.active && !hidden.value && !systemReduced.value)
let ctx, observer, media, raf = 0, timer = 0, last = 0, time = 0, size = 0
let targetX = 0, targetY = 0, currentX = 0, currentY = 0, impulse = 0
let flakes = []
const glints = [
  { x: 50, y: 14.5, scale: 1.1, delay: -1, duration: 6.8 },
  { x: 71, y: 13.4, scale: .8, delay: -3.7, duration: 8.2 },
  { x: 13.7, y: 32, scale: .45, delay: -6.5, duration: 10.1 },
  { x: 85.2, y: 28, scale: .5, delay: -2.4, duration: 9.7 },
  { x: 51, y: 55, scale: .4, delay: -5, duration: 7.3 },
  { x: 50, y: 79.5, scale: .3, delay: -7, duration: 11.4 },
]

function makeFlake(randomY = true) {
  const y = randomY ? .08 + Math.random() * .66 : .075
  const halfWidth = .407 * Math.sqrt(Math.max(0, 1 - ((y - .42) / .365) ** 2))
  return { x: .5 + (Math.random() * 2 - 1) * halfWidth, y,
    r: .0007 + Math.random() * .0017, speed: .014 + Math.random() * .025,
    phase: Math.random() * Math.PI * 2, depth: .35 + Math.random() * .65 }
}
function resize() {
  if (!ctx || !sculpture.value) return
  size = sculpture.value.getBoundingClientRect().width
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.value.width = Math.round(size * ratio)
  canvas.value.height = Math.round(size * ratio)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  flakes = Array.from({ length: size < 450 ? 80 : 120 }, () => makeFlake())
  draw(0)
}
function draw(dt) {
  if (!ctx || !size) return
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  // The animated particles follow the actual glass boundary, not the image rectangle.
  ctx.beginPath()
  ctx.ellipse(size * .5, size * .42, size * .407, size * .365, 0, 0, Math.PI * 2)
  ctx.clip()
  for (let i = 0; i < flakes.length; i++) {
    let flake = flakes[i]
    if (dt) {
      const dx = flake.x - .5, dy = flake.y - .42
      flake.x += (Math.sin(time * .6 + flake.phase) * .007 - dy * impulse * 1.65) * dt
      flake.y += (flake.speed + dx * impulse * 1.65 - impulse * .008) * dt
      if (flake.y > .779 || flake.y < .058 || Math.abs(flake.x - .5) > .43) {
        flakes[i] = flake = makeFlake(false)
      }
    }
    const alpha = (.22 + flake.depth * .48) * (1 + impulse * .16)
    ctx.beginPath()
    ctx.arc(flake.x * size, flake.y * size, Math.max(.4, flake.r * size), 0, Math.PI * 2)
    ctx.fillStyle = i % 9 === 0 ? `rgba(255,222,167,${alpha})` : `rgba(240,248,255,${alpha})`
    ctx.fill()
  }
  ctx.restore()
}
function frame(now) {
  raf = 0
  if (!animated.value) return
  const dt = Math.min((now - last) / 1000, .04) || .016
  last = now
  time += dt
  impulse = Math.max(0, impulse - dt * .24)
  const ease = 1 - Math.exp(-dt * 5)
  currentX += (targetX - currentX) * ease
  currentY += (targetY - currentY) * ease
  // Translation keeps the photograph physically plausible; there is no flat-card rotation.
  sculpture.value.style.transform = `translate3d(${currentX * 3}px,${currentY * 2 + Math.sin(time * .55) * 1.4}px,0)`
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
  if (!animated.value) return
  impulse = 1
  shaken.value = true
  clearTimeout(timer)
  timer = window.setTimeout(() => { shaken.value = false }, 4200)
}
function visibility() { hidden.value = document.hidden }
function preference() { systemReduced.value = media.matches }
onMounted(() => {
  hidden.value = document.hidden
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference()
  media.addEventListener('change', preference)
  ctx = canvas.value.getContext('2d')
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
      :aria-label="animated ? 'Faire tourbillonner la neige dans la boule' : 'Boule de Noël, sapin en touches de piano et cadeaux'"
      :aria-disabled="!animated" @pointermove="move" @pointerleave="resetPointer" @pointerup="resetPointer" @click="shake">
      <span class="sculpture-position">
        <span ref="sculpture" class="sculpture">
          <img class="globe-art" src="/piano-snowglobe.webp" alt="" width="1100" height="1100" fetchpriority="high" decoding="async" draggable="false" />
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
.sculpture { display: block; position: relative; width: 100%; height: 100%; will-change: transform; }
.globe-art { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; -webkit-user-drag: none; filter: drop-shadow(0 14px 17px rgba(0,5,15,.24)); }
.globe-snow { z-index: 1; }
.globe-glint { position: absolute; z-index: 2; width: 8%; aspect-ratio: 1; margin: -4% 0 0 -4%; border-radius: 50%; background: radial-gradient(circle,rgba(255,250,229,.88),rgba(255,213,144,.18) 25%,transparent 65%); transform: scale(var(--glint-size)); opacity: .16; animation: jewel-breath 8s ease-in-out infinite; }
.globe-glint::before,.globe-glint::after { content: ''; position: absolute; left: 48%; top: 5%; width: 4%; height: 90%; background: linear-gradient(transparent,rgba(255,251,228,.84),transparent); border-radius: 50%; }
.globe-glint::after { transform: rotate(90deg); }
.glass-light { position:absolute; left: 9%; top: 4%; width: 82%; height: 73%; border-radius:50%; background: radial-gradient(ellipse at 21% 34%,rgba(224,245,255,.08),transparent 26%),radial-gradient(ellipse at 80% 20%,rgba(255,232,190,.08),transparent 23%); mix-blend-mode: screen; opacity: .5; animation: glass-breath 12s ease-in-out infinite alternate; }
.globe-awake .glass-light { opacity: .8; }
.globe-still .sculpture { will-change: auto; }
.globe-still .globe-glint,.globe-still .glass-light { animation-play-state: paused; }
@keyframes jewel-breath { 0%,60%,100% { opacity: .08; transform: scale(calc(var(--glint-size) * .72)); } 78% { opacity:.75; transform:scale(var(--glint-size)); } 90% { opacity:.18; transform:scale(calc(var(--glint-size) * .85)); } }
@keyframes glass-breath { from { opacity:.2; } to { opacity:.7; } }
@media(prefers-reduced-motion:reduce) { .sculpture { transform:none!important; will-change:auto; } .globe-glint,.glass-light { animation:none!important; } }
</style>
