<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick, defineAsyncComponent, watch } from 'vue'
import { ArrowRight, ArrowLeft, Play, Pause, Music2, Trophy, UserRound, Volume2, VolumeX, Sparkles, Snowflake, Check, Crown, Clock3, Headphones, Download, X, RotateCcw, ChevronRight, Settings2, Home, Medal } from '@lucide/vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import Atmosphere from './components/Atmosphere.vue'
import SnowGlobe from './components/SnowGlobe.vue'
const Game = defineAsyncComponent(()=>import('./components/Game.vue'))
const reduced=matchMedia('(prefers-reduced-motion: reduce)')
const systemReduced=ref(reduced.matches), profileError=ref(''), previewError=ref(''), previewLoading=ref(false)
function read(key,fallback){
  try{
    const value=JSON.parse(localStorage.getItem(key))
    if(Array.isArray(fallback))return Array.isArray(value)?value.filter(r=>r&&typeof r==='object'&&['facile','normal','difficile'].includes(r.mode)&&Number.isFinite(r.score)&&r.score>=0):fallback
    if(!value||typeof value!=='object'||Array.isArray(value))return fallback
    return {motion:typeof value.motion==='boolean'?value.motion:fallback.motion,sound:typeof value.sound==='boolean'?value.sound:fallback.sound,name:typeof value.name==='string'?value.name.slice(0,24):fallback.name}
  }catch{return fallback}
}
const view=ref('home'), mode=ref('normal'), settings=ref(read('promodev-settings',{motion:!reduced.matches,sound:true,name:''})), records=ref(read('promodev-records-v1',[])), result=ref(null), installEvent=ref(null), showHelp=ref(false), audioPreview=ref(false), profileSaved=ref(false)
let previewAudio,prevFocus,profileTimer,previewToken=0
const motion=computed(()=>settings.value.motion&&!systemReduced.value)
const best=computed(()=>Math.max(0,...records.value.map(r=>Number(r.score)||0)))
const modes=[{id:'facile',name:'Facile',multiplier:'×1',points:1500,icon:Snowflake,detail:'Prenez le rythme',notes:216},{id:'normal',name:'Normal',multiplier:'×1,5',points:2250,icon:Sparkles,detail:'Laissez-vous porter',notes:415},{id:'difficile',name:'Difficile',multiplier:'×2',points:3000,icon:Crown,detail:'Faites le grand jeu',notes:701}]
const selected=computed(()=>modes.find(m=>m.id===mode.value))
const personalBest=computed(()=>modes.map(m=>({...m,score:Math.max(0,...records.value.filter(r=>r.mode===m.id).map(r=>r.score))})).sort((a,b)=>b.score-a.score))
const {needRefresh,updateServiceWorker}=useRegisterSW()
function storeSettings(){try{localStorage.setItem('promodev-settings',JSON.stringify(settings.value));return true}catch{return false}}
watch(settings,storeSettings,{deep:true})
watch(()=>settings.value.sound,value=>{if(value)previewError.value='';else stopPreview()})
function stopPreview(){previewToken++;previewAudio?.pause();audioPreview.value=false;previewLoading.value=false}
async function go(next){stopPreview();view.value=next;window.scrollTo({top:0,behavior:'instant'});await nextTick();document.querySelector('main h1')?.focus({preventScroll:true})}
async function preview(){
  previewError.value=''
  if(audioPreview.value||previewLoading.value){stopPreview();return}
  if(!settings.value.sound){previewError.value='Activez la musique dans votre profil pour écouter l’extrait.';return}
  const token=++previewToken;previewLoading.value=true
  if(!previewAudio){previewAudio=new Audio('/music/emilie.mp3');previewAudio.addEventListener('ended',()=>audioPreview.value=false)}
  try{previewAudio.currentTime=35;previewAudio.volume=.45;await previewAudio.play();if(token!==previewToken){if(!previewLoading.value&&!audioPreview.value)previewAudio.pause();return}audioPreview.value=true}
  catch{if(token===previewToken)previewError.value='L’extrait est indisponible. Vérifiez votre connexion.'}
  finally{if(token===previewToken)previewLoading.value=false}
}

