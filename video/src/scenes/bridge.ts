// bridge 144.97 – 173.65: the ceiling. Pixel type, stutters glitch.
//   L37/L38 き・き・昨日も / あ・あ・明日も 同じ 天井: identical layout; 同じ 天井 never moves, it goes grey and lights again
//   L39/L40 なおりたいとか… / なおっても いくとこ ないし: text runs round a loop at the frame edge — nowhere to go
//   L41/L42 ね・ね・ねんきんの ひ / ま・ま・また おくすり: a calendar; pension day circled, tablets on the days after
//   L43 とけて かたまって また とけて: melt, snap solid, melt
//   L44 その くりかえし それだけ: the line repeats as an endless vertical roll
import { Frame, Post } from '../engine/engine';
import { Glyph } from '../engine/lyrics';
import { Ctx, glyph, layout, tablet, text } from '../engine/type';
import { clamp, easeOut, frameIdx, hash, smooth, spring } from '../engine/util';
import { C, F, fit, hot, rgba, win } from './_kit';

/** stutter morae: glyphs followed by ・ */
function stutters(gs: Glyph[]): Glyph[] {
  return gs.filter((g, i) => gs[i + 1]?.ch === '・');
}

function loopPos(s: number): [number, number, number] {
  // rounded-rect loop inset in frame; s = arc length px
  const x0 = 150,
    y0 = 140,
    x1 = 1770,
    y1 = 900;
  const w = x1 - x0,
    h = y1 - y0;
  const P = 2 * (w + h);
  s = ((s % P) + P) % P;
  if (s < w) return [x0 + s, y0, 0];
  s -= w;
  if (s < h) return [x1, y0 + s, Math.PI / 2];
  s -= h;
  if (s < w) return [x1 - s, y1, Math.PI];
  s -= w;
  return [x0, y1 - s, -Math.PI / 2];
}

