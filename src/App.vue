<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick, defineAsyncComponent, watch } from 'vue'
import { ArrowRight, ArrowLeft, Play, Pause, Music2, Trophy, UserRound, Volume2, VolumeX, Sparkles, Snowflake, Check, Crown, Clock3, Headphones, Download, X, RotateCcw, ChevronRight, Settings2, Home, Medal, Star, Gift } from '@lucide/vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import Atmosphere from './components/Atmosphere.vue'
import SnowGlobe from './components/SnowGlobe.vue'
import SongCatalog from './components/SongCatalog.vue'
import TeamLeaderboard from './components/TeamLeaderboard.vue'
import InstallGuide from './components/InstallGuide.vue'
import AccountGate from './components/AccountGate.vue'
import NicknameForm from './components/NicknameForm.vue'
import Prizes from './components/Prizes.vue'
import { diagnostic } from './lib/diagnostics.js'
import {avatarFor} from './lib/avatars.js'
import { starsFor, progressFor } from './lib/progress.js'
import { loadIdentity, logout } from './lib/community.js'
import { songs, songRecords } from './lib/songs.js'
const profilePanel=ref('identity'),boardPanel=ref('team'),creditPage=ref(0)
const identityLoading=ref(true),identityError=ref(''),authenticated=computed(()=>!!account.value?.nicknameReady&&!!account.value?.avatar)
const account=ref(null),showInstall=ref(false),installed=ref(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true)
const catalogState=ref({search:'',genre:'Tous',filter:'Tous'});let catalogScroll=0
const songId=ref(songs[0].id)
const song=computed(()=>songs.find(s=>s.id===songId.value)||songs[0])
const Game = defineAsyncComponent(()=>import('./components/Game.vue'))
const reduced=matchMedia('(prefers-reduced-motion: reduce)')
const systemReduced=ref(reduced.matches), previewError=ref(''), previewLoading=ref(false)
function read(key,fallback){
  try{
    const value=JSON.parse(localStorage.getItem(key))
    if(Array.isArray(fallback))return Array.isArray(value)?value.filter(r=>r&&typeof r==='object'&&['facile','normal','difficile'].includes(r.mode)&&Number.isFinite(r.score)&&r.score>=0):fallback
    if(!value||typeof value!=='object'||Array.isArray(value))return fallback
    return {motion:typeof value.motion==='boolean'?value.motion:fallback.motion,sound:typeof value.sound==='boolean'?value.sound:fallback.sound,name:typeof value.name==='string'?value.name.slice(0,24):fallback.name,offsetMs:Number.isFinite(value.offsetMs)?Math.max(-250,Math.min(250,value.offsetMs)):0}
  }catch{return fallback}
}
const view=ref('home'), mode=ref('normal'), settings=ref(read('promodev-settings',{motion:!reduced.matches,sound:true,name:'',offsetMs:0})), records=ref(read('promodev-records-v1',[])), result=ref(null), installEvent=ref(null), showHelp=ref(false), audioPreview=ref(false)
let previewAudio,prevFocus,previewToken=0
const motion=computed(()=>settings.value.motion&&!systemReduced.value)
const currentRecords=computed(()=>songRecords(records.value,songId.value))
const best=computed(()=>Math.max(0,...records.value.map(r=>Number(r.score)||0)))
const baseModes=[{id:'facile',name:'Facile',multiplier:'×1',points:1500,icon:Snowflake,detail:'Prenez le rythme'},{id:'normal',name:'Normal',multiplier:'×1,5',points:2250,icon:Sparkles,detail:'Laissez-vous porter'},{id:'difficile',name:'Difficile',multiplier:'×2',points:3000,icon:Crown,detail:'Faites le grand jeu'}]
const modes=computed(()=>baseModes.map(m=>({...m,points:song.value.modes?.[m.id]?.maxPoints||m.points})))
const collectionStars=computed(()=>songs.reduce((total,s)=>total+progressFor(records.value,s.id).stars,0))
const selected=computed(()=>modes.value.find(m=>m.id===mode.value))
const personalBest=computed(()=>modes.value.map(m=>({...m,score:Math.max(0,...currentRecords.value.filter(r=>r.mode===m.id).map(r=>r.score))})).sort((a,b)=>b.score-a.score))
const {needRefresh,updateServiceWorker}=useRegisterSW()
function storeSettings(){try{localStorage.setItem('promodev-settings',JSON.stringify(settings.value));return true}catch{return false}}
watch(settings,storeSettings,{deep:true})
watch(()=>settings.value.sound,value=>{if(value)previewError.value='';else stopPreview()})
function stopPreview(){previewToken++;previewAudio?.pause();audioPreview.value=false;previewLoading.value=false}
async function go(next){diagnostic('app.navigate',{previous:view.value,next});if(view.value==='catalog')catalogScroll=window.scrollY;stopPreview();view.value=next;window.scrollTo({top:0,behavior:'instant'});await nextTick();if(next==='catalog')window.scrollTo({top:catalogScroll,behavior:'instant'});document.querySelector('main h1')?.focus({preventScroll:true})}
async function preview(){
  previewError.value=''
  if(audioPreview.value||previewLoading.value){stopPreview();return}
  if(!settings.value.sound){previewError.value='Activez la musique dans votre profil pour écouter l’extrait.';return}
  const token=++previewToken;previewLoading.value=true
  if(!previewAudio){previewAudio=new Audio(song.value.audio+'?v='+song.value.revision);previewAudio.addEventListener('ended',()=>audioPreview.value=false)}
  try{previewAudio.currentTime=song.value.previewAt;previewAudio.volume=.45;await previewAudio.play();if(token!==previewToken){if(!previewLoading.value&&!audioPreview.value)previewAudio.pause();return}audioPreview.value=true}
  catch{if(token===previewToken)previewError.value='L’extrait est indisponible. Vérifiez votre connexion.'}
  finally{if(token===previewToken)previewLoading.value=false}
}

