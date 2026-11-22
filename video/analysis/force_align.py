"""Forced alignment of every sung mora with torchaudio's MMS_FA (multilingual wav2vec2 CTC aligner).

Each mora is romanised (readings from build_data.READ for kanji) and treated as one "word"; a star token between
lines absorbs singing that is not in lyrics.txt (chops, ad-libs). Lines are aligned in ~25 s groups cut at the
current line windows (public/data/lyrics.json), on the lead-vocal stem.

  .venv/Scripts/python.exe -X utf8 video/analysis/force_align.py      -> video/analysis/fa_times.json + report
"""
import json
import os
import sys

import numpy as np
import pykakasi
import soundfile as sf
import torch
import torchaudio
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from align_audio import mora_readings  # noqa: E402

kks = pykakasi.kakasi()
VOWEL = {"a", "i", "u", "e", "o"}


def romaji_morae(text):
    """list of romanised morae for a lyric line (same order as align_audio / build_data morae)"""
    out = []
    for w in text.split(" "):
        if not w:
            continue
        for k in mora_readings(w):
            if k in ("ー",):
                r = out[-1][-1] if out and out[-1] and out[-1][-1] in VOWEL else "u"
            elif k in ("っ", "ッ"):
                r = "t"
            else:
                r = "".join(x["hepburn"] for x in kks.convert(k)).lower()
                r = "".join(c for c in r if "a" <= c <= "z")
                if not r:
                    r = "u"
            out.append(r)
    return out


def main():
    lines = json.load(open(os.path.join(ROOT, "video", "public", "data", "lyrics.json"), encoding="utf8"))["lines"]
    x, sr = sf.read(os.path.join(ROOT, "0 Lead Vocals.wav"), dtype="float32", always_2d=True)
    x = x.mean(axis=1)
    x16 = resample_poly(x, 1, 3).astype(np.float32)  # 48k -> 16k
    SR = 16000

    bundle = torchaudio.pipelines.MMS_FA
    model = bundle.get_model(with_star=True)
    model.eval()
    tokenizer = bundle.get_tokenizer()
    aligner = bundle.get_aligner()

    # groups of lines, ~25 s each
    groups, cur = [], []
    for L in lines:
        if cur and L["end"] - cur[0]["start"] > 25:
            groups.append(cur)
            cur = []
        cur.append(L)
    if cur:
        groups.append(cur)

    result = {}
    for gi, G in enumerate(groups):
        prev_end = lines[G[0]["i"] - 1]["end"] if G[0]["i"] > 0 else 0.0
        nxt = lines[G[-1]["i"] + 1]["start"] if G[-1]["i"] + 1 < len(lines) else len(x16) / SR
        a = max(0.0, min(G[0]["start"] - 0.6, (prev_end + G[0]["start"]) / 2))
        b = min(len(x16) / SR, max(G[-1]["end"] + 0.4, (G[-1]["end"] + nxt) / 2))
        clip = torch.from_numpy(x16[int(a * SR): int(b * SR)]).unsqueeze(0)
        words, owner = ["*"], [None]
        for L in G:
            for k, r in enumerate(romaji_morae(L["text"])):
                words.append(r)
                owner.append((L["i"], k))
            words.append("*")
            owner.append(None)
        with torch.inference_mode():
            emission, _ = model(clip)
        tokens = tokenizer(words)
        spans = aligner(emission[0], tokens)
        ratio = clip.shape[1] / emission.shape[1] / SR
        for w, own, sp in zip(words, owner, spans):
            if own is None:
                continue
            t0 = a + sp[0].start * ratio
            t1 = a + sp[-1].end * ratio
            score = float(np.mean([s.score for s in sp]))
            result.setdefault(own[0], []).append([round(t0, 3), round(t1, 3), w, round(score, 3)])
        print(f"group {gi}: lines {G[0]['i']}-{G[-1]['i']}  {a:.1f}-{b:.1f}s  {len(words)} tokens", flush=True)

    json.dump({str(k): v for k, v in result.items()}, open(os.path.join(HERE, "fa_times.json"), "w"), indent=0)
    # report: compare with the current mora starts
    print("\nline  max|d|  mean|d|  text   (morae with |d| > 0.15: ours->fa)")
    for L in lines:
        ours = [s[0] for w in L["words"] for s in w["syl"]]
        # current syl are display units (kanji may span several morae): expand by the same readings
        fa = result.get(L["i"], [])
        # map units -> first mora index
        units = [s for w in L["words"] for s in w["syl"]]
        mor_per_unit = []
        for w in L["words"]:
            from build_data import units as U  # noqa: E402
            mor_per_unit += [k for _, k in U(w["w"])]
        idx, mi = [], 0
        for k in mor_per_unit:
            idx.append(mi)
            mi += k
        if len(fa) != mi:
            print(f"{L['i']:3d}  mora count mismatch {len(fa)} vs {mi}  {L['text']}")
            continue
        ds = [(u[2], u[0], fa[j][0], fa[j][0] - u[0], fa[j][3]) for u, j in zip(units, idx)]
        big = [f"{c}:{o:.2f}->{n:.2f}" for c, o, n, d, sc in ds if abs(d) > 0.15]
        mx = max(abs(d[3]) for d in ds)
        mean = sum(abs(d[3]) for d in ds) / len(ds)
        print(f"{L['i']:3d}  {mx:5.2f}  {mean:5.2f}  {L['text']}   {' '.join(big)}")


if __name__ == "__main__":
    main()
