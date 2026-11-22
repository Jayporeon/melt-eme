// Lyrics (public/data/lyrics.json). Each line has words; each word has per-mora spans (syl).
// glyphs(line) expands a line into single characters with the time each one is sung,
// which is what every kinetic-type scene animates.
import { clamp } from './util';

export interface Syl extends Array<number | string> {
  0: number;
  1: number;
  2: string;
}
export interface Word {
  w: string;
  start: number;
  end: number;
  syl: [number, number, string][];
}
export interface Line {
  i: number;
  text: string;
  en: string;
  start: number;
  end: number;
  words: Word[];
}
export interface Glyph {
  ch: string;
  t0: number; // sung from
  t1: number; // sung until
  word: number; // word index in the line
  k: number; // glyph index in the line (spaces excluded)
  punct: boolean;
}

const PUNCT = new Set([...' 　・「」『』？！?!…、。（）()~〜']);
const SMALL = new Set([...'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ']);

export class Lyrics {
  lines: Line[];
  private cache = new Map<number, Glyph[]>();
  constructor(d: { lines: Line[] }) {
    this.lines = d.lines;
  }
  get(i: number): Line {
    const l = this.lines[i];
    if (!l) throw new Error('no line ' + i);
    return l;
  }
  find(q: string, nth = 0): Line {
    const hits = this.lines.filter((l) => l.text.includes(q));
    if (!hits[nth]) throw new Error(`no line matching ${q} #${nth}`);
    return hits[nth];
  }
  /** all characters of a line, with their sung times. Spaces are dropped (word index tells breaks). */
  glyphs(line: Line): Glyph[] {
    const c = this.cache.get(line.i);
    if (c) return c;
    const out: Glyph[] = [];
    let k = 0;
    line.words.forEach((w, wi) => {
      const chars = [...w.w];
      // map chars to syllable units in order: each unit's display text (syl[2]) says how many characters
      // it covers (a mora like きょ is 2, a kanji like 京 is 1 but several morae long)
      const syl = w.syl;
      const idx: number[] = [];
      let si = 0,
        used = 0;
      for (const ch of chars) {
        if (PUNCT.has(ch)) {
          idx.push(-1);
          continue;
        }
        const unitLen = syl[si] ? [...syl[si][2]].length : 1;
        if (!syl[si] && SMALL.has(ch) && idx.length) {
          idx.push(Math.max(0, si - 1));
          continue;
        }
        idx.push(Math.min(si, syl.length - 1));
        used++;
        if (used >= unitLen) {
          si++;
          used = 0;
        }
      }
      chars.forEach((ch, j) => {
        let mi = idx[j];
        let t0: number, t1: number;
        if (mi < 0) {
          // punctuation: borrow the next mora's start; trailing punctuation goes with the last sung mora
          let n = j + 1;
          while (n < chars.length && idx[n] < 0) n++;
          if (n < chars.length && syl[idx[n]]) {
            t0 = t1 = syl[idx[n]][0];
          } else {
            let pj = j - 1;
            while (pj >= 0 && idx[pj] < 0) pj--;
            const prev = pj >= 0 ? syl[Math.min(idx[pj], syl.length - 1)] : syl[syl.length - 1];
            t0 = t1 = prev ? prev[0] : w.end;
          }
        } else {
          mi = Math.min(mi, syl.length - 1);
          const s = syl[mi];
          t0 = s ? s[0] : w.start;
          t1 = s ? s[1] : w.end;
        }
        out.push({ ch, t0, t1, word: wi, k: k++, punct: mi < 0 });
      });
    });
    this.cache.set(line.i, out);
    return out;
  }
  /** 0 before the glyph is sung, 1 after, linear during */
  static prog(g: { t0: number; t1: number }, t: number): number {
    if (g.t1 <= g.t0) return t >= g.t0 ? 1 : 0;
    return clamp((t - g.t0) / (g.t1 - g.t0));
  }
  /** visibility envelope of a line: fade in `pre` s before start, hold `post` s after end or until `until` */
  static vis(l: Line, t: number, pre = 0.35, post = 0.6, until = Infinity): { a: number; i: number; o: number } {
    const end = Math.min(l.end + post, until);
    const i = clamp((t - (l.start - pre)) / pre);
    const o = clamp((t - end) / 0.3);
    return { a: i * (1 - o), i, o };
  }
}