watch(songId,()=>{stopPreview();previewAudio=null;previewError.value=''})
function modeKeys(e){const ids=baseModes.map(m=>m.id);let index=ids.indexOf(mode.value);if(['ArrowRight','ArrowDown'].includes(e.key))index=(index+1)%ids.length;else if(['ArrowLeft','ArrowUp'].includes(e.key))index=(index+ids.length-1)%ids.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=ids.length-1;else return;e.preventDefault();mode.value=ids[index];nextTick(()=>document.querySelector('[role=radio][aria-checked=true]')?.focus())}
function chooseSong(id){songId.value=id;go('select')}
function nextSong(){const index=songs.findIndex(s=>s.id===songId.value);chooseSong(songs[(index+1)%songs.length].id)}
async function start(){diagnostic('game.selected',{song:song.value.id,mode:mode.value});stopPreview();view.value='game';await nextTick()}
function finished(value){result.value=value;records.value=read('promodev-records-v1',[]);go('result')}
function acceptIdentity(value){account.value=value;if(value?.nicknameReady)settings.value.name=value.name;identityError.value=''}
async function refreshIdentity(){identityLoading.value=true;identityError.value='';try{acceptIdentity(await loadIdentity())}catch(error){identityError.value=error.status?error.message:'Impossible de vérifier votre connexion. Réessayez.'}finally{identityLoading.value=false}}
function askInstall(e){e.preventDefault();installEvent.value=e}
function install(){showInstall.value=true}
function installedApp(){installed.value=true;installEvent.value=null}
function keyboard(e){if(e.key==='Escape'&&showHelp.value){showHelp.value=false;prevFocus?.focus()}}
function reduction(){systemReduced.value=reduced.matches}
watch(showHelp,async value=>{if(value){prevFocus=document.activeElement;await nextTick();document.querySelector('.help-dialog')?.showModal()}else document.querySelector('.help-dialog')?.close()})
onMounted(()=>{refreshIdentity();window.addEventListener('appinstalled',installedApp);window.addEventListener('beforeinstallprompt',askInstall);window.addEventListener('keydown',keyboard);reduced.addEventListener('change',reduction)})
onUnmounted(()=>{window.removeEventListener('appinstalled',installedApp);stopPreview();window.removeEventListener('beforeinstallprompt',askInstall);window.removeEventListener('keydown',keyboard);reduced.removeEventListener('change',reduction)})
</script>

