"""Build provisional four-lane rhythm charts from a local audio2score MIDI.

These are automatically arranged game charts, not an authoritative melody
transcription. Timing is in seconds against the untrimmed source audio.
"""
from bisect import bisect_left
from collections import Counter
import json
from pathlib import Path
import shutil
import sys
import zipfile

import numpy as np
import pretty_midi

ROOT = Path(sys.argv[1]).resolve()
OUT = ROOT / 'exports'
OUT.mkdir(parents=True, exist_ok=True)
timing = json.loads((ROOT / 'analysis/timing.json').read_text())
source = pretty_midi.PrettyMIDI(str(ROOT / 'source/song.mid'))
raw = sorted([n for instrument in source.instruments if not instrument.is_drum for n in instrument.notes], key=lambda n: n.start)
duration = timing['duration_seconds']
beat = 60 / timing['estimated_bpm']

# Keep prominent mid/high-register notes. This reduces, but cannot eliminate,
# accompaniment and octave artifacts in the automatic transcription.
filtered = [n for n in raw if 48 <= n.pitch <= 88 and n.velocity >= 40 and n.end - n.start >= .12]
groups = []
for note in filtered:
    if not groups or note.start - groups[-1][0].start > .045:
        groups.append([note])
    else:
        groups[-1].append(note)

def salience(n):
    return n.velocity + 10 * min(float(n.end - n.start), .8) + (8 if 60 <= n.pitch <= 81 else 0)

candidates = [{'time': float(g[0].start), 'notes': sorted(g, key=salience, reverse=True)} for g in groups]

def select_spaced(items, min_gap):
    # Strong events win. Subsequent reductions preserve a shared event subset.
    selected, starts = [], []
    for event in sorted(items, key=lambda e: (-salience(e['notes'][0]), e['time'])):
        t = event['time']
        i = bisect_left(starts, t)
        if (i and t - starts[i - 1] < min_gap) or (i < len(starts) and starts[i] - t < min_gap):
            continue
        starts.insert(i, t)
        selected.insert(i, event)
    return selected

hard = select_spaced(candidates, max(.16, beat * .44))
normal = select_spaced(hard, max(.30, beat * .82))
easy = select_spaced(normal, max(.58, beat * 1.6))
bounds = np.quantile([e['notes'][0].pitch for e in hard], [.25, .5, .75])

def lane_for(pitch):
    return int(np.searchsorted(bounds, pitch, side='right'))

settings = [
    ('facile', easy, 1.0, 1500, None, 2.5),
    ('normal', normal, 1.5, 2250, .65, 2.0),
    ('difficile', hard, 2.0, 3000, .5, 1.6),
]
summary = []
for mode, events, coefficient, ceiling, hold_min, approach in settings:
    arranged = []
    last_chord = -100.0
    for event in events:
        main = event['notes'][0]
        chosen = [(main, lane_for(main.pitch))]
        if mode == 'difficile' and event['time'] - last_chord >= beat * 4:
            for other in event['notes'][1:]:
                lane = lane_for(other.pitch)
                if other.velocity >= 55 and other.pitch % 12 != main.pitch % 12 and lane != chosen[0][1]:
                    chosen.append((other, lane))
                    last_chord = event['time']
                    break
        for note, lane in chosen:
            length = float(note.end - note.start)
            hold = min(length, 1.4 if mode == 'difficile' else 1.0) if hold_min is not None and length >= hold_min else 0.0
            arranged.append({'timeSeconds': round(event['time'], 6), 'durationSeconds': round(hold, 6), 'lane': lane, 'midiPitch': int(note.pitch), 'velocity': int(note.velocity), '_musicalDuration': min(length, 1.4)})

    arranged.sort(key=lambda n: (n['timeSeconds'], n['lane']))
    # A lane cannot be struck while its previous hold is still active.
    for lane in range(4):
        lane_notes = [n for n in arranged if n['lane'] == lane]
        for current, following in zip(lane_notes, lane_notes[1:]):
            current['durationSeconds'] = max(0, min(current['durationSeconds'], following['timeSeconds'] - current['timeSeconds'] - .08))
    # Enforce a maximum of two active fingers, including sustained notes.
    for t in sorted(set(n['timeSeconds'] for n in arranged)):
        new = [n for n in arranged if n['timeSeconds'] == t]
        active = [n for n in arranged if n['timeSeconds'] < t < n['timeSeconds'] + n['durationSeconds']]
        active.sort(key=lambda n: n['timeSeconds'] + n['durationSeconds'])
        while len(active) + len(new) > 2:
            previous = active.pop(0)
            previous['durationSeconds'] = max(0, t - previous['timeSeconds'] - .08)

    midi = pretty_midi.PrettyMIDI(initial_tempo=timing['estimated_bpm'])
    instrument = pretty_midi.Instrument(program=0, name=f'Promodev - {mode}')
    for i, note in enumerate(arranged):
        if note['durationSeconds'] < .30:
            note['durationSeconds'] = 0.0
        note['durationSeconds'] = round(note['durationSeconds'], 6)
        note['type'] = 'hold' if note['durationSeconds'] else 'tap'
        note['id'] = f'{mode}-{i+1:04d}'
        musical_duration = note.pop('_musicalDuration')
        midi_end = min(note['timeSeconds'] + max(.1, note['durationSeconds'] or min(musical_duration, .45)), duration)
        instrument.notes.append(pretty_midi.Note(note['velocity'], note['midiPitch'], note['timeSeconds'], midi_end))
    midi.instruments.append(instrument)
    filename = f'dans-les-yeux-emilie.{mode}'
    midi.write(str(OUT / (filename + '.mid')))
    chart = {
        'schemaVersion': 1, 'status': 'automatically-generated-awaiting-playtest',
        'songId': 'joe-dassin-dans-les-yeux-emilie', 'title': "Dans les yeux d’Émilie", 'artist': 'Joe Dassin',
        'audioFile': 'audio.mp3', 'audioSha256': timing['source_sha256'],
        'durationSeconds': duration, 'estimatedBpm': timing['estimated_bpm'],
        'mode': mode, 'laneCount': 4, 'laneIndexing': '0=left, 3=right',
        'timingReference': 'Seconds from start of decoded, untrimmed audio.mp3; never use the MCP beat-position JSON as seconds.',
        'countInSeconds': 3, 'approachTimeSeconds': approach,
        'songDifficulty': {'rating': 3, 'outOf': 5, 'coefficient': 1.5, 'status': 'provisional-needs-playtest'},
        'scoring': {'status': 'implemented-local-provisional-balance', 'modeCoefficient': coefficient, 'maxPoints': ceiling, 'formula': 'round(performanceNormalized0To1000 * songCoefficient * modeCoefficient)'},
        'notes': arranged,
    }
    (OUT / (filename + '.json')).write_text(json.dumps(chart, ensure_ascii=False, indent=2) + '\n')
    summary.append({'mode': mode, 'notes': len(arranged), 'holds': sum(n['type']=='hold' for n in arranged), 'doubleHits': sum(c==2 for c in Counter(n['timeSeconds'] for n in arranged).values()), 'laneCounts': dict(Counter(n['lane'] for n in arranged)), 'maxPointsProvisional': ceiling})

