"""Check each lyric line against what Whisper heard in the lead vocal.

Both sides are reduced to hiragana (pykakasi for Whisper's kanji), then globally aligned character by
character (Needleman-Wunsch). For each lyric line we get the time Whisper heard its first / last matched
character, how much of the line was heard, and the heard text where it differs.

Run: .venv/Scripts/python.exe -X utf8 video/analysis/sync_check.py  -> prints a table, writes sync_report.json
"""
import json
import os

import sys

import pykakasi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_data import reading  # noqa: E402
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
kks = pykakasi.kakasi()
DROP = set(" 　・「」『』？！?!…、。（）()~〜ー-—,.　")


def kata2hira(s):
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)


def to_hira(s):
    out = "".join(x["hira"] for x in kks.convert(s))
    return "".join(c for c in kata2hira(out) if c not in DROP and not c.isspace())


def lyric_hira(text):
    return "".join(c for c in reading(text) if c not in DROP)


def main():
    asr = json.load(open(os.path.join(HERE, "asr_lead.json"), encoding="utf8"))
    lyr = json.load(open(os.path.join(ROOT, "video", "public", "data", "lyrics.json"), encoding="utf8"))["lines"]

    # heard stream: one entry per hiragana char with an interpolated time
    heard = []
    for seg in asr["segments"]:
        for w in seg["words"]:
            h = to_hira(w["w"])
            if not h:
                continue
            n = len(h)
            for k, c in enumerate(h):
                t = w["start"] + (w["end"] - w["start"]) * k / n
                heard.append((c, round(t, 3), w["p"]))
    # lyric stream
    lyc = []
    for L in lyr:
        for c in lyric_hira(L["text"]):
            lyc.append((c, L["i"]))
    A, B = [c for c, _ in lyc], [c for c, _, _ in heard]
    n, m = len(A), len(B)
    MATCH, MIS, GAP = 2, -1, -1
    # DP (int lists, row by row, keep traceback as bytes)
    import array
    prev = array.array("i", [j * GAP for j in range(m + 1)])
    tb = [bytearray(m + 1) for _ in range(n + 1)]
    for j in range(1, m + 1):
        tb[0][j] = 2
    for i in range(1, n + 1):
        cur = array.array("i", [0]) * (m + 1)
        cur[0] = i * GAP
        tb[i][0] = 1
        ai = A[i - 1]
        row = tb[i]
        for j in range(1, m + 1):
            d = prev[j - 1] + (MATCH if ai == B[j - 1] else MIS)
            u = prev[j] + GAP
            l = cur[j - 1] + GAP
            if d >= u and d >= l:
                cur[j] = d
                row[j] = 0
            elif u >= l:
                cur[j] = u
                row[j] = 1
            else:
                cur[j] = l
                row[j] = 2
        prev = cur
    # traceback
    i, j = n, m
    pairs = []  # (lyric idx or None, heard idx or None)
    while i > 0 or j > 0:
        t = tb[i][j]
        if i > 0 and j > 0 and t == 0:
            pairs.append((i - 1, j - 1))
            i -= 1
            j -= 1
        elif i > 0 and (j == 0 or t == 1):
            pairs.append((i - 1, None))
            i -= 1
        else:
            pairs.append((None, j - 1))
            j -= 1
    pairs.reverse()
    # per line
    rep = []
    by_line = {L["i"]: {"match": [], "heard": [], "n": 0} for L in lyr}
    for c, li in lyc:
        by_line[li]["n"] += 1
    last_line = lyc[0][1]
    for a, b in pairs:
        if a is not None:
            last_line = lyc[a][1]
            if b is not None:
                by_line[last_line]["heard"].append(b)
                if A[a] == B[b]:
                    by_line[last_line]["match"].append(b)
        elif b is not None:
            # inserted heard chars belong to the line we are inside
            by_line[last_line]["heard"].append(b)
    for L in lyr:
        d = by_line[L["i"]]
        ms = d["match"]
        cov = len(ms) / max(1, d["n"])
        hs = sorted(d["heard"])
        heard_txt = "".join(B[k] for k in hs)
        asr_s = heard[ms[0]][1] if ms else None
        asr_e = heard[ms[-1]][1] if ms else None
        rep.append({"i": L["i"], "text": L["text"], "ours": L["start"], "asr": asr_s, "asr_end": asr_e,
                    "delta": None if asr_s is None else round(L["start"] - asr_s, 2), "cov": round(cov, 2),
                    "lyric_hira": lyric_hira(L["text"]), "heard_hira": heard_txt})
    json.dump(rep, open(os.path.join(HERE, "sync_report.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    for r in rep:
        a = "  -  " if r["asr"] is None else f"{r['asr']:7.2f}"
        dl = "     " if r["delta"] is None else f"{r['delta']:+5.2f}"
        flag = "" if r["lyric_hira"] == r["heard_hira"] else f"   heard: {r['heard_hira']}"
        print(f"{r['i']:2d} ours {r['ours']:7.2f} asr {a} d {dl} cov {r['cov']:.2f}  {r['text']}{flag}")


if __name__ == "__main__":
    main()
