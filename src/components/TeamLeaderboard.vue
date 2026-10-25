<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Trophy, RefreshCw, Users, Crown, ArrowLeft, ArrowRight } from '@lucide/vue'
import {avatarFor} from '../lib/avatars.js'
import { songs } from '../lib/songs.js'
import { leaderboard, currentPlayer } from '../lib/community.js'
const host=ref(null),page=ref(0),pageSize=ref(3);let observer
const selected=ref(''),mode=ref(''),rows=ref([]),loading=ref(true),error=ref('');let token=0
const shown=computed(()=>rows.value.slice(page.value*pageSize.value,(page.value+1)*pageSize.value))
const pages=computed(()=>Math.max(1,Math.ceil(rows.value.length/pageSize.value)))
watch(pages,()=>page.value=Math.min(page.value,pages.value-1))
onMounted(()=>{observer=new ResizeObserver(([entry])=>{if(matchMedia('(max-width:760px), (max-height:500px) and (max-width:1000px)').matches)pageSize.value=Math.max(1,Math.min(6,Math.floor((entry.contentRect.height-190)/54)));else pageSize.value=6});observer.observe(host.value)})
onUnmounted(()=>observer?.disconnect())
async function load(){page.value=0;const local=++token;loading.value=true;error.value='';try{const value=await leaderboard(selected.value,mode.value);if(local===token)rows.value=value.rows}catch{if(local===token)error.value='Le serveur de l’équipe ne répond pas. Vos records restent enregistrés sur cet appareil.'}finally{if(local===token)loading.value=false}}
watch([selected,mode],load,{immediate:true});onUnmounted(()=>token++)
</script>
<template>
<div ref="host" class="team-board">
 <div class="team-heading"><span><Users :size="18"/> LE CLASSEMENT DE L’ÉQUIPE</span><button class="icon-button" aria-label="Actualiser le classement" :disabled="loading" @click="load"><RefreshCw :size="16"/></button></div>
 <p>Les meilleures performances des joueurs connectés à cette installation.</p>
 <div class="team-filters"><label>Morceau<select v-model="selected"><option value="">Tous les morceaux</option><option v-for="s in songs" :key="s.id" :value="s.id">{{s.title}}</option></select></label><label>Niveau<select v-model="mode"><option value="">Tous les niveaux</option><option value="facile">Facile</option><option value="normal">Normal</option><option value="difficile">Difficile</option></select></label></div>
 <p v-if="loading" class="board-state" role="status">Les scores arrivent…</p>
 <div v-else-if="error" class="board-state"><p role="alert">{{error}}</p><button class="text-button" @click="load">Réessayer</button></div>
 <ol v-else-if="rows.length" class="team-rows"><li v-for="(player,i) in shown" :key="player.id" :class="{self:player.id===currentPlayer()}"><span class="team-rank"><Crown v-if="page===0&&i===0" :size="21"/><span v-else>{{page*pageSize+i+1}}</span></span><span><span class="team-player-line"><img v-if="avatarFor(player.avatar)" :src="avatarFor(player.avatar).src" alt="" width="28" height="28"/><strong>{{player.name}} <small v-if="player.id===currentPlayer()">vous</small></strong></span><small>{{player.performances}} performances · combo {{player.combo}}</small></span><b>{{player.score.toLocaleString('fr-FR')}}<small>points</small></b></li></ol>
 <div v-else class="board-state"><Trophy :size="30"/><h3>La première place vous attend.</h3><p>Terminez un morceau pour lancer le classement.</p></div>
 <div v-if="rows.length&&!loading&&!error" class="list-pagination"><button class="icon-button" aria-label="Joueurs précédents" :disabled="page===0" @click="page--"><ArrowLeft :size="18"/></button><span>{{page+1}} / {{pages}}</span><button class="icon-button" aria-label="Joueurs suivants" :disabled="page>=pages-1" @click="page++"><ArrowRight :size="18"/></button></div>
 <p class="board-note">Total des meilleurs scores pour chaque morceau et niveau. Choisissez le même morceau et le même niveau pour comparer une performance.</p>
