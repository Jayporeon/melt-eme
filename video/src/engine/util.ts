// Small deterministic helpers. Nothing here reads the clock or Math.random:
// every frame is a pure function of song time.

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const smooth = (a: number, b: number, x: number) => {
  const t = inv(a, b, x);
  return t * t * (3 - 2 * t);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeInOut = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutBack = (t: number, s = 1.70158) => {
  t = clamp(t) - 1;
  return t * t * ((s + 1) * t + s) + 1;
};
// damped spring step response, 0 -> 1, overshooting
export const spring = (t: number, freq = 9, damp = 6) =>
  t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(freq * t);
export const pulse = (t: number, half = 0.12) => (t < 0 ? 0 : Math.exp((-t * Math.LN2) / half));

export function hash(n: number): number {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
export const hash2 = (a: number, b: number) => hash(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));
export const srand = (n: number, a = -1, b = 1) => a + (b - a) * hash(n);

// smooth 1D value noise
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash2(i, seed), hash2(i + 1, seed), u) * 2 - 1;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// frame index at 60 fps; use for flicker so that it is stable
export const frameIdx = (t: number) => Math.floor(t * 60 + 1e-4);
