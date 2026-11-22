"""Align every sung mora of lyrics.txt to a note of the lead-vocal MIDI, for the whole song at once.

Cues, combined in one dynamic programme over (mora i -> note j, monotonic):
  - Whisper: each mora whose kana Whisper heard (character alignment, as in sync_check.py) is pulled toward
    the time Whisper heard it
  - rests: the first mora of a line prefers a note that follows a rest (> 0.25 s)
  - lyrics.txt timestamps: a weak pull on each line's first mora (repeated timestamps are ignored)
  - inside a line notes may be skipped (melisma, extra stutters) or shared (two morae on one note) at a cost;
    between lines any number of notes may be skipped cheaply (chops, ad-libs)

Writes video/analysis/mora_times.json  {"lines": [{"text", "morae": [[t0, t1, kana], ...]}]}
and prints each line's start next to the lyrics.txt time and Whisper's time.
Run: .venv/Scripts/python.exe -X utf8 video/analysis/align_audio.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from build_data import READ, kana_morae, parse_lyrics_txt, units  # noqa: E402
from sync_check import DROP, to_hira  # noqa: E402
import midi  # noqa: E402

K2H = lambda s: "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)


def mora_readings(word):
    """per timing mora of a word: its kana reading (kanji expanded via READ)"""
    out = []
    for disp, k in units(word):
        if k == 1 and disp not in READ:
            out.append(K2H(disp))
        else:
            r = READ.get(disp) or "".join(READ.get(c, c) for c in disp)
            ms = kana_morae(r)
            out += [K2H(m) for m in ms]
    return out


def nw(A, B, match=2, mis=-1, gap=-1):
    n, m = len(A), len(B)
    prev = list(range(0, (m + 1) * gap, gap)) if gap else [0] * (m + 1)
    prev = [j * gap for j in range(m + 1)]
    tb = [bytearray(m + 1) for _ in range(n + 1)]
    for j in range(1, m + 1):
        tb[0][j] = 2
    for i in range(1, n + 1):
        cur = [0] * (m + 1)
        cur[0] = i * gap
        tb[i][0] = 1
        ai = A[i - 1]
        row = tb[i]
        for j in range(1, m + 1):
            d = prev[j - 1] + (match if ai == B[j - 1] else mis)
            u = prev[j] + gap
            l = cur[j - 1] + gap
            if d >= u and d >= l:
                cur[j], row[j] = d, 0
            elif u >= l:
                cur[j], row[j] = u, 1
            else:
                cur[j], row[j] = l, 2
        prev = cur
    i, j, pairs = n, m, []
    while i > 0 or j > 0:
        t = tb[i][j]
        if i > 0 and j > 0 and t == 0:
            pairs.append((i - 1, j - 1))
            i, j = i - 1, j - 1
        elif i > 0 and (j == 0 or t == 1):
            i -= 1
        else:
            j -= 1
    return pairs[::-1]


def main():
    rows = parse_lyrics_txt()
    # morae
    mor = []  # (line, kana)
    first = {}
    for li, (text, _) in enumerate(rows):
        first[li] = len(mor)
        for w in text.split(" "):
            if w:
                for k in mora_readings(w):
                    mor.append((li, k))
    M = len(mor)
    # user hints (skip repeated timestamps)
    hint = {}
    for li, (_, t) in enumerate(rows):
        if t is None:
            continue
        if li > 0 and rows[li - 1][1] is not None and abs(rows[li - 1][1] - t) < 1e-6:
            continue
        hint[li] = t
    # Whisper char times -> mora times
    asr = json.load(open(os.path.join(HERE, "asr_lead.json"), encoding="utf8"))
    heard = []
    for seg in asr["segments"]:
        for wn, w in enumerate(seg["words"]):
            h = to_hira(w["w"])
            # the first word of a segment is pinned to the segment start, so its time is unreliable (p = 0)
            p = 0.0 if wn == 0 else w["p"]
            for k, c in enumerate(h):
                heard.append((c, w["start"] + (w["end"] - w["start"]) * k / max(1, len(h)), p))
    lchars, owner = [], []
    for mi, (_, k) in enumerate(mor):
        for c in k:
            if c in DROP:
                continue
            lchars.append(c)
            owner.append(mi)
    pairs = nw(lchars, [c for c, _, _ in heard])
    asr_t = [None] * M
    for a, b in pairs:
        if lchars[a] == heard[b][0] and heard[b][2] >= 0.3:
            mi = owner[a]
            if asr_t[mi] is None:
                asr_t[mi] = heard[b][1]
    # notes
    notes = midi.read(os.path.join(ROOT, "MIDI", "0 Lead Vocals.mid"))
    T = [n[0] for n in notes]
    E = [n[1] for n in notes]
    N = len(notes)
    rest = [j == 0 or T[j] - E[j - 1] > 0.25 for j in range(N)]

    INF = 1e18
    W_ASR, W_HINT, BIAS = 1.0, 0.25, 0.12
    # hard lower bounds for a line's first mora, from the user listening to v3:
    #  - chorus 1's first ぷち is NOT a pickup at 72.10 (no voice there yet): it starts on/after the downbeat
    MIN_START = {}
    for li, (text, _) in enumerate(rows):
        if text.startswith("ぷち・ぷち・ごくん") and 70 < (rows[li][1] or 0) < 75:
            MIN_START[li] = 72.9

    def cost(i, j):
        c = 0.0
        a = asr_t[i]
        if a is not None:
            d = T[j] - (a + BIAS)
            c += W_ASR * min(d * d, 4.0)
        li = mor[i][0]
        if first[li] == i:
            if li in MIN_START and T[j] < MIN_START[li]:
                return 1e9
            if rest[j]:
                c -= 0.6
            if li in hint:
                d = T[j] - hint[li]
                c += W_HINT * min(d * d, 16.0)
        return c

    D = [[INF] * N for _ in range(M)]
    P = [[-1] * N for _ in range(M)]
    for j in range(N):
        D[0][j] = cost(0, j) + 0.02 * j
    for i in range(1, M):
        newline = first[mor[i][0]] == i
        prev = D[i - 1]
        if newline:
            # any earlier note, small cost per skipped note
            best, bj = INF, -1
            for j in range(N):
                if j > 0:
                    cand = prev[j - 1]
                    # carry the running min forward with a per-note skip cost
                    best = best + 0.03 if best < INF else INF
                    if cand < best:
                        best, bj = cand, j - 1
                if best < INF:
                    D[i][j] = best + cost(i, j)
                    P[i][j] = bj
        else:
            for j in range(N):
                c0 = cost(i, j)
                bestv, bj = prev[j] + 1.0, j  # share the note with the previous mora
                for s in range(1, 8):
                    jp = j - s
                    if jp < 0:
                        break
                    gapt = T[j] - T[jp]
                    # syllables inside a line follow each other closely: long gaps cost
                    v = prev[jp] + 0.35 * (s - 1) + 0.9 * min(max(0.0, gapt - 0.5), 2.5)
                    if v < bestv:
                        bestv, bj = v, jp
                D[i][j] = bestv + c0
                P[i][j] = bj
    # end: last mora anywhere
    j = min(range(N), key=lambda x: D[M - 1][x])
    assign = [0] * M
    for i in range(M - 1, -1, -1):
        assign[i] = j
        j = P[i][j]
    # hand overrides, checked against Whisper word boundaries (see NOTES.md):
    #  - intro: the line starts at 0:08 (user's choice), both はろー from 8.36 s
    #  - chorus 1 ばいばい: Whisper's の ends at 97.20, so ばいばい starts on the 97.24 note
    def first_note_after(t):
        return min(range(N), key=lambda j: (T[j] < t - 1e-6, T[j]))
    for li, (text, _) in enumerate(rows):
        idx = [i for i in range(M) if mor[i][0] == li]
        if text.startswith("はろー はろー"):
            # the user wants this line to start at 0:08 (the very soft はろー at 0:03.3 is not shown):
            # は ろ ー | は ろ ー | え め だ よ over the 8 notes from 8.36 s
            j0 = first_note_after(8.0)
            for i, d in zip(idx, [0, 1, 1, 2, 3, 3, 4, 5, 6, 7]):
                assign[i] = j0 + d
        if text.startswith("ばいばい") and abs(T[assign[idx[0]]] - 96.91) < 0.05:
            assign[idx[0]] = first_note_after(97.2)
    shared = {}
    # spans
    out_lines = []
    for li, (text, _) in enumerate(rows):
        idx = [i for i in range(M) if mor[i][0] == li]
        ms = []
        for n_, i in enumerate(idx):
            j = assign[i]
            t0 = T[j]
            if n_ + 1 < len(idx):
                t1 = T[assign[idx[n_ + 1]]]
                if t1 <= t0:  # shared note: split it
                    t1 = t0 + max(0.06, (E[j] - T[j]) / 2)
            else:
                t1 = max(E[j], t0 + 0.15)
            ms.append([round(t0, 3), round(t1, 3), mor[i][1]])
        # fix shared-note overlaps: make monotonic
        for k in range(1, len(ms)):
            if ms[k][0] < ms[k - 1][1] and ms[k][0] <= ms[k - 1][0]:
                ms[k][0] = round(ms[k - 1][0] + 0.06, 3)
        out_lines.append({"i": li, "text": text, "morae": ms})
    # drop 2, bars 2-4: the vocal chops are even 16ths, so the notes don't show where a bar starts; these chunk
    # times come from the user listening (ぷち, ぷち, ごくん, stutters..., last word), last value = bar end.
    # chorus 1/2 first two lines: chunk onsets from the lead-vocal loudness/pitch track (user heard 溶けちゃう and
    # the two ふわ late); chorus 2 is chorus 1 shifted by +100.88 s (onsets match within 0.2 s)
    C2 = 100.88
    MANUAL = [
        ("ぷち・ぷち・ごくん と", 205.0, 207.2, [206.0, 206.45, 206.9, 208.0, 208.08, 208.16, 208.24, 208.5, 209.05], 209.6),
        ("ぷち・ぷち・ごくん と", 208.8, 210.6, [209.8, 210.2, 210.6, 211.5, 211.6, 211.7, 211.8, 212.0], 213.2),
        ("ぷち・ぷち・ごくん 溶", 72.5, 74.0, [72.94, 73.39, 73.64, 74.0], 74.92),
        ("ふわ・ふわ・ひれから", 74.5, 77.0, [75.46, 75.95, 76.34, 77.5], 79.5),
        ("ぷち・ぷち・ごくん 溶", 72.5 + C2, 74.0 + C2, [72.94 + C2, 73.39 + C2, 73.64 + C2, 74.0 + C2], 74.92 + C2),
        ("ふわ・ふわ・ひれから", 74.5 + C2, 77.0 + C2, [75.46 + C2, 75.95 + C2, 76.34 + C2, 77.5 + C2], 79.5 + C2),
    ]
    for L in out_lines:
        if not L["morae"]:
            continue
        st = L["morae"][0][0]
        for pre, lo, hi, cs, cend in MANUAL:
            if not (L["text"].startswith(pre) and lo <= st <= hi):
                continue
            chunks = [c for w in L["text"].split(" ") for c in w.split("・") if c]
            per = [sum(k for _, k in units(c)) for c in chunks]
            assert len(cs) == len(chunks) and sum(per) == len(L["morae"]), (L["text"], len(cs), len(chunks))
            ms, m = [], 0
            for ci, n in enumerate(per):
                a0 = cs[ci]
                a1 = cs[ci + 1] if ci + 1 < len(cs) else cend
                for q in range(n):
                    ms.append([round(a0 + (a1 - a0) * q / n, 3), round(a0 + (a1 - a0) * (q + 1) / n, 3), L["morae"][m][2]])
                    m += 1
            L["morae"] = ms
            break
    # per-mora fixes read off the lead-vocal loudness/pitch timeline (probe.py), after the user's v6 review.
    # (text prefix, window for the aligned line start, {mora index: onset}, line end or None)
    MANUAL_MORA = [
        ("エメは", 82.0, 83.5, {0: 82.69}, None),
        ("見ないで", 86.0, 87.5, {0: 86.98}, None),
        ("とろ・とろ・尻尾も 全部", 180.0, 182.0, {9: 182.80, 10: 183.00, 11: 183.30, 12: 183.55, 13: 183.73}, 183.88),
        ("エメは", 183.5, 184.8, {0: 183.94, 1: 184.21, 2: 184.42, 3: 184.63, 4: 184.84}, None),
        ("……って", 190.0, 192.0, dict(enumerate([190.98, 191.07, 191.40, 191.62, 191.85, 192.36, 192.75, 193.20, 193.77, 194.55])), 194.94),
        ("おやすみ", 217.0, 218.5, dict(enumerate([217.56, 217.80, 218.28, 218.49, 219.36, 219.57, 219.87, 220.08, 220.29, 220.44])), 220.6),
        # drop 2 bar 4 (user, v8): ま x8 + また明日 on the lead-MIDI notes from 213.32 (no ぷち・ぷち・ごくん)
        ("ま・ま・ま・ま・ま・ま・ま・ま・また明日", 212.0, 214.5,
         dict(enumerate([213.32, 213.54, 213.75, 213.98, 214.20, 214.43, 214.64, 214.88, 215.11, 215.33, 215.56, 215.78, 216.24])), 216.6),
        ("また ぷちぷち", 224.0, 225.5, dict(enumerate([224.77, 225.01, 225.67, 225.88, 226.60, 226.96, 228.25, 228.64, 228.79, 228.91, 229.27])), None),
    ]
    for L in out_lines:
        if not L["morae"]:
            continue
        st = L["morae"][0][0]
        for pre, lo, hi, fix, lend in MANUAL_MORA:
            if not (L["text"].startswith(pre) and lo <= st <= hi):
                continue
            ms = L["morae"]
            n = len(ms)
            for k, v in fix.items():
                ms[k % n][0] = v
            for k in range(n - 1):
                ms[k][1] = ms[k + 1][0]
            if lend is not None:
                ms[-1][1] = lend
            ms[-1][1] = max(ms[-1][1], ms[-1][0] + 0.15)
            break
    # forced alignment (force_align.py, torchaudio MMS_FA): its mora starts sit on the acoustic onsets
    # (median offset 0.005 s) while the MIDI-based times above run early. Use them where they agree within
    # FA_LIM s; a few lines with other evidence (Whisper / user reports) may move up to 1.1 s; known
    # mis-alignments (chops pulled in, a line shifted by its neighbour) are kept as they are.
    fa_path = os.path.join(HERE, "fa_times.json")
    if os.path.exists(fa_path) and "--no-fa" not in sys.argv:
        fa = json.load(open(fa_path))
        FA_LIM = 0.6
        WIDE = {"溶けて・溶けて", "水に", "東京の", "咳も", "お水で", "「合法", "ぷち・ぷち・ごくん 溶", "ふわ・ふわ", "ばいばい", "……って", "き・き", "あ・あ"}
        SKIP_LINE = {"おやすみ", "明日 形が"}
        SKIP_MORA = {("溶けて・溶けて", 0), ("ぷち・ぷち・ごくん と", 0)}
        for L in out_lines:
            fl = fa.get(str(L["i"]))
            ms = L["morae"]
            if not fl or len(fl) != len(ms) or any(L["text"].startswith(p) for p in SKIP_LINE):
                continue
            lim = 1.1 if any(L["text"].startswith(p) for p in WIDE) else FA_LIM
            for k, (m, f) in enumerate(zip(ms, fl)):
                if any(L["text"].startswith(p) and k == kk for p, kk in SKIP_MORA):
                    continue
                if abs(f[0] - m[0]) <= lim:
                    m[0] = f[0]
            for k in range(1, len(ms)):
                if ms[k][0] <= ms[k - 1][0]:
                    ms[k][0] = round(ms[k - 1][0] + 0.04, 3)
            for k in range(len(ms) - 1):
                ms[k][1] = ms[k + 1][0]
            ms[-1][1] = max(ms[-1][1], ms[-1][0] + 0.15)
    json.dump({"lines": out_lines}, open(os.path.join(HERE, "mora_times.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    if "--write-txt" in sys.argv:
        import re
        starts = [L["morae"][0][0] for L in out_lines]
        src = open(os.path.join(ROOT, "lyrics.txt"), encoding="utf8").read().split("\n")
        k = 0
        for n, raw in enumerate(src):
            st = raw.strip()
            if not st or st.startswith("["):
                continue
            body = re.sub(r"\s+\d{1,2}:\d{2}[.:]\d{1,3}$", "", st)
            t = starts[k]
            src[n] = f"{body} {int(t // 60):02d}:{t % 60:06.3f}"
            k += 1
        assert k == len(starts)
        open(os.path.join(ROOT, "lyrics.txt"), "w", encoding="utf8").write("\n".join(src))
        print("lyrics.txt timestamps updated")
    for L in out_lines:
        li = L["i"]
        st = L["morae"][0][0]
        h = rows[li][1]
        fa = next((asr_t[i] for i in range(M) if mor[i][0] == li and asr_t[i] is not None), None)
        hs = f"{h:7.2f}" if h is not None else "   -   "
        fs = f"{fa:7.2f}" if fa is not None else "   -   "
        flag = "  <-- moved %.2f" % (st - h) if h is not None and abs(st - h) > 0.6 else ""
        print(f"{li:2d} start {st:7.2f}  txt {hs}  asr {fs}  {L['text']}{flag}")
        if "-v" in sys.argv:
            print("      " + " ".join(f"{k}@{a:.2f}" for a, b, k in L["morae"]))


if __name__ == "__main__":
    main()
