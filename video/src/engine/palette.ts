// One sky-blue world. Sky is the signal colour (sung words, drops, glow).
// Lilac belongs to the medicine only. Pink and lemon are rare accents
// (しあわせ, the yellow fin drop), each used a handful of seconds in the whole video.
export const C = {
  ink: '#050912', // night
  night: '#0b1527',
  deep: '#123a74',
  sky: '#5ccbff', // signal
  sky2: '#2f8fe8',
  pale: '#bfeaff',
  paper: '#eef8ff',
  white: '#ffffff',
  lilac: '#a98cff', // ブロン / メジコン only
  lilac2: '#7a5cf0',
  pink: '#ff8fc8', // rare
  lemon: '#ffd84d', // rare
  frost: '#9fb4c4', // comedown
};

export function rgba(hex: string, a = 1): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function mix(h1: string, h2: string, t: number): string {
  const a = parseInt(h1.slice(1), 16);
  const b = parseInt(h2.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
