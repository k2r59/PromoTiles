<script setup>
import {ref,watch,nextTick} from 'vue'
import {Check,X,UserRound} from '@lucide/vue'
import {avatars,avatarFor} from '../lib/avatars.js'
const props=defineProps({modelValue:{type:String,default:''},disabled:Boolean}),emit=defineEmits(['update:modelValue'])
const opened=ref(false),dialog=ref(null),trigger=ref(null)
watch(opened,async value=>{await nextTick();if(value)dialog.value?.showModal();else{dialog.value?.close();trigger.value?.focus()}})
function select(id){emit('update:modelValue',id);opened.value=false}
</script>
<template>
 <button ref="trigger" type="button" class="avatar-choice" :disabled="disabled" @click="opened=true" aria-haspopup="dialog">
  <img v-if="avatarFor(modelValue)" :src="avatarFor(modelValue).src" alt="" width="52" height="52"><span v-else class="avatar-empty"><UserRound :size="26"/></span>
  <span><strong>{{modelValue?'Votre avatar de Noël':'Choisir mon avatar'}}</strong><small>{{avatarFor(modelValue)?.label||'20 portraits, à vous de choisir'}}</small></span><span class="avatar-edit">{{modelValue?'Modifier':'Choisir'}}</span>
 </button>
 <dialog ref="dialog" class="avatar-dialog" aria-labelledby="avatar-title" @cancel.prevent="opened=false" @click="event=>{if(event.target===dialog)opened=false}">
  <div class="avatar-dialog-header"><div><p class="eyebrow">VOTRE TOUCHE DE NOËL</p><h2 id="avatar-title">Un visage à votre image.</h2></div><button type="button" class="icon-button" aria-label="Fermer le choix d’avatar" @click="opened=false"><X :size="20"/></button></div>
  <div class="avatar-grid" role="group" aria-label="20 avatars de Noël"><button v-for="avatar in avatars" :key="avatar.id" type="button" :aria-label="avatar.label" :aria-pressed="modelValue===avatar.id" :title="avatar.label" @click="select(avatar.id)"><img :src="avatar.src" alt="" width="80" height="80" loading="lazy"><Check v-if="modelValue===avatar.id" :size="16"/></button></div>
  <p class="nickname-hint">Vous pourrez en changer à tout moment dans votre profil.</p>
 </dialog>
</template>
<style>
.avatar-choice{display:flex;align-items:center;gap:12px;width:100%;padding:10px;margin:14px 0;border:1px solid #c5ac7866;border-radius:14px;background:#0b2237;text-align:left}.avatar-choice img,.avatar-empty{width:52px;height:52px;border-radius:50%;object-fit:cover;border:1px solid #e9cf9b}.avatar-empty{display:grid;place-items:center;color:#e9cf9b}.avatar-choice>span:nth-child(2){display:flex;flex:1;min-width:0;flex-direction:column;gap:5px}.avatar-choice strong{font-size:13px;color:#f8edda}.avatar-choice small{font-size:10px;color:#b8c9d9}.avatar-edit{color:#f1d398;font-size:11px}.avatar-dialog{color:#f5f2eb;width:min(480px,calc(100% - 24px));max-height:calc(100dvh - 32px);padding:22px;border:1px solid #e6c78f;border-radius:24px;background:linear-gradient(140deg,#16334a,#071426);box-shadow:0 20px 80px #0008;overflow:auto}.avatar-dialog::backdrop{background:#010c1de6}.avatar-dialog-header{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:20px}.avatar-dialog-header h2{font:500 30px var(--serif);line-height:1.05;margin:10px 0 0}.avatar-dialog-header .eyebrow{font-size:8px;letter-spacing:2px}.avatar-dialog-header .icon-button{flex-shrink:0}.avatar-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.avatar-grid button{position:relative;aspect-ratio:1;padding:0;background:#071426;border:2px solid #a8c2d744;border-radius:50%;overflow:hidden;min-height:44px}.avatar-grid img{width:100%;height:100%;display:block;object-fit:cover}.avatar-grid button[aria-pressed=true]{border-color:#ffe3a1;box-shadow:0 0 0 2px #f2d39855}.avatar-grid svg{position:absolute;bottom:0;right:0;background:#f1d398;color:#071426;border-radius:50%;padding:2px;width:21px;height:21px}.avatar-dialog>.nickname-hint{text-align:center;margin:18px 0 0}@media(max-height:620px){.avatar-choice{margin:10px 0;padding:7px}.avatar-choice img,.avatar-empty{width:44px;height:44px}.avatar-dialog{padding:16px}.avatar-dialog-header{margin-bottom:14px}.avatar-dialog-header h2{font-size:26px}.avatar-grid{gap:8px}}
</style>
