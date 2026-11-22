// pre-chorus 43.78 – 72.81: vertical columns (縦書き), right to left, like a page.
//  L10 かぞえるのは: a huge counter ticks per beat behind, stops on やめた
//  L11 みずいろ おなかの: the dark fills faintly with sky water and tablets
//  L12 すけて きらきら: the column turns to outline, tablets twinkle into stars
//  L13 ぽたり: one lemon drop (the yellow fin) falls from the column
//  L14 「ごうほうだから へいきだよ」: proper, upright mincho, stamped; it starts to tremble
//  L15 だれに いいわけ: each glyph flips from mirrored to facing you
//  L16 溶けて・溶けて・溶け 溶け 溶けて……: five chunks, each bigger, melting harder, into the chorus
import { Frame, Post } from '../engine/engine';
import { Ctx, drop, glyph, layout, sparkle, tablet, text } from '../engine/type';
import { clamp, easeIn, easeOut, frameIdx, hash, inv, noise1, smooth, spring } from '../engine/util';
import { bump, C, chunks, F, fit, hot, rgba, ripple, win } from './_kit';

const COLS: [number, number][] = [
  [10, 1530],
  [11, 1290],
  [12, 1050],
  [13, 810],
];

export function prechorus(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
  const t = f.t;
  const L = (i: number) => f.ly.get(i);
  const colsOut = smooth(Math.max(L(13).end, L(14).start - 0.5), L(14).start + 0.15, t);

  // counter behind L10
  const l10 = L(10);
  const yame = l10.words[2].start;
  const cA = smooth(f.start, f.start + 0.4, t) * (1 - smooth(yame + 0.6, yame + 1.6, t));
  if (cA > 0) {
    const b0 = Math.floor(f.au.beatAt(f.start));
    const n = Math.max(1, Math.floor(f.au.beatAt(Math.min(t, yame))) - b0 + 1);
    const stopped = t >= yame;
    const kk = stopped ? 0 : Math.exp(-f.beatPhase * 6);
    text(ink, String(n), 700, 560, 520, F.slam, {
      fill: rgba(C.sky, stopped ? 0.08 : 0.1 + 0.08 * kk),
      alpha: cA,
      sx: 1 + 0.04 * kk,
      sy: 1 + 0.04 * kk,
    });
    if (stopped) {
      const s = easeOut(inv(yame, yame + 0.3, t));
      ink.save();
      ink.globalAlpha = cA * 0.7;
      ink.strokeStyle = C.sky;
      ink.lineWidth = 8;
      ink.beginPath();
      ink.moveTo(420, 600);
      ink.lineTo(420 + 560 * s, 520);
      ink.stroke();
      ink.restore();
    }
  }

  // tablets in the belly (L11 on), become stars on きらきら
  const l11 = L(11);
  const l12 = L(12);
  const kira = l12.words[1].start;
  const tabA = smooth(l11.start, l11.start + 1.2, t) * (1 - colsOut * 0.6) * (1 - smooth(L(16).start, L(16).start + 1, t));
  if (tabA > 0) {
    for (let i = 0; i < 34; i++) {
      const r1 = hash(i * 3 + 1),
        r2 = hash(i * 3 + 2),
        r3 = hash(i * 3 + 3);
      const x = 120 + r1 * 1680;
      const y = 140 + ((r2 * 800 - (t - l11.start) * (10 + r3 * 18)) % 800 + 800) % 800;
      const star = smooth(kira + r3 * 0.8, kira + r3 * 0.8 + 0.3, t);
      const tw = 0.55 + 0.45 * Math.sin(t * (3 + r1 * 4) + i);
      if (star < 1) tablet(ink, x, y, 9 + r3 * 8, tabA * (1 - star) * 0.7);
      if (star > 0) sparkle(ink, x, y, (10 + r3 * 18) * star * tw, i % 4 === 0 ? C.sky : '#ffffff', tabA * star);
    }
  }

  // columns
  for (const [li, x] of COLS) {
    const w = win(f, li, 0.3, 99, 0.3);
    if (t < w.s) continue;
    const l = L(li);
    const gs = f.ly.glyphs(l);
    const nGap = new Set(gs.map((g) => g.word)).size - 1;
    const size = Math.min(72, 790 / (gs.length * 1.02 + nGap * 0.5));
    const { p } = layout(ink, gs, F.body, size, x, 0, { weight: 500, gap: 0.5, vertical: true });
    const top = 150;
    const off = top - p[0].y + p[0].w / 2;
    const age = t - l.end;
    const fadeOld = age > 0 ? 0.55 + 0.45 * Math.exp(-age * 0.6) : 1;
    const outline = li === 12 && t > l.start;
    const sizeK = size;
    for (const q of p) {
      const g = q.g;
      const on = t >= g.t0;
      const appear = clamp((t - g.t0) / 0.08);
      if (appear <= 0) continue;
      const h = hot(g, t);
      const yellow = li === 13 && g.word === 0;
      let col = !on ? rgba(C.paper, 0.3) : h > 0.4 ? (yellow ? C.lemon : C.sky) : yellow ? rgba(C.lemon, 0.85) : C.paper;
      const b = bump(g, t, 0.25);
      const fall = colsOut * (300 + hash(g.k + li * 40) * 500);
      glyph(ink, g.ch, q.x + noise1(t * 0.7 + g.k, li) * 4, q.y + off + easeIn(colsOut) * fall, sizeK, F.body, {
        weight: 500,
        vertical: true,
        fill: outline ? null : col,
        stroke: outline ? (on ? C.sky : rgba(C.pale, 0.4)) : null,
        sw: 0.035,
        sx: b,
        sy: b,
        alpha: appear * fadeOld * (1 - colsOut),
        shadow: outline ? 0 : 0.35,
      });
    }
    // ぽたり: the yellow drop from the bottom of column 13
    if (li === 13) {
      const pt = l.words[3].start;
      const bottom = p[p.length - 1].y + off + 50;
      const s = t - pt;
      if (s > -0.3) {
        const form = smooth(pt - 0.3, pt, t);
        const fallY = bottom + (s > 0 ? 0.5 * 3200 * s * s : 0);
        const landY = 960;
        if (fallY < landY) drop(ink, x, fallY, 13 * form + 0.1, C.lemon, 1, 1 + clamp(s * 2));
        else {
          const tl = pt + Math.sqrt((2 * (landY - bottom)) / 3200);
          ripple(ink, t, tl, x, landY, C.lemon, 3, 0.8);
        }
      }
    }
  }

  // L14 「ごうほうだから へいきだよ」
  {
    const w = win(f, 14, 0.25, 1.0, 0.3);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = 104;
      const { p } = layout(ink, gs, F.min, size, 960, 470, { weight: 800, gap: 0.3 });
      const tremble = smooth(w.l.start + 2.5, w.l.end, t);
      for (const q of p) {
        const g = q.g;
        const s = t - g.t0;
        if (s < 0) continue;
        const st = 1 + 0.6 * Math.exp(-Math.max(0, s) * 16);
        const j = tremble * 5;
        const fi = frameIdx(t);
        glyph(ink, g.ch, q.x + (hash(fi * 7 + g.k) - 0.5) * j, q.y + (hash(fi * 11 + g.k) - 0.5) * j, size, F.min, {
          weight: 800,
          fill: C.sky,
          sx: st,
          sy: st,
          alpha: clamp(s / 0.05 + 1) * (1 - w.out),
          shadow: 0.4,
        });
      }
    }
  }

  // L15 だれに いいわけ してるの？ — mirrored glyphs turn to face you. After the line, a ~3 s run of fast
  // た・た・た chops: the line shakes, flickers and glitches with the lead-vocal loudness (so with every た)
  let stut = 0;
  {
    const w = win(f, 15, 0.3, 0.2, 0.2);
    const gs15 = f.ly.glyphs(w.l);
    const lastSung = gs15[gs15.length - 1].t0 + 0.45;
    if (t > lastSung && t < L(16).start) stut = clamp(f.au.env('vocal', t) * 1.6) * smooth(lastSung, lastSung + 0.2, t);
    if (w.on) {
      const gs = f.ly.glyphs(w.l);
      const size = 84;
      const { p } = layout(ink, gs, F.body, size, 960, 640, { weight: 500, gap: 0.45 });
      for (const q of p) {
        const g = q.g;
        const turn = spring(t - g.t0, 12, 6);
        const sx = -1 + 2 * Math.min(1.08, turn);
        const on = t >= g.t0;
        const fi = frameIdx(t);
        const jx = (hash(fi * 13 + g.k) - 0.5) * 26 * stut;
        const jy = (hash(fi * 29 + g.k) - 0.5) * 16 * stut;
        const flick = stut > 0.2 && hash(fi * 7 + g.k * 3) > 0.75 ? 0.35 : 1;
        glyph(ink, g.ch, q.x + jx, q.y + jy, size, F.body, {
          weight: 500,
          fill: on ? (hot(g, t) > 0.4 ? C.sky : C.paper) : rgba(C.pale, 0.35),
          sx: sx * (1 + 0.08 * stut),
          sy: 1 + 0.08 * stut,
          alpha: w.a * flick,
          shadow: 0.3,
        });
      }
      // the excuse above fades away as this starts
    }
  }

  // L16 とけて・とけて・とけて…… — each one bigger, the last one centre and sky
  let melt = 0.03 + 0.05 * smooth(f.start, L(14).start, t);
  let wob = 0;
  let flash = 0;
  {
    const l = L(16);
    const parts = chunks(f.ly.glyphs(l));
    const gs = parts.flatMap((c) => c.gs);
    // 溶けて・溶けて・溶け 溶け 溶けて…… : five chunks, each bigger, the last one in the centre
    const sizes = [130, 160, 190, 230, 330];
    const pos: [number, number][] = [
      [470, 280],
      [1450, 300],
      [560, 790],
      [1380, 780],
      [960, 540],
    ];
    const lastK = parts.length - 1;
    parts.forEach((c, k) => {
      const s = t - c.t0;
      if (s < 0 || k >= sizes.length) return;
      const nextT = parts[k + 1]?.t0 ?? 1e9;
      const fadeOlder = 1 - smooth(nextT, nextT + 0.4, t) * 0.55;
      // fit inside the frame (the last chunk is 溶けて…… and would run off the left edge)
      const size = fit(ink, c.gs, F.pop, sizes[k], k === lastK ? 1300 : 760, 400, 0);
      const [cx, cy] = pos[k];
      const { p } = layout(ink, c.gs, F.pop, size, cx, cy, { gap: 0 });
      for (const q of p) {
        const sk = t - q.g.t0;
        if (sk < 0) continue;
        const sp = spring(sk + 0.02, 14, 7);
        glyph(ink, q.g.ch, q.x, q.y, size, F.pop, {
          fill: k === lastK ? C.sky : hot(q.g, t) > 0.4 ? C.sky : C.paper,
          sx: sp,
          sy: sp,
          alpha: fadeOlder,
          shadow: 0.35,
        });
      }
    });
    if (gs[0]) {
      const r = smooth(gs[0].t0, f.end, t);
      melt += r * r * 2.2;
      wob = r * 0.5;
    }
    flash = smooth(f.end - 0.25, f.end, t) * 0.85;
  }

  const water = smooth(l11.start, l11.start + 2, t) * (1 - colsOut * 0.5);
  return {
    bg: 0,
    bg2: 1,
    bgMix: water * 0.22 + smooth(L(16).start, f.end, t) * 0.5,
    light: 0.6,
    tint: [1, 1, 1],
    melt,
    glitch: 0.5 * stut,
    rgb: 0.9 * stut,
    shake: [(hash(frameIdx(t)) - 0.5) * 0.006 * stut, (hash(frameIdx(t) + 7) - 0.5) * 0.004 * stut],
    meltSeed: 21,
    wob,
    zoom: 1 + 0.06 * smooth(L(16).start, f.end, t),
    flash,
    flashCol: [0.85, 0.95, 1],
    bloom: 0.6,
    vig: 0.65,
  };
}