export function bridge(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
  const t = f.t;
  const L = (i: number) => f.ly.get(i);
  const fi = frameIdx(t);
  let glitch = 0;
  let rgb = 0;
  let melt = 0.03;
  let lampFlick = 1;

  const stutterHit = (gs: Glyph[]) => {
    for (const g of stutters(gs)) {
      const s = t - g.t0;
      if (s >= 0 && s < 0.4) {
        glitch = Math.max(glitch, (1 - s / 0.4) * 0.9);
        rgb = Math.max(rgb, (1 - s / 0.4) * 1.2);
        lampFlick = Math.min(lampFlick, s < 0.08 ? 0.2 : 1);
      }
    }
  };

  // ---- L37 / L38
  {
    const l37 = L(37),
      l38 = L(38);
    const s0 = l37.start - 0.12;
    const e0 = Math.max(L(38).end + 0.1, L(39).start - 0.05);
    if (t >= s0 && t < e0) {
      const use = t >= l38.start - 0.2 ? l38 : l37;
      const gs = f.ly.glyphs(use);
      const size = 96;
      const { p } = layout(ink, f.ly.glyphs(l37), F.dot, size, 960, 500, { gap: 0.4 });
      stutterHit(gs);
      const a = clamp((t - s0) / 0.3) * (1 - clamp((t - (e0 - 0.25)) / 0.25));
      gs.forEach((g, i) => {
        const q = p[i];
        // 同じ 天井 keeps its place from L37 (same ceiling) but, like every lyric, is grey until it is sung
        const on = t >= g.t0;
        const h = hot(g, t);
        const isSt = gs[i + 1]?.ch === '・';
        const echo = isSt && t >= g.t0 ? Math.exp(-(t - g.t0) * 5) : 0;
        for (let e = 2; e >= 1; e--) {
          if (echo <= 0.02) break;
          glyph(ink, g.ch, q.x + e * 26 * echo, q.y - e * 6 * echo, size, F.dot, { fill: rgba(C.sky, 0.35 * echo), alpha: a });
        }
        glyph(ink, g.ch, q.x, q.y, size, F.dot, {
          fill: !on ? rgba(C.pale, 0.25) : h > 0.4 ? C.sky : C.paper,
          alpha: a,
          shadow: 0.4,
        });
      });
      // small label: same count as yesterday
      const day = use === l38 ? 'DAY  n+1' : 'DAY  n';
      text(ink, day, 960, 640, 26, F.mono, { fill: rgba(C.pale, 0.5), alpha: a, track: 0.2 });
    }
  }

  // ---- L39 / L40 on a loop round the frame
  {
    const s0 = Math.max(L(39).start - 0.12, L(38).end);
    const e0 = Math.max(L(40).end + 0.1, L(41).start - 0.05);
    if (t >= s0 && t < e0) {
      const a = clamp((t - s0) / 0.4) * (1 - clamp((t - (e0 - 0.3)) / 0.3));
      const speed = 260;
      const size = 70;
      const g39 = f.ly.glyphs(L(39));
      const g40 = f.ly.glyphs(L(40));
      const seq: Glyph[] = [...g39, ...g40];
      stutterHit(g39);
      // head of the text travels with time; glyphs trail behind
      // counter-clockwise: on the top edge the text reads left to right and runs left
      const head = 1500 - (t - s0) * speed;
      let sArc = head;
      seq.forEach((g, i) => {
        const gap = i > 0 && (seq[i - 1].word !== g.word || (i === g39.length)) ? size * (i === g39.length ? 1.6 : 0.5) : 0;
        sArc += size * 1.02 + gap;
        const on = t >= g.t0;
        const [x, y, rot] = loopPos(sArc);
        glyph(ink, g.ch, x, y, size, F.dot, {
          fill: !on ? rgba(C.pale, 0.22) : hot(g, t) > 0.4 ? C.sky : C.paper,
          rot,
          alpha: a,
          shadow: 0.3,
        });
      });
      // the loop path itself
      ink.save();
      ink.globalAlpha = a * 0.18;
      ink.strokeStyle = C.pale;
      ink.setLineDash([6, 14]);
      ink.lineWidth = 2;
      ink.strokeRect(150, 140, 1620, 760);
      ink.restore();
      // centre: no destination
      text(ink, '目的地：なし', 960, 520, 40, F.dot, { fill: rgba(C.pale, 0.55), alpha: a * smooth(L(40).start, L(40).start + 0.4, t) });
    }
  }

  // ---- L41 / L42 ね・ね・ねんきんの ひが きたら / ま・ま・また おくすり かいに いく
  // a month calendar: pension day (15) gets circled; then a tablet is stamped on the following days, one per beat
  {
    const s0 = Math.max(L(41).start - 0.12, L(40).end);
    const e0 = Math.max(L(42).end + 0.1, L(43).start - 0.05);
    if (t >= s0 && t < e0) {
      const a = clamp((t - s0) / 0.3) * (1 - clamp((t - (e0 - 0.25)) / 0.25));
      const cw = 128,
        ch = 74,
        cols = 7;
      const x0 = 880 - (cw * cols) / 2,
        y0 = 190;
      const first = 3; // weekday of the 1st
      const week = ['日', '月', '火', '水', '木', '金', '土'];
      week.forEach((d, i) => text(ink, d, x0 + cw * (i + 0.5), y0 - 30, 24, F.dot, { fill: rgba(i === 0 ? C.sky : C.pale, 0.55), alpha: a }));
      ink.save();
      ink.globalAlpha = a * 0.22;
      ink.strokeStyle = C.pale;
      ink.lineWidth = 1;
      for (let r = 0; r <= 5; r++) {
        ink.beginPath();
        ink.moveTo(x0, y0 + r * ch);
        ink.lineTo(x0 + cw * cols, y0 + r * ch);
        ink.stroke();
      }
      ink.restore();
      const l41 = L(41),
        l42 = L(42);
      const nenkin = l41.words[0].syl[2]?.[0] ?? l41.start; // the first syllable after the ね・ね stutter
      const kau = l42.start;
      const beatsSince = f.au.beatAt(t) - f.au.beatAt(kau);
      const cell = (d: number): [number, number] => {
        const k = d - 1 + first;
        return [x0 + cw * ((k % cols) + 0.5), y0 + ch * (Math.floor(k / cols) + 0.5)];
      };
      for (let d = 1; d <= 30; d++) {
        const [x, y] = cell(d);
        const lit = d === 15 && t >= nenkin;
        text(ink, String(d), x - cw * 0.32, y - ch * 0.22, 22, F.dot, { fill: lit ? C.sky : rgba(C.pale, 0.42), alpha: a, align: 'left' });
        // tablets on the days after pension day
        const n = d - 15;
        if (n >= 1 && beatsSince >= n - 1) {
          const sp = spring((beatsSince - (n - 1)) * 0.45, 14, 7);
          tablet(ink, x + 14, y + 6, 15 * sp, a * 0.95);
        }
      }
      // circle round 15
      if (t >= nenkin) {
        const [x, y] = cell(15);
        const r = easeOut(clamp((t - nenkin) / 0.5));
        ink.save();
        ink.globalAlpha = a;
        ink.strokeStyle = C.sky;
        ink.lineWidth = 4;
        ink.beginPath();
        ink.ellipse(x, y, cw * 0.46, ch * 0.44, -0.1, -Math.PI / 2, -Math.PI / 2 + r * Math.PI * 2.1);
        ink.stroke();
        ink.restore();
      }
      for (const li of [41, 42]) {
        const w = win(f, li, 0.2, 0.5, 0.2);
        if (!w.on) continue;
        const gs = f.ly.glyphs(w.l);
        stutterHit(gs);
        const size = fit(ink, gs, F.dot, 96, 1600, 400, 0.4);
        const { p } = layout(ink, gs, F.dot, size, 960, 790, { gap: 0.4 });
        for (const q of p) {
          const g = q.g;
          const on = t >= g.t0;
          const isSt = gs[gs.indexOf(g) + 1]?.ch === '・';
          const j = isSt && on ? Math.exp(-(t - g.t0) * 6) * 18 : 0;
          glyph(ink, g.ch, q.x + (hash(fi + g.k) - 0.5) * j, q.y + (hash(fi * 3 + g.k) - 0.5) * j, size, F.dot, {
            fill: !on ? rgba(C.pale, 0.25) : hot(g, t) > 0.4 ? C.sky : C.paper,
            alpha: w.a,
            shadow: 0.4,
          });
        }
      }
    }
  }

  // ---- L43 とけて かたまって また とけて
  {
    const w = win(f, 43, 0.25, 0.4, 0.2);
    if (w.on) {
      const l = w.l;
      const gs = f.ly.glyphs(l);
      const size = fit(ink, gs, F.dot, 110, 1600, 400, 0.4);
      const { p } = layout(ink, gs, F.dot, size, 960, 480, { gap: 0.4 });
      const [w0, w1, w2, w3] = l.words;
      const m1 = smooth(w0.start, w0.end + 0.25, t) * (1 - smooth(w1.start, w1.start + 0.08, t));
      const m2 = smooth(w2.start, w3.end + 0.3, t);
      melt += (m1 + m2) * 1.4;
      const snap = t >= w1.start ? Math.exp(-(t - w1.start) * 10) : 0;
      for (const q of p) {
        const g = q.g;
        const on = t >= g.t0;
        const sc = 1 + 0.12 * snap * (g.word === 1 ? 1 : 0.3);
        glyph(ink, g.ch, q.x, q.y, size, F.dot, {
          fill: !on ? rgba(C.pale, 0.25) : hot(g, t) > 0.4 ? C.sky : C.paper,
          sx: sc,
          sy: sc,
          alpha: w.a,
          shadow: 0.3,
        });
      }
      glitch = Math.max(glitch, snap * 0.6);
    }
  }

  // ---- L44 その くりかえし それだけ: endless roll
  let flash = 0;
  {
    const l = L(44);
    const s0 = Math.max(l.start - 0.12, L(43).end);
    if (t >= s0) {
      const gs = f.ly.glyphs(l);
      const size = 84;
      const { p } = layout(ink, gs, F.dot, size, 960, 0, { gap: 0.4 });
      const roll = (t - s0) * 70;
      const a = clamp((t - s0) / 0.3);
      for (let r = -4; r <= 4; r++) {
        const yy = 540 + r * 120 - (roll % 120);
        const centre = Math.exp(-Math.abs(yy - 540) / 90);
        for (const q of p) {
          const g = q.g;
          const on = t >= g.t0;
          glyph(ink, g.ch, q.x, yy, size, F.dot, {
            fill: centre > 0.6 ? (!on ? rgba(C.pale, 0.3) : hot(g, t) > 0.4 ? C.sky : C.paper) : rgba(C.pale, 0.16 + 0.2 * centre),
            alpha: a,
          });
        }
      }
      flash = smooth(f.end - 0.3, f.end, t) * 0.9;
    }
  }

  return {
    bg: 4,
    light: lampFlick * (0.8 + 0.2 * Math.sin(t * 0.3)),
    bgA: 0,
    bgB: 1.0,
    bgC: 0.38,
    melt,
    meltSeed: 41,
    glitch,
    rgb,
    sat: 0.85,
    grain: 0.11,
    bloom: 0.45,
    vig: 0.7,
    zoom: 1 + 0.01 * f.kick,
    flash: Math.max(flash, Math.max(0, 1 - (t - f.start) / 0.3) * 0.5),
    flashCol: [0.85, 0.95, 1],
  };
}
export { easeOut, spring };
