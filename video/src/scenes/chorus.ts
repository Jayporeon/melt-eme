// chorus (72.81 – 101.75 and 173.65 – 202.26): sky-blue water. Every line has its own motion.
//   ぷち・ぷち・ごくん   full-frame slams, one chunk at a time; とけちゃう melts
//   ふわ・ふわ           chunks rise like bubbles
//   とろ・とろ           glyphs stretch and sag like syrup
//   エメは おくすりいろの おみず   text floats on the surface, reflected
//   みないで … すけちゃうよ        fill drains out, only an outline is left
//   ぐる・ぐる・ぐるり   a turning spiral of text
//   みずに とけたら みえないの     glyphs dissolve into bubbles
//   ばいばい げんじつ またあした   a tide carries the line off to the right
//   ……って だれも みてないか (chorus 2 only)   everything stops: black, small, plain
import { Frame, Post } from '../engine/engine';
import { Glyph } from '../engine/lyrics';
import { bubble, Ctx, glyph as glyph0, GOpts, layout, Placed } from '../engine/type';

// every glyph in the water gets a dark navy rim so it reads against the blue
const STK = 'rgba(4,16,44,0.92)';
function glyph(ink: Ctx, ch: string, x: number, y: number, size: number, font: string, o: GOpts = {}) {
  glyph0(ink, ch, x, y, size, font, { stroke: STK, sw: 0.09, ...o });
}
import { clamp, easeIn, easeInOut, easeOut, hash, inv, smooth, spring } from '../engine/util';
import { blister, bump, C, chunks, F, fit, hot, pillField, rgba, win } from './_kit';

type Idiom = 'slam' | 'float' | 'syrup' | 'surface' | 'clear' | 'spiral' | 'dissolve' | 'tide' | 'stop';

function idiomOf(text: string): Idiom {
  if (text.startsWith('ぷち')) return 'slam';
  if (text.startsWith('ふわ')) return 'float';
  if (text.startsWith('とろ')) return 'syrup';
  if (text.startsWith('エメは')) return 'surface';
  if (text.startsWith('見ないで')) return 'clear';
  if (text.startsWith('ぐる')) return 'spiral';
  if (text.startsWith('水に')) return 'dissolve';
  if (text.startsWith('ばいばい')) return 'tide';
  return 'stop';
}

const MELT_WORD = '溶け';

/** big slam of a chunk */
function slamChunk(ink: Ctx, gs: Glyph[], t: number, t0: number, tEnd: number, font: string, maxSize: number, y: number, col: string) {
  const s = t - t0;
  if (s < 0 || t >= tEnd) return; // the next chunk replaces this one at once
  const size = fit(ink, gs, font, maxSize, 1650, 400, 0.1);
  const { p } = layout(ink, gs, font, size, 960, y, { gap: 0.1 });
  const sp = 1.5 - 0.5 * spring(s, 16, 8);
  const out = 0;
  const rot = (hash(Math.floor(t0 * 100)) - 0.5) * 0.12;
  for (const q of p) {
    const dx = (q.x - 960) * sp;
    glyph(ink, q.g.ch, 960 + dx, y + (q.y - y), size * sp, font, {
      fill: col,
      stroke: C.deep,
      sw: 0.06,
      rot,
      alpha: 1 - out,
      shadow: 0.5,
    });
  }
}

