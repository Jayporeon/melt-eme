// verse 1 14.71 – 43.78: a tiny room (a box frame). Each line is sung at the top of the room,
// then its words drop to the floor and pile up like clutter. ブロン / メジコン become lilac
// label and box; ぷち spits white tablets; ごく shakes the pile; びん rolls; at the end the
// pile dims and only わらってる is lit.
import { Frame, Post } from '../engine/engine';
import { Line } from '../engine/lyrics';
import { charW, Ctx, glyph, layout, tablet, text } from '../engine/type';
import { clamp, easeOut, hash, inv, lerp, smooth } from '../engine/util';
import { blister, bump, C, F, hot, puTimes, rgba, ripple } from './_kit';

const BOX = { x0: 540, x1: 1380, y0: 150, y1: 880 };
const FLOOR = BOX.y1 - 34;
const LIVE_Y = 280;
const PILE_SIZE = 46;
const G = 5200; // px/s^2
const LINES = [2, 3, 4, 5, 6, 7, 8, 9];
const RESERVE_W = 0; // (no reserved area: the blister sheet falls onto the pile like a word)
const SHEET_SC = 0.34; // blister sheet scale once it lies in the pile
const SHEET_POSE = { x: 960, y: 560, sc: 0.85, rot: -0.06 }; // where it floats while ぷち・ぷち・ぷち pops
const ROLL = 220; // how far the empty bottle rolls

interface Item {
  line: number;
  word: number;
  text: string;
  w: number; // width at pile size
  sx: number;
  sy: number;
  rot: number;
  kind: 'word' | 'bron' | 'medi' | 'bin' | 'sheet';
  c0: number; // character range of the word this item is made of (ブロンと -> ブロン + と)
  c1: number;
}
let pile: Item[] | null = null;

function buildPile(ctx: Ctx, f: Frame): Item[] {
  const items: Item[] = [];
  let row = 0;
  let x = BOX.x0 + 30;
  const rowH = 64;
  // the two bottom rows keep their right end free: the blister sheet and its tablets land there
  const rightLimit = (r: number) => BOX.x1 - 30 - (r <= 1 ? RESERVE_W : 0);
  for (const li of LINES.slice(0, 7)) {
    const l = f.ly.get(li);
    l.words.forEach((wd, wi) => {
      let s = wd.w.replace(/[・？]/g, '');
      if (li === 5 && wi === 2) return; // ぷち・ぷち・ぷち becomes tablets instead
      // ブロンと: the bottle (ブロン) and the particle (と) fall as two separate things
      const parts: [string, Item['kind'], number, number][] = s.startsWith('ブロン')
        ? [['ブロン', 'bron', 0, 3], [s.slice(3), 'word', 3, [...s].length]]
        : [[s, s.startsWith('メジコン') ? 'medi' : s.startsWith('瓶') ? 'bin' : 'word', 0, [...s].length]];
      parts.forEach(([ps, kind, c0, c1], pi) => {
        if (!ps) return;
        const w = [...ps].reduce((a, c) => a + charW(ctx, c, F.body, 800) * PILE_SIZE, 0) + (kind === 'word' ? 0 : 36);
        // the empty bottle rolls on ころころり: keep the space it rolls into free
        const roll = kind === 'bin' ? ROLL + 20 : 0;
        if (x + w + roll > rightLimit(row)) {
          row++;
          x = BOX.x0 + 30 + hash(row * 17) * 60;
        }
        const r = hash(li * 31 + wi * 7 + pi * 101);
        items.push({
          line: li,
          word: wi,
          text: ps,
          w,
          sx: x + w / 2,
          sy: FLOOR - row * rowH - 22 - r * 8,
          rot: (r - 0.5) * (row === 0 ? 0.1 : 0.34),
          kind,
          c0,
          c1,
        });
        x += w + 24 + r * 20 + roll + (pi === 0 && parts.length > 1 ? 70 : 0);
      });
    });
    if (li === 5) {
      // the blister sheet joins the pile right after 白い つぶつぶ, like one more thing dropped on the floor
      const w = 496 * SHEET_SC + 10;
      if (x + w > rightLimit(row)) {
        row++;
        x = BOX.x0 + 30 + hash(row * 17) * 60;
      }
      items.push({ line: 5, word: 3, text: '', w, sx: x + w / 2, sy: FLOOR - row * rowH - 30, rot: -0.12, kind: 'sheet', c0: 0, c1: 0 });
      x += w + 30;
    }
  }
  return items;
}

function liveLayout(ink: Ctx, f: Frame, l: Line) {
  const gs = f.ly.glyphs(l);
  let size = 66;
  let lay = layout(ink, gs, F.body, size, 960, LIVE_Y, { weight: 800, gap: 0.45 });
  if (lay.w > 760) {
    size *= 760 / lay.w;
    lay = layout(ink, gs, F.body, size, 960, LIVE_Y, { weight: 800, gap: 0.45 });
  }
  return { gs, size, p: lay.p };
}