async function start(){stopPreview();view.value='game';await nextTick()}
function finished(value){result.value=value;records.value=read('promodev-records-v1',[]);go('result')}
function saveProfile(){clearTimeout(profileTimer);profileError.value='';profileSaved.value=storeSettings();if(!profileSaved.value)profileError.value='Votre navigateur ne permet pas d’enregistrer les préférences.';profileTimer=setTimeout(()=>profileSaved.value=false,1800)}
function askInstall(e){e.preventDefault();installEvent.value=e}
async function install(){if(installEvent.value){await installEvent.value.prompt();installEvent.value=null}else showHelp.value=true}
function keyboard(e){if(e.key==='Escape'&&showHelp.value){showHelp.value=false;prevFocus?.focus()}}
function reduction(){systemReduced.value=reduced.matches}
watch(showHelp,async value=>{if(value){prevFocus=document.activeElement;await nextTick();document.querySelector('.help-dialog')?.showModal()}else document.querySelector('.help-dialog')?.close()})
onMounted(()=>{window.addEventListener('beforeinstallprompt',askInstall);window.addEventListener('keydown',keyboard);reduced.addEventListener('change',reduction)})
onUnmounted(()=>{stopPreview();clearTimeout(profileTimer);window.removeEventListener('beforeinstallprompt',askInstall);window.removeEventListener('keydown',keyboard);reduced.removeEventListener('change',reduction)})
</script>

