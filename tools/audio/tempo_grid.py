"""Estimate a metrical grid using beat, eighth and sixteenth-note support.
A single spectral phase can follow a dotted rhythm instead of the underlying beat.
These are estimates, never a claim of canonical score transcription.
"""
import numpy as np

def fit_grid(times, weights):
    candidates=np.arange(75,180.001,.1)
    def supports(bpms):
        z=np.exp(2j*np.pi*times[:,None]*bpms/60)
        return [np.abs((z**k).T@weights)/max(1e-9,weights.sum()) for k in [1,2,4]]
    support=supports(candidates)
    scores=support[0]+.8*support[1]+.5*support[2]
    coarse=float(candidates[np.argmax(scores)])
    fine=np.arange(coarse-.12,coarse+.121,.005)
    support=supports(fine);scores=support[0]+.8*support[1]+.5*support[2]
    index=int(np.argmax(scores));bpm=float(fine[index]);phase=float(np.angle(np.sum(np.exp(2j*np.pi*times*bpm/60)*weights)))
    return bpm,phase,dict(method='beat-eighth-sixteenth phase support, 75–180 BPM',score=round(float(scores[index]),4),supports=[round(float(s[index]),4) for s in support])