/** time this line's words leave the top and fall */
/** a line's words fall only once the line has been sung out (l.end = lead vocal goes quiet) */
const fallT = (f: Frame, li: number) =>
  li === 9 ? 1e9 : Math.max(f.ly.get(li).end + 0.05, f.ly.get(li + 1).start - 0.35);

function drawItem(ink: Ctx, it: Item, x: number, y: number, rot: number, a: number, dim: number) {
  ink.save();
  ink.translate(x, y);
  ink.rotate(rot);
  ink.globalAlpha = a;
  if (it.kind === 'bron') {
    // glass bottle on its side: pale glass body with a purple label
    ink.fillStyle = rgba(C.pale, 0.22 * dim + 0.1);
    ink.strokeStyle = rgba(C.pale, 0.7 * dim);
    ink.lineWidth = 2;
    ink.beginPath();
    ink.roundRect(-it.w / 2 - 10, -30, it.w + 20, 60, 16);
    ink.fill();
    ink.stroke();
    ink.fillStyle = '#6a4fd6';
    ink.globalAlpha = a * (0.5 + 0.5 * dim);
    ink.fillRect(-it.w / 2 + 8, -22, it.w - 16, 44);
    ink.globalAlpha = a;
    text(ink, it.text, 0, 0, PILE_SIZE * 0.8, F.body, { weight: 800, fill: '#ffffff' });
  } else if (it.kind === 'medi') {
    // purple paper box
    ink.fillStyle = '#5338b8';
    ink.globalAlpha = a * (0.45 + 0.55 * dim);
    ink.fillRect(-it.w / 2, -30, it.w, 60);
    ink.strokeStyle = rgba('#ffffff', 0.5);
    ink.lineWidth = 2;
    ink.strokeRect(-it.w / 2 + 5, -25, it.w - 10, 50);
    ink.globalAlpha = a;
    text(ink, it.text, 0, 0, PILE_SIZE * 0.8, F.body, { weight: 800, fill: '#ffffff' });
  } else {
    text(ink, it.text, 0, 0, PILE_SIZE, F.body, { weight: 800, fill: rgba(C.paper, 0.25 + 0.5 * dim) });
  }
  ink.restore();
}

