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
// phones / tablets: coarse pointer or touch points
const TOUCH = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
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
  // preview renders 1280x720 on desktop, 960x540 on phones (lighter); export renders 2560x1440
const scale = parseFloat(qs.get('scale') ?? (qs.has('render') ? String(2560 / 1920) : TOUCH ? '0.5' : '0.6667'));
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
// Desktop: keyboard (space, arrows, , . [ ] h) and the control bar. Phone / tablet: tap the picture to play or
// pause, the bar (play, time, seek, fullscreen) shows on a tap and hides itself while playing.
function previewMode(eng: Engine) {
  const audio = new window.Audio('audio/song.m4a');
  audio.preload = 'auto';
  const $ = (id: string) => document.getElementById(id)!;
  const hud = $('hud');
  const seekEl = $('seek') as HTMLInputElement;
  const timeEl = $('time');
  const dur = eng.au.duration;
  seekEl.max = String(dur);
  let t = parseFloat(qs.get('t') ?? '0');
  audio.currentTime = t;
  let playing = false;
  let dragging = false;
  let lastResume = 0;
  let last = performance.now();
  let hide = TOUCH; // the debug time bar (top left) starts hidden on touch devices
  const fmt = (x: number) => `${Math.floor(x / 60)}:${(x % 60).toFixed(2).padStart(5, '0')}`;
  const fmtShort = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;

  // ---- play state + auto-hiding controls
  let idleTimer = 0;
  const showUI = () => {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    if (playing) idleTimer = window.setTimeout(() => document.body.classList.add('idle'), 2500);
  };
  const setPlaying = (p: boolean) => {
    playing = p;
    document.body.classList.toggle('playing', p);
    ($('pp').querySelector('.i-play') as HTMLElement).style.display = p ? 'none' : '';
    ($('pp').querySelector('.i-pause') as HTMLElement).style.display = p ? '' : 'none';
    if (p) {
      if (t >= dur - 0.05) t = 0;
      audio.currentTime = t;
      audio.play().catch(() => setPlaying(false));
    } else audio.pause();
    showUI();
  };
  const toggle = () => setPlaying(!playing);
  const seek = (x: number) => {
    t = Math.max(0, Math.min(dur - 1 / FPS, x));
    audio.currentTime = t;
  };
  (window as any).__seek = seek;
  audio.addEventListener('ended', () => setPlaying(false));

  // ---- pointer: tap / click on the picture toggles play; any movement shows the bar
  const bar = $('bar');
  document.addEventListener('pointerup', (e) => {
    if (bar.contains(e.target as Node)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    toggle();
  });
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') showUI();
  });
  $('pp').addEventListener('click', toggle);
  $('big').addEventListener('pointerup', (e) => {
    e.stopPropagation();
    toggle();
  });
  // ---- seek bar
  // While dragging only the picture follows the bar; the audio is moved once, on release. Seeking the audio on
  // every input event (dozens per second) leaves phone browsers stuck "seeking", which froze the picture.
  // Phones may end a drag with pointercancel / touchend instead of pointerup, so every way of letting go ends it.
  const commitSeek = () => {
    audio.currentTime = t;
    if (playing) audio.play().catch(() => setPlaying(false));
  };
  seekEl.addEventListener('pointerdown', () => {
    dragging = true;
    showUI();
  });
  seekEl.addEventListener('touchstart', () => {
    dragging = true;
    showUI();
  }, { passive: true });
  seekEl.addEventListener('input', () => {
    t = Math.max(0, Math.min(dur - 1 / FPS, parseFloat(seekEl.value)));
    if (!dragging) commitSeek(); // a single tap on the bar, or the keyboard
    showUI();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    commitSeek();
    showUI();
  };
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture', 'touchend', 'touchcancel', 'change']) seekEl.addEventListener(ev, endDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('touchend', endDrag);
  // ---- fullscreen (and landscape on phones that allow it)
  $('fs').addEventListener('click', async () => {
    const d = document as any;
    try {
      if (document.fullscreenElement || d.webkitFullscreenElement) {
        await (document.exitFullscreen?.() ?? d.webkitExitFullscreen?.());
      } else {
        const el = document.documentElement as any;
        await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
        await (screen.orientation as any)?.lock?.('landscape').catch(() => {});
      }
    } catch {
      /* not supported (e.g. iPhone Safari): ignore */
    }
    showUI();
  });

  // ---- keyboard (desktop). A focused button would also react to Space on keyup: cancel that.
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') e.preventDefault();
  });
  for (const b of document.querySelectorAll('#bar button, #seek')) b.addEventListener('pointerup', () => (b as HTMLElement).blur());
  window.addEventListener('keydown', (e) => {
    if (e.target === seekEl && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) seekEl.blur();
    const big = e.shiftKey ? 5 : 1;
    if (e.code === 'Space') {
      toggle();
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
    else if (e.key === 'f') ($('fs') as HTMLButtonElement).click();
    showUI();
  });

  if (TOUCH) $('hint').textContent = 'Tap to play / タップで再生';
  else $('hint').textContent = 'Click or press Space / クリック・スペースで再生';
  document.body.classList.add('ready');

  const loop = () => {
    const now = performance.now();
    if (playing && !dragging) {
      if (audio.seeking || audio.readyState < 3) {
        // audio still seeking / buffering (common on phones after a seek): hold the picture where it is
      } else {
        if (audio.paused && now - lastResume > 800) {
          // the browser paused the audio by itself (phone interruption, seek): resume, or show the play button
          lastResume = now;
          audio.play().catch(() => setPlaying(false));
        }
        // smooth clock that follows the audio element
        t += (now - last) / 1000;
        const at = audio.currentTime;
        if (Math.abs(at - t) > 0.08) t = at;
        else t += (at - t) * 0.1;
      }
      if (t >= dur) {
        t = dur - 1 / FPS;
        setPlaying(false);
      }
    }
    last = now;
    eng.render(t);
    if (!dragging) seekEl.value = String(t);
    timeEl.textContent = `${fmtShort(t)} / ${fmtShort(dur)}`;
    hud.style.display = hide ? 'none' : 'block';
    hud.textContent = `${fmt(t)}  beat ${eng.au.beatAt(t).toFixed(2)}  ${eng.lastScene}   [space] play  ←/→ ±1s (shift 5s)  ,/. frame  [ ] scene  f full  h hide`;
    requestAnimationFrame(loop);
  };
  loop();
}

main().catch((e) => {
  document.body.innerHTML = `<pre style="color:#f88;white-space:pre-wrap;padding:16px">Could not start the preview.
${e?.stack ?? e}</pre>`;
  console.error(e);
  const q = new URLSearchParams(location.search);
  if (q.has('render')) {
    const ws = new WebSocket(`ws://${location.host}/ws${location.search}`);
    ws.onopen = () => ws.send('error:' + String(e?.stack ?? e));
  }
});
