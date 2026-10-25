<script setup>
import {Headphones,Speaker,Gift,Crown,ArrowRight} from '@lucide/vue'
defineEmits(['play'])
const prizes=[
 {rank:'1re place',name:'Le son, en grand.',item:'Casque audio premium',description:'Pour savourer chaque note, partout.',icon:Headphones,tone:'gold',label:'Le grand frisson'},
 {rank:'2e place',name:'La fête vous suit.',item:'Enceinte nomade',description:'Votre playlist préférée, à emporter.',icon:Speaker,tone:'silver',label:'Le rythme en poche'},
 {rank:'3e place',name:'Une pause gourmande.',item:'Coffret gourmand de Noël',description:'Chocolats fins et douceurs à partager.',icon:Gift,tone:'bronze',label:'La touche de douceur'}
]
</script>
<template>
 <section class="prizes-screen narrow-screen page-enter">
  <p class="eyebrow">LES ÉTOILES ONT LEURS CADEAUX</p>
  <h1 tabindex="-1">Sous le <em>sapin.</em></h1>
  <div class="prizes-intro"><p>Trois podiums. Trois raisons de vibrer.</p><span>Dotations fictives</span></div>
  <div class="prizes-grid">
   <article v-for="prize in prizes" :key="prize.rank" class="prize-card" :class="prize.tone">
    <div class="prize-art" aria-hidden="true"><div class="prize-halo"></div><component :is="prize.icon" :stroke-width="1.25"/><span class="prize-spark one">✦</span><span class="prize-spark two">✧</span></div>
    <div class="prize-copy"><span class="prize-rank"><Crown :size="14"/>{{prize.rank}}</span><p class="prize-label">{{prize.label}}</p><h2>{{prize.name}}</h2><h3>{{prize.item}}</h3><p class="prize-description">{{prize.description}}</p></div>
   </article>
  </div>
  <div class="prizes-footer"><p>Une sélection imaginaire pour rêver au podium.</p><button class="primary-button" @click="$emit('play')">À moi de jouer<ArrowRight :size="20"/></button></div>
 </section>
