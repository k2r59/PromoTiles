"""Reproducible 64-second piano demo. Requires mido, FluidSynth and ffmpeg.
Usage: python tools/audio/build_entertainer.py /path/to/GeneralUser-GS.sf2
The score and the rendered audio share this exact MIDI timeline.
"""
from pathlib import Path
from collections import defaultdict
import hashlib, json, subprocess, sys
import mido

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'audio/the-entertainer/source/entertainer.mid'
OUT = ROOT / 'public/music/the-entertainer'
WORK = ROOT / 'artifacts/audio-tools'
PPQ = 384
TEMPO = 833333  # 72 quarter notes/minute, as in the source
LEAD = 384  # one beat to settle in after the countdown
END = 36 * 768
CADENCE = 35 * 768
CUT_PICKUP = CADENCE + 480
SEC = TEMPO / 1e6 / PPQ
LANES = [1, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]


def read_notes(track):
    tick = 0
    active = {}
    result = []
    for event in track:
        tick += event.time
        if event.type == 'note_on' and event.velocity:
            active[(event.channel, event.note)] = tick
        elif event.type in ('note_off', 'note_on'):
            start = active.pop((event.channel, event.note), None)
            if start is not None and start < CUT_PICKUP:
                end = min(tick, END)
                # Close the second A phrase on its tonic, without the B pickup.
                if start == CADENCE:
                    end = END
                result.append(dict(tick=start, end=end, pitch=event.note))
    return sorted(result, key=lambda n: (n['tick'], n['pitch']))


def main():
    sf = Path(sys.argv[1]).resolve()
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    source = mido.MidiFile(SOURCE)
    assert source.ticks_per_beat == PPQ
    hands = [read_notes(track) for track in source.tracks[1:3]]
    groups = defaultdict(list)
    for hand, notes in enumerate(hands):
        for n in notes:
            # During the descending introduction the melody changes staff.
            if hand == 0 or n['tick'] < 2688:
                groups[n['tick']].append(n)
    melody = [max(notes, key=lambda n: n['pitch']) for _, notes in sorted(groups.items())]
    melody_keys = {(n['tick'], n['pitch']) for n in melody}
    midi = mido.MidiFile(ticks_per_beat=PPQ)
    meta = mido.MidiTrack([mido.MetaMessage('set_tempo', tempo=TEMPO)])
    midi.tracks.append(meta)
    for channel, notes in enumerate(hands):
        events = []
        track = mido.MidiTrack([mido.Message('program_change', channel=channel, program=0)])
        midi.tracks.append(track)
        for n in notes:
            lead = (n['tick'], n['pitch']) in melody_keys
            velocity = (98 if n['tick'] % 768 == 0 else 90) if lead else (58 if channel else 65)
            events.extend([(n['tick'] + LEAD, mido.Message('note_on', channel=channel, note=n['pitch'], velocity=velocity)),
                           (n['end'] + LEAD, mido.Message('note_off', channel=channel, note=n['pitch']))])
        previous = 0
        for tick, event in sorted(events, key=lambda e: (e[0], e[1].type == 'note_on')):
            track.append(event.copy(time=tick - previous))
            previous = tick
        track.append(mido.MetaMessage('end_of_track', time=END + LEAD - previous))
    midi.save(OUT / 'performance.mid')
    subprocess.run(['fluidsynth', '-ni', '-q', '-r', '44100', '-g', '.7', '-o', 'synth.reverb.active=0', '-o', 'synth.chorus.active=0', '-F', str(WORK / 'entertainer.wav'), str(sf), str(OUT / 'performance.mid')], check=True)
    duration = round((END + LEAD) * SEC + 2.5, 6)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(WORK / 'entertainer.wav'), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9,apad', '-t', str(duration), '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '192k', str(OUT / 'piano.mp3')], check=True)
    decoded = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / 'piano.mp3'), '-f', 's16le', '-ac', '1', '-ar', '44100', '-'], check=True, capture_output=True).stdout
    duration = round(len(decoded) / 2 / 44100, 6)
    digest = hashlib.sha256((OUT / 'piano.mp3').read_bytes()).hexdigest()
    # Stable pitch-class lanes: identical motifs keep identical finger patterns.
    for mode, approach, maximum in [('facile', 2.8, 1500), ('normal', 2.5, 2250), ('difficile', 2.1, 3000)]:
        selected = list(melody)
        if mode == 'facile':
            # Eighth-note anchors plus long syncopations, always actual melody attacks.
            selected = [n for n in selected if n['tick'] % 192 == 0 or n['end'] - n['tick'] >= 288]
        if mode == 'difficile':
            occupied = {n['tick'] for n in selected}
            bass = defaultdict(list)
            for n in hands[1]:
                if n['tick'] >= 3072 and n['tick'] % 192 == 0 and n['tick'] not in occupied:
                    bass[n['tick']].append(n)
            selected += [min(notes, key=lambda n: n['pitch']) for notes in bass.values()]
        selected.sort(key=lambda n: n['tick'])
        notes = [dict(id=f'{mode}-{i:04}', timeSeconds=round((n['tick'] + LEAD) * SEC, 6), durationSeconds=0,
                      lane=LANES[n['pitch'] % 12], midiPitch=n['pitch'], type='tap', sourceTick=n['tick'] + LEAD)
                 for i, n in enumerate(selected)]
        chart = dict(schemaVersion=1, status='midi-synchronised-demo-awaiting-player-feedback', songId='scott-joplin-the-entertainer-demo-v1',
                     title='The Entertainer', artist='Scott Joplin', audioFile='piano.mp3', audioSha256=digest,
                     durationSeconds=duration, estimatedBpm=72, beatOffsetSeconds=round(LEAD * SEC, 6), mode=mode, laneCount=4,
                     timingReference='Exact rendered performance.mid ticks, 384 PPQ, 833333 microseconds/quarter; no audio trim.',
                     countInSeconds=3, approachTimeSeconds=approach, songDifficulty=dict(rating=3, outOf=5, coefficient=1.5),
                     scoring=dict(maxPoints=maximum), notes=notes)
        (OUT / f'{mode}.json').write_text(json.dumps(chart, ensure_ascii=False, indent=2) + '\n')
        print(mode, len(notes), 'notes;', duration, 'seconds')
    (OUT / 'credits.json').write_text(json.dumps(dict(composition='The Entertainer — Scott Joplin (1902)',
        score='Mutopia / Chris Sawer, Simon Albrecht — public domain', source='https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=263',
        soundfont='GeneralUser GS 2.0.3 — S. Christian Collins', soundfontSource='https://github.com/mrbumpy409/GeneralUser-GS',
        soundfontSha256=hashlib.sha256(sf.read_bytes()).hexdigest(), audioSha256=digest,
        arrangement='Intro + repeated A theme, final tonic extended; rendered locally from performance.mid.'), ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main()
