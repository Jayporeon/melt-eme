"""Transcribe the lead-vocal stem with faster-whisper (word timestamps) -> video/analysis/asr_lead.json

No lyric prompt is given, so the transcript shows what is actually sung, not what lyrics.txt says.
Run: .venv/Scripts/python.exe -X utf8 video/analysis/asr_lead.py [model]   (default large-v3)
"""
import json
import os
import sys
import time

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
name = sys.argv[1] if len(sys.argv) > 1 else "large-v3"

# decode ourselves (faster-whisper's PyAV loader breaks with PyAV 19): mono, 16 kHz float32
x, sr = sf.read(os.path.join(ROOT, "0 Lead Vocals.wav"), dtype="float32", always_2d=True)
x = x.mean(axis=1)
from math import gcd
g = gcd(sr, 16000)
AUDIO = resample_poly(x, 16000 // g, sr // g).astype(np.float32)

model = None
for dev, ct in (("cuda", "float16"), ("cpu", "int8")):
    try:
        model = WhisperModel(name, device=dev, compute_type=ct, cpu_threads=os.cpu_count() or 8)
        # force a tiny run so missing CUDA libraries fail here, not halfway through
        list(model.transcribe(AUDIO[: 16000 * 3], language="ja")[0])
        print("device:", dev, ct, flush=True)
        break
    except Exception as e:  # noqa: BLE001
        print(f"{dev} unavailable: {e}", flush=True)
        model = None
if model is None:
    sys.exit("no device")

t0 = time.time()
segs, info = model.transcribe(
    AUDIO,
    language="ja",
    beam_size=5,
    word_timestamps=True,
    vad_filter=False,
    condition_on_previous_text=False,
    temperature=0.0,
    no_speech_threshold=0.5,
)
out = []
for s in segs:
    words = [{"w": w.word, "start": round(w.start, 3), "end": round(w.end, 3), "p": round(w.probability, 3)} for w in (s.words or [])]
    out.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text, "words": words})
    print(f"{s.start:7.2f} {s.end:7.2f} {s.text}", flush=True)
json.dump({"model": name, "segments": out}, open(os.path.join(HERE, "asr_lead.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"done in {time.time() - t0:.0f}s")
