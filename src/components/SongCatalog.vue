<script setup>
import { computed, ref, toRef, onUnmounted, watch } from 'vue'
import { Search, Heart, Headphones, Pause, ArrowRight, Star, Music2, Shuffle, Flame, X } from '@lucide/vue'
import { songs } from '../lib/songs.js'
import { progressFor, dailySong, readFavorites } from '../lib/progress.js'
const props=defineProps({records:Array,sound:Boolean,state:Object}),emit=defineEmits(['choose','preview-active'])
const search=toRef(props.state,'search'),genre=toRef(props.state,'genre'),filter=toRef(props.state,'filter'),favorites=ref(readFavorites()),playing=ref(''),loading=ref(''),error=ref('')
const genres=['Tous',...new Set(songs.map(s=>s.genre))],daily=dailySong(songs)
const progress=computed(()=>Object.fromEntries(songs.map(s=>[s.id,progressFor(props.records,s.id)])))
const completed=computed(()=>Object.values(progress.value).filter(p=>p.played).length)
const stars=computed(()=>Object.values(progress.value).reduce((total,p)=>total+p.stars,0))
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const visible=computed(()=>songs.filter(s=>(genre.value==='Tous'||s.genre===genre.value)&&normalize(s.title+' '+s.artist).includes(normalize(search.value))&&(filter.value==='Tous'||(filter.value==='Favoris'?favorites.value.includes(s.id):!progress.value[s.id].played))))
let audio,timer,token=0
function stop(){token++;audio?.pause();audio=null;clearTimeout(timer);playing.value=loading.value='';emit('preview-active',false)}
async function preview(song){
 if(playing.value===song.id||loading.value===song.id){stop();return}
 stop();error.value=''
 if(!props.sound){error.value='Activez le son pour écouter un extrait.';return}
 const local=++token,player=new Audio(song.audio+'?v='+song.revision);audio=player;loading.value=song.id;emit('preview-active',true);player.volume=.55;player.currentTime=song.previewAt
 try{await player.play();if(local!==token){player.pause();return}playing.value=song.id;timer=setTimeout(stop,15000)}
 catch{if(local===token)error.value='Cet extrait ne se charge pas. Vous pouvez réessayer.'}
 finally{if(local===token){loading.value='';if(!playing.value)emit('preview-active',false)}}
}
function favorite(id){favorites.value=favorites.value.includes(id)?favorites.value.filter(x=>x!==id):[...favorites.value,id];try{localStorage.setItem('promodev-favorites',JSON.stringify(favorites.value))}catch{error.value='Les favoris ne peuvent pas être enregistrés sur cet appareil.'}}
function choose(song){stop();emit('choose',song.id)}
function random(){const pool=visible.value.length?visible.value:songs;choose(pool[Math.floor(Math.random()*pool.length)])}
watch(()=>props.sound,value=>{if(!value)stop()})
watch(visible,items=>{if(!items.some(s=>s.id===(playing.value||loading.value)))stop()})
onUnmounted(stop)
</script>
<template>
<section class="catalog-screen page-enter">
 <div class="catalog-heading"><h1 tabindex="-1">Votre <em>collection.</em></h1><span>{{songs.length}} morceaux</span></div>
 <div class="catalog-tools"><label class="catalog-search"><Search :size="18"/><input v-model="search" type="search" placeholder="Chercher un morceau, un artiste…" aria-label="Chercher un morceau"/><button v-if="search" aria-label="Effacer la recherche" @click="search=''"><X :size="16"/></button></label><button class="surprise-button" aria-label="Surprenez-moi" @click="random"><Shuffle :size="23"/></button></div>
 <div class="genre-filters" role="group" aria-label="Style musical"><button v-for="g in genres" :key="g" :aria-pressed="genre===g" @click="genre=g">{{g}}</button></div>
 <div class="catalog-subnav"><div role="group" aria-label="Filtrer la collection"><button v-for="f in ['Tous','Favoris','À découvrir']" :key="f" :aria-pressed="filter===f" @click="filter=f">{{f}}</button></div><span aria-live="polite">{{visible.length}} {{visible.length===1?'titre':'titres'}}</span></div>
 <p v-if="error" class="error-message" role="alert">{{error}}</p>
 <div v-if="visible.length" class="album-grid">
  <article v-for="s in visible" :key="s.id" class="album-card" :data-genre="s.genre" :style="{'--cover-hue':190+songs.indexOf(s)*23%140}">
   <button class="album-open" :aria-label="'Jouer à '+s.title+' · '+progress[s.id].stars+' étoiles sur 3'" @click="choose(s)">
    <img v-if="s.cover" class="album-photo" :src="s.cover" alt="" loading="lazy"/>
    <span class="album-genre" :title="s.genre">{{s.genre}}</span>
    <div class="album-copy"><h2>{{s.title}}</h2><span class="album-artist" :title="s.artist">{{s.artist}}</span></div>
    <span class="album-progress" aria-hidden="true"><span class="album-stars"><Star v-for="i in 3" :key="i" :size="15" :fill="progress[s.id].stars>=i?'currentColor':'none'"/></span><span class="album-duration">{{s.duration}}</span></span>
   </button>
   <button class="album-heart" :aria-label="(favorites.includes(s.id)?'Retirer des favoris : ':'Ajouter aux favoris : ')+s.title" :aria-pressed="favorites.includes(s.id)" @click="favorite(s.id)"><Heart :size="21" :fill="favorites.includes(s.id)?'currentColor':'none'"/></button>
   <button class="album-preview" :class="{'is-playing':playing===s.id||loading===s.id}" :aria-busy="loading===s.id" :aria-label="(playing===s.id||loading===s.id?'Arrêter : ':'Écouter : ')+s.title" :title="playing===s.id||loading===s.id?'Arrêter l’extrait':'Écouter un extrait'" @click="preview(s)"><Pause v-if="playing===s.id||loading===s.id" :size="20"/><Headphones v-else :size="20"/></button>
  </article>
 </div>
 <div v-else class="catalog-empty"><Music2 :size="34"/><h2>Aucun titre ici, pour le moment.</h2><p>Essayez un autre style ou ajoutez des morceaux à vos favoris.</p><button class="secondary-button" @click="genre='Tous';filter='Tous';search=''">Voir les {{songs.length}} morceaux</button></div>
 <div class="collection-footer"><span><Star :size="16"/> {{stars}} / {{songs.length*3}} étoiles · {{completed}} {{completed===1?'morceau joué':'morceaux joués'}}</span><button class="daily-track" @click="choose(daily)"><Flame :size="16"/> Défi du jour · {{daily.title}} <ArrowRight :size="16"/></button></div>
 <p class="catalog-footnote">Trois niveaux par morceau · Notes courtes et notes à maintenir · Versions de jeu</p>
