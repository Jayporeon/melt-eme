"""Print a line-by-line timeline of the lead vocal for checking lyric timing by eye.

  .venv/Scripts/python.exe -X utf8 video/analysis/probe.py 82.5 86.8 [more ranges...]

Every 30 ms: loudness bar, pitch (pyin), acoustic onsets (*), and the mora that currently starts there (from
public/data/lyrics.json), so a mora that starts before / after the voice is easy to see.
"""
import json
import os
import sys

import librosa
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
x, sr = sf.read(os.path.join(ROOT, "0 Lead Vocals.wav"), dtype="float32", always_2d=True)
x = x.mean(1)
L = json.load(open(os.path.join(ROOT, "video", "public", "data", "lyrics.json"), encoding="utf8"))["lines"]
mor = sorted((s[0], s[2], l["i"]) for l in L for w in l["words"] for s in w["syl"])
STEP = 0.03

args = [float(a) for a in sys.argv[1:]]
for a, b in zip(args[::2], args[1::2]):
    seg = x[int(a * sr): int(b * sr)]
    hop = int(sr * STEP)
    rms = librosa.feature.rms(y=seg, frame_length=hop * 2, hop_length=hop)[0]
    rms = rms / (rms.max() + 1e-9)
    f0, _, _ = librosa.pyin(seg, fmin=150, fmax=1000, sr=sr, frame_length=2048, hop_length=hop)
    on = librosa.onset.onset_detect(y=seg, sr=sr, hop_length=256, backtrack=True, units="time", delta=0.03)
    on = [a + o for o in on]
    print(f"===== {a} - {b}")
    for i, r in enumerate(rms):
        t = a + i * STEP
        p = f0[i] if i < len(f0) and not np.isnan(f0[i]) else 0
        o = "*" if any(t - STEP / 2 <= q < t + STEP / 2 for q in on) else " "
        ms = " ".join(f"[{m}]" for tt, m, li in mor if t - STEP / 2 <= tt < t + STEP / 2)
        print(f"{t:7.2f} {o} {'#' * int(r * 24):<24} {librosa.hz_to_note(p) if p else '':<4} {ms}")
