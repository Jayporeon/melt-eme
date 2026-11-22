// Engine: one frame = pure function of song time t.
//   scene.render(f, ink, sub) draws on two Canvas2D layers and returns post settings,
//   then: background shader -> composite (ink melts / wobbles / glitches; sub stays put) -> bloom -> final.
import { Audio } from './audio';
import { GL, Target, Tex } from './gl';
import { Line, Lyrics } from './lyrics';
import { BG, BRIGHT, COMP, DOWN, FINAL, UP } from './shaders';
import { Ctx, H, W, subtitle } from './type';
import { frameIdx } from './util';

export interface Post {
  bg: number;
  bg2: number;
  bgMix: number;
  tint: [number, number, number];
  light: number;
  bgA: number;
  bgB: number;
  bgC: number;
  melt: number;
  meltSeed: number;
  wob: number;
  wobF: number;
  glitch: number;
  rgb: number;
  zoom: number;
  rot: number;
  shake: [number, number];
  refr: number;
  double: number;
  doubleOff: [number, number];
  bloom: number;
  bloomThr: number;
  ca: number;
  grain: number;
  vig: number;
  flash: number;
  flashCol: [number, number, number];
  invert: number;
  fade: number;
  expo: number;
  sat: number;
  /** English subtitles: false to hide, or a y position */
  sub: boolean | number;
}

export const DEFAULT_POST: Post = {
  bg: 0, bg2: 0, bgMix: 0, tint: [1, 1, 1], light: 1, bgA: 0, bgB: 0, bgC: 0,
  melt: 0, meltSeed: 0, wob: 0, wobF: 9, glitch: 0, rgb: 0, zoom: 1, rot: 0, shake: [0, 0], refr: 0,
  double: 0, doubleOff: [0, 0],
  bloom: 0.4, bloomThr: 0.78, ca: 0.6, grain: 0.07, vig: 0.55, flash: 0, flashCol: [1, 1, 1],
  invert: 0, fade: 0, expo: 1, sat: 1, sub: true,
};

export interface Frame {
  t: number;
  lt: number; // local time in scene
  p: number; // 0..1 through scene
  start: number;
  end: number;
  beat: number;
  beatPhase: number;
  bar: number;
  kick: number;
  snare: number;
  hat: number;
  bass: number;
  vocal: number;
  au: Audio;
  ly: Lyrics;
}

export type SceneFn = (f: Frame, ink: Ctx, sub: Ctx) => Partial<Post>;
export interface Entry {
  id: string;
  start: number;
  end: number;
  fn: SceneFn;
}

