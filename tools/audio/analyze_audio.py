"""Measure timing in seconds against the decoded source audio."""
import hashlib
import json
from pathlib import Path
import sys
import librosa
import numpy as np

src = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve()
y, sr = librosa.load(src, sr=22050, mono=True)
hop = 512
strength = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, frames = librosa.beat.beat_track(onset_envelope=strength, sr=sr, hop_length=hop, trim=False)
beats = librosa.frames_to_time(frames, sr=sr, hop_length=hop)
onset_frames = librosa.onset.onset_detect(onset_envelope=strength, sr=sr, hop_length=hop)
onsets = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop)
report = {
    'source': str(src), 'source_sha256': hashlib.sha256(src.read_bytes()).hexdigest(),
    'duration_seconds': round(len(y) / sr, 6), 'estimated_bpm': round(float(np.asarray(tempo).reshape(-1)[0]), 3),
    'beat_times_seconds': [round(float(x), 6) for x in beats],
    'onset_times_seconds': [round(float(x), 6) for x in onsets],
    'onset_strengths': [round(float(strength[int(x)]), 6) for x in onset_frames],
    'method': 'librosa onset_strength, onset_detect and beat_track; automatically estimated, not manually verified.'
}
out.write_text(json.dumps(report, indent=2))
print(json.dumps({k:v for k,v in report.items() if not isinstance(v,list)},ensure_ascii=False))
print('beats:',len(beats),'onsets:',len(onsets),flush=True)
