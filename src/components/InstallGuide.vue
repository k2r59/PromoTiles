<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { X, Download, Share, EllipsisVertical, PlusSquare, Check, ArrowRight, ArrowLeft, Smartphone } from '@lucide/vue'
const props=defineProps({open:Boolean,installPrompt:Object,installed:Boolean})
const emit=defineEmits(['close','consumed'])
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)
const platform=ref(ios?'ios':/Android/.test(navigator.userAgent)?'android':'desktop'),step=ref(0),dialog=ref(null),busy=ref(false),message=ref('')
let previousFocus
const instructions=computed(()=>({
 ios:[{icon:Smartphone,title:'Ouvrez le jeu dans Safari',text:'Sur votre iPhone ou iPad, ouvrez noel.promo.dev et connectez-vous avec votre adresse @promo.dev.'},{icon:Share,title:'Ouvrez le menu Partager',text:'Touchez Partager dans Safari. Selon votre présentation, ce bouton se trouve dans le menu Plus.'},{icon:PlusSquare,title:'Ajoutez le jeu à l’accueil',text:'Choisissez « Sur l’écran d’accueil », activez « Ouvrir comme app web » si proposé, puis touchez « Ajouter ».'}],
 android:[{icon:Smartphone,title:'Ouvrez le jeu dans Chrome',text:'Sur votre téléphone Android, ouvrez noel.promo.dev et connectez-vous avec votre adresse @promo.dev.'},{icon:EllipsisVertical,title:'Ouvrez le menu du navigateur',text:'Touchez les trois points à côté de la barre d’adresse.'},{icon:Download,title:'Installez votre jeu',text:'Choisissez « Installer et créer un raccourci », puis « Installer ». Selon votre version, le menu peut s’appeler « Ajouter à l’écran d’accueil ».'}],
 desktop:[{icon:Smartphone,title:'Ouvrez le jeu dans votre navigateur',text:'Utilisez Chrome ou Edge, puis connectez-vous avec votre adresse @promo.dev.'},{icon:Download,title:'Retrouvez le bouton Installer',text:'Cliquez sur l’icône d’installation de la barre d’adresse, ou cherchez Installer dans le menu du navigateur.'},{icon:Check,title:'Gardez Noël à portée de main',text:'Confirmez l’installation. Le jeu s’ouvre ensuite dans sa propre fenêtre. Sur Safari Mac, utilisez Fichier → Ajouter au Dock.'}]
})[platform.value])
watch(platform,()=>{step.value=0;message.value=''})
watch(()=>props.open,async value=>{await nextTick();if(value){previousFocus=document.activeElement;step.value=0;message.value='';dialog.value?.showModal()}else if(dialog.value?.open)dialog.value.close()})
function closed(){emit('close');previousFocus?.focus()}
async function install(){
 if(!props.installPrompt||busy.value)return
 busy.value=true
 try{await props.installPrompt.prompt();const choice=await props.installPrompt.userChoice;message.value=choice.outcome==='accepted'?'Installation demandée. Votre navigateur termine la préparation.':'Vous pourrez l’installer plus tard depuis votre profil.'}
 catch{message.value='Suivez les étapes ci-dessus pour installer le jeu depuis votre navigateur.'}
 finally{busy.value=false;emit('consumed')}
}
function changed(e){if(e.key==='ArrowRight')step.value=Math.min(2,step.value+1);if(e.key==='ArrowLeft')step.value=Math.max(0,step.value-1)}
onMounted(()=>dialog.value?.addEventListener('keydown',changed))
onUnmounted(()=>dialog.value?.removeEventListener('keydown',changed))
</script>
<template>
 <dialog ref="dialog" class="install-sheet" aria-labelledby="install-title" @close="closed" @click="e=>{if(e.target===e.currentTarget)dialog.close()}">
  <div class="install-grip" aria-hidden="true"></div>
  <button class="install-close" aria-label="Fermer le guide d’installation" @click="dialog.close()"><X :size="20"/></button>
  <img src="/icons/icon-192.png" class="install-icon" alt=""/>
  <p class="install-eyebrow">VOTRE RENDEZ-VOUS DE NOËL</p>
  <h2 id="install-title">La magie, à portée de main.</h2>
  <p class="install-intro">Une icône sur votre écran. Un accès direct au jeu.</p>
  <p v-if="installed" class="install-confirmed"><Check :size="20"/> Le jeu est déjà ouvert en mode application.</p>
  <template v-else>
   <div class="install-platforms" role="group" aria-label="Appareil pour l’installation"><button v-for="p in [{id:'ios',label:'iPhone / iPad'},{id:'android',label:'Android'},{id:'desktop',label:'Ordinateur'}]" :key="p.id" :aria-pressed="platform===p.id" @click="platform=p.id">{{p.label}}</button></div>
   <section class="install-step" aria-live="polite" aria-atomic="true"><div class="install-step-icon"><component :is="instructions[step].icon" :size="28"/></div><small>ÉTAPE {{step+1}} SUR 3</small><h3>{{instructions[step].title}}</h3><p>{{instructions[step].text}}</p></section>
   <div class="install-pagination"><button aria-label="Étape précédente" :disabled="step===0" @click="step--"><ArrowLeft :size="19"/></button><div class="install-dots" aria-label="Étapes"><button v-for="i in 3" :key="i" :aria-label="'Étape '+i" :aria-current="step===i-1?'step':undefined" @click="step=i-1"><span></span></button></div><button aria-label="Étape suivante" :disabled="step===2" @click="step++"><ArrowRight :size="19"/></button></div>
   <button v-if="installPrompt&&platform!=='ios'" class="primary-button" :disabled="busy" @click="install"><Download :size="19"/> {{busy?'Ouverture…':'Installer maintenant'}}</button>
   <button v-else class="primary-button" @click="step<2?step++:dialog.close()">{{step<2?'Continuer':'J’ai compris'}} <ArrowRight v-if="step<2" :size="19"/><Check v-else :size="19"/></button>
   <p v-if="message" role="status" class="install-message">{{message}}</p>
  </template>
  <p class="install-footnote">Les morceaux déjà chargés restent jouables hors connexion.<br>Le classement se synchronise pendant une partie en ligne.</p>
 </dialog>
