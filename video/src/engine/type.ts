// Canvas2D typography. Everything is laid out in logical 1920x1080 and drawn glyph by glyph.
import { C, rgba } from './palette';
import { Glyph, Line, Lyrics } from './lyrics';
import { clamp } from './util';

export const W = 1920;
export const H = 1080;

export const F = {
  slam: '"Dela Gothic One"',
  pop: '"Hachi Maru Pop"',
  body: '"M PLUS 1 Variable"',
  dot: '"DotGothic16"',
  hand: '"Klee One"',
  min: '"Shippori Mincho B1"',
  mono: '"IBM Plex Mono"',
  maru: '"Zen Maru Gothic"',
};
export const font = (f: string, px: number, w = 400) => `${w} ${px.toFixed(2)}px ${f}`;

export type Ctx = CanvasRenderingContext2D;

const wcache = new Map<string, number>();
export function charW(ctx: Ctx, ch: string, f: string, w = 400): number {
  const key = f + '|' + w + '|' + ch;
  let v = wcache.get(key);
  if (v === undefined) {
    ctx.save();
    ctx.font = font(f, 100, w);
    v = ctx.measureText(ch).width / 100;
    ctx.restore();
    wcache.set(key, v);
  }
  return v;
}

export interface Placed {
  g: Glyph;
  x: number; // centre x
  y: number; // centre y
  w: number; // advance (px)
}

/** horizontal layout of glyphs, centred on cx. Word breaks get a gap. Returns placed glyphs and total width. */
export function layout(
  ctx: Ctx,
  gs: Glyph[],
  f: string,
  size: number,
  cx: number,
  cy: number,
  o: { weight?: number; gap?: number; track?: number; vertical?: boolean } = {},
): { p: Placed[]; w: number } {
  const gap = (o.gap ?? 0.4) * size;
  const track = (o.track ?? 0) * size;
  const adv: number[] = [];
  let total = 0;
  gs.forEach((g, i) => {
    const a = o.vertical ? size * (isSmallPunct(g.ch) ? 0.6 : 1.02) : charW(ctx, g.ch, f, o.weight) * size;
    adv.push(a);
    total += a + (i < gs.length - 1 ? track : 0);
    if (i < gs.length - 1 && gs[i + 1].word !== g.word) total += gap;
  });
  let x = -total / 2;
  const p: Placed[] = gs.map((g, i) => {
    const a = adv[i];
    const pos = x + a / 2;
    x += a + track;
    if (i < gs.length - 1 && gs[i + 1].word !== g.word) x += gap;
    return o.vertical ? { g, x: cx, y: cy + pos, w: a } : { g, x: cx + pos, y: cy, w: a };
  });
  return { p, w: total };
}

const isSmallPunct = (c: string) => '・、。'.includes(c);
const ROT_V = new Set([...'ー…「」（）()〜~―']);

export interface GOpts {
  fill?: string | null;
  stroke?: string | null;
  sw?: number; // stroke width relative to size
  sx?: number;
  sy?: number;
  rot?: number;
  alpha?: number;
  weight?: number;
  vertical?: boolean;
  shadow?: number; // drop shadow alpha
  blur?: number; // px blur (canvas filter)
  skew?: number;
}

/** draw one character centred at (x, y) */
export function glyph(ctx: Ctx, ch: string, x: number, y: number, size: number, f: string, o: GOpts = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0);
  ctx.scale(o.sx ?? 1, o.sy ?? 1);
  if (o.vertical && ROT_V.has(ch)) ctx.rotate(Math.PI / 2);
  if (o.vertical && '、。'.includes(ch)) ctx.translate(size * 0.3, -size * 0.3);
  ctx.font = font(f, size, o.weight ?? 400);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (o.blur && o.blur > 0.3) ctx.filter = `blur(${o.blur.toFixed(1)}px)`;
  const yo = size * 0.04; // optical centre for CJK in most fonts
  if (o.shadow) {
    ctx.save();
    ctx.globalAlpha = a * o.shadow;
    ctx.fillStyle = '#000814';
    ctx.fillText(ch, size * 0.04, yo + size * 0.06);
    ctx.restore();
  }
  if (o.stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = (o.sw ?? 0.06) * size;
    ctx.strokeStyle = o.stroke;
    ctx.strokeText(ch, 0, yo);
  }
  if (o.fill !== null) {
    ctx.fillStyle = o.fill ?? C.paper;
    ctx.fillText(ch, 0, yo);
  }
  ctx.restore();
}

/** plain string (no timing) centred at x,y */
export function text(ctx: Ctx, s: string, x: number, y: number, size: number, f: string, o: GOpts & { align?: CanvasTextAlign; track?: number } = {}) {
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.font = font(f, size, o.weight ?? 400);
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  if (o.track) (ctx as any).letterSpacing = `${(o.track * size).toFixed(1)}px`;
  if (o.blur && o.blur > 0.3) ctx.filter = `blur(${o.blur.toFixed(1)}px)`;
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(o.sx ?? 1, o.sy ?? 1);
  if (o.stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = (o.sw ?? 0.06) * size;
    ctx.strokeStyle = o.stroke;
    ctx.strokeText(s, 0, 0);
  }
  if (o.fill !== null) {
    ctx.fillStyle = o.fill ?? C.paper;
    ctx.fillText(s, 0, 0);
  }
  ctx.restore();
}

