// Temporary local-only QA overlay. Imported only by Vite DEV with animationAudit=1.
const panel = document.createElement('output')
panel.style.cssText = 'position:fixed;z-index:9999;top:54px;left:8px;right:8px;font:11px/1.4 monospace;background:#031326ed;color:white;padding:8px;pointer-events:none;white-space:pre-wrap'
document.body.append(panel)
let frames=[],last=0,start=performance.now(),raf=0,report=0
const probe=document.createElement('canvas');probe.width=probe.height=24;const probeCtx=probe.getContext('2d')
function tick(now){if(last&&now-last<1000)frames.push(now-last);last=now;raf=requestAnimationFrame(tick)}
raf=requestAnimationFrame(tick)
report=setInterval(()=>{
 const sorted=[...frames].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length*.5)]||0,p95=sorted[Math.floor(sorted.length*.95)]||0
 const globe=document.querySelector('.sculpture'),image=document.querySelector('.globe-art'),canvas=document.querySelector('.globe-snow'),rect=globe?.getBoundingClientRect(),imageRect=image?.getBoundingClientRect()
 let checksum=0;if(canvas){probeCtx.clearRect(0,0,24,24);probeCtx.drawImage(canvas,0,0,24,24);const data=probeCtx.getImageData(0,0,24,24).data;checksum=data.reduce((sum,v,i)=>(sum+v*(i+1))%10000000,0)}
 panel.textContent=`QA ${(performance.now()-start)/1000|0}s · ${frames.length} frames\nmedian ${median.toFixed(1)}ms · p95 ${p95.toFixed(1)}ms · >34ms ${frames.filter(v=>v>34).length}\nscene ${rect?.width.toFixed(0)}×${rect?.height.toFixed(0)} / img ${imageRect?.width.toFixed(0)}×${imageRect?.height.toFixed(0)}\n${globe?.style.transform||'absent'}\nmotion ${document.querySelector('.globe-still')?'OFF':'ON'} · canvas ${canvas?.width}×${canvas?.height} · hash ${checksum}\n${document.querySelector('.globe-hint')?.textContent}`
},1000)
if(import.meta.hot)import.meta.hot.dispose(()=>{cancelAnimationFrame(raf);clearInterval(report);panel.remove()})
