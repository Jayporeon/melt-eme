// outro 216.53 – 246.4: the music box again, in the dark.
//   おやすみ おやすみ エメ: soft hand type, then every glyph closes like an eyelid
//   あした かたちが あったら: each glyph forms out of a falling drop
//   また ぷちぷち しようかな: two tablets
//   ……しようかな: small, alone
//   end card: title + credits; the title melts away, fade to black
import { Frame, Post } from '../engine/engine';
import { Ctx, drop, glyph, layout, tablet, text } from '../engine/type';
import { clamp, easeIn, easeOut, inv, smooth, spring } from '../engine/util';
import { blister, C, F, hot, musicBox, rgba, ripple, win } from './_kit';
import { CREDIT, TITLE } from './intro';

export function outro(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
  const t = f.t;
  const L = (i: number) => f.ly.get(i);
  const IDX = {
    nite: f.ly.find('おやすみ').i,
    shape: f.ly.find('形が').i,
    again: f.ly.find('ぷちぷち').i,
    last: f.ly.lines[f.ly.lines.length - 1].i,
  };
  musicBox(ink, f, smooth(f.start, f.start + 2, t) * (1 - smooth(236, 240, t)) * 0.7);

  // L57 おやすみ — eyelids
  {
    const w = win(f, IDX.nite, 0.4, 1.4, 0.2);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = 84;
      const { p } = layout(ink, gs, F.hand, size, 960, 500, { weight: 600, gap: 0.5 });
      for (const q of p) {
        const g = q.g;
        const b = 1;
        const close = easeIn(smooth(w.l.end + 0.1 + g.k * 0.06, w.l.end + 0.7 + g.k * 0.06, t));
        glyph(ink, g.ch, q.x, q.y + close * size * 0.2, size, F.hand, {
          weight: 600,
          fill: t >= g.t0 ? C.sky : rgba(C.pale, 0.3),
          blur: (1 - b) * 10,
          alpha: w.a,
          sy: Math.max(0.04, 1 - close),
          sx: 1 + close * 0.15,
        });
      }
    }
  }

  // L58 あした かたちが あったら — drops become glyphs
  {
    const w = win(f, IDX.shape, 0.9, 1.0, 0.5);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = 78;
      const { p } = layout(ink, gs, F.hand, size, 960, 500, { weight: 600, gap: 0.5 });
      for (const q of p) {
        const g = q.g;
        const land = g.t0;
        const fall0 = land - 0.6;
        if (t < fall0) continue;
        if (t < land) {
          const s = inv(fall0, land, t);
          drop(ink, q.x, -40 + (q.y - -40) * easeIn(s), 9, C.sky, 0.9, 1 + s * 0.5);
          continue;
        }
        const s = t - land;
        const sp = spring(s, 12, 6);
        glyph(ink, g.ch, q.x, q.y, size, F.hand, {
          weight: 600,
          fill: C.sky,
          sx: sp * (1 + 0.3 * Math.exp(-s * 8)),
          sy: sp * (1 - 0.3 * Math.exp(-s * 8)),
          alpha: clamp(s / 0.15) * (1 - w.out),
          blur: Math.exp(-s * 6) * 6,
        });
      }
    }
  }

  // L59 また ぷちぷち しようかな
  {
    const w = win(f, IDX.again, 0.4, 0.5, 0.5);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = 78;
      const { p } = layout(ink, gs, F.hand, size, 960, 500, { weight: 600, gap: 0.5 });
      for (const q of p) {
        const g = q.g;
        const b = 1;
        glyph(ink, g.ch, q.x, q.y, size, F.hand, {
          weight: 600,
          fill: t >= g.t0 ? C.sky : rgba(C.pale, 0.3),
          blur: (1 - b) * 8,
          alpha: w.a,
        });
      }
      // a small, mostly empty sheet; ぷちぷち pops the last two
      const pu = gs.filter((g) => g.ch === 'ぷ').map((g) => g.t0);
      const pops: number[] = [0, 0, Infinity, 0, 0, Infinity];
      pops[2] = pu[0];
      pops[5] = pu[1];
      const sa = clamp((t - (w.l.start - 0.2)) / 0.6) * (1 - w.out);
      blister(ink, t, 960, 700, 0.62, -0.08, pops, sa * 0.9, { cols: 3, seed: 77, jump: 520, grav: 900 });
    }
  }

  // L60 ……しようかな
  {
    const w = win(f, IDX.last, 0.5, 1.5, 0.8);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const { p } = layout(ink, gs, F.hand, 46, 960, 540, { weight: 400, gap: 0.5 });
      for (const q of p) {
        glyph(ink, q.g.ch, q.x, q.y, 46, F.hand, { fill: t >= q.g.t0 ? C.sky : rgba(C.pale, 0.3), alpha: w.a });
      }
    }
  }

  // end card
  const cardIn = 236.0;
  const meltOut = smooth(242.6, 245.4, t);
  if (t > cardIn - 0.2) {
    const chars = [...TITLE];
    const fake = chars.map((ch, k) => ({ ch, t0: 0, t1: 0, word: 0, k, punct: false }));
    const size = 128;
    const { p } = layout(ink, fake, F.maru, size, 960, 470, { weight: 900 });
    p.forEach((q, k) => {
      const s = t - (cardIn + k * 0.09);
      if (s < 0) return;
      const a = clamp(s / 0.6) * (1 - smooth(244, 245.8, t));
      glyph(ink, q.g.ch, q.x, q.y + (1 - easeOut(clamp(s / 0.8))) * 24, size, F.maru, {
        weight: 900,
        fill: k >= 5 ? C.sky : C.paper,
        alpha: a,
        blur: (1 - clamp(s / 0.6)) * 10,
        shadow: 0.4,
      });
    });
    const ca = smooth(cardIn + 1.0, cardIn + 1.8, t) * (1 - smooth(244, 245.8, t));
    text(ink, CREDIT, 960, 610, 30, F.body, { weight: 300, fill: rgba(C.pale, 0.9), alpha: ca, track: 0.05 });
    // one drop forms under the title and falls
    // the drop is let go (d0 + 0.8) on the echoed ……しようかな, which the lead and backing stems both start at
    // 239.3 s (the user heard it around 3:58.2; at 238.2 only keys/synth are playing)
    const d0 = 239.3 - 0.8;
    if (t > d0 && t < 241.6) {
      const s = t - d0;
      const y = 540 + (s > 0.8 ? 0.5 * 2400 * (s - 0.8) ** 2 : 0);
      if (y < 900) drop(ink, 1288, y, 11 * smooth(d0, d0 + 0.8, t), C.sky, 1, 1 + clamp(s - 0.8));
    }
    ripple(ink, t, d0 + 0.8 + Math.sqrt((2 * 360) / 2400), 1288, 900, C.sky, 3, 0.7);
  }

  return {
    bg: 0,
    light: 0.3 * (1 - smooth(240, 246, t)),
    melt: 0.02 + meltOut * 1.6 + smooth(L(IDX.shape).end - 0.2, L(IDX.shape).end + 0.8, t) * (1 - smooth(L(IDX.again).start - 0.3, L(IDX.again).start, t)) * 0.8,
    meltSeed: 57,
    bloom: 0.6,
    vig: 0.8,
    grain: 0.08,
    fade: smooth(244.6, 246.3, t),
    flash: Math.max(0, 1 - (t - f.start) / 0.2) * 0.3,
    flashCol: [0.8, 0.9, 1],
  };
}
export { text };
