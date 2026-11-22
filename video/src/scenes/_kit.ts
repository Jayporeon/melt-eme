// Shared kinetic-type pieces used by several scenes.
import { Frame } from '../engine/engine';
import { Glyph, Line } from '../engine/lyrics';
import { C, rgba } from '../engine/palette';
import { Ctx, F, GOpts, glyph, H, layout, pill, Placed, tablet, W } from '../engine/type';
import { clamp, easeOut, hash, lerp, spring } from '../engine/util';

export { C, rgba, F, W, H };

/** line visibility. l.end is when the lead vocal actually goes quiet (build_data.py), so a line never starts
 *  leaving before it has been sung out: it holds `hold` s after that (or until the next line starts) and only
 *  then fades over `fo` s. */
export function win(f: Frame, i: number, pre = 0.3, hold = 1.2, fo = 0.25, overlap = 0) {
  const L = f.ly.lines;
  const l = L[i];
  const next = L[i + 1];
  const prev = L[i - 1];
  let s = l.start - Math.min(pre, 0.12);
  if (prev && prev.end < l.start) s = Math.max(s, prev.end);
  pre = Math.max(0.06, l.start - s);
  let e = l.end + hold;
  // when the next line starts, this one makes way (l.end never runs past the next start, see build_data.py)
  if (next) e = Math.min(e, Math.max(next.start + overlap, l.end + 0.02));
  const fade = Math.min(fo, Math.max(0.1, e - l.end));
  const t = f.t;
  const out = clamp((t - (e - fade)) / fade);
  const a = clamp((t - s) / Math.max(pre, 0.01)) * (1 - out);
  return { a, on: t >= s && t < e, s, e, l, out };
}

/** karaoke colour rule (one rule everywhere): 0 = not sung yet (grey), 1 = sung (blue, stays blue).
 *  The syllable being sung right now is marked by bump(), not by a third colour. */
export const hot = (g: Glyph, t: number, _decay = 3) => (t >= g.t0 ? 1 : 0);
/** onset bump 0 -> 1 -> settles; used as scale kick */
export const bump = (g: Glyph, t: number, amt = 0.25) => {
  const s = t - g.t0;
  if (s < 0) return 1;
  return 1 + amt * Math.exp(-s * 9) * Math.cos(s * 18);
};
/** appear-on-sing factor (type-on) */
export const born = (g: Glyph, t: number, lead = 0.04, dur = 0.18) => clamp((t - (g.t0 - lead)) / dur);

/** split glyphs into chunks by ・ and by word */
export function chunks(gs: Glyph[]): { gs: Glyph[]; t0: number; t1: number; text: string }[] {
  const out: { gs: Glyph[]; t0: number; t1: number; text: string }[] = [];
  let cur: Glyph[] = [];
  const flush = () => {
    const real = cur.filter((g) => !'（）()'.includes(g.ch));
    if (real.length) {
      const sung = real.filter((g) => !g.punct);
      const t0 = (sung[0] ?? real[0]).t0;
      const t1 = (sung[sung.length - 1] ?? real[real.length - 1]).t1;
      out.push({ gs: real, t0, t1, text: real.map((g) => g.ch).join('') });
    }
    cur = [];
  };
  gs.forEach((g, i) => {
    if (g.ch === '・') {
      flush();
      return;
    }
    if (i > 0 && gs[i - 1].word !== g.word) flush();
    cur.push(g);
  });
  flush();
  return out;
}

/** standard karaoke glyph: dim before, sky while sung, paper after; bump on onset */
export function kglyph(ctx: Ctx, p: Placed, t: number, size: number, f: string, o: GOpts & { dim?: number; base?: string; hotc?: string; dx?: number; dy?: number } = {}) {
  const g = p.g;
  const h = hot(g, t);
  const on = t >= g.t0;
  const base = o.base ?? C.paper;
  const fill = !on ? rgba(base, o.dim ?? 0.28) : h > 0.35 ? o.hotc ?? C.sky : base;
  void base;
  const b = bump(g, t, 0.22);
  glyph(ctx, g.ch, p.x + (o.dx ?? 0), p.y + (o.dy ?? 0) - (on ? 10 * Math.exp(-(t - g.t0) * 10) : 0), size, f, {
    shadow: 0.35,
    ...o,
    fill: o.fill === undefined ? fill : o.fill,
    sx: (o.sx ?? 1) * b,
    sy: (o.sy ?? 1) * b,
  });
}

/** fit a size so a line fits in maxW */
export function fit(ctx: Ctx, gs: Glyph[], f: string, size: number, maxW: number, weight = 400, gap = 0.4) {
  const { w } = layout(ctx, gs, f, size, 0, 0, { weight, gap });
  return w > maxW ? (size * maxW) / w : size;
}

