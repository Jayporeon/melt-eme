"""Build the two data files the video reads: public/data/audio.json and public/data/lyrics.json.

Run from the repo root:  .venv/Scripts/python.exe -X utf8 video/analysis/build_data.py

audio.json  beats / downbeats / sections (from the hand-checked beat map in analysis/song.json),
            drum onsets from MIDI/2 Drums.mid (36 kick, 38 snare, 42 hat), note lists for the lead
            vocal, music box (keyboard), synth and bass, and 100 fps loudness envelopes per stem.
lyrics.json one entry per sung line. Line windows come from the earlier alignment (analysis/lyrics_v1.json,
            hand-fixed intro/outro). Inside each window every mora gets its own span from the lead
            vocal MIDI notes, so words light up mora by mora. English from translation_en.txt.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import midi  # noqa: E402

OUT = os.path.join(ROOT, "video", "public", "data")
SMALL = set("ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ")
SKIP = set(" 　・「」『』？！?!…、。（）()~〜")


# readings for the kanji in lyrics.txt. Multi-character keys are whole-word readings (jukujikun) and become
# one display unit; single kanji become one unit each, spanning the morae of their reading.
READ = {
    "今日": "きょう", "明日": "あした", "昨日": "きのう", "尻尾": "しっぽ",
    "東": "とう", "京": "きょう", "手": "て", "帳": "ちょう", "生": "い", "偉": "えら", "小": "ちい", "並": "なら",
    "白": "しろ", "咳": "せき", "熱": "ねつ", "水": "みず", "流": "なが", "空": "から", "瓶": "びん", "写": "しゃ",
    "真": "しん", "笑": "わら", "数": "かぞ", "色": "いろ", "腹": "なか", "粒": "つぶ", "透": "す", "星": "ほし",
    "黄": "き", "雫": "しずく", "合": "ごう", "法": "ほう", "平": "へい", "気": "き", "誰": "だれ", "言": "い",
    "訳": "わけ", "溶": "と", "全": "ぜん", "部": "ぶ", "薬": "くすり", "見": "み", "回": "まわ", "現": "げん",
    "実": "じつ", "青": "あお", "体": "からだ", "痒": "かゆ", "世": "せ", "界": "かい", "薄": "うす", "膜": "まく",
    "向": "む", "幸": "しあわ", "触": "さわ", "割": "わ", "玉": "だま", "切": "き", "目": "め", "寒": "さむ",
    "持": "も", "悪": "わる", "床": "ゆか", "一": "いち", "番": "ばん", "優": "やさ", "怖": "こわ", "形": "かたち",
    "同": "おな", "天": "てん", "井": "じょう", "治": "なお", "思": "おも", "行": "い", "年": "ねん", "金": "きん",
    "日": "ひ", "来": "き", "買": "か", "固": "かた", "繰": "く", "返": "かえ",
}
KANJI = lambda ch: "一" <= ch <= "鿿" or ch == "々"


def kana_morae(s):
    out = []
    for ch in s:
        if ch in SKIP:
            continue
        if ch in SMALL and out:
            out[-1] += ch
        else:
            out.append(ch)
    return out


def units(word):
    """display units of a word: (display text, number of morae). Kana -> one unit per mora; kanji -> one unit
    per character (or per whole-word reading) spanning the morae of its reading."""
    out = []
    buf = ""
    i = 0
    chars = [c for c in word if c not in SKIP]
    while i < len(chars):
        ch = chars[i]
        if KANJI(ch):
            if buf:
                out += [(m, 1) for m in kana_morae(buf)]
                buf = ""
            two = "".join(chars[i:i + 2])
            if two in READ:
                out.append((two, len(kana_morae(READ[two]))))
                i += 2
                continue
            r = READ.get(ch)
            if r is None:
                raise SystemExit(f"no reading for {ch} in {word}: add it to READ")
            out.append((ch, len(kana_morae(r))))
        else:
            buf += ch
        i += 1
    if buf:
        out += [(m, 1) for m in kana_morae(buf)]
    return out


def reading(text):
    """hiragana reading of a lyric line (kanji via READ), punctuation dropped"""
    out = ""
    for w in text.split(" "):
        chars = [c for c in w if c not in SKIP]
        i = 0
        while i < len(chars):
            two = "".join(chars[i:i + 2])
            if two in READ:
                out += READ[two]
                i += 2
                continue
            out += READ.get(chars[i], chars[i])
            i += 1
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in out)


def morae(word):
    return [u for u, _ in units(word)]


def env(path, fps=100):
    x, sr = sf.read(path, dtype="float32", always_2d=True)
    x = x.mean(axis=1)
    hop = sr // fps
    n = len(x) // hop
    frames = x[: n * hop].reshape(n, hop)
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    ref = np.percentile(rms, 98) + 1e-9
    v = np.clip(rms / ref, 0, 1)
    # light smoothing: 30 ms
    k = np.ones(3) / 3
    v = np.convolve(v, k, mode="same")
    return [round(float(a), 3) for a in v]


def band_env(path, lo, hi, fps=100):
    x, sr = sf.read(path, dtype="float32", always_2d=True)
    x = x.mean(axis=1)
    hop = sr // fps
    win = hop * 4
    n = len(x) // hop
    freqs = np.fft.rfftfreq(win, 1 / sr)
    sel = (freqs >= lo) & (freqs < hi)
    w = np.hanning(win).astype(np.float32)
    xp = np.pad(x, (win // 2, win))
    vals = np.empty(n, np.float32)
    for i in range(n):
        seg = xp[i * hop: i * hop + win] * w
        vals[i] = np.sqrt((np.abs(np.fft.rfft(seg))[sel] ** 2).mean())
    ref = np.percentile(vals, 98) + 1e-9
    return [round(float(a), 3) for a in np.clip(vals / ref, 0, 1)]


def build_audio():
    song = json.load(open(os.path.join(HERE, "song.json"), encoding="utf8"))
    beats = song["beats"]
    downbeats = beats[::4]
    sections = [{"name": s["name"], "start": s["start"], "end": s["end"]} for s in song["sections"]]
    drums = midi.read(os.path.join(ROOT, "MIDI", "2 Drums.mid"))
    on = {"kick": [], "snare": [], "hat": []}
    for s, e, p, v in drums:
        k = {36: "kick", 38: "snare", 42: "hat"}.get(p)
        if k:
            on[k].append([s, round(v / 127, 3)])

    def notes(name):
        return [[s, e, p, round(v / 127, 3)] for s, e, p, v in midi.read(os.path.join(ROOT, "MIDI", name))]

    stems = {
        "mix": "とけちゃう、エメ.wav", "vocal": "0 Lead Vocals.wav", "backing": "1 Backing Vocals.wav",
        "drums": "2 Drums.wav", "bass": "3 Bass.wav", "keys": "4 Keyboard.wav", "synth": "6 Synth.wav",
    }
    envs = {k: env(os.path.join(ROOT, v)) for k, v in stems.items()}
    mixp = os.path.join(ROOT, stems["mix"])
    envs["low"] = band_env(mixp, 20, 160)
    envs["high"] = band_env(mixp, 5000, 16000)
    audio = {
        "duration": song["duration"], "bpm": song["bpm"], "fps": 100,
        "beats": beats, "downbeats": downbeats, "sections": sections,
        "onsets": on,
        "notes": {"lead": notes("0 Lead Vocals.mid"), "box": notes("4 Keyboard.mid"),
                  "synth": notes("6 Synth.mid"), "bass": notes("3 Bass.mid")},
        "env": envs,
    }
    json.dump(audio, open(os.path.join(OUT, "audio.json"), "w", encoding="utf8"), separators=(",", ":"))
    print("audio.json", len(beats), "beats", {k: len(v) for k, v in on.items()})
    return audio


def parse_lyrics_txt():
    """lyrics.txt: [section] tags, then one sung line per row, optionally ending in a start time mm:ss.mmm"""
    import re
    rows = []
    for raw in open(os.path.join(ROOT, "lyrics.txt"), encoding="utf8"):
        raw = raw.strip()
        if not raw or raw.startswith("["):
            continue
        m = re.search(r"\s+(\d{1,2}):(\d{2})[.:](\d{1,3})$", raw)
        t = None
        if m:
            t = int(m.group(1)) * 60 + int(m.group(2)) + int(m.group(3).ljust(3, "0")) / 1000
            raw = raw[: m.start()].strip()
        rows.append([raw, t])
    return rows


def build_lyrics(audio):
    old = json.load(open(os.path.join(HERE, "lyrics_v1.json"), encoding="utf8"))
    old_by_text = {}
    for L in old:
        old_by_text.setdefault(L["text"], []).append(L)
    en = [l.strip() for l in open(os.path.join(HERE, "translation_en.txt"), encoding="utf8")
          if l.strip() and not l.startswith("#")]
    rows = parse_lyrics_txt()
    assert len(en) == len(rows), (len(en), len(rows))
    lead = audio["notes"]["lead"]
    onsets = [n[0] for n in lead]
    # phrase starts: notes after a rest
    phrase = [lead[0][0]] + [lead[i][0] for i in range(1, len(lead)) if lead[i][0] - lead[i - 1][1] > 0.25]

    # 1. line starts: the user's timestamp; a duplicate of the previous row's time is a copy slip ->
    #    fall back to the old alignment of the same position / same text
    starts, src = [], []
    for i, (text, t) in enumerate(rows):
        dup = t is not None and i > 0 and rows[i - 1][1] is not None and abs(t - rows[i - 1][1]) < 1e-6
        if t is None or dup:
            # rows up to the bridge keep the old positions, so the old line at the same index is the same line
            o = old[i] if i < len(old) else None
            t = o["start"] if o else None
            src.append("old" if not dup else "old(dup)")
        else:
            # snap to a phrase start within [-0.3, +0.5] s
            near = [p for p in phrase if -0.3 <= p - t <= 0.5]
            if near:
                t = min(near, key=lambda p: abs(p - t))
                src.append("user~snap")
            else:
                src.append("user")
        starts.append(t)

    mt_path = os.path.join(HERE, "mora_times.json")
    mt = json.load(open(mt_path, encoding="utf8"))["lines"] if os.path.exists(mt_path) else []
    lines = []
    for i, (text, _) in enumerate(rows):
        s0 = starts[i]
        nxt = starts[i + 1] if i + 1 < len(rows) else audio["duration"] - 3
        # a single sung line over a whole chop section: keep it to a normal line length
        e0 = min(nxt - 0.05, s0 + 4.2)
        words = [w for w in text.split(" ") if w]
        # timing morae (kanji expanded to their reading's morae), each remembers its display unit
        mor = []  # (word index, unit index within line, display text)
        uidx = 0
        unit_list = []
        for wi, w in enumerate(words):
            for disp, k in units(w):
                unit_list.append((wi, disp))
                for _ in range(k):
                    mor.append((wi, uidx, disp))
                uidx += 1
        M = len(mor)
        ns = [n for n in lead if s0 - 0.12 <= n[0] < e0]
        N = len(ns)
        aligned = mt[i]["morae"] if i < len(mt) and mt[i]["text"] == text and len(mt[i]["morae"]) == M else None
        if aligned:
            # whole-song alignment (align_audio.py): lead-MIDI notes + Whisper + rests
            mst = [m[0] for m in aligned]
            men = [m[1] for m in aligned]
            s0 = mst[0]
            src[i] = "aligned"
        elif N >= max(3, M * 0.55):
            t_on = [n[0] for n in ns] + [max(ns[-1][1], ns[-1][0] + 0.12)]
            idx = np.arange(len(t_on))
            pos = np.linspace(0, N, M + 1)
            spans = np.interp(pos, idx, t_on)
            if N > M:
                for k in range(M):
                    j = int(round(k * N / M))
                    spans[k] = t_on[min(j, N - 1)]
            mst, men = list(spans[:-1]), list(spans[1:])
            men[-1] = min(max(men[-1], ns[-1][1]), e0 + 0.4)
        else:
            dur = min(e0 - s0, max(1.2, M * 0.24))
            step = dur / max(M, 1)
            mst = [s0 + k * step for k in range(M)]
            men = [s0 + (k + 1) * step for k in range(M)]
        wout = []
        for wi, w in enumerate(words):
            syl = []
            for u, (uwi, disp) in enumerate(unit_list):
                if uwi != wi:
                    continue
                ks = [k for k in range(M) if mor[k][1] == u]
                syl.append([round(mst[ks[0]], 3), round(men[ks[-1]], 3), disp])
            ws = syl[0][0] if syl else s0
            we = syl[-1][1] if syl else ws + 0.2
            wout.append({"w": w, "start": round(ws, 3), "end": round(we, 3), "syl": syl})
        ls = min(s0, mst[0]) if M else s0
        lines.append({"i": i, "text": text, "en": en[i], "start": round(ls, 3),
                      "end": round(max(wout[-1]["end"], ls + 0.5), 3), "words": wout, "src": src[i]})
    # each line ends when the lead vocal actually goes quiet (sustained vowels and their tails included),
    # not at the MIDI note end: first point after the last mora where the lead-vocal envelope stays below
    # VOC_QUIET for 0.15 s, never past the next line's start
    venv = audio["env"]["vocal"]
    fps = audio["fps"]
    VOC_QUIET = 0.10
    for k, L in enumerate(lines):
        last = L["words"][-1]["syl"][-1] if L["words"][-1]["syl"] else None
        if not last:
            continue
        limit = (lines[k + 1]["start"] - 0.02) if k + 1 < len(lines) else last[0] + 4.0
        limit = min(limit, last[0] + 4.0)
        t = last[0] + 0.12
        vend = None
        while t < limit:
            i0 = int(t * fps)
            if all(venv[min(len(venv) - 1, i0 + q)] < VOC_QUIET for q in range(15)):
                vend = t
                break
            t += 0.01
        if vend is None:
            vend = max(limit, last[1])
        vend = round(max(vend, last[1]), 3)
        last[1] = vend
        L["words"][-1]["end"] = vend
        L["end"] = max(L["end"], vend)
    json.dump({"lines": lines, "notes": "line starts: lyrics.txt timestamps (snapped to a lead-MIDI phrase start "
               "within -0.3/+0.5 s); duplicated timestamps and untimed chop lines fall back to the earlier alignment; "
               "mora spans from MIDI/0 Lead Vocals.mid onsets"},
              open(os.path.join(OUT, "lyrics.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    for L in lines:
        print(f"{L['i']:2d} {L['start']:7.2f} {L['end']:7.2f} {L['src']:10s} {L['text']}  |  "
              + " ".join(f"{w['w']}@{w['start']:.2f}" for w in L["words"]))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    a = build_audio()
    build_lyrics(a)
