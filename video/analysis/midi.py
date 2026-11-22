"""Read note on/off events from a standard MIDI file (no dependencies) and print phrases.

Usage: python mv/scripts/midi_notes.py "MIDI/0 Lead Vocals.mid" [--gap 0.30] [--json out.json]

Writes (with --json) a list of notes [start, end, pitch, velocity] in seconds, honouring tempo changes,
and prints phrases: runs of notes separated by rests longer than --gap seconds.
"""
import argparse
import json
import struct


def vlq(b, i):
    v = 0
    while True:
        c = b[i]
        i += 1
        v = (v << 7) | (c & 0x7F)
        if c < 0x80:
            return v, i


def read(path):
    b = open(path, "rb").read()
    assert b[:4] == b"MThd"
    hl = struct.unpack(">I", b[4:8])[0]
    fmt, ntr, div = struct.unpack(">HHH", b[8:14])
    i = 8 + hl
    events = []  # (tick, kind, data)
    for _ in range(ntr):
        assert b[i:i + 4] == b"MTrk", b[i:i + 4]
        ln = struct.unpack(">I", b[i + 4:i + 8])[0]
        j, end = i + 8, i + 8 + ln
        tick, status = 0, 0
        while j < end:
            d, j = vlq(b, j)
            tick += d
            c = b[j]
            if c == 0xFF:
                typ = b[j + 1]
                l, k = vlq(b, j + 2)
                data = b[k:k + l]
                if typ == 0x51:
                    events.append((tick, "tempo", (data[0] << 16) | (data[1] << 8) | data[2]))
                j = k + l
                continue
            if c in (0xF0, 0xF7):
                l, k = vlq(b, j + 1)
                j = k + l
                continue
            if c & 0x80:
                status = c
                j += 1
            hi = status & 0xF0
            if hi in (0xC0, 0xD0):
                j += 1
                continue
            d1, d2 = b[j], b[j + 1]
            j += 2
            if hi == 0x90 and d2 > 0:
                events.append((tick, "on", (d1, d2)))
            elif hi == 0x80 or (hi == 0x90 and d2 == 0):
                events.append((tick, "off", (d1, 0)))
        i = end
    events.sort(key=lambda e: (e[0], 0 if e[1] == "tempo" else (1 if e[1] == "off" else 2)))
    tempo, last_tick, sec = 500000, 0, 0.0
    open_notes, notes = {}, []
    for tick, kind, data in events:
        sec += (tick - last_tick) * tempo / 1e6 / div
        last_tick = tick
        if kind == "tempo":
            tempo = data
        elif kind == "on":
            open_notes.setdefault(data[0], []).append((sec, data[1]))
        else:
            st = open_notes.get(data[0])
            if st:
                s, v = st.pop(0)
                notes.append([round(s, 4), round(sec, 4), data[0], v])
    notes.sort()
    return notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("midi")
    ap.add_argument("--gap", type=float, default=0.30)
    ap.add_argument("--json")
    a = ap.parse_args()
    notes = read(a.midi)
    if a.json:
        json.dump(notes, open(a.json, "w"))
    phrases, cur = [], []
    for n in notes:
        if cur and n[0] - max(x[1] for x in cur) > a.gap:
            phrases.append(cur)
            cur = []
        cur.append(n)
    if cur:
        phrases.append(cur)
    print(f"{len(notes)} notes, {len(phrases)} phrases (gap > {a.gap}s)")
    for k, p in enumerate(phrases):
        print(f"{k:3d} {p[0][0]:7.2f}-{max(x[1] for x in p):7.2f}  {len(p):3d} notes")


if __name__ == "__main__":
    main()