// ----------------------------------------------------------------- music box dots (intro / outro)
export function musicBox(ctx: Ctx, f: Frame, a: number, until = Infinity, flash = 0) {
  if (a <= 0.01) return;
  const t = f.t;
  const ns = f.au.notesIn('box', t - 5, Math.min(t + 0.01, until));
  const x0 = 1560;
  for (const n of ns) {
    const age = t - n[0];
    if (age < 0) continue;
    const x = x0 - age * 210;
    const y = 880 - (n[2] - 60) * 15;
    const fresh = Math.exp(-age * 2.4);
    const fade = clamp(1 - age / 5) * clamp((x - 200) / 300);
    ctx.save();
    ctx.globalAlpha = a * fade * (0.25 + 0.75 * fresh);
    // tail
    ctx.strokeStyle = rgba(C.sky, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.min(age, 0.5) * 210 * (n[1] - n[0] > 0.2 ? 1 : 0.4), y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 2.5 + 5 * fresh * n[3], 0, Math.PI * 2);
    ctx.fillStyle = fresh > 0.5 ? '#ffffff' : C.pale;
    ctx.fill();
    ctx.restore();
  }
  // the comb: a hairline where notes are struck
  ctx.save();
  ctx.globalAlpha = Math.min(1, a * (0.25 + 0.75 * flash));
  ctx.lineWidth = 1 + 3 * flash;
  ctx.strokeStyle = flash > 0.3 ? C.sky : C.pale;
  ctx.beginPath();
  ctx.moveTo(x0, 300);
  ctx.lineTo(x0, 860);
  ctx.stroke();
  ctx.restore();
}

// ----------------------------------------------------------------- drifting medicine (liquid scenes)
export function pillField(ctx: Ctx, f: Frame, n: number, seed: number, a: number, speed = 1) {
  if (a <= 0.01) return;
  for (let i = 0; i < n; i++) {
    const r1 = hash(seed * 131 + i * 7);
    const r2 = hash(seed * 131 + i * 7 + 1);
    const r3 = hash(seed * 131 + i * 7 + 2);
    const depth = 0.4 + 0.6 * r3;
    const sp = (18 + 30 * r2) * speed * depth;
    const y = ((r2 * 1400 - f.t * sp) % 1400 + 1400) % 1400 - 160;
    const x = r1 * W + Math.sin(f.t * 0.6 + i) * 30;
    const rot = f.t * (r1 - 0.5) * 1.2 + i;
    const s = depth;
    if (i % 3 === 0) tablet(ctx, x, y, 16 * s, a * (0.35 + 0.45 * depth));
    else pill(ctx, x, y, 64 * s, 26 * s, rot, i % 5 === 1 ? '#e9f6ff' : '#ffffff', a * (0.35 + 0.45 * depth));
  }
}