export class Engine {
  gl: GL;
  ink: HTMLCanvasElement;
  sub: HTMLCanvasElement;
  ix: Ctx;
  sx: Ctx;
  tInk: Tex;
  tSub: Tex;
  tBg: Target;
  tComp: Target;
  bloomT: Target[] = [];
  bloomU: Target[] = [];
  lastPost: Post = DEFAULT_POST;
  lastScene = '';
  constructor(
    public canvas: HTMLCanvasElement,
    public scale: number, // output px per logical px
    public au: Audio,
    public ly: Lyrics,
    public timeline: Entry[],
  ) {
    const pw = Math.round(W * scale),
      ph = Math.round(H * scale);
    canvas.width = pw;
    canvas.height = ph;
    this.gl = new GL(canvas);
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = pw;
      c.height = ph;
      return c;
    };
    this.ink = mk();
    this.sub = mk();
    this.ix = this.ink.getContext('2d', { willReadFrequently: false })!;
    this.sx = this.sub.getContext('2d')!;
    this.tInk = this.gl.canvasTex();
    this.tSub = this.gl.canvasTex();
    this.tBg = this.gl.target(pw, ph);
    this.tComp = this.gl.target(pw, ph);
    let w = pw,
      h = ph;
    for (let i = 0; i < 6; i++) {
      w = Math.max(1, w >> 1);
      h = Math.max(1, h >> 1);
      this.bloomT.push(this.gl.target(w, h));
      this.bloomU.push(this.gl.target(w, h));
    }
  }

  scene(t: number): Entry {
    for (const e of this.timeline) if (t >= e.start && t < e.end) return e;
    return this.timeline[this.timeline.length - 1];
  }

  /** line whose English subtitle shows at t (non-overlapping windows) */
  subLine(t: number): { l: Line; a: number } | null {
    const L = this.ly.lines;
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      const next = L[i + 1];
      const s = l.start - 0.25;
      const e = Math.max(l.end + 0.1, Math.min(l.end + 0.9, next ? next.start - 0.05 : Infinity));
      if (t >= s && t < e) {
        const a = Math.min(1, (t - s) / 0.25, (e - t) / 0.25);
        return { l, a };
      }
    }
    return null;
  }

  render(t: number) {
    const au = this.au;
    const e = this.scene(t);
    this.lastScene = e.id;
    const beat = au.beatAt(t);
    const f: Frame = {
      t,
      lt: t - e.start,
      p: (t - e.start) / (e.end - e.start),
      start: e.start,
      end: e.end,
      beat,
      beatPhase: beat - Math.floor(beat),
      bar: beat / 4,
      kick: au.hit('kick', t, 0.1),
      snare: au.hit('snare', t, 0.12),
      hat: au.hit('hat', t, 0.05),
      bass: au.env('bass', t),
      vocal: au.env('vocal', t),
      au,
      ly: this.ly,
    };
    const S = this.scale;
    for (const c of [this.ix, this.sx]) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.ink.width, this.ink.height);
      c.setTransform(S, 0, 0, S, 0, 0);
      c.globalAlpha = 1;
      c.filter = 'none';
    }
    const post: Post = { ...DEFAULT_POST, ...e.fn(f, this.ix, this.sx) };
    this.lastPost = post;
    if (post.sub !== false) {
      const s = this.subLine(t);
      if (s) subtitle(this.sx, s.l, s.a, typeof post.sub === 'number' ? post.sub : 1012);
    }
    this.composite(t, post);
  }

  private composite(t: number, p: Post) {
    const g = this.gl;
    const fr = frameIdx(t);
    g.upload(this.tInk, this.ink);
    g.upload(this.tSub, this.sub);
    g.draw('bg', BG, this.tBg, {
      uT: t, uMode: p.bg, uMode2: p.bg2, uMix: p.bgMix, uBeat: this.au.beatAt(t), uKick: this.au.hit('kick', t, 0.1),
      uBass: this.au.env('bass', t), uA: p.bgA, uB: p.bgB, uC: p.bgC, uLight: p.light, uTint: p.tint,
    });
    g.draw('comp', COMP, this.tComp, {
      uBg: this.tBg, uInk: this.tInk, uSub: this.tSub, uT: t, uMelt: p.melt, uMeltSeed: p.meltSeed,
      uWob: p.wob, uWobF: p.wobF, uGlitch: p.glitch, uRgb: p.rgb, uFrame: fr, uZoom: p.zoom, uRot: p.rot,
      uShake: p.shake, uRefr: p.refr, uDouble: p.double, uDoubleOff: p.doubleOff,
    });
    // bloom
    g.draw('bright', BRIGHT, this.bloomT[0], { uSrc: this.tComp, uThr: p.bloomThr });
    for (let i = 1; i < this.bloomT.length; i++) {
      const s = this.bloomT[i - 1];
      g.draw('down', DOWN, this.bloomT[i], { uSrc: s, uTexel: [1 / s.w, 1 / s.h] });
    }
    const n = this.bloomT.length;
    let cur: Target = this.bloomT[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      g.draw('up', UP, this.bloomU[i], { uSrc: cur, uAdd: this.bloomT[i], uTexel: [1 / cur.w, 1 / cur.h] });
      cur = this.bloomU[i];
    }
    g.draw('final', FINAL, null, {
      uSrc: this.tComp, uBloom: cur, uT: t, uFrame: fr, uBloomAmt: p.bloom, uCa: p.ca, uGrain: p.grain,
      uVig: p.vig, uFlash: p.flash, uFlashCol: p.flashCol, uInvert: p.invert, uFade: p.fade, uExpo: p.expo, uSat: p.sat,
    });
  }
}