</template>
<style scoped>
.install-sheet{position:fixed;inset:auto 0 0;margin:auto;width:min(100%,480px);max-width:100%;max-height:calc(100dvh - 16px);overflow:auto;border:1px solid #c8ab7544;border-bottom:0;border-radius:26px 26px 0 0;padding:20px 28px max(24px,env(safe-area-inset-bottom));background:linear-gradient(160deg,#132b41,#071426 65%);color:#edf0ee;box-shadow:0 -20px 90px #0008;text-align:center}.install-sheet[open]{animation:install-slide .25s ease-out}.install-sheet::backdrop{background:#010a16c9;backdrop-filter:blur(7px)}.install-grip{height:4px;width:38px;border-radius:3px;background:#96a8bc55;margin:0 auto 20px}.install-close{position:absolute;right:16px;top:15px;width:44px;height:44px;display:grid;place-items:center;border:1px solid #91a9be44;border-radius:50%;background:#071426;color:#d9e3eb}.install-icon{height:58px;width:58px;border-radius:15px;border:1px solid #ccb17c77;box-shadow:0 0 28px #dec39119}.install-eyebrow{font-size:8px;letter-spacing:2px;color:#e3c994;margin:17px 0 10px}.install-sheet h2{font:600 36px/1 'Cormorant Garamond',serif;color:#fff0d3;margin:0}.install-intro{font-size:11px;color:#bacbdc;line-height:1.6;margin:12px 0 20px}.install-platforms{display:flex;padding:4px;border:1px solid #91a9be33;background:#030e1e88;border-radius:12px;gap:4px}.install-platforms button{flex:1;min-height:44px;padding:7px 4px;border-radius:8px;background:none;font-size:11px;color:#b8cadb}.install-platforms button[aria-pressed=true]{background:#e5c993;color:#122137}.install-step{min-height:210px;padding:23px 3px 8px}.install-step-icon{color:#e7c991;margin:0 auto 12px}.install-step small{color:#c2a773;font-size:8px;letter-spacing:2px}.install-step h3{font:600 25px/1.15 'Cormorant Garamond',serif;color:#f5e6cd;margin:10px 0}.install-step p{font-size:12px;line-height:1.7;color:#baccdc;margin:0}.install-pagination{display:flex;justify-content:space-between;align-items:center;margin:0 0 12px}.install-pagination>button{width:44px;height:44px;background:#a0bbd411;border:1px solid #8ca6bc22;border-radius:50%;display:grid;place-items:center}.install-dots{display:flex}.install-dots button{width:32px;height:44px;display:grid;place-items:center;background:transparent}.install-dots span{width:6px;height:6px;border-radius:50%;background:#849aad55}.install-dots [aria-current=step] span{width:19px;border-radius:5px;background:#e5c993}.install-sheet .primary-button{min-height:50px}.install-footnote{font-size:10px;line-height:1.7;color:#91a8bd;margin:17px 0 0}.install-confirmed,.install-message{font-size:12px;line-height:1.6;color:#e2ce9e;margin:20px 0}.install-confirmed{display:flex;gap:10px;justify-content:center}@keyframes install-slide{from{opacity:0;transform:translateY(45px)}to{opacity:1;transform:translateY(0)}}@media(max-width:350px),(max-height:690px){.install-sheet{padding:12px 18px 18px}.install-grip{margin-bottom:10px}.install-icon{width:42px;height:42px}.install-sheet h2{font-size:29px}.install-eyebrow{margin-top:12px}.install-intro{margin:9px 0 12px}.install-step{min-height:192px;padding-top:15px}.install-step h3{font-size:23px}.install-footnote{margin-top:12px}}@media(prefers-reduced-motion:reduce){.install-sheet[open]{animation:none}}
</style>

<style scoped>
@media(max-height:650px){
 .install-sheet{padding-top:10px;padding-bottom:max(12px,env(safe-area-inset-bottom))}
 .install-icon,.install-eyebrow,.install-intro,.install-grip{display:none}
 .install-sheet h2{font-size:26px;padding:10px 40px 14px}
 .install-step{min-height:0;padding:15px 0 8px}.install-step-icon{margin-bottom:7px}.install-step p{font-size:11px;line-height:1.5}
 .install-pagination{margin-bottom:8px}.install-footnote{font-size:9px;line-height:1.4;margin-top:9px}
}
@media(max-height:430px){
 .install-sheet{width:min(100%,780px);display:none}.install-sheet[open]{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
 .install-sheet h2{grid-column:1;padding:8px 0 12px}.install-platforms{grid-column:1}.install-step{grid-column:2;grid-row:1/4;padding:6px 20px 6px 0;align-self:center}.install-step-icon{display:none}
 .install-pagination{grid-column:1}.install-sheet>.primary-button{grid-column:2;align-self:center}.install-footnote{grid-column:1;grid-row:4}
}
</style>