export function verse1(f: Frame, ink: Ctx, _sub: Ctx): Partial<Post> {
  const t = f.t;
  if (!pile) pile = buildPile(ink, f);
  const endDim = 1 - 0.75 * smooth(39.2, 41.0, t);
  const intro = smooth(f.start, f.start + 1.2, t);

  // shake from ごく (line 7 morae)
  let shake = 0;
  const l7 = f.ly.glyphs(f.ly.get(7));
  for (const g of l7) if (g.ch === 'ご' && t >= g.t0) shake = Math.max(shake, Math.exp(-(t - g.t0) * 9));

  // the room
  ink.save();
  ink.globalAlpha = 0.55 * intro;
  ink.strokeStyle = C.pale;
  ink.lineWidth = 2;
  ink.strokeRect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0);
  ink.globalAlpha = 0.18 * intro;
  ink.strokeRect(BOX.x0 + 10, BOX.y0 + 10, BOX.x1 - BOX.x0 - 20, BOX.y1 - BOX.y0 - 20);
  ink.restore();
  text(ink, '1R', BOX.x0 + 8, BOX.y0 - 24, 22, F.mono, { align: 'left', fill: rgba(C.pale, 0.5 * intro) });
  ripple(ink, t, f.start, 960, 540);

  // pile
  const pu5 = puTimes(f, 5);
  const pops5: number[] = [];
  pops5[2] = pu5[0];
  pops5[6] = pu5[1];
  pops5[3] = pu5[2];
  // top of the pile when the tablets pop out (lines up to 4 have landed): they land there and get buried later
  const pileTop = Math.min(...pile.filter((q) => q.line <= 4).map((q) => q.sy)) - 30;
  let sheetFalling = false;
  for (const it of pile) {
    const ft = fallT(f, it.line);
    const st = ft + it.word * 0.07 + it.c0 * 0.03;
    if (it.kind === 'sheet') {
      blister(ink, t, SHEET_POSE.x, SHEET_POSE.y, SHEET_POSE.sc, SHEET_POSE.rot, pops5, 0.4 + 0.6 * endDim, {
        part: 'tablets', seed: 5, floorY: pileTop, keepTablets: true, jump: 760, landX: [BOX.x0 + 70, BOX.x1 - 70],
      });
      if (t >= st) sheetFalling = true;
    }
    if (t < st) continue;
    if (it.kind === 'sheet') {
      const dy = it.sy - SHEET_POSE.y;
      const T = Math.sqrt((2 * Math.max(dy, 1)) / G);
      const s = t - st;
      const q = Math.min(1, s / T);
      const b = Math.max(0, s - T);
      const x = lerp(SHEET_POSE.x, it.sx, q) + Math.sin(t * 70) * shake * 8;
      const y = SHEET_POSE.y + dy * q * q - Math.abs(Math.sin(b * 16)) * 20 * Math.exp(-b * 7) + Math.cos(t * 63) * shake * 5;
      blister(ink, t, x, y, lerp(SHEET_POSE.sc, SHEET_SC, q), lerp(SHEET_POSE.rot, it.rot, q), pops5, 0.4 + 0.6 * endDim, { part: 'sheet', seed: 5 });
      continue;
    }
    const l = f.ly.get(it.line);
    const { p } = liveLayout(ink, f, l);
    const mine = p.filter((q) => q.g.word === it.word && !q.g.punct).slice(it.c0, it.c1);
    const x0 = mine.length ? (mine[0].x + mine[mine.length - 1].x) / 2 : 960;
    const y0 = LIVE_Y;
    const dy = it.sy - y0;
    const T = Math.sqrt((2 * dy) / G);
    const s = t - st;
    let x: number, y: number, rot: number;
    if (s < T) {
      const q = s / T;
      x = lerp(x0, it.sx, q);
      y = y0 + dy * q * q;
      rot = it.rot * q;
    } else {
      const b = s - T;
      x = it.sx;
      y = it.sy - Math.abs(Math.sin(b * 16)) * 26 * Math.exp(-b * 7);
      rot = it.rot;
    }
    if (it.kind === 'bin') {
      // empty bottle rolls along the floor on ころころり
      const l8 = f.ly.get(8).words[2];
      const r = inv(l8.start, l8.end + 0.6, t);
      x += easeOut(r) * ROLL;
      rot += easeOut(r) * Math.PI * 4;
    }
    const sh = shake * 8;
    x += Math.sin(t * 70 + it.word) * sh;
    y += Math.cos(t * 63 + it.line) * sh * 0.6;
    drawItem(ink, it, x, y, rot, 1, endDim);
  }

  // ぷち・ぷち・ぷち: a blister sheet floats up in the room; each ぷち pops one tablet out onto the pile.
  // When the line is done the sheet drops into the clutter at the front right.
  {
    const l5 = f.ly.get(5);
    const pu = puTimes(f, 5);
    const s0 = l5.start - 0.5;
    if (t > s0 && !sheetFalling) {
      const drop0 = fallT(f, 5) + 0.25;
      const appear = easeOut(clamp((t - s0) / 0.5));
      void drop0;
      const x = SHEET_POSE.x,
        y = SHEET_POSE.y + (1 - appear) * 60,
        sc = SHEET_POSE.sc,
        rot = SHEET_POSE.rot;
      const pops: number[] = [];
      pops[2] = pu[0];
      pops[6] = pu[1];
      pops[3] = pu[2];
      blister(ink, t, x, y, sc, rot, pops, appear * (0.4 + 0.6 * endDim), { part: 'sheet', seed: 5 });
    }
  }

  // live line at the top of the room
  for (const li of LINES) {
    const l = f.ly.get(li);
    const s0 = li > LINES[0] ? Math.max(l.start - 0.12, fallT(f, li - 1)) : l.start - 0.12;
    const e0 = fallT(f, li);
    if (t < s0 || t >= e0) continue;
    const { size, p } = liveLayout(ink, f, l);
    const inA = clamp((t - s0) / Math.max(0.1, Math.min(0.3, l.start - s0)));
    for (const q of p) {
      const g = q.g;
      const h = hot(g, t);
      const on = t >= g.t0;
      let col: string = !on ? rgba(C.paper, 0.3) : h > 0.4 ? C.sky : C.paper;
      if (li === 4 && (g.word === 0 || g.word === 1) && on && g.ch !== 'と') col = C.lilac;
      const isWarau = li === 9 && g.word === 2;
      const fnt = isWarau ? F.hand : F.body;
      if (isWarau && on) col = C.sky;
      const b = bump(g, t, 0.3);
      glyph(ink, g.ch, q.x, q.y - (on ? 12 * Math.exp(-(t - g.t0) * 10) : 0), size * (isWarau ? 1.05 : 1), fnt, {
        weight: isWarau ? 600 : 800,
        fill: col,
        sx: b,
        sy: b,
        alpha: inA,
        shadow: 0.4,
      });
    }
  }

  const push = smooth(f.start, f.end, t);
  return {
    bg: 0,
    light: 0.75 + 0.2 * f.kick,
    zoom: 1 + 0.1 * push + 0.012 * f.kick,
    shake: [Math.sin(t * 80) * shake * 0.003, Math.cos(t * 71) * shake * 0.002],
    melt: 0.04 + 0.08 * push,
    meltSeed: 11,
    bloom: 0.55,
    vig: 0.7,
    grain: 0.08,
  };
}
