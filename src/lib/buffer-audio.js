// One decoded buffer per round. No Blob URL or HTMLMediaElement seeking: Safari
// can incorrectly reduce a Blob MP3's duration to zero after play/pause/seek.
export class BufferAudio extends EventTarget {
 constructor(context,buffer){
  super();this.context=context;this.buffer=buffer;this.gain=context.createGain();this.gain.connect(context.destination)
  this.offset=0;this.started=0;this.source=null;this.version=0;this.closed=false;this._muted=false;this._volume=1;this.ended=false
  this.onState=()=>{this.dispatchEvent(new Event('statechange'));if(!this.paused&&context.state!=='running')this.dispatchEvent(new Event('interrupted'))}
  context.addEventListener('statechange',this.onState)
 }
 get duration(){return this.buffer?.duration||0}
 get paused(){return !this.source}
 get currentTime(){return Math.min(this.duration,this.offset+(this.source?Math.max(0,this.context.currentTime-this.started):0))}
 set currentTime(value){this.pause();this.offset=Math.min(this.duration,Math.max(0,value));this.ended=false}
 get muted(){return this._muted}
 set muted(value){this._muted=!!value;this.updateGain()}
 get volume(){return this._volume}
 set volume(value){this._volume=Math.min(1,Math.max(0,value));this.updateGain()}
 updateGain(){this.gain.gain.value=this._muted?0:this._volume}
 async unlock(){if(this.closed)throw Error('audio-closed');await this.context.resume()}
 async play(){
  if(this.closed)throw Error('audio-closed');if(this.source)return
  const ticket=++this.version;await this.unlock()
  if(this.closed||ticket!==this.version)return
  const source=this.context.createBufferSource();source.buffer=this.buffer;source.connect(this.gain)
  source.onended=()=>{if(this.source!==source||ticket!==this.version)return;this.source=null;this.offset=this.duration;this.ended=true;source.disconnect();this.dispatchEvent(new Event('ended'))}
  this.started=this.context.currentTime;this.source=source;this.ended=false
  source.start(0,this.offset);this.dispatchEvent(new Event('playing'))
 }
 pause(){
  this.version++;if(!this.source)return
  this.offset=this.currentTime;const source=this.source;this.source=null;source.onended=null;source.stop();source.disconnect();this.dispatchEvent(new Event('pause'))
 }
 async dispose(){if(this.closed)return;this.pause();this.closed=true;this.context.removeEventListener('statechange',this.onState);this.gain.disconnect();this.buffer=null;await this.context.close()}
}
export async function decodeGameAudio(bytes,AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext){
 const context=new AudioContextClass()
 try {const buffer=await context.decodeAudioData(bytes);return new BufferAudio(context,buffer)}
 catch(error){await context.close();throw error}
}