/** karaoke state of a glyph: 0 before, (0..1) while sung, 1 after; `since` = seconds since its start */
export function ks(g: Glyph, t: number) {
  return { p: Lyrics.prog(g, t), since: t - g.t0, on: t >= g.t0, act: t >= g.t0 && t < g.t1 + 0.12 };
}

/** colour for a sung / unsung glyph */
export function kcol(g: Glyph, t: number, base = C.paper, hot = C.sky, dim = 0.3): { fill: string; hot: number } {
  const s = t - g.t0;
  if (s < 0) return { fill: rgba(base, dim), hot: 0 };
  const h = Math.exp(-Math.max(0, t - g.t1) * 3.2);
  return { fill: h > 0.5 ? hot : base, hot: h };
}

// ------------------------------------------------------------ English subtitle
/** English line: bright, a little larger, on a soft dark rounded plate so it reads over any background */
export function subtitle(sub: Ctx, l: Line, a: number, y = 1012) {
  if (a <= 0.01) return;
  const size = 30;
  sub.save();
  sub.font = font(F.mono, size, 500);
  (sub as any).letterSpacing = `${(0.03 * size).toFixed(1)}px`;
  const tw = sub.measureText(l.en).width;
  sub.restore();
  const pw = tw + 56,
    ph = 54;
  sub.save();
  sub.globalAlpha = a;
  sub.filter = 'blur(6px)';
  sub.fillStyle = 'rgba(2,6,16,0.55)';
  sub.beginPath();
  sub.roundRect(W / 2 - pw / 2 - 6, y - ph / 2 - 4, pw + 12, ph + 8, 30);
  sub.fill();
  sub.filter = 'none';
  sub.fillStyle = 'rgba(3,8,20,0.5)';
  sub.beginPath();
  sub.roundRect(W / 2 - pw / 2, y - ph / 2, pw, ph, 27);
  sub.fill();
  sub.restore();
  text(sub, l.en, W / 2 + 1.5, y + 2, size, F.mono, { fill: rgba('#000814', 0.7 * a), track: 0.03, weight: 500 });
  text(sub, l.en, W / 2, y, size, F.mono, { fill: rgba('#f2f9ff', 0.96 * a), track: 0.03, weight: 500 });
}

// ------------------------------------------------------------ motifs
export function dropPath(ctx: Ctx, x: number, y: number, r: number, stretch = 1) {
  // tear drop with the point up; (x,y) is the centre of the round part
  ctx.beginPath();
  const top = y - r * 2.1 * stretch;
  ctx.moveTo(x, top);
  ctx.bezierCurveTo(x + r * 0.35, y - r * 1.2 * stretch, x + r, y - r * 0.55, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI, false);
  ctx.bezierCurveTo(x - r, y - r * 0.55, x - r * 0.35, y - r * 1.2 * stretch, x, top);
  ctx.closePath();
}
export function drop(ctx: Ctx, x: number, y: number, r: number, col = C.sky, a = 1, stretch = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  dropPath(ctx, x, y, r, stretch);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - r * 0.3, r * 0.18, r * 0.3, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = rgba('#ffffff', 0.75);
  ctx.fill();
  ctx.restore();
}
export function pill(ctx: Ctx, x: number, y: number, w: number, h: number, rot = 0, col = '#ffffff', a = 1, line = true) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = col;
  ctx.fill();
  if (line) {
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 + 2);
    ctx.lineTo(0, h / 2 - 2);
    ctx.strokeStyle = rgba('#7aa6c8', 0.6);
    ctx.lineWidth = Math.max(1, h * 0.06);
    ctx.stroke();
  }
  ctx.restore();
}
export function tablet(ctx: Ctx, x: number, y: number, r: number, a = 1, col = '#ffffff') {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y);
  ctx.lineTo(x + r * 0.6, y);
  ctx.strokeStyle = rgba('#8fb3cf', 0.7);
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
  ctx.restore();
}
export function bubble(ctx: Ctx, x: number, y: number, r: number, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(C.pale, 0.8);
  ctx.lineWidth = Math.max(1.2, r * 0.07);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = rgba('#ffffff', 0.8);
  ctx.fill();
  ctx.restore();
}
export function sparkle(ctx: Ctx, x: number, y: number, r: number, col = '#ffffff', a = 1) {
  if (a <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.22;
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
export const fadeIO = (t: number, a: number, b: number, fi = 0.3, fo = 0.3) => clamp((t - a) / fi) * (1 - clamp((t - (b - fo)) / fo));
