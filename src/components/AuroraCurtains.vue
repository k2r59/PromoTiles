<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
const props=defineProps({active:Boolean,subtle:Boolean})
const canvas=ref(null)
let ctx,raf=0,last=0,time=0,width=0,height=0
// Broad luminous curtains change shape, rather than drifting a nearly static texture.
function ribbonY(x,layer){
 const phase=time*.58+layer*1.7
 return height*(.12+layer*.10)+Math.sin(x/width*5.2+phase)*height*.065+Math.sin(x/width*9.5-phase*.72)*height*.025
}
function draw(){
 if(!ctx)return
 ctx.clearRect(0,0,width,height)
 ctx.globalCompositeOperation='screen'
 for(let layer=2;layer>=0;layer--){
  const depth=height*(.24+Math.sin(time*.42+layer)*.035)
  const color=layer===1?'108,160,255':layer===2?'146,119,235':'69,236,186'
  const glow=ctx.createLinearGradient(0,height*(.03+layer*.10),0,height*(.45+layer*.10))
  glow.addColorStop(0,`rgba(${color},0)`)
  glow.addColorStop(.22,`rgba(${color},.10)`)
  glow.addColorStop(.44,`rgba(${color},${.4+Math.sin(time*.64+layer)*.1})`)
  glow.addColorStop(.7,`rgba(${color},.08)`)
  glow.addColorStop(1,`rgba(${color},0)`)
  ctx.fillStyle=glow;ctx.beginPath()
  for(let step=0;step<=40;step++){const x=width*step/40,y=ribbonY(x,layer);if(!step)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
  for(let step=40;step>=0;step--){const x=width*step/40;ctx.lineTo(x,ribbonY(x,layer)+depth)}
  ctx.closePath();ctx.fill()
 }
 ctx.globalCompositeOperation='source-over'
}
function frame(now){
 raf=0
 if(!props.active)return
 // 30 fps is enough for slow sky movement, including on mobile.
 if(now-last>=1000/30){time+=Math.min((now-last)/1000,.08);last=now;draw()}
 raf=requestAnimationFrame(frame)
}
function restart(){cancelAnimationFrame(raf);raf=0;last=performance.now();draw();if(props.active)raf=requestAnimationFrame(frame)}
function resize(){
 if(!ctx)return
 width=innerWidth;height=innerHeight
 const dpr=Math.min(devicePixelRatio||1,matchMedia('(pointer: coarse)').matches?1:1.25)
 canvas.value.width=Math.round(width*dpr);canvas.value.height=Math.round(height*dpr)
 ctx.setTransform(dpr,0,0,dpr,0,0);draw()
}
onMounted(()=>{ctx=canvas.value.getContext('2d');resize();window.addEventListener('resize',resize);restart()})
watch(()=>props.active,restart)
onUnmounted(()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)})
</script>
<template><canvas ref="canvas" class="aurora-curtains" :data-animated="active" :style="{opacity:subtle?.55:.95}" aria-hidden="true"></canvas></template>
<style scoped>
.aurora-curtains{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;filter:blur(8px);opacity:.95}
@media(max-width:600px){.aurora-curtains{filter:blur(5px)}}
</style>