</template>
<style>
.prizes-screen{max-width:1100px;margin:0 auto;padding:20px 36px 36px}.prizes-screen>h1{font:500 clamp(48px,6vw,78px)/1 var(--serif);margin:14px 0}.prizes-screen>h1 em{font-weight:400;color:#f1d398}.prizes-intro{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:26px}.prizes-intro p{font-size:13px;color:#bfd0e0}.prizes-intro>span{flex-shrink:0;border:1px solid #d6b87566;padding:6px 10px;border-radius:30px;color:#ebd5ac;font-size:10px}.prizes-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.prize-card{position:relative;overflow:hidden;border:1px solid #dcb97699;border-radius:24px;background:linear-gradient(155deg,#183248,#071426 80%);box-shadow:0 15px 40px #0003}.prize-card.silver{border-color:#b9d1df88}.prize-card.bronze{border-color:#d7ab8b88}.prize-art{height:190px;position:relative;display:grid;place-items:center;color:#f5db9f}.prize-art>svg{width:104px;height:104px;position:relative;filter:drop-shadow(0 9px 10px #0006)}.silver .prize-art{color:#d8edf8}.bronze .prize-art{color:#eac0a2}.prize-halo{position:absolute;width:170px;height:170px;border-radius:50%;border:1px solid #efcd8f30;background:radial-gradient(circle,#efc87522,transparent 70%);box-shadow:0 0 0 13px #efcd8f05}.prize-spark{position:absolute;color:#f9e0aa}.prize-spark.one{left:23%;top:24%;font-size:18px}.prize-spark.two{right:23%;bottom:21%;font-size:24px}.prize-copy{padding:0 24px 28px}.prize-rank{display:inline-flex;align-items:center;gap:7px;font-size:11px;color:#f1d398;border:1px solid #e2c78755;padding:6px 10px;border-radius:30px}.prize-label{font-size:8px;letter-spacing:1.7px;text-transform:uppercase;color:#b9ccdd;margin:19px 0 10px}.prize-copy h2{font:500 33px/1 var(--serif);color:#fcf1dd;margin-bottom:12px}.prize-copy h3{font-size:12px;color:#e6cfaa;font-weight:600}.prize-description{font-size:11px;color:#b5c8da;line-height:1.7;margin-top:9px}.prizes-footer{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-top:26px}.prizes-footer>p{font-size:11px;color:#b9cddd}.prizes-footer .primary-button{min-width:260px}.bottom-nav{grid-template-columns:repeat(4,1fr)}
@media(max-width:760px),(max-height:500px) and (max-width:1000px){.prizes-screen .prizes-intro{margin:0 0 10px;flex-shrink:0}.prizes-intro p{display:none}.prizes-intro>span{font-size:9px;padding:4px 8px}.prizes-grid{flex:1;min-height:0;display:grid;grid-template-columns:1fr;grid-template-rows:repeat(3,minmax(0,1fr));gap:9px}.prize-card{display:flex;align-items:center;border-radius:18px}.prize-art{width:29%;height:100%;flex-shrink:0;overflow:hidden}.prize-art>svg{width:clamp(42px,7dvh,66px);height:clamp(42px,7dvh,66px)}.prize-halo{width:85px;height:85px}.prize-spark.one{left:13%;top:15%;font-size:12px}.prize-spark.two{right:9%;bottom:12%;font-size:17px}.prize-copy{padding:8px 12px 8px 2px}.prize-rank{font-size:9px;padding:3px 7px}.prize-rank svg{width:11px;height:11px}.prize-label{display:none}.prize-copy h2{font-size:clamp(22px,3.5dvh,29px);margin:7px 0 5px}.prize-copy h3{font-size:10px}.prize-description{font-size:10px;margin-top:5px;line-height:1.5}.prizes-footer{flex-shrink:0;flex-direction:column;gap:6px;margin-top:10px}.prizes-footer>p{font-size:9px}.prizes-footer .primary-button{width:100%;min-width:0}}
@media(max-height:650px) and (max-width:760px){.prize-description{display:none}.prize-copy h2{margin:5px 0;font-size:23px}.prizes-footer>p{display:none}.prize-halo{width:65px;height:65px}.prizes-screen .prizes-intro{margin-bottom:6px}}
@media(max-height:500px) and (min-width:600px){.prizes-grid{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:1fr}.prize-card{flex-direction:column;justify-content:center}.prize-art{height:58px;width:100%;}.prize-art>svg{height:44px;width:44px}.prize-copy{padding:8px;text-align:center}.prize-copy h2{font-size:22px;margin:5px 0}.prize-description{display:none}.prizes-footer{margin-top:6px}.prizes-footer>p{display:none}}
@media(min-width:761px) and (min-height:501px){
 .app-shell:has(.prizes-screen){height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding-bottom:0}
 .app-shell:has(.prizes-screen) .brand-header{flex-shrink:0}
 .app-shell:has(.prizes-screen) .main-content{flex:1;min-height:0}
 .app-shell .prizes-screen{height:100%;display:flex;flex-direction:column;padding:8px 36px}
 .prizes-screen>h1{font-size:clamp(38px,7dvh,72px);margin:8px 0}
 .prizes-intro{margin-bottom:12px}.prizes-grid{flex:1;min-height:0}
 .prize-card{display:flex;flex-direction:column}.prize-art{flex:1;min-height:50px;height:auto;max-height:190px}
 .prize-art>svg{width:clamp(46px,11dvh,100px);height:clamp(46px,11dvh,100px)}
 .prize-copy{padding:0 20px 16px}.prize-copy h2{font-size:clamp(25px,4dvh,33px);margin-bottom:8px}.prize-label{margin:10px 0 7px}
 .prizes-footer{margin-top:12px}.prizes-footer .primary-button{min-height:46px}
 .app-shell:has(.prizes-screen) .bottom-nav{position:relative;left:auto;bottom:auto;transform:none;flex-shrink:0;margin:10px auto 12px}
}
</style>
