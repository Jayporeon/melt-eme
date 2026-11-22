// intro 0 – 14.71: music box in the dark. Whispered lines type on out of blur.
// Title drops in letter by letter on the beat, then melts. A drop falls into verse 1.
import { Frame, Post } from '../engine/engine';
import { Ctx, drop, glyph, layout, text } from '../engine/type';
import { clamp, easeIn, easeOut, inv, smooth, spring } from '../engine/util';
import { born, C, F, musicBox, rgba, ripple, win } from './_kit';

export const TITLE = 'とけちゃう、エメ';
export const CREDIT = '歌手　Suno V6　／　作詞　Opus 5.5';
// shown on the end card: Eme is a fan character created by ぴょんこ
export const CHARA_CREDIT = 'エメは ぴょんこさん（X: @pyon_ko_）による シャワーズの二次創作キャラクターです';

function whisper(ink: Ctx, f: Frame, i: number, y: number, size: number, gone = 1e9) {
  const w = win(f, i, 0.3, 0.9, 0.4);
  if (!w.on) return;
  const gs = f.ly.glyphs(w.l);
  const { p } = layout(ink, gs, F.hand, size, 960, y, { weight: 600, gap: 0.5 });
  for (const q of p) {
    const b = born(q.g, f.t, 0.08, 0.5);
    const out = Math.max(w.out, smooth(gone - 0.4, gone, f.t));
    const hotv = clamp(1 - (f.t - q.g.t1) * 1.5) * (f.t >= q.g.t0 ? 1 : 0);
    glyph(ink, q.g.ch, q.x, q.y + (1 - easeOut(b)) * 22 - out * 30, size, F.hand, {
      weight: 600,
      alpha: b * (1 - out),
      blur: (1 - b) * 14 + out * 10,
      fill: hotv > 0.4 || f.t >= q.g.t0 ? C.sky : C.pale,
    });
  }
}

export function intro(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
  const t = f.t;
  // the whispered はろー under the title (~3.3-4.1 s on the lead stem) is not a lyric line; the lead-vocal
  // loudness itself drives a flash of the title glow and the music-box comb, so it is always in sync
  const wg = t < 7.5 ? clamp((f.au.env('vocal', t) - 0.08) * 2.6) : 0;
  musicBox(ink, f, smooth(0.3, 2.5, t) * (1 - smooth(13.2, 14.5, t)) * (0.9 + 0.9 * wg), Infinity, wg);
  whisper(ink, f, 0, 470, 62);

  // title: letters drop in on half beats from ~1.6 s, melt away before the first whisper
  const tb0 = f.au.beatAt(1.55);
  const b0 = Math.ceil(tb0);
  const chars = [...TITLE];
  const size = 150;
  const melt = smooth(6.4, 7.4, t) * (1 - smooth(7.6, 7.8, t));
  const ta = 1 - smooth(7.0, 7.6, t);
  if (t > 1.3 && ta > 0) {
    const fake = chars.map((ch, k) => ({ ch, t0: 0, t1: 0, word: 0, k, punct: false }));
    const { p } = layout(ink, fake, F.maru, size, 960, 470, { weight: 900 });
    p.forEach((q, k) => {
      const tk = f.au.timeOfBeat(b0 + k * 0.5);
      const s = t - tk;
      if (s < 0) return;
      const y = q.y - (1 - spring(s, 14, 7)) * 160;
      const sq = 1 + 0.25 * Math.exp(-s * 10) * Math.sin(s * 30);
      glyph(ink, q.g.ch, q.x, y, size, F.maru, {
        weight: 900,
        fill: k >= 5 ? C.sky : C.paper,
        sy: 1 / sq,
        sx: sq,
        alpha: ta,
        shadow: 0.4,
      });
    });
    const ca = smooth(3.6, 4.2, t) * ta;
    text(ink, CREDIT, 960, 600, 28, F.body, { weight: 300, fill: rgba(C.pale, 0.85), alpha: ca, track: 0.05 });
  }
  whisper(ink, f, 1, 520, 66, f.au.sec('verse1').start - 0.45);

  // a drop falls into verse 1 (lands exactly on the downbeat)
  const land = f.au.sec('verse1').start;
  const d0 = land - 0.85;
  if (t > d0 - 0.4 && t < land) {
    const s = inv(d0, land, t);
    const y = -60 + easeIn(s) * 600;
    const form = smooth(d0 - 0.4, d0, t);
    drop(ink, 960, y, 16 * form + 0.1, C.sky, 1, 1 + s * 0.6);
  }
  ripple(ink, t, land, 960, 545);

  return {
    bg: 0,
    light: 0.25 + 0.35 * smooth(0, 6, t),
    melt: melt * 1.4,
    meltSeed: 3,
    fade: 1 - smooth(0, 1.6, t),
    bloom: 0.6 + 1.3 * wg,
    bloomThr: 0.78 - 0.25 * wg,
    expo: 1 + 0.12 * wg,
    grain: 0.08,
    vig: 0.75,
    sub: true,
  };
}
