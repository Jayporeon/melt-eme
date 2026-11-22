import '@fontsource/dela-gothic-one/400.css';
import '@fontsource/hachi-maru-pop/400.css';
import '@fontsource-variable/m-plus-1/wght.css';
import '@fontsource/dotgothic16/400.css';
import '@fontsource/klee-one/400.css';
import '@fontsource/klee-one/600.css';
import '@fontsource/shippori-mincho-b1/500.css';
import '@fontsource/shippori-mincho-b1/800.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/zen-maru-gothic/500.css';
import '@fontsource/zen-maru-gothic/900.css';

import { Audio, AudioData } from './engine/audio';
import { Engine } from './engine/engine';
import { Lyrics } from './engine/lyrics';
import { F } from './engine/type';
import { buildTimeline, EXTRA_TEXT } from './timeline';

const qs = new URLSearchParams(location.search);
const FPS = 60;

async function loadFonts(ly: Lyrics) {
  const chars = new Set<string>();
  for (const l of ly.lines) for (const c of l.text + l.en) chars.add(c);
  for (const c of EXTRA_TEXT) chars.add(c);
  const s = [...chars].join('');
  const jobs: Promise<unknown>[] = [];
  const fams: [string, number[]][] = [
    [F.slam, [400]], [F.pop, [400]], [F.body, [300, 500, 800]], [F.dot, [400]], [F.hand, [400, 600]],
    [F.min, [500, 800]], [F.mono, [400, 500]], [F.maru, [500, 900]],
  ];
  for (const [f, ws] of fams) for (const w of ws) jobs.push(document.fonts.load(`${w} 40px ${f}`, s));
  await Promise.all(jobs);
  await document.fonts.ready;
}

async function main() {
  const [ad, ld] = await Promise.all([
    fetch('data/audio.json').then((r) => r.json() as Promise<AudioData>),
    fetch('data/lyrics.json').then((r) => r.json()),
  ]);
  const au = new Audio(ad);
  const ly = new Lyrics(ld);
  await loadFonts(ly);
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const scale = parseFloat(qs.get('scale') ?? (qs.has('render') ? String(2560 / 1920) : '0.6667'));
  const eng = new Engine(canvas, scale, au, ly, buildTimeline(au, ly));
  (window as any).__eng = eng;

  if (qs.has('render')) return renderMode(eng);
  previewMode(eng);
}

// --------------------------------------------------------------------------- export
async function renderMode(eng: Engine) {
  document.body.classList.add('render');
  const ws = new WebSocket(`ws://${location.host}/ws${location.search}`);
  ws.binaryType = 'arraybuffer';
  await new Promise((r) => (ws.onopen = r));
  const job: { frames: number[] } = await new Promise((r) => (ws.onmessage = (m) => r(JSON.parse(m.data))));
  const gl = eng.gl.gl;
  const w = eng.canvas.width,
    h = eng.canvas.height;
  let acks = 0;
  let waiting: (() => void) | null = null;
  ws.onmessage = () => {
    acks++;
    if (waiting) {
      const f = waiting;
      waiting = null;
      f();
    }
  };
  let sent = 0;
  for (const fi of job.frames) {
    eng.render(fi / FPS);
    const buf = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    ws.send(buf.buffer);
    sent++;
    if (sent - acks >= 3) await new Promise<void>((r) => (waiting = r));
  }
  while (acks < sent) await new Promise<void>((r) => (waiting = r));
  ws.send('done');
}

// --------------------------------------------------------------------------- preview
function previewMode(eng: Engine) {
  const audio = new window.Audio('audio/song.m4a');
  audio.preload = 'auto';
  const hud = document.getElementById('hud')!;
  let t = parseFloat(qs.get('t') ?? '0');
  audio.currentTime = t;
  let playing = false;
  let last = performance.now();
  let hide = false;
  const fmt = (x: number) => `${Math.floor(x / 60)}:${(x % 60).toFixed(2).padStart(5, '0')}`;
  const seek = (x: number) => {
    t = Math.max(0, Math.min(eng.au.duration - 1 / FPS, x));
    audio.currentTime = t;
  };
  window.addEventListener('keydown', (e) => {
    const big = e.shiftKey ? 5 : 1;
    if (e.code === 'Space') {
      playing = !playing;
      if (playing) {
        audio.currentTime = t;
        audio.play();
      } else audio.pause();
      e.preventDefault();
    } else if (e.code === 'ArrowRight') seek(t + big);
    else if (e.code === 'ArrowLeft') seek(t - big);
    else if (e.key === '.') seek(t + 1 / FPS);
    else if (e.key === ',') seek(t - 1 / FPS);
    else if (e.key === ']' || e.key === '[') {
      const tl = eng.timeline;
      const i = tl.findIndex((s) => t >= s.start && t < s.end);
      const j = Math.max(0, Math.min(tl.length - 1, i + (e.key === ']' ? 1 : -1)));
      seek(tl[j].start + 0.001);
    } else if (e.key === 'h') hide = !hide;
  });
  (window as any).__seek = seek;
  const loop = () => {
    const now = performance.now();
    if (playing) {
      // smooth clock that follows the audio element
      t += (now - last) / 1000;
      const at = audio.currentTime;
      if (Math.abs(at - t) > 0.08) t = at;
      else t += (at - t) * 0.1;
    }
    last = now;
    eng.render(t);
    hud.style.display = hide ? 'none' : 'block';
    hud.textContent = `${fmt(t)}  beat ${eng.au.beatAt(t).toFixed(2)}  ${eng.lastScene}   [space] play  ←/→ ±1s (shift 5s)  ,/. frame  [ ] scene  h hide`;
    requestAnimationFrame(loop);
  };
  loop();
}

main().catch((e) => {
  document.body.innerHTML = `<pre style="color:#f88;white-space:pre-wrap">${e?.stack ?? e}</pre>`;
  console.error(e);
  const q = new URLSearchParams(location.search);
  if (q.has('render')) {
    const ws = new WebSocket(`ws://${location.host}/ws${location.search}`);
    ws.onopen = () => ws.send('error:' + String(e?.stack ?? e));
  }
});