<template>
  <div class="app-shell" :class="{'motion-off':!motion,'game-open':view==='game','selection-open':view==='select','result-open':view==='result'}">
    <Atmosphere :motion="motion&&view!=='game'" :quiet="view!=='home'" />
    <a class="skip-link" href="#main">Aller au contenu</a>
    <header v-if="view!=='game'" class="brand-header">
      <button class="brand" aria-label="Promodev, retour à l’accueil" @click="go('home')">PROMODEV<span>PIANO CHALLENGE</span></button>
      <div class="header-controls"><button class="icon-button" :aria-label="settings.sound?'Couper le son':'Activer le son'" :aria-pressed="settings.sound" @click="settings.sound=!settings.sound;stopPreview()"><Volume2 v-if="settings.sound" :size="19"/><VolumeX v-else :size="19"/></button><button class="icon-button" :aria-label="motion?'Réduire les animations':'Activer les animations'" :aria-pressed="motion" :disabled="systemReduced" @click="settings.motion=!settings.motion"><Sparkles :size="19"/></button></div>
    </header>

    <main id="main" :class="['main-content', 'view-'+view]">
      <section v-if="view==='home'" class="home-screen page-enter">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> LE CHALLENGE DE NOËL <span></span></p>
          <h1 tabindex="-1">Un Noël<br>qui résonne.</h1>
          <p class="hero-description">Un morceau. Quelques notes.<br>Et toute l’équipe à faire vibrer.</p>
        </div>
        <SnowGlobe class="home-globe" :motion="motion" :active="view==='home'" />
        <div class="home-actions">
          <div class="home-stats"><div><Music2 :size="23"/><span>À découvrir<strong>3 niveaux de défi</strong></span></div><div><Crown :size="23"/><span>Votre record<strong>{{best?best.toLocaleString('fr-FR')+' pts':'À vous de jouer'}}</strong></span></div></div>
          <button class="primary-button hero-cta" @click="go('select')">Entrer en scène <ArrowRight :size="22"/></button>
          <p class="small-note"><Headphones :size="13"/> Encore plus magique avec un casque.</p>
        </div>
        <div class="home-side-note"><span class="edition-line"></span><p>NUIT POLAIRE<br><span>Édition de Noël · Promodev</span></p></div>
      </section>

      <section v-else-if="view==='select'" class="selection-screen narrow-screen page-enter">
        <button class="back-link" @click="go('home')"><ArrowLeft :size="17"/> L’accueil</button>
        <p class="eyebrow">VOTRE PROCHAINE PERFORMANCE</p>
        <h1 tabindex="-1">À chaque titre,<br>son défi.</h1>
        <p class="section-intro">Choisissez votre morceau, puis votre niveau.</p>
        <h2 class="section-label">LE MORCEAU <span></span></h2>
        <div class="song-card selected"><button class="song-cover" @click="preview" :aria-busy="previewLoading" :aria-label="(audioPreview||previewLoading)?'Arrêter l’extrait':'Écouter un extrait du morceau'"><span class="vinyl-disc"></span><Pause v-if="audioPreview||previewLoading" :size="22"/><Play v-else :size="22"/></button><div class="song-info"><h3>Dans les yeux d’Émilie</h3><p>Joe Dassin</p><span><Clock3 :size="12"/> 3 min 42 <i>·</i> Titre 3/5 <b>×1,5</b></span></div><span class="selected-check"><Check :size="17"/></span></div>
        <p class="song-difficulty"><Music2 :size="18"/><span>Difficulté du titre : <b>3/5</b> · coefficient <b>×1,5</b></span></p>
        <p v-if="previewError" class="error-message" role="alert">{{previewError}}</p>
        <h2 class="section-label">VOTRE NIVEAU <span></span></h2>
        <div class="mode-list" role="radiogroup" aria-label="Niveau de difficulté"><button v-for="m in modes" :key="m.id" class="mode-option" :class="{selected:mode===m.id}" role="radio" :aria-checked="mode===m.id" @click="mode=m.id"><component :is="m.icon" :size="29"/><span class="mode-title"><strong>{{m.name}}</strong><small>{{m.detail}} <b>{{m.multiplier}}</b></small></span><span class="mode-score"><b>{{m.points.toLocaleString('fr-FR')}}</b> pts max</span><span class="radio-circle"><Check v-if="mode===m.id" :size="13"/></span></button></div>
        <p class="score-explanation">Plus le défi est exigeant, plus il rapporte.<br><span>Votre précision et vos combos font la différence.</span></p>
        <button class="primary-button" @click="start">Jouer · {{selected.name}} <Play :size="19" fill="currentColor"/></button>
        <button class="text-button" @click="showHelp=true">Comment jouer ?</button>
      </section>

      <Game v-else-if="view==='game'" :mode="mode" :sound="settings.sound" :motion="motion" @exit="go('select')" @finish="finished" />

      <section v-else-if="view==='result'" class="result-screen narrow-screen page-enter">
        <div class="celebration" aria-hidden="true"><i v-for="i in 24" :key="i" :style="{'--i':i}"></i></div>
        <p class="eyebrow">LE RIDEAU SE LÈVE SUR VOTRE SCORE</p>
        <div class="result-crown"><Crown :size="54" stroke-width="1"/></div>
        <h1 tabindex="-1">{{result.accuracy>=80?'Une étoile est née.':result.accuracy>=45?'Vous avez le rythme.':'La magie se pratique.'}}</h1>
        <p class="result-song">Dans les yeux d’Émilie · {{selected.name}}</p>
        <div class="result-score">{{result.score.toLocaleString('fr-FR')}}<span>POINTS / {{result.maxPoints.toLocaleString('fr-FR')}}</span></div>
        <div class="result-stats"><div><strong>{{result.accuracy===0&&(result.perfect||result.good)?'<1':result.accuracy}}<small>%</small></strong><span>Précision</span></div><div><strong>{{result.maxCombo}}</strong><span>Meilleur combo</span></div><div><strong>{{result.perfect}}</strong><span>Notes parfaites</span></div></div>
        <p class="result-advice">{{result.accuracy<70?'Gardez les yeux sur la ligne lumineuse et laissez la musique vous guider.':'Un autre niveau, un nouveau record. La scène est à vous.'}}</p>
        <button class="primary-button" @click="start"><RotateCcw :size="19"/> Encore une fois</button>
        <button class="secondary-button" @click="go('select')">Changer de niveau <ArrowRight :size="17"/></button>
        <p v-if="result.saved===false" class="error-message">Le score n’a pas pu être enregistré sur cet appareil.</p>
      </section>

      <section v-else-if="view==='leaderboard'" class="leaderboard-screen narrow-screen page-enter">
        <p class="eyebrow">NOËL CHEZ PROMODEV</p><h1 tabindex="-1">Le classement</h1><p class="section-intro">Chaque performance mérite de briller.</p>
        <p class="local-badge">VOS RECORDS SUR CET APPAREIL</p>
        <div class="podium photo-podium" aria-label="Vos meilleurs scores par niveau">
          <div v-for="i in [1,0,2]" :key="i" class="podium-column" :class="'place-'+(i+1)">
            <Crown class="podium-crown" :size="i===0?32:24"/>
            <div class="medallion"><component :is="personalBest[i].icon" :size="24"/></div>
            <strong>{{personalBest[i].name}}</strong><span>{{personalBest[i].score?personalBest[i].score.toLocaleString('fr-FR'):'—'}}</span>
          </div>
          <span v-for="place in [1,2,3]" :key="'rank-'+place" class="podium-rank" :class="'rank-'+place" aria-hidden="true">{{place}}</span>
        </div>
        <div class="records-list"><div v-for="m in modes" :key="m.id" class="record-row"><component :is="m.icon" :size="20"/><span>{{m.name}}</span><b>{{Math.max(0,...records.filter(r=>r.mode===m.id).map(r=>r.score)).toLocaleString('fr-FR')}} <small>pts</small></b></div></div>
        <p class="section-intro local-context">Entraînez-vous et battez vos records.<br>Le classement entre collègues ouvrira avec le concours.</p>
        <button class="primary-button" @click="go('select')">Viser les étoiles <ArrowRight :size="20"/></button>
      </section>

      <section v-else-if="view==='profile'" class="profile-screen narrow-screen page-enter">
        <p class="eyebrow">LES COULISSES</p><h1 tabindex="-1">Votre espace</h1><p class="section-intro">La magie, à votre façon.</p>
        <form class="profile-card" @submit.prevent="saveProfile"><label for="nickname">Votre prénom ou pseudo</label><input id="nickname" v-model="settings.name" maxlength="24" autocomplete="nickname" placeholder="Comment vous appeler ?"><button class="secondary-button" type="submit">{{profileSaved?'Enregistré':'Enregistrer'}} <Check :size="17"/></button></form><p v-if="profileError" class="error-message" role="alert">{{profileError}}</p>
        <div class="settings-card"><button class="setting-row" :aria-pressed="settings.sound" @click="settings.sound=!settings.sound"><Volume2 :size="21"/><span>Musique du jeu</span><span class="toggle" :class="{on:settings.sound}"></span></button><button class="setting-row" :aria-pressed="motion" :disabled="systemReduced" @click="settings.motion=!settings.motion"><Sparkles :size="21"/><span>Ambiance animée<small v-if="systemReduced">Mouvements réduits sur votre appareil</small></span><span class="toggle" :class="{on:motion}"></span></button><button class="setting-row" @click="install"><Download :size="21"/><span>Installer sur mon téléphone</span><ChevronRight :size="18"/></button></div>
        <p class="small-note">Vos préférences et records restent sur cet appareil.</p>
      </section>
    </main>

    <nav v-if="view!=='game'&&view!=='select'&&view!=='result'" class="bottom-nav" aria-label="Navigation principale"><button :class="{active:['home','select','result'].includes(view)}" :aria-current="['home','select','result'].includes(view)?'page':undefined" @click="go('home')"><Play :size="22" :fill="['home','select','result'].includes(view)?'currentColor':'none'"/><span>Jouer</span></button><button :class="{active:view==='leaderboard'}" :aria-current="view==='leaderboard'?'page':undefined" @click="go('leaderboard')"><Trophy :size="22"/><span>Classement</span></button><button :class="{active:view==='profile'}" :aria-current="view==='profile'?'page':undefined" @click="go('profile')"><UserRound :size="22"/><span>Profil</span></button></nav>
    <div v-if="needRefresh&&view!=='game'" class="update-banner">Une nouvelle version est prête.<button @click="updateServiceWorker()">Actualiser</button></div>
    <dialog class="help-dialog" @close="showHelp=false" @click="e=>{if(e.target===e.currentTarget)showHelp=false}"><button class="icon-button close-dialog" aria-label="Fermer" @click="showHelp=false"><X :size="20"/></button><Snowflake :size="30" class="gold"/><h2>La scène est à vous.</h2><p>Touchez les quatre touches lorsque les notes arrivent sur la ligne lumineuse. Gardez le doigt appuyé pour les notes longues.</p><p>Sur ordinateur, utilisez <kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd>. La barre espace met le jeu en pause.</p><p>Pour installer : utilisez le bouton d’installation du navigateur. Sur iPhone, ouvrez dans Safari, puis Partager → Sur l’écran d’accueil.</p><button class="primary-button" @click="showHelp=false">C’est parti <ArrowRight :size="18"/></button></dialog>
  </div>
</template>
