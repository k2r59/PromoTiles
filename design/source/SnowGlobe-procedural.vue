<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const props = defineProps({ motion: Boolean, active: { type: Boolean, default: true } })
const host = ref(null), ready = ref(false), failed = ref(false), shaken = ref(false)
let renderer, scene, camera, world, tree, star, snow, snowData, raf, resizeObserver, envTarget
let t = 0, last = 0, impulse = 0, targetX = 0, targetY = 0, hide = false, shakeTimer
let particles = [], lights = []
const resources = new Set()
const own = x => (resources.add(x), x)
const gold = () => own(new THREE.MeshStandardMaterial({ color: '#e2bd76', metalness: .86, roughness: .22 }))
function mesh(geo, mat, parent = world) { const m = new THREE.Mesh(own(geo), mat); parent.add(m); return m }
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const ctx = c.getContext('2d'), g = ctx.createRadialGradient(32,32,0,32,32,32)
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.1,'rgba(255,255,255,.9)'); g.addColorStop(.3,'rgba(255,255,255,.25)'); g.addColorStop(1,'rgba(255,255,255,0)')
  ctx.fillStyle=g;ctx.fillRect(0,0,64,64); return own(new THREE.CanvasTexture(c))
}
function pointGlow(parent, position, color, size, texture) {
  const mat = own(new THREE.SpriteMaterial({map:texture,color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}))
  const s = new THREE.Sprite(mat);s.position.copy(position);s.scale.setScalar(size);parent.add(s);return s
}
function fir(x,z,scale=1,parent=world) {
  const group = new THREE.Group(); parent.add(group);group.position.set(x,.27,z);group.scale.setScalar(scale)
  const green = own(new THREE.MeshStandardMaterial({color:'#183c42',roughness:.9}))
  const white = own(new THREE.MeshStandardMaterial({color:'#e2edfb',roughness:.8}))
  mesh(new THREE.CylinderGeometry(.025,.035,.5,5),green,group).position.y=.2
  for(let j=0;j<5;j++){
    const r=.32*(1-j/6),y=.28+j*.16
    mesh(new THREE.ConeGeometry(r,.4,9),green,group).position.y=y
    const cap=mesh(new THREE.ConeGeometry(r*.94,.34,9),white,group);cap.position.y=y+.05
  }
  return group
}
function gift(x,z,size,color) {
  const g=new THREE.Group();world.add(g);g.position.set(x,.27+size/2,z);g.rotation.y=.25
  const mat=own(new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.25}))
  const ribbon=gold();mesh(new THREE.BoxGeometry(size,size,size),mat,g)
  mesh(new THREE.BoxGeometry(size*.13,size*1.015,size*1.02),ribbon,g)
  mesh(new THREE.BoxGeometry(size*1.02,size*1.02,size*.13),ribbon,g)
  for(const side of [-1,1]) { const bow=mesh(new THREE.TorusGeometry(size*.17,size*.026,5,20),ribbon,g);bow.position.set(side*size*.13,size*.55,0);bow.rotation.set(.7,side*.4,side*.5) }
}
function init() {
  const el=host.value
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}) } catch {failed.value=true;return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1.5:1.75));renderer.setClearColor(0,0)
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12
  el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true')
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.1,60);camera.position.set(0,2.65,10.8);camera.lookAt(0,1.65,0)
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();envTarget=pmrem.fromScene(room,.04);scene.environment=envTarget.texture;room.dispose();pmrem.dispose()
  world=new THREE.Group();scene.add(world)
  scene.add(new THREE.HemisphereLight('#c0dfff','#324258',2.2))
  const key=new THREE.DirectionalLight('#fff0d8',3.8);key.position.set(-3,6,5);scene.add(key)
  const rim=new THREE.DirectionalLight('#88c6ff',4);rim.position.set(4,4,-3);scene.add(rim)
  const tex=glowTexture()
  const white=own(new THREE.MeshStandardMaterial({color:'#f3f2ea',metalness:.12,roughness:.25}))
  const black=own(new THREE.MeshStandardMaterial({color:'#080e1a',metalness:.38,roughness:.16}))
  const snowMat=own(new THREE.MeshStandardMaterial({color:'#ebf2ff',roughness:.87}))
  const metal=gold(), sapphire=own(new THREE.MeshStandardMaterial({color:'#13243b',metalness:.85,roughness:.18}))
  mesh(new THREE.CylinderGeometry(1.53,1.63,.31,96),sapphire).position.y=.03
  mesh(new THREE.CylinderGeometry(1.58,1.59,.08,96),metal).position.y=-.1
  mesh(new THREE.CylinderGeometry(1.52,1.57,.075,96),metal).position.y=.19
  const mound=mesh(new THREE.SphereGeometry(1.46,48,20),snowMat);mound.scale.y=.09;mound.position.y=.22
  for(const y of [-.14,.13,.23]) {const ring=mesh(new THREE.TorusGeometry(y===-.14?1.6:1.52,.018,8,100),metal);ring.rotation.x=Math.PI/2;ring.position.y=y}
  // Engraved maker's plaque on the front of the pedestal.
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=80
  const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#101f34';ctx.fillRect(0,0,512,80);ctx.fillStyle='#f0d296';ctx.font='32px Georgia';ctx.textAlign='center';ctx.fillText('P R O M O D E V',256,51)
  const label=mesh(new THREE.PlaneGeometry(1.05,.16),own(new THREE.MeshBasicMaterial({map:own(new THREE.CanvasTexture(labelCanvas))})));label.position.set(0,.035,1.62)
  tree=new THREE.Group();world.add(tree)
  const total=132, turns=Math.PI*2*3.5
  for(let i=0;i<total;i++) {
    const f=i/(total-1),a=f*turns+.5,r=1.04*(1-f)+.07,y=.48+f*2.65,scale=1-f*.55
    const key=mesh(new THREE.BoxGeometry(.155*scale,.055,.39*scale),white,tree);key.position.set(Math.cos(a)*r,y,Math.sin(a)*r);key.rotation.y=Math.PI/2-a;key.rotation.z=.04
    if([1,3,6,8,10].includes(i%12)) {const b=mesh(new THREE.BoxGeometry(.075*scale,.07,.22*scale),black,tree);b.position.set(Math.cos(a)*(r-.05),y+.055,Math.sin(a)*(r-.05));b.rotation.y=key.rotation.y}
  }
  const ribbonPoints=[]
  for(let i=0;i<=300;i++){const f=i/300,a=f*turns+.5,r=1.04*(1-f)+.27;ribbonPoints.push(new THREE.Vector3(Math.cos(a)*r,.47+f*2.65,Math.sin(a)*r))}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribbonPoints),260,.013,5,false),own(new THREE.MeshStandardMaterial({color:'#f8d18a',emissive:'#f9c571',emissiveIntensity:2.5,roughness:.3})),tree)
  for(let i=0;i<ribbonPoints.length;i+=8){const s=pointGlow(tree,ribbonPoints[i],'#ffd99a',.14,tex);lights.push({s,phase:i*.7})}
  // A faceted champagne star, rotating slowly above the piano tree.
  const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.105:.245;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y)}shape.closePath()
  star=mesh(new THREE.ExtrudeGeometry(shape,{depth:.085,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.026,bevelThickness:.025}),metal,tree);star.position.set(0,3.36,0)
  pointGlow(tree,new THREE.Vector3(0,3.36,.07),'#ffe9b4',1.05,tex)
  const warm=new THREE.PointLight('#ffd898',3,5,2);warm.position.set(0,2,1.2);world.add(warm)
  fir(-.95,-.35,.85);fir(.85,-.55,1);fir(-.55,-.9,.62);fir(1.05,.35,.48)
  gift(-.55,.82,.28,'#dbe7ef');gift(-.85,.6,.23,'#d3ac70');gift(.54,.88,.34,'#f0ece0');gift(.83,.65,.23,'#1a3a56')
  // Fresnel shell keeps the sculpture readable and adds moving optical reflections.
  const glass=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,
    uniforms:{uTime:{value:0}},
    vertexShader:`varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);vP=position;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`varying vec3 vN;varying vec3 vV;varying vec3 vP;uniform float uTime;void main(){vec3 n=normalize(vN);float f=pow(1.-abs(dot(n,normalize(vV))),3.0);float edge=smoothstep(.64,.96,f);float stripe=pow(max(0.,dot(n,normalize(vec3(-.58+sin(uTime*.12)*.04,.3,.7)))),70.);float line=pow(max(0.,dot(n,normalize(vec3(.75,.1,.35)))),85.);vec3 c=mix(vec3(.42,.64,.88),vec3(.94,.98,1.),edge);float a=f*.38+edge*.25+stripe*.35+line*.15;gl_FragColor=vec4(c,clamp(a,0.,.75));}`
  }))
  const globe=mesh(new THREE.SphereGeometry(2.1,80,56,0,Math.PI*2,0,2.4),glass);globe.position.y=1.8;globe.renderOrder=5
  world.userData.glass=glass
  // Small, volumetric snowflakes, all contained within the actual glass sphere.
  const count=innerWidth<600?310:520,positions=new Float32Array(count*3)
  for(let i=0;i<count;i++){let x,y,z;do{x=(Math.random()-.5)*3.9;y=.3+Math.random()*3.55;z=(Math.random()-.5)*3.9}while(x*x+(y-1.8)**2+z*z>3.8);positions.set([x,y,z],i*3);particles.push({x,y,z,speed:.08+Math.random()*.13,phase:Math.random()*Math.PI*2})}
  snowData=positions;const geo=own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.BufferAttribute(positions,3))
  snow=new THREE.Points(geo,own(new THREE.PointsMaterial({size:.027,map:tex,color:'#eff7ff',transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending})));world.add(snow)
  const halo=pointGlow(scene,new THREE.Vector3(0,1.4,-2),'#4b92df',8,tex);halo.material.opacity=.16
  // Ground shadow anchors the object in the snow clearing.
  const shadow=mesh(new THREE.PlaneGeometry(5.2,3.2),own(new THREE.MeshBasicMaterial({map:tex,color:'#000817',transparent:true,opacity:.75,depthWrite:false})),scene);shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-.22,0)
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(el);resize();ready.value=true
  renderer.domElement.addEventListener('webglcontextlost',lost)
  document.addEventListener('visibilitychange',visibility)
  restart()
}
function resize(){if(!renderer||!host.value)return;const {width,height}=host.value.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();renderStatic()}
function renderStatic(){if(renderer&&scene)renderer.render(scene,camera)}
function frame(now){raf=0;if(!props.active||hide)return;const dt=Math.min((now-last)/1000,.04)||.016;last=now
  if(props.motion){t+=dt;impulse=Math.max(0,impulse-dt*.3);world.rotation.y+=(targetX*.2+Math.sin(t*.15)*.055-world.rotation.y)*.04;world.rotation.x+=(targetY*.045-world.rotation.x)*.04;world.position.y=Math.sin(t*.65)*.025;star.rotation.y=Math.sin(t*.36)*.3;world.userData.glass.uniforms.uTime.value=t
    for(const {s,phase} of lights)s.material.opacity=.6+Math.sin(t*1.2+phase)*.25
    particles.forEach((p,i)=>{p.y-=dt*p.speed*(1+impulse*6);if(p.y<.32)p.y=3.45;const radius=Math.sqrt(Math.max(0,3.82-(p.y-1.8)**2));const base=Math.hypot(p.x,p.z);const angle=Math.atan2(p.z,p.x)+t*.08+impulse*Math.sin(t*2+p.phase)*.45;const r=Math.min(base,radius*.96);snowData[i*3]=Math.cos(angle)*r;snowData[i*3+1]=p.y;snowData[i*3+2]=Math.sin(angle)*r});snow.geometry.attributes.position.needsUpdate=true
  }
  renderStatic();if(props.motion)raf=requestAnimationFrame(frame)
}
function restart(){cancelAnimationFrame(raf);raf=0;last=performance.now();if(props.active&&!hide)raf=requestAnimationFrame(frame)}
function visibility(){hide=document.hidden;restart()}
function lost(e){e.preventDefault();failed.value=true;cancelAnimationFrame(raf)}
function move(e){const r=host.value.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*2;targetY=((e.clientY-r.top)/r.height-.5)*2}
function shake(){if(!props.motion)return;impulse=1;shaken.value=true;clearTimeout(shakeTimer);shakeTimer=setTimeout(()=>shaken.value=false,3500)}
watch(()=>[props.motion,props.active],restart)
onMounted(init)
onUnmounted(()=>{cancelAnimationFrame(raf);clearTimeout(shakeTimer);resizeObserver?.disconnect();document.removeEventListener('visibilitychange',visibility);renderer?.domElement.removeEventListener('webglcontextlost',lost);resources.forEach(x=>x.dispose?.());envTarget?.dispose();renderer?.dispose();renderer?.domElement.remove()})
</script>
<template>
  <div class="globe-wrap">
    <button ref="host" class="globe-canvas" type="button" aria-label="Faire tourbillonner la neige dans la boule" :aria-disabled="!motion" @pointermove="move" @pointerleave="targetX=0;targetY=0" @click="shake">
      <span v-if="!ready&&!failed" class="globe-loading"><span class="mini-star">✦</span> La magie prend forme…</span>
      <span v-if="failed" class="globe-fallback"><span>✧</span><i>♪</i><small>Un Noël qui résonne</small></span>
    </button>
    <p class="globe-hint" :class="{ active: shaken }"><span aria-hidden="true">✧</span> {{ motion ? (shaken ? 'Un peu de magie, juste pour vous.' : 'Touchez la boule. Réveillez la magie.') : 'Un instant suspendu.' }}</p>
  </div>
</template>