# Independent output checks: valid timing, ergonomics, preserved MIDI timing.
for mode, *_ in settings:
    stem = f'dans-les-yeux-emilie.{mode}'
    data = json.loads((OUT / (stem + '.json')).read_text())
    notes = data['notes']
    assert len({n['id'] for n in notes}) == len(notes)
    assert all(0 <= n['timeSeconds'] < duration and n['timeSeconds'] + n['durationSeconds'] <= duration and 0 <= n['lane'] < 4 for n in notes)
    for lane in range(4):
        lane_notes = [n for n in notes if n['lane'] == lane]
        assert all(a['timeSeconds'] + a['durationSeconds'] < b['timeSeconds'] for a,b in zip(lane_notes,lane_notes[1:]))
    for t in {n['timeSeconds'] for n in notes}:
        assert sum(n['timeSeconds']==t or n['timeSeconds'] < t < n['timeSeconds']+n['durationSeconds'] for n in notes) <= 2
    reopened = pretty_midi.PrettyMIDI(str(OUT / (stem + '.mid')))
    back = sorted(reopened.instruments[0].notes, key=lambda n:(n.start,n.pitch))
    original = sorted(notes,key=lambda n:(n['timeSeconds'],n['midiPitch']))
    assert len(back)==len(original)
    assert all(abs(a.start-b['timeSeconds']) < .003 and a.pitch==b['midiPitch'] for a,b in zip(back,original))
assert summary[0]['notes'] < summary[1]['notes'] < summary[2]['notes']
shutil.copy2(ROOT / 'source/song.mid', OUT / 'dans-les-yeux-emilie.transcription-brute.mid')
shutil.copy2(ROOT / 'source/song.mp3', OUT / 'audio.mp3')
manifest = {'title': "Dans les yeux d’Émilie", 'artist': 'Joe Dassin', 'source': 'MP3 fourni par l’utilisateur', 'referenceUrl':'https://www.youtube.com/watch?v=ZJJCs-Y--_s', 'audioSha256':timing['source_sha256'], 'durationSeconds':duration, 'estimatedBpm':timing['estimated_bpm'], 'rawTranscribedNotes':len(raw), 'modes':summary, 'validation':'Timing, lane conflicts, maximum two active fingers, MIDI round-trip and progressive density checked.', 'limitations':['Transcription automatique du mix complet, sans séparation voix/instruments.', 'Partitions adaptées automatiquement ; mélodie et synchronisation à valider à l’écoute et en jeu.', 'Difficulté intrinsèque et coefficients de score provisoires.', 'PWA locale jouable ; qualité musicale et équilibre à valider sur téléphone.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
archive=ROOT/'dans-les-yeux-emilie-pack.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for file in sorted(OUT.iterdir()):
        z.write(file, file.name)
print(json.dumps(manifest,ensure_ascii=False,indent=2))
print('Archive:',archive)