/** ripple rings expanding from (x,y) starting at t0 */
export function ripple(ctx: Ctx, t: number, t0: number, x: number, y: number, col = C.sky, n = 3, sc = 1) {
  const s = t - t0;
  if (s < 0 || s > 2.2) return;
  for (let k = 0; k < n; k++) {
    const sk = s - k * 0.18;
    if (sk < 0) continue;
    const r = easeOut(sk / 1.6) * 260 * sc;
    ctx.save();
    ctx.globalAlpha = clamp(1 - sk / 1.6) * 0.8;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5 - k * 0.6;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export { lerp, clamp, spring, easeOut, hash };

// ----------------------------------------------------------------- blister pack (PTP sheet)
// A silver sheet of `cols` x 2 domed pockets, each holding a white tablet. pops[i] is the time pocket i
// bursts: the dome flexes, the foil tears, and the tablet jumps out and falls (or floats) away.
export interface BlisterOpts {
  cols?: number;
  grav?: number; // px/s^2 at scale 1
  jump?: number; // initial upward speed at scale 1
  seed?: number;
  floorY?: number; // tablets stop here (world y), otherwise they fall off screen
  keepTablets?: boolean;
  grow?: number; // flying tablets grow by this much per second (coming toward the camera)
  landX?: [number, number]; // with floorY: each tablet lands somewhere in this x range
  part?: 'all' | 'sheet' | 'tablets'; // draw only the sheet, or only the flying/landed tablets
}
export function blisterPocket(i: number, cols: number, pw: number): [number, number] {
  const r = Math.floor(i / cols),
    c = i % cols;
  return [(c - (cols - 1) / 2) * pw, (r - 0.5) * pw];
}
export function blister(ctx: Ctx, t: number, cx: number, cy: number, sc: number, rot: number, pops: number[], a: number, o: BlisterOpts = {}) {
  if (a <= 0.01) return;
  const cols = o.cols ?? 5;
  const n = cols * 2;
  const pw = 92;
  const w = cols * pw + 36,
    h = 2 * pw + 36;
  const r = pw * 0.36;
  if (o.part !== 'tablets') {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(sc, sc);
  // foil
  const gr = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  // brushed foil, kept below the glow threshold so the sheet doesn't bloom like lyric text
  gr.addColorStop(0, '#9fb0bd');
  gr.addColorStop(0.45, '#6f8292');
  gr.addColorStop(0.55, '#8c9dab');
  gr.addColorStop(1, '#5d6f7e');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // perforation between the rows and between columns
  ctx.setLineDash([5, 7]);
  ctx.strokeStyle = 'rgba(40,60,80,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 8, 0);
  ctx.lineTo(w / 2 - 8, 0);
  for (let c = 1; c < cols; c++) {
    const x = (c - cols / 2) * pw;
    ctx.moveTo(x, -h / 2 + 8);
    ctx.lineTo(x, h / 2 - 8);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < n; i++) {
    const [x, y] = blisterPocket(i, cols, pw);
    const tp = pops[i] ?? Infinity;
    const s = t - tp;
    const popped = s >= 0;
    const flex = popped ? 1 + 0.35 * Math.exp(-s * 14) : 1 - 0.12 * smoothPre(t, tp);
    // dome
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flex, flex);
    if (!popped) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,215,228,0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,232,242,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // tablet inside
      ctx.beginPath();
      ctx.arc(0, 2, r * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = '#d9e3ea';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, 2);
      ctx.lineTo(r * 0.42, 2);
      ctx.strokeStyle = 'rgba(120,150,175,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-r * 0.4, -r * 0.42, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    } else {
      // torn foil: dark hole with jagged edge + shards
      const seed = (o.seed ?? 0) * 100 + i;
      ctx.beginPath();
      for (let k = 0; k < 14; k++) {
        const ang = (k / 14) * Math.PI * 2;
        const rr = r * (0.62 + 0.28 * hash(seed * 31 + k));
        ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(8,16,30,0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(230,240,248,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  }
  if (o.part === 'sheet') return;
  // flying tablets, in world space
  const g = (o.grav ?? 2600) * sc;
  const jump = (o.jump ?? 820) * sc;
  for (let i = 0; i < n; i++) {
    const tp = pops[i];
    if (tp === undefined || t < tp) continue;
    const s = t - tp;
    const [px, py] = blisterPocket(i, cols, pw);
    const wx = cx + (px * Math.cos(rot) - py * Math.sin(rot)) * sc;
    const wy = cy + (px * Math.sin(rot) + py * Math.cos(rot)) * sc;
    const seed = (o.seed ?? 0) * 100 + i;
    const vy = -jump * (0.85 + 0.3 * hash(seed * 7 + 2));
    let vx = (hash(seed * 7 + 1) - 0.5) * 520 * sc;
    if (o.landX && o.floorY !== undefined) {
      const tx = o.landX[0] + (o.landX[1] - o.landX[0]) * hash(seed * 7 + 5);
      const tland = (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * (o.floorY - wy)))) / g;
      vx = (tx - wx) / Math.max(0.05, tland);
    }
    let x = wx + vx * s;
    let y = wy + vy * s + 0.5 * g * s * s;
    let spin = s * (9 + 6 * hash(seed * 7 + 3));
    if (o.floorY !== undefined && y > o.floorY && s > 0.1) {
      const disc = vy * vy + 2 * g * (o.floorY - wy);
      const tl = (-vy + Math.sqrt(Math.max(0, disc))) / g;
      x = wx + vx * tl;
      y = o.floorY;
      spin = Math.round(tl * (9 + 6 * hash(seed * 7 + 3)) / Math.PI) * Math.PI;
      if (!o.keepTablets) continue;
    }
    if (y > 1250) continue;
    const pop = 1 + 0.5 * Math.exp(-s * 10) + (o.grow ?? 0) * s;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.rotate(spin * 0.3);
    ctx.scale(pop * sc, pop * sc * Math.max(0.18, Math.abs(Math.cos(spin))));
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, 0);
    ctx.lineTo(r * 0.42, 0);
    ctx.strokeStyle = 'rgba(120,150,175,0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    // a few foil sparks at the moment of popping
    if (s < 0.25) {
      for (let k = 0; k < 5; k++) {
        const ang = hash(seed * 13 + k) * Math.PI * 2;
        const d = s * (300 + 200 * hash(seed * 17 + k)) * sc;
        ctx.save();
        ctx.globalAlpha = a * (1 - s / 0.25);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx + Math.cos(ang) * d - 3, wy + Math.sin(ang) * d - 3, 6, 6);
        ctx.restore();
      }
    }
  }
}
const smoothPre = (t: number, tp: number) => {
  const x = clamp((t - (tp - 0.12)) / 0.12);
  return x * x * (3 - 2 * x);
};

/** onset times of ぷ glyphs in a line */
export const puTimes = (f: Frame, li: number) => f.ly.glyphs(f.ly.get(li)).filter((g) => g.ch === 'ぷ').map((g) => g.t0);
