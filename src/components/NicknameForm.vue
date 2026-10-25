<script setup>
import {ref,watch,useId} from 'vue'
import {ArrowRight,Check} from '@lucide/vue'
import {saveNickname} from '../lib/community.js'
import AvatarPicker from './AvatarPicker.vue'
import {nickname} from '../lib/nickname.js'
const props=defineProps({initial:{type:String,default:''},onboarding:Boolean,initialAvatar:{type:String,default:''}}),emit=defineEmits(['saved'])
const id=useId(),avatar=ref(props.initialAvatar),name=ref(props.initial),busy=ref(false),error=ref(''),saved=ref(false)
watch(()=>props.initial,value=>{name.value=value})
watch(()=>props.initialAvatar,value=>{avatar.value=value})
async function submit(){
 if(busy.value)return
 error.value='';saved.value=false
 try{const valid=nickname(name.value);if(!avatar.value)throw Object.assign(Error('Choisissez votre avatar de Noël.'),{status:400});busy.value=true;const value=await saveNickname(valid.name,avatar.value);name.value=value.name;saved.value=true;emit('saved',value)}
 catch(cause){error.value=cause.status?cause.message:'Connexion impossible. Vérifiez votre réseau puis réessayez.'}
 finally{busy.value=false}
}
</script>
<template>
 <form class="nickname-form" @submit.prevent="submit" :aria-busy="busy">
  <label :for="id">Votre pseudo <span>obligatoire</span></label>
  <input :id="id" v-model="name" required minlength="2" maxlength="24" autocomplete="nickname" autocapitalize="off" :spellcheck="false" placeholder="Votre nom de scène" :disabled="busy" :aria-invalid="!!error" :aria-describedby="id+'-hint '+id+'-error'" @input="error='';saved=false">
  <p :id="id+'-hint'" class="nickname-hint">2 à 24 caractères. Un pseudo unique pour vous retrouver au classement.</p>
  <AvatarPicker v-model="avatar" :disabled="busy"/>
  <p :id="id+'-error'" class="error-message" role="alert">{{error}}</p>
  <button :class="onboarding?'primary-button':'secondary-button'" type="submit" :disabled="busy">{{busy?'Vérification…':onboarding?'Entrer en scène':saved?'Enregistré':'Enregistrer'}}<ArrowRight v-if="onboarding" :size="20"/><Check v-else :size="18"/></button>
  <p v-if="saved&&!onboarding" class="nickname-success" role="status">Votre pseudo est enregistré.</p>
 </form>
</template>
<style>
.nickname-form{text-align:left;width:100%;max-width:430px;margin:24px auto 0}.nickname-form label{display:flex;align-items:center;justify-content:space-between;color:#f7e2b6;font-size:15px;margin-bottom:10px}.nickname-form label span{font-size:11px;color:#b8c9d9}.nickname-form input{width:100%;min-height:54px;border:1px solid #7890aa;background:#071426;color:#fff5e6;padding:14px 16px;border-radius:13px;font:inherit;font-size:16px}.nickname-form input:focus-visible{outline:2px solid #f1d398;outline-offset:3px}.nickname-hint{font-size:12px;color:#b8c9d9;line-height:1.6;margin:10px 0}.nickname-form .error-message:empty{display:none}.nickname-form .primary-button{width:100%;margin-top:18px}.nickname-success{color:#a8e3d1;font-size:13px}
</style>
