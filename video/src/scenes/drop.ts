// drops (101.75 – 116.2, 202.26 – 216.53): vocal chops. The current chunk is a giant slam in the
// middle; the whole frame is wallpapered with the same chunk, scrolling, swapping colour each beat;
// heavy jelly wobble on the bass. Drop 2 drains everything away at the end.
import { Frame, Post } from '../engine/engine';
import { Ctx, glyph, layout, text } from '../engine/type';
import { clamp, easeIn, hash, smooth, spring } from '../engine/util';
import { blister, C, chunks, F, fit, rgba } from './_kit';

export function makeDrop(lines: number[], drain: boolean) {
  return function drop(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
    const t = f.t;
    // collect all chunks of the section in time order
    const all = lines.flatMap((li) => chunks(f.ly.glyphs(f.ly.get(li))).map((c) => ({ ...c, li })));
    if (drain) {
      // drop 2 is one sung line; after it, its chunks keep coming back as chops, one per beat
      const base = all.slice();
      const lastEnd = Math.max(...base.map((c) => c.t1));
      let b = Math.ceil(f.au.beatAt(lastEnd + 0.15));
      let k = 0;
      while (f.au.timeOfBeat(b) < f.end - 2.4) {
        const c = base[k % base.length];
        all.push({ ...c, t0: f.au.timeOfBeat(b) + 0.03, t1: f.au.timeOfBeat(b + 1), li: -1 - k });
        b += c.text.length > 3 ? 2 : 1;
        k++;
      }
    }
    let cur = all[0];
    let ci = 0;
    all.forEach((c, i) => {
      if (t >= c.t0) {
        cur = c;
        ci = i;
      }
    });
    const next = all[ci + 1];
    const curEnd = next ? next.t0 : f.end;
    const s = t - cur.t0;
    const beatI = Math.floor(f.beat);
    // drop 2 melts away only once its last word (また明日) has started: from 0.2 s after that chunk
    const lastChunk = all[all.length - 1];
    const drainFrom = lastChunk ? lastChunk.t0 + 0.2 : f.end - 1.0;
    const end = drain ? smooth(drainFrom, f.end + 0.1, t) : 0;

    // wallpaper of the chunk
    const wp = cur.text;
    const cols = beatI % 2 === 0 ? [C.white, C.sky2] : [C.deep, C.white];
    const size = 64;
    const step = Math.max(size * [...wp].length * 1.05 + 50, 160);
    const scroll = (t * 90) % step;
    ink.save();
    for (let r = -1; r < 14; r++) {
      const y = r * 96 + ((t * 40) % 96);
      for (let c = -1; c < 1920 / step + 2; c++) {
        const x = c * step + (r % 2) * step * 0.5 - scroll * (r % 2 ? 1 : -1);
        const lit = hash(r * 97 + c * 13 + beatI * 7) > 0.8;
        text(ink, wp, x, y, size, F.slam, { fill: lit ? C.white : cols[(r + c + 10) % 2], alpha: (lit ? 0.6 : 0.3) * (1 - end) });
      }
    }
    ink.restore();

    // giant chunk
    if (s >= 0 && t < curEnd + 0.2) {
      const gs = cur.gs;
      const sz = fit(ink, gs, F.slam, 380, 1600, 400, 0.05);
      const { p } = layout(ink, gs, F.slam, sz, 960, 470, { gap: 0.05 });
      const sp = 1.6 - 0.6 * spring(s, 18, 8);
      const rot = (hash(ci * 7 + lines[0]) - 0.5) * 0.18;
      const isTail = !next || next.li !== cur.li;
      for (const q of p) {
        const g = q.g;
        const lit = cur.li < 0 || t >= g.t0;
        glyph(ink, g.ch, 960 + (q.x - 960) * sp, 470, sz * sp, F.slam, {
          fill: lit ? C.sky : rgba(C.paper, 0.4),
          stroke: C.ink,
          sw: 0.09,
          rot,
          alpha: 1 - clamp((t - curEnd) / 0.2) * (isTail ? 0 : 1),
          shadow: 0.6,
        });
      }
    }

    // blister sheet at the bottom: every ぷち chop pops the next tablet; a fresh sheet when one runs out
    {
      // ぷち and ごくん each pop one tablet
      const pu = all.filter((c) => c.text === 'ぷち' || c.text === 'ごくん').map((c) => c.t0);
      const m = pu.filter((x) => x <= t).length;
      const sheet = Math.floor(Math.max(0, m - 1) / 10);
      const pops: number[] = [];
      for (let k = sheet * 10; k < Math.min(pu.length, sheet * 10 + 10); k++) pops[[1, 7, 3, 8, 0, 6, 4, 9, 2, 5][k % 10]] = pu[k];
      const enter = sheet > 0 ? spring(t - pu[sheet * 10] + 0.25, 12, 7) : clamp((t - f.start) / 0.3);
      blister(ink, t, 960, 830, 1.0 * enter, -0.03, pops, 1 - end, { seed: 40 + sheet + (drain ? 9 : 0), jump: 1250, grav: 2300, grow: 1.6 });
    }

    const k = f.kick;
    const sn = f.snare;
    const inv = beatI % 8 === 7 ? sn * 0.9 : 0;
    return {
      bg: 5,
      bgA: drain ? 1 : 0,
      wob: (0.8 + 1.1 * f.bass) * (1 - end * 0.5),
      wobF: 6,
      melt: 0.1 + end * 3.5,
      meltSeed: beatI * 1.3,
      zoom: 1 + 0.05 * k,
      rgb: 0.6 * k,
      glitch: 0.25 * sn,
      invert: inv,
      bloom: 0.3,
      bloomThr: 1.0,
      ca: 1.0 + k,
      shake: [(hash(beatI) - 0.5) * 0.01 * k, (hash(beatI + 9) - 0.5) * 0.01 * k],
      fade: drain ? easeIn(smooth(f.end - 0.5, f.end, t)) : 0,
      flash: Math.max(0, 1 - (t - f.start) / 0.3) * 0.8,
      flashCol: [1, 1, 1],
      tint: [1 - end * 0.6, 1 - end * 0.4, 1 - end * 0.2],
    };
  };
}
