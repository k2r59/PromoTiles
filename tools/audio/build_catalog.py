"""Build 50 real recordings + onset-based rhythm charts (numpy/scipy + ffmpeg).
Run with artifacts/catalog/venv/bin/python tools/audio/build_catalog.py [--limit N].
Original downloads: artifacts/catalog/originals; provenance: audio/catalog/sources.json.
Charts are rhythm arrangements, not a claimed note-perfect transcription of the mix.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import json, subprocess, hashlib, re, argparse
from concurrent.futures import ThreadPoolExecutor
from chart_gestures import balance_gestures
from tempo_grid import fit_grid
import numpy as np
from scipy import signal, ndimage
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/music/catalog'; OUT.mkdir(parents=True,exist_ok=True)
SR=22050; HOP=220; DT=HOP/SR; LEAD=1.25
GENRES={'6':'Dance','7':'Électro','8':'Funk','16':'Pop','26':'Hip-hop'}
ARCADE={'Voxel Revolution','Cyborg Ninja','Kawai Kitsune','Blip Stream','Level Up','Reformat','Pookatori and Friends'}
def decode(path):
 r=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True)
 return np.frombuffer(r.stdout,dtype=np.float32)
def features(y):
 _,times,z=signal.stft(y,SR,nperseg=2048,noverlap=2048-HOP,boundary='zeros')
 s=np.abs(z).astype(np.float32)
 harmonic=ndimage.median_filter(s,size=(1,21)); percussive=ndimage.median_filter(s,size=(17,1))
 harmonic=s*harmonic**2/(harmonic**2+percussive**2+1e-12)
 flux=np.maximum(0,np.diff(np.log1p(s*120),axis=1,prepend=0)).mean(axis=0)
 flux=ndimage.gaussian_filter1d(flux,1)
 peaks,_=signal.find_peaks(flux,distance=int(.12/DT),prominence=max(.002,np.percentile(flux,70)*.28))
 # Reconstruct pitch-class energy from harmonic bins; stable harmonic regions support holds.
 freqs=np.fft.rfftfreq(2048,1/SR)
 valid=np.flatnonzero((freqs>100)&(freqs<1600))
 pitches=np.rint(69+12*np.log2(freqs[valid]/440)).astype(int)
 chroma=np.zeros((12,len(times)),dtype=np.float32)
 for pc in range(12):chroma[pc]=harmonic[valid[pitches%12==pc]].sum(axis=0)
 chroma=ndimage.gaussian_filter1d(chroma,2,axis=1)
 # Harmonic spectral novelty distinguishes a sustained tone from repeated attacks.
 harmonic_flux=np.maximum(0,np.diff(harmonic,axis=1,prepend=harmonic[:,:1])).sum(axis=0)/(harmonic.sum(axis=0)+1e-9)
 harmonic_flux=ndimage.gaussian_filter1d(harmonic_flux,1)
 return times,flux,peaks,chroma,harmonic_flux

def build(source):
 slug=(source.get('prefix','')+'-' if source.get('prefix') else '')+re.sub('[^a-z0-9]+','-',source['title'].lower()).strip('-')
 dest=OUT/slug;dest.mkdir(exist_ok=True)
 src=ROOT/source['filePath'] if source.get('filePath') else ROOT/'artifacts/catalog/originals'/source['filename']
 y=decode(src); original_duration=len(y)/SR
 if not source.get('bpm'):
  _,_,z=signal.stft(y[:SR*90],SR,nperseg=1024,noverlap=804)
  onset=np.maximum(0,np.diff(np.abs(z),axis=1)).sum(axis=0);onset-=onset.mean()
  correlation=signal.fftconvolve(onset,onset[::-1],mode='full')[len(onset)-1:]
  lags=np.arange(round(60/175/DT),round(60/75/DT))
  prior=np.exp(-.5*(np.log2((60/(lags*DT))/115)/.65)**2)
  bpm=60/(float(lags[np.argmax(correlation[lags]*prior)])*DT)
 else:bpm=float(source['bpm'])
 beat=60/bpm
 # Choose a complete 32-bar passage with energy, avoiding long ambient intros.
 rms=np.sqrt(np.convolve(y[::220]**2,np.ones(100)/100,'same'))
 clip_length=min(128*beat,original_duration-2)
 starts=np.arange(0,max(.1,original_duration-clip_length-1),beat*4)
 scores=[np.mean(rms[int(t*100):int((t+clip_length)*100)]) for t in starts]
 best=max(scores); candidates=[t for t,score in zip(starts,scores) if score>=best*.93]
 start=float(candidates[0]);end=min(original_duration,start+clip_length)
 if 'excerptStart' in source:
  start=float(source['excerptStart']);end=min(original_duration,start+float(source['excerptDuration']))
 if source.get('energeticExcerpt'):
  # Begin eight beats before the label's preview/drop, on a four-beat boundary.
  # Preserve a continuous 90-second passage; never loop or speed up a recording.
  desired=max(0,float(source.get('officialPreviewSeconds',0))-8*beat)
  start=min((desired//(beat*4))*beat*4,max(0,original_duration-float(source.get('excerptDuration',90))-.5))
  end=min(original_duration,start+float(source.get('excerptDuration',90)))
 # Render no tempo change. A fixed silence gives a fair first note on every device.
 # Render normalized PCM before adding silence: avoids loudnorm/MP3 timestamp trimming.
 if not source.get('reuseAudio'):
  pcm=subprocess.run(['ffmpeg','-v','error','-ss',str(start),'-i',str(src),'-t',str(end-start),'-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ac','2','-ar','44100','-f','f32le','-'],capture_output=True,check=True).stdout
  music=np.frombuffer(pcm,dtype=np.float32).reshape(-1,2).copy()
  fade=min(len(music),int(.9*44100));music[-fade:]*=np.linspace(1,0,fade,dtype=np.float32)[:,None]
  attack=min(len(music),int(.035*44100));music[:attack]*=np.linspace(0,1,attack,dtype=np.float32)[:,None]
  padded=np.concatenate([np.zeros((round(LEAD*44100),2),dtype=np.float32),music])
  subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar','44100','-ac','2','-i','-','-c:a','libmp3lame','-b:a','160k',str(dest/'audio.mp3')],input=padded.tobytes(),check=True)
 audio=decode(dest/'audio.mp3');duration=len(audio)/SR
 times,flux,peaks,chroma,harmonic_flux=features(audio)
 peaks=peaks[(times[peaks]>LEAD+.08)&(times[peaks]<duration-.9)]
 # Fit beat phase/tempo against measured attacks near the composer's tempo.
 weights=flux[peaks]; peak_times=times[peaks]
 tempo_evidence=None
 if source.get('prefix')=='ncs':
  fitted,phase,tempo_evidence=fit_grid(peak_times,weights)
 else:
  fits=[]
  for candidate in np.linspace(bpm*.985,bpm*1.015,121):
   phases=np.exp(2j*np.pi*peak_times*candidate/60)
   score=np.sum(phases*weights)
   fits.append((abs(score),candidate,np.angle(score)))
  _,fitted,phase=max(fits)
 beat=60/fitted;offset=(phase/(2*np.pi)*beat)%beat
 energy=chroma.sum(axis=0); dominant=chroma.argmax(axis=0)
 dominant=ndimage.median_filter(dominant,size=9)
 sustained=[]
 # A held harmonic tone must remain present, even while percussion continues.
 for peak in peaks:
  t=times[peak]
  if t<LEAD+1 or t>duration-2:continue
  begin=min(len(times)-1,peak+int(.09/DT));pc=int(dominant[begin]);baseline=chroma[pc,begin]
  if baseline<np.percentile(energy,40)*.10:continue
  limit=min(len(times)-1,peak+int(1.85/DT))
  segment=chroma[pc,begin:limit]
  present=(segment>baseline*.40)&(segment/(energy[begin:limit]+1e-9)>.15)
  # Tolerate brief percussive masking, but not a disappearing sustained sound.
  stable=ndimage.uniform_filter1d(present.astype(float),size=9)>.65
  failures=np.flatnonzero(~stable)
  stop=begin+(int(failures[0]) if len(failures) else len(segment))
  repeated,_=signal.find_peaks(harmonic_flux[peak+int(.20/DT):stop],prominence=.08,height=.12,distance=int(.12/DT))
  if len(repeated):stop=peak+int(.20/DT)+int(repeated[0])-int(.03/DT)
  length=times[stop]-t
  if length>=.65:sustained.append((int(peak),min(1.7,length-.08),pc))
 hold_candidates=[];last=-10
 for peak,length,pc in sustained:
  if times[peak]-last>=3.2:hold_candidates.append((peak,length,pc));last=times[peak]
 # Every difficulty keeps these genuine sustained regions; length capped for beginners.
 rating=min(5,max(2,round((fitted-80)/30)+2));coefficient=1+(rating-1)*.25
 digest=hashlib.sha256((dest/'audio.mp3').read_bytes()).hexdigest()
 # Cluster repeating four-bar harmonic phrases. Repeated passages reuse the same lanes.
 phrase_beats=16;phrase_seconds=phrase_beats*beat
 phrase_count=max(1,int(np.ceil((duration-offset)/phrase_seconds)))
 fingerprints=[];phrase_groups=[]
 for phrase in range(phrase_count):
  positions=offset+phrase*phrase_seconds+np.arange(32)*beat/2
  frames=np.clip(np.rint(positions/DT).astype(int),0,len(times)-1)
  matrix=chroma[:,frames];matrix=matrix/(np.linalg.norm(matrix,axis=0,keepdims=True)+1e-9)
  vector=matrix.flatten();vector=vector/(np.linalg.norm(vector)+1e-9)
  match=next((i for i,fingerprint in enumerate(fingerprints) if np.dot(vector,fingerprint)>.91),None)
  if match is None:match=len(fingerprints);fingerprints.append(vector)
  phrase_groups.append(match)
 # Map the harmonic register to four stable lanes, refined by repeated phrase fingerprints.
 pitch_order=np.argsort(chroma.sum(axis=1))[::-1]
 pitch_lanes={int(pc):int(i%4) for i,pc in enumerate(pitch_order)}
 stats={}
 for mode,gap,approach,mult in [('facile',.46,2.7,1),('normal',.25,2.25,1.5),('difficile',.16,1.85,2)]:
  play_beat=beat*(2 if source.get('prefix')=='ncs' and fitted>=145 and mode!='difficile' else 1)
  gap=max(.13,play_beat*{'facile':.85,'normal':.43,'difficile':.27}[mode])
  hold_map={p:(min(length,1.15) if mode=='facile' else length,pc) for p,length,pc in hold_candidates}
  chosen=[]
  # Normal keeps strong quarter-note anchors and selected eighth-note answers.
  eligible=peaks
  if mode=='normal':
   eligible=np.array([p for p in peaks if p in hold_map or round((times[p]-offset)/play_beat*2)%8 in (0,1,2,4,6)],dtype=int)
  # Prioritize measured attacks near musical subdivisions and strong sounds, not elapsed-time spawning.
  def priority(p):
   phase=((times[p]-offset)/play_beat)%1
   accent=max(0,1-min(phase,1-phase)*5)
   return float(flux[p]*(1+accent*.5)+(10 if p in hold_map else 0))
  for p in sorted(eligible,key=priority,reverse=True):
   if all(abs(times[p]-times[q])>=gap for q in chosen):chosen.append(int(p))
  chosen.sort();notes=[];busy=[-10]*4
  for p in chosen:
   t=float(times[p]); index=round((t-offset)/beat*2)
   phrase=max(0,min(len(phrase_groups)-1,int((t-offset)/phrase_seconds)))
   pc=int(dominant[min(len(times)-1,p+int(.08/DT))])
   # The same harmonic note at the same place in a repeated phrase has the same gesture.
   lane=pitch_lanes[pc]
   # Alternate repeated percussive pulses to avoid one-finger hammering over a held bass.
   if notes and notes[-1]['lane']==lane and t-notes[-1]['timeSeconds']<beat*.75:
    lane=(lane+(1 if index%2 else 3))%4
   if mode=='difficile' and phrase_groups[phrase]%2:lane=3-lane
   available=[i for i in range(4) if busy[i]+.14<t]
   if not available:continue
   if lane not in available:lane=min(available,key=lambda i:abs(i-lane))
   length=hold_map.get(p,(0,0))[0]
   # At most one hold plus one tapping finger at any instant.
   if length and any(until>t for until in busy):length=0
   if length:busy[lane]=t+length
   notes.append(dict(id=f'{mode}-{len(notes):04d}',timeSeconds=round(t,6),durationSeconds=round(length,6),lane=lane,type='hold' if length else 'tap',sourceOnsetFrame=p))
  notes=balance_gestures(notes)
  maximum=round(1000*coefficient*mult)
  chart=dict(schemaVersion=1,songId=source.get('id','km-'+source['isrc'].lower()),title=source['title'],artist=source.get('artist','Kevin MacLeod'),mode=mode,
   audioFile='audio.mp3',audioSha256=digest,durationSeconds=round(duration,6),estimatedBpm=round(fitted,3),beatOffsetSeconds=round(offset,6),
   laneCount=4,approachTimeSeconds=approach,countInSeconds=3,status='audio-onset-rhythm-arrangement',
   timingReference='Decoded delivered MP3; detected spectral attacks (22050 Hz, 220-sample hop). Holds track sustained harmonic energy; not a transcription of each instrument.',
   songDifficulty=dict(rating=rating,outOf=5,coefficient=coefficient),scoring=dict(maxPoints=maximum,modeCoefficient=mult),notes=notes)
  (dest/f'{mode}.json').write_text(json.dumps(chart,ensure_ascii=False,separators=(',',':'))+'\n')
  stats[mode]=dict(notes=len(notes),holds=sum(n['type']=='hold' for n in notes),maxPoints=maximum)
 genre=source.get('genreLabel') or ('Arcade' if source['title'] in ARCADE else GENRES[source['genre']])
 item=dict(id=source.get('id','km-'+source['isrc'].lower()),title=source['title'],artist=source.get('artist','Kevin MacLeod'),genre=genre,
  audio=f'/music/catalog/{slug}/audio.mp3',chartRoot=f'/music/catalog/{slug}',duration=f'{int(duration)//60}:{int(duration)%60:02d}',durationSeconds=round(duration,3),previewAt=min(12,duration*.2),
  bpm=round(fitted),tempoEstimated=bool(tempo_evidence),difficulty=rating,coefficient=coefficient,modes=stats,description=f'{genre} · Version jeu',hint='Touches courtes sur les attaques, rubans dorés sur les sons tenus.',
  sourceUrl='https://incompetech.com/music/royalty-free/index.html?isrc='+source['isrc'],license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',
  credit=f"{source['title']} — Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0.",
  isrc=source['isrc'],excerptStartSeconds=round(start,6),originalDurationSeconds=round(original_duration,3),audioSha256=digest,
  changes='Extrait pour le jeu, fondus et silence initial. Arrangement des touches par PromoTiles.')
 (dest/'analysis.json').write_text(json.dumps(dict(sampleRate=SR,hop=HOP,tempoEvidence=tempo_evidence,phraseGroups=phrase_groups,holdMethod='continuous harmonic energy; end before significant harmonic reattack',onsets=[dict(frame=int(p),time=round(float(times[p]),6),strength=round(float(flux[p]),6)) for p in peaks],holds=[dict(frame=p,duration=round(d,6),pitchClass=pc) for p,d,pc in hold_candidates]),separators=(',',':'))+'\n')
 item['revision']=hashlib.sha256((''.join((dest/f'{m}.json').read_text() for m in ['facile','normal','difficile'])+digest).encode()).hexdigest()[:16]
 for key in ['sourceUrl','license','licenseUrl','credit','rightsStatus','cover']:
  if key in source:item[key]=source[key]
 if source.get('prefix')=='ncs':item.pop('isrc',None)
 print(source['title'],stats,flush=True)
 return item

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int,default=50);parser.add_argument('--workers',type=int,default=3);args=parser.parse_args()
 sources=json.loads((ROOT/'audio/catalog/sources.json').read_text())[:args.limit]
 with ThreadPoolExecutor(max_workers=args.workers) as pool:catalog=list(pool.map(build,sources))
 # Feature dance tracks first; all fifty remain available from the start.
 order=['Raving Energy', 'Funky Chunk', 'Voxel Revolution', 'Newer Wave', 'Digital Lemonade', 'Laserpack']
 catalog.sort(key=lambda s:order.index(s['title']) if s['title'] in order else len(order)+sources.index(next(x for x in sources if x['title']==s['title'])))
 target=ROOT/'src/data';target.mkdir(exist_ok=True)
 (target/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'public/music/credits.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 print('CATALOG READY',len(catalog),flush=True)
