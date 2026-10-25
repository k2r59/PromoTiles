// Native media looping uses little CPU and avoids decoding a full song in JS memory.
export class AmbientMusic {
 constructor(audio,{window:win=window,document:doc=document}={}){
  this.audio=audio;this.win=win;this.doc=doc;this.active=false;this.unlocked=false;this.pending=false;this.disposed=false;this.revision=0;this.pageHidden=false
  audio.loop=true;audio.preload='none'
  this.gesture=()=>{this.unlocked=true;this.sync()}
  this.visibility=()=>this.sync()
  this.hide=()=>{this.pageHidden=true;this.sync()}
  this.show=()=>{this.pageHidden=false;this.sync()}
  win.addEventListener('click',this.gesture);win.addEventListener('keydown',this.gesture)
  win.addEventListener('pagehide',this.hide);win.addEventListener('pageshow',this.show)
  doc.addEventListener('visibilitychange',this.visibility)
 }
 get allowed(){return !this.disposed&&this.active&&this.unlocked&&!this.doc.hidden&&!this.pageHidden}
 setActive(value){if(this.active!==value){this.active=value;this.revision++}this.sync()}
 sync(){
  if(!this.allowed){this.audio.pause();return}
  if(this.pending||!this.audio.paused)return
  const revision=this.revision;this.pending=true
  // play() runs synchronously inside the first user gesture for Safari's audio policy.
  try{Promise.resolve(this.audio.play()).catch(()=>{}).finally(()=>{
   this.pending=false
   if(!this.allowed)this.audio.pause()
   else if(revision!==this.revision)this.sync()
  })}catch{this.pending=false}
 }
 dispose(){
  this.disposed=true;this.audio.pause()
  this.win.removeEventListener('click',this.gesture);this.win.removeEventListener('keydown',this.gesture)
  this.win.removeEventListener('pagehide',this.hide);this.win.removeEventListener('pageshow',this.show)
  this.doc.removeEventListener('visibilitychange',this.visibility)
 }
}