<template>
  <div class="app-shell" :class="{'catalog-open':view==='catalog','with-navigation':authenticated&&['home','profile','leaderboard','prizes'].includes(view),'motion-off':!motion,'game-open':view==='game','selection-open':['select','catalog','credits'].includes(view),'result-open':view==='result'}">
    <Atmosphere :motion="motion" :quiet="view!=='home'" :catalog="view==='catalog'" :gameplay="view==='game'" />
    <a class="skip-link" href="#main">Aller au contenu</a>
    <header v-if="view!=='game'" class="brand-header">
      <button v-if="view==='catalog'" class="icon-button home-button" aria-label="Retour à l’accueil" title="Accueil" @click="go('home')"><Home :size="22" :stroke-width="2.2"/></button>
      <button v-if="view==='select'" class="icon-button home-button" aria-label="Retour au choix du morceau" title="Retour" @click="go('catalog')"><ArrowLeft :size="22" :stroke-width="2.2"/></button>
      <button class="brand" aria-label="Promodev, retour à l’accueil" @click="go('home')">PROMODEV<span>PIANO CHALLENGE</span></button>
      <div class="header-controls"><button class="icon-button sound-toggle" :title="settings.sound?'Son activé':'Son coupé'" :aria-label="settings.sound?'Couper le son':'Activer le son'" :aria-pressed="settings.sound" @click="settings.sound=!settings.sound;stopPreview()"><Volume2 v-if="settings.sound" :size="22" :stroke-width="2.2"/><VolumeX v-else :size="22" :stroke-width="2.2"/></button><button class="icon-button" :aria-label="motion?'Réduire les animations':'Activer les animations'" :aria-pressed="motion" :disabled="systemReduced" @click="settings.motion=!settings.motion"><Sparkles :size="19"/></button></div>
    </header>

    <main id="main" :class="['main-content', authenticated?'view-'+view:'view-account']">
      <AccountGate v-if="!authenticated" :account="account" :loading="identityLoading" :load-error="identityError" @authenticated="acceptIdentity" @retry="refreshIdentity"/>
      <section v-else-if="view==='home'" class="home-screen page-enter">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> LE CHALLENGE DE NOËL <span></span></p>
          <h1 tabindex="-1">Un Noël<br>qui résonne.</h1>
          <p class="hero-description">Un morceau. Quelques notes.<br>Et toute l’équipe à faire vibrer.</p>
        </div>
        <SnowGlobe class="home-globe" :motion="motion" :active="view==='home'" />
        <div class="home-actions">
          <div class="home-stats"><div><Music2 :size="23"/><span>À découvrir<strong>{{songs.length}} morceaux · 3 niveaux</strong></span></div><div><Crown :size="23"/><span>Votre record<strong>{{best?best.toLocaleString('fr-FR')+' pts':'À vous de jouer'}}</strong></span></div></div>
          <button class="primary-button hero-cta" @click="go('catalog')">Entrer en scène <ArrowRight :size="22"/></button>
          <p class="small-note"><Headphones :size="13"/> Encore plus magique avec un casque.</p>
        </div>
        <div class="home-side-note"><span class="edition-line"></span><p>NUIT POLAIRE<br><span>Édition de Noël · Promodev</span></p></div>
      </section>

      <SongCatalog v-else-if="view==='catalog'" :records="records" :sound="settings.sound" :state="catalogState" @choose="chooseSong" />

      <section v-else-if="view==='select'" class="selection-screen narrow-screen page-enter">

        <p class="eyebrow">VOTRE PROCHAINE PERFORMANCE</p>
        <h1 tabindex="-1">À chaque titre,<br>son défi.</h1>
        <p class="section-intro">Choisissez votre niveau. La scène vous attend.</p>
        <h2 class="section-label">LE MORCEAU <span></span></h2>

        <div class="song-card selected"><button class="song-cover" @click="preview" :aria-busy="previewLoading" :aria-label="(audioPreview||previewLoading)?'Arrêter l’extrait':'Écouter un extrait du morceau'"><img v-if="song.cover" :src="song.cover" alt="" class="selected-artwork"/><span v-else class="vinyl-disc"></span><Pause v-if="audioPreview||previewLoading" :size="22"/><Play v-else :size="22"/></button><div class="song-info"><h3>{{song.title}}</h3><p>{{song.artist}}</p><span><Clock3 :size="12"/> {{song.duration}} <i>·</i> {{song.tempoEstimated?'≈':''}}{{song.bpm}} BPM</span></div><span class="selected-check"><Check :size="17"/></span></div>
        <p class="song-difficulty"><Music2 :size="18"/><span>{{song.description}}</span></p>
        <p class="song-hint">{{song.hint}}</p><p class="chart-summary"><span>{{song.modes[mode].notes}} notes</span><span>{{song.modes[mode].holds}} à maintenir</span><span>Difficulté du titre {{song.difficulty}}/5</span></p>
        <p v-if="previewError" class="error-message" role="alert">{{previewError}}</p>
        <h2 class="section-label">VOTRE NIVEAU <span></span></h2>
        <div class="mode-list" role="radiogroup" aria-label="Niveau de difficulté" @keydown="modeKeys"><button v-for="m in modes" :key="m.id" class="mode-option" :class="{selected:mode===m.id}" role="radio" :tabindex="mode===m.id?0:-1" :aria-checked="mode===m.id" @click="mode=m.id"><component :is="m.icon" :size="29"/><span class="mode-title"><strong>{{m.name}}</strong><small>{{m.detail}} <b>{{m.multiplier}}</b></small></span><span class="mode-score"><b>{{m.points.toLocaleString('fr-FR')}}</b> pts max</span><span class="radio-circle"><Check v-if="mode===m.id" :size="13"/></span></button></div>
        <p class="score-explanation">Plus le défi est exigeant, plus il rapporte.<br><span>Votre précision et vos combos font la différence.</span></p>
        <div class="selection-actions"><button class="primary-button" @click="start">Jouer · {{selected.name}} <Play :size="19" fill="currentColor"/></button>
        <button class="text-button" @click="showHelp=true">Comment jouer ?</button></div>
      </section>

      <Game v-else-if="view==='game'" :mode="mode" :song="song" :sound="settings.sound" :motion="motion" :player-name="settings.name" :offset-ms="settings.offsetMs" @exit="go('select')" @finish="finished" />

      <section v-else-if="view==='result'" class="result-screen narrow-screen page-enter">
        <div class="celebration" aria-hidden="true"><i v-for="i in 24" :key="i" :style="{'--i':i}"></i></div>
        <p class="eyebrow">LE RIDEAU SE LÈVE SUR VOTRE SCORE</p>
        <div class="result-crown"><Crown :size="54" stroke-width="1"/></div>
        <h1 tabindex="-1">{{result.accuracy>=80?'Une étoile est née.':result.accuracy>=45?'Vous avez le rythme.':'La magie se pratique.'}}</h1>
        <div class="result-stars" role="img" :aria-label="starsFor(result.accuracy)+' étoiles obtenues sur 3'"><Star aria-hidden="true" v-for="i in 3" :key="i" :size="28" :fill="starsFor(result.accuracy)>=i?'currentColor':'none'"/></div>
        <p class="result-song">{{song.title}} · {{selected.name}}</p>
        <div class="result-score">{{result.score.toLocaleString('fr-FR')}}<span>POINTS / {{result.maxPoints.toLocaleString('fr-FR')}}</span></div>
        <div class="result-stats"><div><strong>{{result.accuracy===0&&(result.perfect||result.good)?'<1':result.accuracy}}<small>%</small></strong><span>Précision</span></div><div><strong>{{result.maxCombo}}</strong><span>Meilleur combo</span></div><div><strong>{{result.perfect}}</strong><span>Notes parfaites</span></div></div>
        <p class="hold-result">{{result.holdsCompleted||0}} / {{result.holdsTotal||0}} notes longues réussies<span v-if="result.holdsBroken"> · {{result.holdsBroken}} relâchées trop tôt</span></p>
        <p class="result-advice">{{result.accuracy<70?'Gardez les yeux sur la ligne lumineuse et laissez la musique vous guider.':'Un autre niveau, un nouveau record. La scène est à vous.'}}</p>
        <button class="primary-button" @click="start"><RotateCcw :size="19"/> Encore une fois</button>
        <button class="secondary-button" @click="nextSong">Le morceau suivant <ArrowRight :size="17"/></button><button class="text-button" @click="go('catalog')">Retour aux {{songs.length}} morceaux</button>
        <p class="shared-result" role="status">{{result.shared?'Performance enregistrée dans le classement de l’équipe.':'Record conservé sur cet appareil. Classement partagé indisponible pour cette partie.'}}</p>
        <p v-if="result.saved===false" class="error-message">Le score n’a pas pu être enregistré sur cet appareil.</p>
      </section>

      <section v-else-if="view==='leaderboard'" class="leaderboard-screen narrow-screen page-enter">
        <p class="eyebrow">NOËL CHEZ PROMODEV</p><h1 tabindex="-1">Le classement</h1><p class="section-intro">Chaque performance mérite de briller.</p>
        <div class="panel-switch" role="group" aria-label="Type de classement"><button :aria-pressed="boardPanel==='team'" @click="boardPanel='team'">L’équipe</button><button :aria-pressed="boardPanel==='personal'" @click="boardPanel='personal'">Mes records</button></div><TeamLeaderboard v-if="boardPanel==='team'"/><div v-else class="personal-board"><p class="local-badge">VOS RECORDS SUR CET APPAREIL</p><select v-model="songId" class="song-selector" aria-label="Morceau des records locaux"><option v-for="s in songs" :key="s.id" :value="s.id">{{s.title}}</option></select>
        <div class="podium photo-podium" aria-label="Vos meilleurs scores par niveau">
          <div v-for="i in [1,0,2]" :key="i" class="podium-column" :class="'place-'+(i+1)">
            <Crown class="podium-crown" :size="i===0?32:24"/>
            <div class="medallion"><component :is="personalBest[i].icon" :size="24"/></div>
            <strong>{{personalBest[i].name}}</strong><span>{{personalBest[i].score?personalBest[i].score.toLocaleString('fr-FR'):'—'}}</span>
          </div>
          <span v-for="place in [1,2,3]" :key="'rank-'+place" class="podium-rank" :class="'rank-'+place" aria-hidden="true">{{place}}</span>
        </div>
        <div class="records-list"><div v-for="m in modes" :key="m.id" class="record-row"><component :is="m.icon" :size="20"/><span>{{m.name}}</span><b>{{Math.max(0,...currentRecords.filter(r=>r.mode===m.id).map(r=>r.score)).toLocaleString('fr-FR')}} <small>pts</small></b></div></div>
        <p class="section-intro local-context">Entraînez-vous et battez vos records.<br>{{collectionStars}} étoiles obtenues sur {{songs.length*3}}.</p>
        </div><button class="primary-button board-play" @click="go('catalog')">Viser les étoiles <ArrowRight :size="20"/></button>
      </section>

      <Prizes v-else-if="view==='prizes'" @play="go('catalog')"/>
      <section v-else-if="view==='profile'" class="profile-screen narrow-screen page-enter">
        <p class="eyebrow">LES COULISSES</p><h1 tabindex="-1">Votre espace</h1><p class="section-intro">La magie, à votre façon.</p>
        <div class="panel-switch" role="group" aria-label="Rubriques du profil"><button :aria-pressed="profilePanel==='identity'" @click="profilePanel='identity'">Mon profil</button><button :aria-pressed="profilePanel==='comfort'" @click="profilePanel='comfort'">Confort</button><button :aria-pressed="profilePanel==='app'" @click="profilePanel='app'">Application</button></div>
        <div v-if="profilePanel==='identity'" class="profile-panel identity-panel">
         <div v-if="account?.email" class="account-identity"><label for="account-email">Votre adresse vérifiée</label><input id="account-email" :value="account.email" type="email" readonly/><p>Un seul profil par adresse @promo.dev.</p><button class="text-button" @click="logout">Se déconnecter</button></div>
         <NicknameForm :initial-avatar="account?.avatar" :initial="account?.name" @saved="acceptIdentity"/>
        </div>
        <div v-else-if="profilePanel==='comfort'" class="profile-panel comfort-panel">
         <div class="settings-card"><button class="setting-row" :aria-pressed="settings.sound" @click="settings.sound=!settings.sound"><Volume2 :size="21"/><span>Musique du jeu</span><span class="toggle" :class="{on:settings.sound}"></span></button><button class="setting-row" :aria-pressed="motion" :disabled="systemReduced" @click="settings.motion=!settings.motion"><Sparkles :size="21"/><span>Ambiance animée</span><span class="toggle" :class="{on:motion}"></span></button></div>
         <div class="latency-card"><label for="latency">Synchronisation <b>{{settings.offsetMs>0?'+':''}}{{settings.offsetMs}} ms</b></label><input id="latency" v-model.number="settings.offsetMs" type="range" min="-250" max="250" step="10"><p>Son en retard : augmentez la valeur.<br>Son en avance : diminuez la valeur.</p><button class="text-button" @click="settings.offsetMs=0">Revenir à 0 ms</button></div>
        </div>
        <div v-else class="profile-panel application-panel">
         <div class="settings-card"><button class="setting-row" @click="install"><Download :size="21"/><span>{{installed?'Guide de l’application':'Installer l’application'}}</span><ChevronRight :size="18"/></button></div>
         <button class="secondary-button" @click="go('credits')"><Music2 :size="18"/> Artistes et crédits musicaux</button><p class="small-note">Préférences sur cet appareil.<br>Vos scores sont associés à votre compte.</p>
        </div>
      </section>
      <section v-else-if="view==='credits'" class="narrow-screen credits-screen page-enter"><button class="back-link" @click="go('profile')"><ArrowLeft :size="17"/> Votre espace</button><p class="eyebrow">LA MUSIQUE DERRIÈRE LE JEU</p><h1 tabindex="-1">Les artistes.</h1><p class="section-intro">{{songs.length}} morceaux de plusieurs artistes, adaptés en versions de jeu avec extraits, fondus et silence initial. Arrangement des touches : PromoTiles.</p><p class="song-hint">Musique fournie par <a href="https://ncs.io" target="_blank" rel="noopener noreferrer">NoCopyrightSounds</a>. Version d’essai interne ; les conditions propres aux morceaux figurent sur les pages des sources.</p><ol class="credits-list" :start="creditPage*3+1"><li v-for="s in songs.slice(creditPage*3,creditPage*3+3)" :key="s.id"><a :href="s.sourceUrl" target="_blank" rel="noopener noreferrer">{{s.title}}</a><span>{{s.artist}} · {{s.license}}</span></li></ol><div class="list-pagination"><button class="icon-button" aria-label="Artistes précédents" :disabled="creditPage===0" @click="creditPage--"><ArrowLeft :size="18"/></button><span>{{creditPage+1}} / {{Math.ceil(songs.length/3)}}</span><button class="icon-button" aria-label="Artistes suivants" :disabled="creditPage>=Math.ceil(songs.length/3)-1" @click="creditPage++"><ArrowRight :size="18"/></button></div></section>
    </main>

    <nav v-if="authenticated&&!['game','select','catalog','result','credits'].includes(view)" class="bottom-nav" aria-label="Navigation principale"><button :class="{active:['home','select','result'].includes(view)}" :aria-current="['home','select','result'].includes(view)?'page':undefined" @click="go('home')"><Play :size="22" :fill="['home','select','result'].includes(view)?'currentColor':'none'"/><span>Jouer</span></button><button :class="{active:view==='leaderboard'}" :aria-current="view==='leaderboard'?'page':undefined" @click="go('leaderboard')"><Trophy :size="22"/><span>Classement</span></button><button :class="{active:view==='prizes'}" :aria-current="view==='prizes'?'page':undefined" @click="go('prizes')"><Gift :size="22"/><span>Dotations</span></button><button :class="{active:view==='profile'}" :aria-current="view==='profile'?'page':undefined" @click="go('profile')"><img v-if="avatarFor(account?.avatar)" class="nav-avatar" :src="avatarFor(account.avatar).src" alt="" width="24" height="24"/><UserRound v-else :size="22"/><span>Profil</span></button></nav>
    <div v-if="needRefresh&&view!=='game'" class="update-banner">Une nouvelle version est prête.<button @click="updateServiceWorker()">Actualiser</button></div>
    <InstallGuide :open="showInstall" :install-prompt="installEvent" :installed="installed" @close="showInstall=false" @consumed="installEvent=null"/>
    <dialog class="help-dialog" @close="showHelp=false" @click="e=>{if(e.target===e.currentTarget)showHelp=false}"><button class="icon-button close-dialog" aria-label="Fermer" @click="showHelp=false"><X :size="20"/></button><Snowflake :size="30" class="gold"/><h2>La scène est à vous.</h2><p>Touchez les quatre touches lorsque les notes arrivent sur la ligne lumineuse. Gardez le doigt appuyé pour les notes longues.</p><p>Sur ordinateur, utilisez <kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd>. La barre espace met le jeu en pause.</p><button class="primary-button" @click="showHelp=false">C’est parti <ArrowRight :size="18"/></button></dialog>
  </div>
