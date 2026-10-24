<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
const props = defineProps({ motion: Boolean, quiet: Boolean })
const canvas = ref(null), hidden = ref(false), systemReduced = ref(false)
const animated = computed(() => props.motion && !hidden.value && !systemReduced.value)
let ctx, media, raf = 0, last = 0, time = 0, width = 0, height = 0, flakes = []
function resize() {
  if (!ctx) return
  width = innerWidth; height = innerHeight
  const d = Math.min(devicePixelRatio || 1, 1.5)
  canvas.value.width = Math.round(width * d); canvas.value.height = Math.round(height * d)
  ctx.setTransform(d, 0, 0, d, 0, 0)
  flakes = Array.from({ length: width < 600 ? 85 : 155 }, () => ({ x: Math.random() * width, y: Math.random() * height, r: .4 + Math.random() * 1.6, v: 9 + Math.random() * 22, p: Math.random() * 6.28 }))
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
    ctx.fillStyle = `rgba(220,239,255,${props.quiet ? .1 : .18 + f.r * .11})`; ctx.fill()
  }
}
function frame(now) {
  raf = 0
  if (!animated.value) return
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
watch(() => props.quiet, () => { if (ctx && !animated.value) draw(0) })
</script>
<template>
  <div class="atmosphere" aria-hidden="true" :class="{ 'is-still': !motion || systemReduced, 'is-hidden': hidden, 'is-quiet': quiet }">
    <div class="winter-landscape"></div><div class="night-veil"></div>
    <div class="aurora aurora-one"></div><div class="aurora aurora-two"></div>
    <div class="winter-mist"></div><canvas ref="canvas" class="snow-layer"></canvas><div class="vignette"></div>
  </div>
</template>
<style scoped>
.is-hidden * { animation-play-state: paused !important; }
</style>
