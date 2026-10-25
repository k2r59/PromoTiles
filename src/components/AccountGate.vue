<script setup>
import {ref,onUnmounted} from 'vue'
import {Mail,ArrowRight,ArrowLeft,ShieldCheck,Music2} from '@lucide/vue'
import {requestCode,verifyCode,loadIdentity} from '../lib/community.js'
import NicknameForm from './NicknameForm.vue'
const props=defineProps({account:Object,loading:Boolean,loadError:String}),emit=defineEmits(['authenticated','retry'])
const email=ref(''),code=ref(''),challenge=ref(''),busy=ref(false),error=ref(''),remaining=ref(0)
let timer
function countdown(){remaining.value=60;clearInterval(timer);timer=setInterval(()=>{remaining.value--;if(remaining.value<=0)clearInterval(timer)},1000)}
async function send(){
 if(busy.value||remaining.value>0)return
 busy.value=true;error.value=''
 try{const result=await requestCode(email.value);challenge.value=result.challenge;code.value='';countdown()}
 catch(cause){error.value=cause.status?cause.message:'Vérifiez votre connexion puis réessayez.'}
 finally{busy.value=false}
}
async function verify(){
 if(busy.value)return
 busy.value=true;error.value=''
 try{await verifyCode(challenge.value,code.value.trim());const value=await loadIdentity();if(!value)throw Error('session');emit('authenticated',value)}
 catch(cause){error.value=cause.status?cause.message:'Connexion impossible. Réessayez.'}
 finally{busy.value=false}
}
function changeEmail(){challenge.value='';error.value='';code.value='';remaining.value=0;clearInterval(timer)}
onUnmounted(()=>clearInterval(timer))
</script>
<template>
 <section class="account-gate page-enter" aria-labelledby="account-title">
  <div class="account-emblem"><Music2 :size="32"/></div>
  <p class="eyebrow">LE CHALLENGE DE NOËL</p>
  <h1 id="account-title" tabindex="-1">{{account?'Votre nom de':'La magie vous'}}<br><em>{{account?'scène.':'attend.'}}</em></h1>
  <p v-if="loading" class="gate-description" role="status">Ouverture de votre espace…</p>
  <template v-else-if="loadError"><p class="error-message" role="alert">{{loadError}}</p><button class="secondary-button" @click="emit('retry')">Réessayer</button></template>
  <template v-else-if="account">
   <p class="gate-description">Choisissez votre pseudo pour rejoindre la scène<br>et retrouver vos scores.</p>
   <NicknameForm :initial-avatar="account.avatar" onboarding :initial="account.name?.startsWith('Joueur ')?'':account.name" @saved="emit('authenticated',$event)"/>
  </template>
  <template v-else>
   <p class="gate-description">Votre équipe. Votre musique. Votre moment.</p>
   <form v-if="!challenge" class="login-form" @submit.prevent="send" :aria-busy="busy">
    <label for="login-email">Votre adresse professionnelle</label>
    <div class="login-field"><Mail :size="20"/><input id="login-email" v-model="email" type="email" required maxlength="254" autocomplete="email" autocapitalize="off" :spellcheck="false" placeholder="prenom@promo.dev" :disabled="busy" aria-describedby="login-help login-error"></div>
    <p id="login-help" class="nickname-hint">Réservé à l’équipe @promo.dev. Recevez un code par e-mail, sans mot de passe.</p>
    <button type="submit" class="primary-button" :disabled="busy">{{busy?'Envoi en cours…':'Recevoir mon code'}}<ArrowRight :size="20"/></button>
   </form>
   <form v-else class="login-form" @submit.prevent="verify" :aria-busy="busy">
    <label for="login-code">Votre code de connexion</label>
    <p class="nickname-hint">Envoyé à {{email.trim().toLowerCase()}} · valable 10 minutes.</p>
    <input class="code-input" id="login-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9]{6}" minlength="6" maxlength="6" placeholder="000000" :disabled="busy" aria-describedby="login-error">
    <button type="submit" class="primary-button" :disabled="busy">{{busy?'Connexion…':'Rejoindre la scène'}}<ArrowRight :size="20"/></button>
    <div class="code-actions"><button type="button" class="text-button" :disabled="busy" @click="changeEmail"><ArrowLeft :size="15"/> Modifier l’e-mail</button><button type="button" class="text-button" :disabled="busy||remaining>0" @click="send">{{remaining>0?'Renvoyer dans '+remaining+' s':'Renvoyer le code'}}</button></div>
   </form>
   <p id="login-error" class="error-message" role="alert">{{error}}</p>
   <p class="gate-trust"><ShieldCheck :size="16"/> Un espace privé pour notre équipe.</p>
  </template>
 </section>
</template>
<style>
.view-account{display:flex;align-items:center;justify-content:center;overflow:auto}.account-gate{position:relative;width:min(100%,560px);text-align:center;padding:24px 36px 28px;background:linear-gradient(150deg,#081a2deb,#071426ee);border:1px solid #e6c78f66;border-radius:28px;box-shadow:0 20px 70px #0005;margin:auto}.account-emblem{margin:0 auto 16px;display:grid;place-items:center;width:64px;height:64px;border:1px solid #e6c78f88;border-radius:50%;color:#f1d398;background:#152a3b}.account-gate h1{font-family:var(--serif);font-weight:500;font-size:clamp(42px,6vw,68px);line-height:.95;margin:20px 0}.account-gate h1 em{color:#f1d398;font-weight:400}.gate-description{font-size:14px;line-height:1.7;color:#c2d2e1}.login-form{text-align:left;max-width:430px;margin:26px auto 0}.login-form label{font-size:14px;color:#f7e2b6;display:block;margin-bottom:10px}.login-field{display:flex;align-items:center;gap:12px;background:#071426;border:1px solid #7890aa;border-radius:13px;padding:0 16px;color:#c2d2e1}.login-field:focus-within{outline:2px solid #f1d398;outline-offset:3px}.login-field input{min-width:0;width:100%;background:transparent;border:0;outline:0;padding:16px 0;color:#fff5e6;font:inherit;font-size:16px}.login-form .primary-button{width:100%;margin-top:20px}.code-input{width:100%;min-height:60px;color:#fff5e6;background:#071426;border:1px solid #7890aa;border-radius:13px;font-size:28px;letter-spacing:10px;text-align:center;padding:10px}.code-actions{display:flex;justify-content:space-between;gap:12px;margin-top:12px}.code-actions .text-button{font-size:12px}.gate-trust{font-size:11px;color:#b8c9d9;display:flex;justify-content:center;align-items:center;gap:7px;margin:24px 0 0}.account-gate>.error-message:empty{display:none}@media(max-width:760px){.account-gate{padding:20px;max-width:440px;border-radius:22px}.account-emblem{width:48px;height:48px;margin-bottom:12px}.account-gate h1{font-family:var(--serif);font-weight:500;font-size:48px;margin:16px 0}.account-gate .eyebrow{font-size:9px;justify-content:center}.gate-description{font-size:13px}.login-form{margin-top:20px}}@media(max-height:700px){.account-gate{padding:16px 20px}.account-emblem{display:none}.account-gate h1{font-family:var(--serif);font-weight:500;font-size:40px;margin:12px 0}.gate-trust{margin-top:14px}.account-gate .primary-button{min-height:48px}.login-form,.nickname-form{margin-top:16px}}
</style>