</template>

<style scoped>
.chart-summary{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:#cdbd9b;margin:0 0 26px;flex-wrap:wrap}.result-stars{display:flex;justify-content:center;gap:10px;color:#e6c78f;margin:15px 0}.hold-result,.shared-result{font-size:11px;line-height:1.8;color:#bbd0e2;text-align:center}.shared-result{margin:20px 0}.latency-card{padding:22px;background:#0a2135bf;border:1px solid #a4bfd333;border-radius:14px;margin:24px 0}.latency-card label{display:flex;justify-content:space-between;font-size:12px;gap:12px}.latency-card b{color:#e6c78f;white-space:nowrap}.latency-card input{width:100%;margin:22px 0 10px;accent-color:#e6c78f}.latency-card p{font-size:11px;line-height:1.8;color:#a9bfd2}.credits-screen{padding-bottom:45px}.credits-list{padding-left:22px}.credits-list li{padding:13px 0;color:#9cb2c7;font-size:12px}.credits-list a,.credits-screen a{color:#e6c78f}.credits-list span{display:block;font-size:10px;margin-top:6px;line-height:1.6}

.song-selector{width:100%;padding:12px 14px;margin-bottom:12px;border:1px solid #7e9bb647;border-radius:10px;background:#0c2035;color:#e5ecf4;font:inherit;font-size:13px}.song-hint{color:#b9cce0;font-size:12px;line-height:1.7;margin:-4px 0 24px}
</style>