export function makeChorus(lines: number[], intensity: number) {
  return function chorus(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
    const t = f.t;
    let melt = 0.06 * intensity;
    let stop = 0;
    let wobBoost = 0;
    let rotCam = 0;

    pillField(ink, f, 16, 7 + intensity * 3, 0.75, 1);

    for (const li of lines) {
      const w = win(f, li, 0.25, 1.0, 0.2);
      if (!w.on) continue;
      const l = w.l;
      const gs = f.ly.glyphs(l);
      const id = idiomOf(l.text);
      const ch = chunks(gs);

      // とけちゃう / とけて: melt pulse after it is sung
      const tokeIdx = l.words.findIndex((x) => x.w.startsWith(MELT_WORD));
      if (tokeIdx >= 0) {
        const tw = l.words[tokeIdx];
        const r = smooth(tw.end, tw.end + 0.8, t) * (1 - smooth(w.e - 0.3, w.e, t));
        melt += r * (0.3 + 0.2 * intensity);
      }

      if (id === 'slam') {
        // a blister sheet at the bottom: each ぷち pops a tablet up past the slam
        const pu = gs.filter((g) => g.ch === 'ぷ').map((g) => g.t0);
        const pops: number[] = [];
        if (intensity > 0.5) for (const k of [0, 4, 7, 9]) pops[k] = 0; // chorus 2: already half used
        pops[intensity > 0.5 ? 2 : 6] = pu[0];
        pops[intensity > 0.5 ? 5 : 3] = pu[1];
        const sa = clamp((t - (l.start - 0.4)) / 0.3) * (1 - w.out);
        // chunks before the とけ word
        const pre = ch.filter((c) => !c.text.startsWith(MELT_WORD));
        pre.forEach((c, k) => {
          const nextT = pre[k + 1]?.t0 ?? l.words[tokeIdx].start;
          slamChunk(ink, c.gs, t, c.t0, nextT, F.slam, 300, 430, C.sky);
        });
        const tk = ch.find((c) => c.text.startsWith(MELT_WORD));
        if (tk) drawMeltWord(ink, tk.gs, t, w.a, 230, 440, intensity);
        blister(ink, t, 960, 815 + (1 - sa) * 80, 1.1, 0.04, pops, sa, { seed: 17 + intensity, jump: 1150, grav: 2300, grow: 1.6 });
      } else if (id === 'float') {
        const fl = ch.filter((c) => c.text === 'ふわ');
        fl.forEach((c, k) => {
          const s = t - c.t0;
          if (s < 0) return;
          const size = 150;
          const x0 = 340 + k * 1240;
          const yb = 880 - easeOut(clamp(s / 2.2)) * 600 - s * 20;
          const { p } = layout(ink, c.gs, F.pop, size, x0, yb, { gap: 0 });
          p.forEach((q, j) => {
            glyph(ink, q.g.ch, q.x + Math.sin(t * 2.4 + j + k) * 14, q.y + Math.sin(t * 3 + j * 1.3) * 10, size, F.pop, {
              fill: hot(q.g, t) > 0.4 ? C.sky : C.paper,
              alpha: clamp(s / 0.2) * (1 - w.out) * (1 - clamp((s - 3) / 1)),
              shadow: 0.3,
              sx: bump(q.g, t, 0.3),
              sy: bump(q.g, t, 0.3),
            });
          });
          for (let b = 0; b < 4; b++) {
            const bs = s - b * 0.15;
            if (bs < 0) continue;
            bubble(ink, x0 + (hash(k * 9 + b) - 0.5) * 260, yb + 120 - bs * 160, 10 + hash(b + k) * 16, clamp(1 - bs / 2) * (1 - w.out));
          }
        });
        // ひれから (inside the first word after the ふわ chunks) + とけちゃう
        const hc = ch.filter((c) => c.text !== 'ふわ' && !c.text.startsWith(MELT_WORD));
        // ひれから only appears when it is sung (not while the two ふわ are)
        hc.forEach((c) => {
          if (t < c.t0) return;
          const sp = spring(t - c.t0 + 0.02, 14, 7);
          const { p } = layout(ink, c.gs, F.body, 110, 960, 330, { weight: 800 });
          p.forEach((q) => kgl(ink, q, t, 110 * sp, F.body, 800, w.a));
        });
        const tk = ch.find((c) => c.text.startsWith(MELT_WORD));
        if (tk) drawMeltWord(ink, tk.gs, t, w.a, 210, 640, intensity);
      } else if (id === 'syrup') {
        const size = fit(ink, gs, F.pop, 140, 1600, 400, 0.35);
        const { p } = layout(ink, gs, F.pop, size, 960, 430, { gap: 0.35 });
        const tkStart = tokeIdx >= 0 ? l.words[tokeIdx].start : 1e9;
        for (const q of p) {
          const g = q.g;
          const on = t >= g.t0;
          const s = Math.max(0, t - g.t0);
          const stretch = on ? 1 + 0.9 * easeOut(clamp(s / 1.4)) : 1;
          const sag = on ? easeIn(clamp(s / 2)) * 90 : 0;
          const isToke = q.g.word >= tokeIdx && tokeIdx >= 0 && t >= tkStart;
          glyph(ink, g.ch, q.x, q.y + sag + (size * (stretch - 1)) / 2, size, F.pop, {
            fill: !on ? rgba(C.paper, 0.3) : hot(g, t) > 0.4 ? C.sky : isToke ? C.pale : C.paper,
            sy: stretch,
            sx: 1 - (stretch - 1) * 0.12,
            alpha: w.a,
            shadow: 0.3,
          });
        }
      } else if (id === 'surface') {
        const size = fit(ink, gs, F.body, 112, 1640, 800, 0.4);
        const { p } = layout(ink, gs, F.body, size, 960, 470, { weight: 800, gap: 0.4 });
        const med = [C.sky, C.lilac, C.pale, C.pink, C.sky2, C.lilac];
        // waterline
        ink.save();
        ink.globalAlpha = 0.5 * w.a;
        ink.strokeStyle = C.white;
        ink.lineWidth = 2;
        ink.beginPath();
        for (let x = 0; x <= 1920; x += 20) {
          const y = 540 + Math.sin(x * 0.008 + t * 2.2) * 10 + Math.sin(x * 0.019 - t * 1.4) * 5;
          if (x === 0) ink.moveTo(x, y);
          else ink.lineTo(x, y);
        }
        ink.stroke();
        ink.restore();
        for (const q of p) {
          const g = q.g;
          const on = t >= g.t0;
          const bob = Math.sin(q.x * 0.008 + t * 2.2) * 10 + Math.sin(q.x * 0.019 - t * 1.4) * 5;
          const isMed = l.words[g.word].w.startsWith('お薬');
          const col = !on ? rgba(C.paper, 0.3) : isMed ? med[g.k % med.length] : hot(g, t) > 0.4 ? C.sky : C.paper;
          const drift = on ? 0 : 0;
          const tilt = Math.cos(q.x * 0.008 + t * 2.2) * 0.08;
          const by = bump(g, t, 0.2);
          glyph(ink, g.ch, q.x, q.y + bob + drift, size, F.body, { weight: 800, fill: col, rot: tilt, sx: by, sy: by, alpha: w.a, shadow: 0.3 });
          // reflection under the surface
          glyph(ink, g.ch, q.x, 610 + (540 - q.y) * 0.4 + bob * 1.4, size, F.body, {
            weight: 800,
            fill: col,
            sy: -0.55,
            rot: -tilt,
            alpha: w.a * 0.22,
            blur: 3,
          });
        }
      } else if (id === 'clear') {
        const size = fit(ink, gs, F.body, 128, 1640, 800, 0.45);
        const { p } = layout(ink, gs, F.body, size, 960, 500, { weight: 800, gap: 0.45 });
        for (const q of p) {
          const g = q.g;
          const on = t >= g.t0;
          const drain = smooth(l.end, l.end + 0.8, t);
          const isSuke = l.words[g.word].w.startsWith('透け');
          const fillA = 1 - drain * (isSuke ? 1 : 0.75);
          glyph(ink, g.ch, q.x, q.y, size, F.body, {
            weight: 800,
            fill: on ? rgba(C.sky, fillA) : rgba(C.paper, 0.28),
            stroke: rgba(C.pale, on ? 0.9 - (isSuke ? drain * 0.55 : 0) : 0.3),
            sw: 0.025,
            alpha: w.a,
            sx: bump(g, t, 0.18),
            sy: bump(g, t, 0.18),
          });
        }
      } else if (id === 'spiral') {
        // text laid along an inward spiral, read from the outside in; the spiral turns
        const order = gs.filter((g) => g.ch !== '・');
        const turn = (t - l.start) * 0.55;
        rotCam = Math.sin((t - l.start) * 1.4) * 0.03;
        let th = 0;
        order.forEach((g, k) => {
          const r = Math.max(120, 430 - th * 52);
          const size = 64 + (r / 430) * 70;
          const ang = th - turn - Math.PI * 0.9;
          const x = 960 + Math.cos(ang) * r * 1.3;
          const y = 520 + Math.sin(ang) * r * 0.85;
          th += (size * 1.08 + (order[k + 1] && order[k + 1].word !== g.word ? size * 0.3 : 0)) / (r * 1.1);
          if (t < g.t0) return;
          const sp = spring(t - g.t0 + 0.02, 14, 7);
          glyph(ink, g.ch, x, y, size, F.pop, {
            fill: hot(g, t) > 0.4 ? C.sky : C.paper,
            rot: ang + Math.PI / 2,
            sx: sp,
            sy: sp,
            alpha: w.a,
            shadow: 0.3,
          });
        });
      } else if (id === 'dissolve') {
        const size = fit(ink, gs, F.body, 122, 1640, 800, 0.45);
        const { p } = layout(ink, gs, F.body, size, 960, 500, { weight: 800, gap: 0.45 });
        for (const q of p) {
          const g = q.g;
          const on = t >= g.t0;
          const s = t - (l.end + 0.05 + g.k * 0.04);
          const gone = clamp(s / 0.7);
          glyph(ink, g.ch, q.x, q.y - gone * 30, size * (1 - 0.5 * gone), F.body, {
            weight: 800,
            fill: !on ? rgba(C.paper, 0.3) : hot(g, t) > 0.4 ? C.sky : C.paper,
            alpha: w.a * (1 - gone),
            blur: gone * 8,
            shadow: 0.3 * (1 - gone),
          });
          if (s > 0) {
            for (let b = 0; b < 5; b++) {
              const bs = s - b * 0.06;
              if (bs < 0 || bs > 2.5) continue;
              const r = hash(g.k * 17 + b + l.i * 3);
              bubble(ink, q.x + (r - 0.5) * size * 0.9 + Math.sin(bs * 4 + b) * 8, q.y - bs * (120 + r * 140), 5 + r * 12, w.a * clamp(1 - bs / 2.5));
            }
          }
        }
      } else if (id === 'tide') {
        const size = fit(ink, gs, F.pop, 120, 1640, 400, 0.45);
        const { p } = layout(ink, gs, F.pop, size, 960, 500, { gap: 0.45 });
        const away = easeIn(smooth(l.end, Math.max(w.e, l.end + 0.35), t));
        for (const q of p) {
          const g = q.g;
          const s = t - (g.t0 - 0.12);
          if (s < 0) continue;
          const inX = (1 - easeOut(clamp(s / 0.5))) * -260;
          const isBye = g.word === 0;
          const wave = isBye && t >= g.t0 ? Math.sin((t - g.t0) * 9) * 0.25 * Math.exp(-(t - g.t0) * 0.8) : 0;
          const isMata = g.word === 2;
          glyph(ink, g.ch, q.x + inX + away * (600 + (q.x - 400) * 0.6), q.y + Math.sin(t * 2 + q.x * 0.01) * 8, size, F.pop, {
            fill: t < g.t0 ? rgba(C.paper, 0.35) : hot(g, t) > 0.4 ? C.sky : isMata ? C.pale : C.paper,
            rot: wave,
            alpha: clamp(s / 0.3) * w.a * (1 - away),
            shadow: 0.3,
          });
        }
      } else if (id === 'stop') {
        stop = Math.max(stop, smooth(l.start - 0.3, l.start - 0.05, t) * (1 - smooth(w.e - 0.15, w.e, t)));
      }
      void wobBoost;
    }

    // chorus 2's deadpan stop: everything else is cleared
    if (stop > 0.5) {
      ink.setTransform(1, 0, 0, 1, 0, 0);
      ink.clearRect(0, 0, ink.canvas.width, ink.canvas.height);
      const s = ink.canvas.width / 1920;
      ink.setTransform(s, 0, 0, s, 0, 0);
      const l = f.ly.lines.find((x) => x.text.startsWith('……って'))!;
      const gs = f.ly.glyphs(l);
      const { p } = layout(ink, gs, F.hand, 50, 960, 520, { weight: 400, gap: 0.5 });
      for (const q of p) {
        const on = t >= q.g.t0;
        glyph(ink, q.g.ch, q.x, q.y, 50, F.hand, { fill: on ? C.sky : rgba(C.pale, 0.25) });
      }
    }

    const k = f.kick;
    const wob = (0.35 + 0.6 * f.bass) * (0.8 + 0.4 * intensity);
    const on = stop > 0.5 ? 0 : 1;
    return {
      bg: stop > 0.5 ? 6 : 1,
      melt: melt * on,
      meltSeed: Math.floor(f.beat / 4) * 3.7,
      wob: wob * on,
      wobF: 7,
      refr: 0.8 * on,
      zoom: 1 + (0.02 + 0.012 * intensity) * k * on,
      rot: rotCam * on,
      bloom: on ? 0.38 : 0.25,
      bloomThr: 0.95,
      ca: on ? 0.8 + 0.6 * k : 0.2,
      grain: on ? 0.06 : 0.1,
      vig: on ? 0.45 : 0.8,
      flash: on * Math.max(0, 1 - (t - f.start) / 0.35) * 0.7,
      flashCol: [0.85, 0.95, 1],
    };
  };
}

