// Song analysis (public/data/audio.json, built by analysis/build_data.py).
export type Note = [number, number, number, number]; // start, end, pitch, vel(0..1)

export interface AudioData {
  duration: number;
  bpm: number;
  fps: number;
  beats: number[];
  downbeats: number[];
  sections: { name: string; start: number; end: number }[];
  onsets: Record<string, [number, number][]>;
  notes: Record<string, Note[]>;
  env: Record<string, number[]>;
}

function lowerBound(arr: number[], x: number): number {
  let lo = 0,
    hi = arr.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (arr[m] <= x) lo = m + 1;
    else hi = m;
  }
  return lo; // first index with arr[i] > x
}

export class Audio {
  d: AudioData;
  private onT: Record<string, number[]> = {};
  private noteT: Record<string, number[]> = {};
  constructor(d: AudioData) {
    this.d = d;
    for (const k in d.onsets) this.onT[k] = d.onsets[k].map((o) => o[0]);
    for (const k in d.notes) this.noteT[k] = d.notes[k].map((o) => o[0]);
  }
  get duration() {
    return this.d.duration;
  }
  /** fractional beat index */
  beatAt(t: number): number {
    const b = this.d.beats;
    const i = lowerBound(b, t) - 1;
    if (i < 0) {
      const p = b[1] - b[0];
      return (t - b[0]) / p;
    }
    if (i >= b.length - 1) {
      const p = b[b.length - 1] - b[b.length - 2];
      return b.length - 1 + (t - b[b.length - 1]) / p;
    }
    return i + (t - b[i]) / (b[i + 1] - b[i]);
  }
  timeOfBeat(x: number): number {
    const b = this.d.beats;
    const i = Math.floor(x);
    if (i < 0) return b[0] + x * (b[1] - b[0]);
    if (i >= b.length - 1) return b[b.length - 1] + (x - b.length + 1) * (b[b.length - 1] - b[b.length - 2]);
    return b[i] + (x - i) * (b[i + 1] - b[i]);
  }
  barAt(t: number) {
    return this.beatAt(t) / 4;
  }
  section(t: number) {
    for (const s of this.d.sections) if (t >= s.start && t < s.end) return s;
    return this.d.sections[this.d.sections.length - 1];
  }
  sec(name: string) {
    const s = this.d.sections.find((s) => s.name === name);
    if (!s) throw new Error('no section ' + name);
    return s;
  }
  env(name: string, t: number): number {
    const e = this.d.env[name];
    const x = t * this.d.fps;
    const i = Math.floor(x);
    if (i < 0) return e[0];
    if (i >= e.length - 1) return e[e.length - 1];
    return e[i] + (e[i + 1] - e[i]) * (x - i);
  }
  /** decaying impulse from the most recent onsets of a kind */
  hit(kind: string, t: number, half = 0.12): number {
    const ts = this.onT[kind];
    const os = this.d.onsets[kind];
    let i = lowerBound(ts, t) - 1;
    let v = 0;
    for (let k = 0; k < 3 && i >= 0; k++, i--) {
      const dt = t - ts[i];
      if (dt > half * 8) break;
      v = Math.max(v, os[i][1] * Math.exp((-dt * Math.LN2) / half));
    }
    return v;
  }
  events(kind: string, t0: number, t1: number): [number, number][] {
    const ts = this.onT[kind];
    const a = lowerBound(ts, t0 - 1e-9);
    const b = lowerBound(ts, t1);
    return this.d.onsets[kind].slice(a, b);
  }
  notesIn(kind: string, t0: number, t1: number): Note[] {
    const ts = this.noteT[kind];
    const a = lowerBound(ts, t0 - 1e-9);
    const b = lowerBound(ts, t1);
    return this.d.notes[kind].slice(a, b);
  }
}
