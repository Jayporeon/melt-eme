// verse 2 116.2 – 144.97.
// First half: behind a thin soap film. Unsung glyphs are blurred, sung ones come into focus.
//   しあわせ floats inside a bubble (pink, the only pink in the video) and bursts on われちゃう.
// Second half (from L33): the comedown. Cold bathroom tiles, frost colour, nausea double vision.
//   トイレの ゆかが…: each glyph tips over and lies on the floor
//   とろとろ: melts; どうせ あしたも このかたち: glyphs flatten into a puddle.
import { Frame, Post } from '../engine/engine';
import { Ctx, glyph, layout } from '../engine/type';
import { clamp, easeIn, easeInOut, easeOut, frameIdx, hash, inv, noise1, smooth, spring } from '../engine/util';
import { bump, C, F, fit, hot, rgba, win } from './_kit';

const iri = (k: number, t: number) => {
  const h = 198 + 12 * Math.sin(k * 0.7 + t * 0.8); // stays in the sky-blue range
  return `hsl(${h.toFixed(0)} 90% 78%)`;
};

export function verse2(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
  const t = f.t;
  const L = (i: number) => f.ly.get(i);
  const cold = smooth(L(33).start - 0.15, L(33).start + 0.45, t);

  // ---- film lines 29, 30, 32 (31 handled with the bubble)
  for (const li of [29, 30, 32]) {
    // シャボン玉 (L32, bottom of the frame) may stay 0.35 s into the next line so 玉 finishes lighting
    const w = win(f, li, 0.4, 0.8, 0.35, li === 32 ? 0.35 : 0);
    if (!w.on) continue;
    const gs = f.ly.glyphs(w.l);
    const y = li === 32 ? 800 : 500;
    const size = fit(ink, gs, F.body, li === 32 ? 76 : 92, 1600, 300, 0.5);
    const { p } = layout(ink, gs, F.body, size, 960, y, { weight: 300, gap: 0.5 });
    for (const q of p) {
      const g = q.g;
      const on = t >= g.t0;
      const focus = smooth(g.t0 - 0.15, g.t0 + 0.25, t);
      const poka = li === 29 && w.l.words[g.word].w.startsWith('ぽか') && on ? 1 + 0.08 * Math.sin((t - g.t0) * 14) : 1;
      glyph(ink, g.ch, q.x + noise1(t * 0.5 + g.k, li) * 6, q.y + noise1(t * 0.4 + g.k, li + 9) * 8, size, F.body, {
        weight: 300 + 300 * focus,
        fill: on ? iri(g.k, t) : rgba(C.pale, 0.45),
        blur: (1 - focus) * 9,
        alpha: w.a,
        sx: poka,
        sy: poka,
      });
    }
  }

  // ---- bubble with しあわせ (L31 -> burst in L32)
  {
    const l31 = L(31),
      l32 = L(32);
    const burst = l32.words[1].start;
    const s0 = l31.start - 0.5;
    if (t > s0 && t < burst + 2) {
      const grow = easeOut(clamp((t - s0) / 1.0));
      const bx = 960 + Math.sin(t * 0.7) * 40;
      const by = 470 - (t - s0) * 14;
      const r = 250 * grow;
      const popped = t >= burst;
      const ps = t - burst;
      if (!popped) {
        // soap bubble
        ink.save();
        const gr = ink.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.1, bx, by, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.02)');
        gr.addColorStop(0.8, 'rgba(190,230,255,0.06)');
        gr.addColorStop(1, 'rgba(230,200,255,0.25)');
        ink.fillStyle = gr;
        ink.beginPath();
        ink.arc(bx, by, r, 0, Math.PI * 2);
        ink.fill();
        ink.lineWidth = 3;
        ink.strokeStyle = `hsla(${(200 + Math.sin(t * 2) * 50).toFixed(0)},90%,80%,0.8)`;
        ink.stroke();
        ink.beginPath();
        ink.ellipse(bx - r * 0.42, by - r * 0.45, r * 0.16, r * 0.08, -0.7, 0, Math.PI * 2);
        ink.fillStyle = 'rgba(255,255,255,0.7)';
        ink.fill();
        ink.restore();
      } else if (ps < 0.6) {
        // pop ring + droplets
        ink.save();
        ink.globalAlpha = 1 - ps / 0.6;
        ink.strokeStyle = C.pale;
        ink.lineWidth = 3;
        ink.beginPath();
        ink.arc(bx, by, r * (1 + ps * 1.4), 0, Math.PI * 2);
        ink.setLineDash([14, 22]);
        ink.stroke();
        ink.restore();
      }
      // しあわせ inside
      const gs = f.ly.glyphs(l31);
      const shi = gs.filter((g) => g.word === 0);
      const { p } = layout(ink, shi, F.pop, 96, bx, by, { gap: 0 });
      for (const q of p) {
        const g = q.g;
        const on = t >= g.t0;
        if (!on && !popped) {
          glyph(ink, g.ch, q.x, q.y, 96, F.pop, { fill: rgba(C.pink, 0.3), alpha: grow });
          continue;
        }
        let x = q.x,
          y = q.y,
          rot = 0,
          a = grow;
        if (popped) {
          const ang = hash(g.k * 5 + 1) * Math.PI * 2;
          const v = 500 + hash(g.k * 5 + 2) * 400;
          x += Math.cos(ang) * v * ps;
          y += Math.sin(ang) * v * ps + 900 * ps * ps;
          rot = (hash(g.k) - 0.5) * 8 * ps;
          a = clamp(1 - ps / 1.2);
        }
        const sp = popped ? 1 : spring(t - g.t0 + 0.02, 12, 6);
        glyph(ink, g.ch, x, y + Math.sin(t * 2 + g.k) * 6, 96, F.pop, {
          fill: C.pink,
          sx: sp,
          sy: sp,
          rot,
          alpha: a,
          shadow: 0.2,
        });
      }
      // rest of L31 under the bubble
      const rest = gs.filter((g) => g.word > 0);
      if (!popped || ps < 0.4) {
        const { p: p2 } = layout(ink, rest, F.body, 64, 960, 820, { weight: 300, gap: 0.5 });
        for (const q of p2) {
          const g = q.g;
          const focus = smooth(g.t0 - 0.15, g.t0 + 0.25, t);
          glyph(ink, g.ch, q.x, q.y + (q.g.word === 3 ? -Math.sin(clamp((t - g.t0) / 1.2) * Math.PI) * 24 : 0), 64, F.body, {
            weight: 300 + 300 * focus,
            fill: t >= g.t0 ? iri(g.k, t) : rgba(C.pale, 0.45),
            blur: (1 - focus) * 8,
            alpha: (1 - clamp((t - Math.max(l31.end, l32.start - 0.05)) / 0.12)) * grow,
          });
        }
      }
    }
  }

  // ---- comedown
  const sway = Math.sin(t * 0.9) * 0.018 * cold;
  const fi = frameIdx(t);
  // L33 きれめは さむくて きもちわるい
  {
    const w = win(f, 33, 0.3, 0.6, 0.3);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = fit(ink, gs, F.min, 88, 1600, 500, 0.45);
      const { p } = layout(ink, gs, F.min, size, 960, 500, { weight: 500, gap: 0.45 });
      for (const q of p) {
        const g = q.g;
        const on = t >= g.t0;
        const shiver = on ? 2.5 : 0.8;
        glyph(ink, g.ch, q.x + (hash(fi * 3 + g.k) - 0.5) * shiver, q.y + (hash(fi * 5 + g.k) - 0.5) * shiver, size, F.min, {
          weight: 500,
          fill: !on ? rgba(C.frost, 0.3) : C.sky,
          alpha: w.a,
          sx: bump(g, t, 0.12),
          sy: bump(g, t, 0.12),
        });
      }
    }
  }
  // L34 トイレの ゆかが いちばん やさしい — glyphs tip over onto the floor
  {
    // the line is sung upright; once it is sung out the glyphs tip over one by one and stay lying on the
    // floor (below the next line) until the next line has been sung too
    const w0 = win(f, 34, 0.3, 0.6, 0.35);
    const e34 = L(35).end + 0.2;
    const w = { ...w0, on: t >= w0.s && t < e34, a: clamp((t - w0.s) / 0.3) * (1 - clamp((t - (e34 - 0.4)) / 0.4)) };
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = fit(ink, gs, F.min, 84, 1500, 500, 0.5);
      const floor = 760;
      const { p } = layout(ink, gs, F.min, size, 960, floor - size / 2, { weight: 500, gap: 0.5 });
      for (const q of p) {
        const g = q.g;
        const on = t >= g.t0;
        const tip = easeInOut(clamp((t - (w.l.end + 0.05 + g.k * 0.06)) / 0.55));
        const ang = -tip * (Math.PI / 2) * (1 + 0.08 * Math.sin(tip * Math.PI));
        // pivot at bottom-left corner of the glyph
        const px = q.x - q.w / 2,
          py = floor;
        const cx = px + Math.cos(ang - Math.PI / 4) * (size * 0.7071),
          cy = py + Math.sin(ang - Math.PI / 4) * (size * 0.7071);
        const yasa = w.l.words[g.word].w.startsWith('優し');
        glyph(ink, g.ch, cx, cy, size, F.min, {
          weight: 500,
          rot: ang,
          fill: !on ? rgba(C.frost, 0.3) : C.sky,
          alpha: w.a,
        });
      }
    }
  }
  // L35 こわく なるほど えりまき とろとろ
  let melt = 0.04;
  {
    const w = win(f, 35, 0.3, 0.6, 0.3);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = fit(ink, gs, F.min, 92, 1600, 500, 0.45);
      const { p } = layout(ink, gs, F.min, size, 960, 470, { weight: 500, gap: 0.45 });
      const toro = w.l.words[3];
      melt += smooth(toro.start, toro.end + 0.4, t) * 1.3 * (1 - w.out);
      for (const q of p) {
        const g = q.g;
        const on = t >= g.t0;
        const st = g.word === 3 && on ? 1 + 0.7 * easeOut(clamp((t - g.t0) / 1)) : 1;
        glyph(ink, g.ch, q.x, q.y + (size * (st - 1)) / 2, size, F.min, {
          weight: 500,
          fill: !on ? rgba(C.frost, 0.3) : hot(g, t) > 0.4 ? C.sky : C.frost,
          sy: st,
          alpha: w.a,
        });
      }
    }
  }
  // L36 どうせ あしたも このかたち — flatten into a puddle
  {
    const w = win(f, 36, 0.3, 2, 0.4);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = fit(ink, gs, F.min, 92, 1500, 500, 0.45);
      const { p } = layout(ink, gs, F.min, size, 960, 480, { weight: 500, gap: 0.45 });
      for (const q of p) {
        const g = q.g;
        const on = t >= g.t0;
        const fl = easeIn(smooth(w.l.end + g.k * 0.04, w.l.end + 0.9 + g.k * 0.04, t));
        glyph(ink, g.ch, 960 + (q.x - 960) * (1 + fl * 0.25), q.y + fl * 330, size, F.min, {
          weight: 500,
          fill: !on ? rgba(C.frost, 0.3) : hot(g, t) > 0.4 ? C.sky : lerpCol(fl),
          sy: 1 - fl * 0.82,
          sx: 1 + fl * 0.3,
          alpha: w.a,
        });
      }
      // the puddle under them
      const pa = smooth(w.l.start + 0.4, w.l.end + 0.6, t) * w.a;
      if (pa > 0) {
        ink.save();
        ink.globalAlpha = pa * 0.35;
        ink.fillStyle = C.sky2;
        ink.beginPath();
        ink.ellipse(960, 820, 520 * pa, 34 * pa, 0, 0, Math.PI * 2);
        ink.fill();
        ink.restore();
      }
    }
  }

  const film = 1 - cold;
  return {
    bg: 2,
    bg2: 3,
    bgMix: cold,
    bgA: t * 0.05,
    light: 0.85,
    double: film * smooth(L(30).start, L(30).start + 0.5, t) * (1 - smooth(L(31).start - 0.3, L(31).start, t)) * 0.8 + cold * 0.9,
    doubleOff: [Math.sin(t * 1.1) * 0.006 * (1 + cold), Math.cos(t * 0.8) * 0.004 * (1 + cold)],
    rot: sway,
    zoom: 1.0 + 0.015 * Math.sin(t * 0.6) * cold,
    melt,
    meltSeed: 31,
    sat: 1 - 0.45 * cold,
    bloom: 0.55 - 0.2 * cold,
    grain: 0.07 + 0.05 * cold,
    vig: 0.6 + 0.2 * cold,
    flash: Math.max(0, 1 - (t - f.start) / 0.3) * 0.5,
    flashCol: [0.85, 0.95, 1],
  };
}

function lerpCol(x: number) {
  return x > 0.5 ? C.sky2 : C.frost;
}
export { inv, spring };