function kgl(ink: Ctx, q: Placed, t: number, size: number, font: string, weight: number, a: number) {
  const g = q.g;
  const on = t >= g.t0;
  const b = bump(g, t, 0.25);
  glyph(ink, g.ch, q.x, q.y - (on ? 12 * Math.exp(-(t - g.t0) * 10) : 0), size, font, {
    weight,
    fill: !on ? rgba(C.paper, 0.3) : hot(g, t) > 0.4 ? C.sky : C.paper,
    sx: b,
    sy: b,
    alpha: a,
    shadow: 0.35,
  });
}

/** とけちゃう: soft pop font, each glyph sags as it is sung; the shader melt does the rest */
function drawMeltWord(ink: Ctx, gs: Glyph[], t: number, a: number, size: number, y: number, intensity: number) {
  const real = gs.filter((g) => !g.punct || g.ch === 'ー');
  if (t < real[0].t0) return;
  const sz = fit(ink, real, F.pop, size, 1500, 400, 0);
  const { p } = layout(ink, real, F.pop, sz, 960, y, { gap: 0 });
  // the whole word appears the moment its first syllable is sung (no left-to-right reveal)
  const s0 = t - real[0].t0;
  if (s0 < 0) return;
  for (const q of p) {
    const g = q.g;
    const s = Math.max(0, t - g.t0);
    const sp = spring(s0 + 0.02, 13, 6) * bump(g, t, 0.18);
    const sag = easeInOut(clamp(s / 1.6)) * (30 + 30 * intensity);
    glyph(ink, g.ch, q.x, q.y + sag, sz, F.pop, {
      fill: t >= g.t0 ? C.sky : rgba(C.paper, 0.45),
      stroke: C.deep,
      sw: 0.05,
      sx: sp * (1 + sag / 300),
      sy: sp * (1 - sag / 500),
      alpha: a,
      shadow: 0.4,
    });
  }
}

export { inv };
