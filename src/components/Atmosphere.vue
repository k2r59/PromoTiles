<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import SkyVisitors from './SkyVisitors.vue'
import AuroraCurtains from './AuroraCurtains.vue'
const props = defineProps({ motion: Boolean, quiet: Boolean, catalog: Boolean, gameplay: Boolean })
const canvas = ref(null), hidden = ref(false), systemReduced = ref(false)
const animated = computed(() => props.motion && !hidden.value && !systemReduced.value)
let ctx, media, raf = 0, last = 0, time = 0, width = 0, height = 0, flakes = []
function resize() {
  if (!ctx) return
  width = innerWidth; height = innerHeight
  const d = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1 : 1.5)
  canvas.value.width = Math.round(width * d); canvas.value.height = Math.round(height * d)
  ctx.setTransform(d, 0, 0, d, 0, 0)
  flakes = Array.from({ length: props.gameplay ? 40 : width < 600 ? 85 : 155 }, () => ({ x: Math.random() * width, y: Math.random() * height, r: .4 + Math.random() * 1.6, v: 9 + Math.random() * 22, p: Math.random() * 6.28 }))
  draw(0)
}
function draw(dt) {
  ctx.clearRect(0, 0, width, height)
  for (const f of flakes) {
    if (dt) {
      f.y += f.v * dt; f.x += Math.sin(time * .3 + f.p) * dt * 5
      if (f.y > height + 5) f.y = -5
      if (f.x > width + 5) f.x = -5
      if (f.x < -5) f.x = width + 5
    }
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(220,239,255,${props.gameplay ? .18 : props.quiet ? .1 : .18 + f.r * .11})`; ctx.fill()
  }
}
function frame(now) {
  raf = 0
  if (!animated.value) return
  if (now - last < 1000 / 30 - 1) { raf = requestAnimationFrame(frame); return }
  const dt = Math.min((now - last) / 1000, .05) || .016
  last = now; time += dt; draw(dt); raf = requestAnimationFrame(frame)
}
function restart() {
  cancelAnimationFrame(raf); raf = 0
  if (!ctx) return
  last = performance.now()
  if (animated.value) raf = requestAnimationFrame(frame)
  else draw(0)
}
function visibility() { hidden.value = document.hidden }
function preference() { systemReduced.value = media.matches }
onMounted(() => {
  hidden.value = document.hidden
  media = matchMedia('(prefers-reduced-motion: reduce)'); preference()
  media.addEventListener('change', preference)
  ctx = canvas.value.getContext('2d'); resize()
  window.addEventListener('resize', resize); document.addEventListener('visibilitychange', visibility); restart()
})
onUnmounted(() => {
  cancelAnimationFrame(raf); media?.removeEventListener('change', preference)
  window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility)
})
watch(animated, restart)
watch(() => props.gameplay, resize)
watch(() => props.quiet, () => { if (ctx && !animated.value) draw(0) })
</script>
<template>
  <div class="atmosphere" aria-hidden="true" :class="{ 'is-still': !motion || systemReduced, 'is-hidden': hidden, 'is-quiet': quiet, 'is-catalog': catalog, 'is-gameplay': gameplay }">
    <div class="winter-landscape"></div><div class="night-veil"></div>
    <AuroraCurtains :active="animated" :subtle="gameplay" />
    <div class="winter-mist"></div><SkyVisitors :active="animated && (!quiet || catalog || gameplay)" :catalog="catalog || gameplay" /><canvas ref="canvas" class="snow-layer"></canvas><div class="vignette"></div>
  </div>
</template>
<style scoped>
.is-catalog .night-veil{background:linear-gradient(180deg,#031124a8,#031124b8 45%,#031124d9)}
.atmosphere.is-gameplay .night-veil{background:linear-gradient(180deg,#03112499,#03112488)}
.is-hidden * { animation-play-state: paused !important; }
</style>