</section>
</template>
<style scoped>
.catalog-screen{max-width:1120px;margin:auto;padding:0 28px 36px}
.catalog-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin:0 0 22px}
.catalog-heading h1{font:500 clamp(38px,5vw,64px)/1.05 'Cormorant Garamond',serif;color:#fff2dc;letter-spacing:-.035em;white-space:nowrap}
.catalog-heading em{color:#ebc88a;font-weight:400}.catalog-heading>span{font-size:12px;color:#c1d3e4;white-space:nowrap}
.catalog-tools{display:flex;gap:10px}.catalog-search{display:flex;align-items:center;gap:12px;flex:1;min-width:0;padding:0 16px;border:1px solid #7692ab;background:#091b2ee8;border-radius:15px;color:#c4d6e7}
.catalog-search input{width:100%;min-width:0;height:48px;background:none;border:0;color:#f8f2e7;font-size:13px}.catalog-search input::placeholder{color:#b3c5d7}.catalog-search input::-webkit-search-cancel-button{display:none}
.catalog-search button{display:grid;place-items:center;width:32px;height:44px;flex-shrink:0;background:none;color:#d8e4f0}
.surprise-button{display:grid;place-items:center;flex-shrink:0;width:48px;height:48px;border:1px solid #7692ab;border-radius:15px;background:#0b2035;color:#e3eaf0;font-size:0}.surprise-button svg{width:23px;height:23px}
.genre-filters{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:16px 0 8px;padding-bottom:2px}
.genre-filters button{flex-shrink:0;border:1px solid #5c7894;border-radius:25px;background:#081a2de8;min-height:44px;padding:8px 22px;color:#e5edf4;font-size:12px}
.genre-filters button[aria-pressed=true]{background:#efd297;color:#132337;border-color:#ffe3ad}
.catalog-subnav{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 14px;color:#c0d1e0;font-size:11px}
.catalog-subnav>div{display:flex;gap:20px}.catalog-subnav button{min-height:44px;border-bottom:2px solid transparent;background:none;color:#d3e0ed;font-size:14px;font-weight:500;padding:0 0 2px}
.catalog-subnav button[aria-pressed=true]{color:#ffe0a6;border-color:#efce91}
.album-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.album-card{position:relative;isolation:isolate;min-width:0;width:100%;aspect-ratio:1.12;min-height:208px;border:1.5px solid #eccb88;border-radius:18px;overflow:hidden;background:#071627;box-shadow:0 6px 20px #0005;transition:border-color .18s,box-shadow .18s}
.album-card:hover,.album-card:focus-within{border-color:#ffe6b4;box-shadow:0 0 0 1px #ffe2a388,0 8px 24px #0007}
.album-open{position:relative;display:block;width:100%;height:100%;padding:0;border:0;background:linear-gradient(135deg,hsl(var(--cover-hue) 35% 32%),#071426);color:#fff2dc;text-align:left}
.album-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 35%}
.album-open:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#04102018 0%,#04102008 22%,#03101c88 43%,#03101cf5 68%,#03101c 100%);pointer-events:none}
.album-genre{position:absolute;left:10px;top:10px;z-index:1;max-width:calc(100% - 72px);padding:5px 9px;border:1px solid #b9d2e56b;border-radius:20px;background:#071426e8;color:#f0f3f5;font-size:9px;letter-spacing:.09em;line-height:1.3;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.album-copy{position:absolute;left:13px;right:13px;bottom:61px;z-index:1}
.album-copy h2{font:600 27px/1.03 'Cormorant Garamond',serif;letter-spacing:-.025em;color:#fff5e4;margin:0 0 5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 8px #0008}
.album-artist{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#c6d9eb;font-size:11px;line-height:1.5}
.album-progress{position:absolute;z-index:1;left:13px;bottom:10px;right:64px;height:44px;display:flex;align-items:center;gap:10px}
.album-stars{display:flex;align-items:center;gap:4px;color:#ffda92}.album-duration{font-size:10px;color:#c6d9eb}
.album-heart,.album-preview{position:absolute;z-index:2;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;right:9px;transition:background .15s,transform .15s}
.album-heart{top:9px;border:1px solid #86a4c16b;background:#071426ed;color:#f0f2f5}.album-heart[aria-pressed=true]{color:#ffe0a0;background:#20374c}.album-heart:hover{background:#213d56}
.album-preview{bottom:9px;background:linear-gradient(135deg,#ffe3a3,#e7c68a);border:1px solid #ffe8b4;color:#07172a}.album-preview:hover{background:#ffe7b8}.album-preview.is-playing{background:#a4e7d7;border-color:#d5fff1}
.album-open:focus-visible{outline:3px solid #fff0c9;outline-offset:-5px;border-radius:17px}.album-heart:focus-visible,.album-preview:focus-visible{outline-offset:2px}
.collection-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:25px;font-size:11px;color:#d6c39d}.collection-footer>span,.daily-track{display:flex;align-items:center;gap:8px}
.daily-track{background:#0a2036;border:1px solid #b99b6066;border-radius:12px;padding:12px;color:#e6c992;font-size:11px;min-height:44px}
.catalog-footnote{text-align:center;font-size:10px;line-height:1.7;color:#b4c8da;margin-top:20px}
.catalog-empty{text-align:center;background:#07192ded;border:1px solid #7490a255;border-radius:18px;padding:35px 15px;color:#c9d9e8}.catalog-empty h2{font:30px 'Cormorant Garamond',serif;margin:12px 0}.catalog-empty p{font-size:12px;line-height:1.7}.catalog-empty button{max-width:300px;margin:20px auto 0}
@media(max-width:1000px) and (min-width:761px){.album-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:760px){
 .catalog-screen{padding:4px 20px 26px}.catalog-heading{margin-bottom:16px;gap:8px}.catalog-heading h1{font-size:clamp(31px,8.4vw,52px)}.catalog-heading>span{font-size:10px}
 .catalog-search{padding:0 12px;border-radius:13px;gap:9px}.catalog-search input{font-size:12px}.surprise-button{border-radius:13px}
 .genre-filters{gap:8px;margin-top:12px}.genre-filters button{padding:8px 18px;font-size:11px}
 .catalog-subnav{margin-bottom:12px}.catalog-subnav>div{gap:17px}.catalog-subnav button{font-size:13px}.catalog-subnav>span{font-size:10px}
 .album-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
 .album-card{aspect-ratio:1.12;min-height:188px;border-radius:14px}
 .album-copy{left:10px;right:10px;bottom:59px}.album-copy h2{font-size:clamp(21px,5.3vw,29px);margin-bottom:4px}.album-artist{font-size:10px}
 .album-heart,.album-preview{right:7px}.album-heart{top:7px}.album-preview{bottom:7px}
 .album-genre{top:9px;left:8px;max-width:calc(100% - 65px);font-size:8px;padding:5px 7px;letter-spacing:.06em}
 .album-progress{left:10px;bottom:7px;right:56px;gap:6px}.album-stars{gap:3px}.album-stars svg{width:13px;height:13px}.album-duration{font-size:9px}
 .collection-footer{font-size:10px;margin-top:18px}.collection-footer .daily-track{width:100%;justify-content:center}
}
@media(max-width:350px){
 .catalog-screen{padding-left:12px;padding-right:12px}.catalog-heading{flex-wrap:wrap;gap:3px}.catalog-heading h1{font-size:35px}.catalog-heading>span{margin-left:auto}
 .album-grid{gap:10px}.album-card{min-height:184px}.album-copy{left:8px;right:8px}.album-copy h2{font-size:20px}.album-artist{font-size:9px}
 .album-progress{left:8px;gap:5px}.album-stars{gap:2px}.album-stars svg{width:12px;height:12px}.album-duration{font-size:9px}
}
</style>