</div>
</template>
<style scoped>
.team-board{border:1px solid #a8bed039;border-radius:18px;background:#081c30dc;padding:23px;margin:25px 0}.team-heading{display:flex;align-items:center;justify-content:space-between}.team-heading>span{display:flex;gap:10px;align-items:center;color:#e8cc98;font-size:10px;letter-spacing:1.4px}.team-board>p{font-size:12px;color:#acc2d6;line-height:1.7}.team-filters{display:flex;gap:12px;margin:22px 0}.team-filters label{display:flex;flex:1;min-width:0;flex-direction:column;gap:8px;font-size:10px;color:#b2c6d9}.team-filters select{width:100%;min-width:0;background:#0c253d;color:#e8e8df;border:1px solid #a3bfd039;border-radius:8px;padding:11px 8px;font-size:11px}.team-rows{list-style:none;margin:0;padding:0}.team-rows li{display:flex;align-items:center;gap:13px;padding:17px 2px;border-bottom:1px solid #9db7ce25}.team-rank{color:#e5c48b;width:24px;text-align:center;font-size:13px}.team-rows li>span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:6px;min-width:0}.team-rows strong{font-size:13px;overflow-wrap:anywhere}.team-rows small{font-size:10px;color:#8faac3;font-weight:400}.team-rows b{display:flex;flex-direction:column;text-align:right;gap:5px;color:#e5c995;font-size:17px}.team-rows li.self{background:#d1b57a0c}.team-rows strong small{color:#e5c995}.board-state{text-align:center;padding:25px 10px;color:#c1d3e3;font-size:12px;line-height:1.8}.board-state h3{font:26px 'Cormorant Garamond',serif}.team-board .board-note{font-size:10px;color:#8fa7bd;margin-top:20px}.icon-button:disabled{opacity:.5}@media(max-width:400px){.team-board{padding:17px}.team-filters{flex-direction:column}}
</style>

<style scoped>
@media(max-width:760px),(max-height:500px) and (max-width:1000px){
.team-board{display:flex;flex-direction:column;flex:1;min-height:0;margin:10px 0;padding:10px 14px;overflow:hidden}.team-board>p:not(.board-state){display:none}.team-heading{flex-shrink:0}.team-heading>span{font-size:8px;letter-spacing:.6px}.team-heading .icon-button{width:36px;height:36px}.team-filters{flex-direction:row;margin:8px 0;gap:8px;flex-shrink:0}.team-filters label{gap:4px}.team-filters select{padding:8px 4px;min-height:38px}.team-rows{flex:1;min-height:0}.team-rows li{height:54px;padding:6px 0;gap:8px}.team-rows strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.team-rows li>span:nth-child(2){gap:3px}.team-rows b{font-size:15px}.board-state{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:8px;font-size:11px;line-height:1.4}.board-state h3{font-size:22px}.list-pagination{flex-shrink:0;margin-top:auto}.board-note{display:none}
}
</style>

<style scoped>
@media(max-height:500px) and (max-width:1000px){
 .team-board{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:36px minmax(0,1fr);gap:0 18px;padding:6px 12px}
 .team-heading{grid-column:1;grid-row:1}.team-filters{grid-column:1;grid-row:2;margin:0;align-self:start}
 .team-rows{grid-column:2;grid-row:1/3;padding-bottom:40px}.team-rows li{height:50px}
 .list-pagination{grid-column:2;grid-row:2;align-self:end;width:100%}.list-pagination button{height:32px;width:32px}
 .board-state{grid-column:2;grid-row:1/3;padding:0}.board-state>svg{display:none}.board-state h3{font-size:20px}
}
</style>

<style scoped>
.team-player-line{display:flex;align-items:center;gap:8px;min-width:0}.team-player-line img{border-radius:50%;border:1px solid #e6c78f88;flex-shrink:0;width:28px;height:28px}.team-player-line strong{min-width:0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
</style>
