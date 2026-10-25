export function judgementFeedback(event){
 if(!event||event.type==='ignored')return null
 if(event.type==='perfect')return {text:'Parfait !',detail:event.hold?'Maintenez la touche':'Pile dans le rythme',tone:'perfect'}
 if(event.type==='good')return {text:'Bien !',detail:event.hold?'Maintenez la touche':'Continuez comme ça',tone:'good'}
 if(event.type==='hold-complete')return {text:'Maintien réussi !',detail:'Jusqu’au bout',tone:'perfect'}
 if(event.type==='early-release')return {text:'Relâché trop tôt',detail:'Gardez la touche appuyée',tone:'error'}
 if(event.type==='miss')return {text:'Raté !',detail:'La note a dépassé la ligne',tone:'error'}
 if(event.type==='wrong')return {
  text:event.reason==='early'?'Trop tôt':event.reason==='late'?'Trop tard':'Mauvaise touche',
  detail:event.reason==='early'?'Attendez la ligne dorée':event.reason==='late'?'Touchez au passage sur la ligne':'Suivez la piste de la note',tone:'error'
 }
 return null
}
