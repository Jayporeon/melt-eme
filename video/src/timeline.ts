// Scene windows: one scene per section. A cut is the section start, moved earlier to the beat
// before a pickup line when the singer comes in ahead of the downbeat.
import { Audio } from './engine/audio';
import { Entry } from './engine/engine';
import { Lyrics } from './engine/lyrics';
import { bridge } from './scenes/bridge';
import { makeChorus } from './scenes/chorus';
import { makeDrop } from './scenes/drop';
import { CREDIT, intro, TITLE } from './scenes/intro';
import { outro } from './scenes/outro';
import { prechorus } from './scenes/prechorus';
import { verse1 } from './scenes/verse1';
import { verse2 } from './scenes/verse2';

export const EXTRA_TEXT = TITLE + CREDIT + '0123456789目的地：なしDAY n+1 1R 日月火水木金土' + 'abcdefghijklmnopqrstuvwxyz';

export function buildTimeline(au: Audio, ly: Lyrics): Entry[] {
  const sec = (n: string) => au.sec(n).start;
  // never cut while the previous line is still being sung
  const cut = (name: string, firstLine: number, lead = 0.35) => {
    const s = sec(name);
    const prevEnd = firstLine > 0 ? ly.get(firstLine - 1).end : 0;
    const pick = Math.max(ly.get(firstLine).start - lead, prevEnd);
    if (pick >= s - 0.2) return s;
    const b = au.timeOfBeat(Math.floor(au.beatAt(pick)));
    return b >= prevEnd ? b : pick;
  };
  const c = {
    verse1: sec('verse1'),
    pre: sec('prechorus'),
    ch1: cut('chorus1', 17),
    drop1: cut('drop1', 25, 0.15), // ばいばい… is sung out at 101.0
    verse2: cut('verse2', 29),
    bridge: cut('bridge', 37),
    ch2: cut('chorus2', 45),
    drop2: cut('drop2', 53),
    outro: sec('outro'),
  };
  const E = (id: string, start: number, end: number, fn: Entry['fn']): Entry => ({ id, start, end, fn });
  return [
    E('intro', 0, c.verse1, intro),
    E('verse1', c.verse1, c.pre, verse1),
    E('prechorus', c.pre, c.ch1, prechorus),
    E('chorus1', c.ch1, c.drop1, makeChorus([17, 18, 19, 20, 21, 22, 23, 24], 0)),
    E('drop1', c.drop1, c.verse2, makeDrop([25, 26, 27, 28], false)),
    E('verse2', c.verse2, c.bridge, verse2),
    E('bridge', c.bridge, c.ch2, bridge),
    E('chorus2', c.ch2, c.drop2, makeChorus([45, 46, 47, 48, 49, 50, 51, 52], 1)),
    E('drop2', c.drop2, c.outro, makeDrop([53, 54, 55, 56], true)),
    E('outro', c.outro, au.duration + 1, outro),
  ];
}
