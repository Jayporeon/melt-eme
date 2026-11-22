// Offline export: headless Chrome renders frames (same code as the preview) and streams raw RGBA
// over a WebSocket to ffmpeg. Several Chrome workers each take a contiguous range; the segments
// are joined and muxed with the original WAV at the end.
//
//   bun scripts/render.ts                         full video -> ../mv/out/tokechau_eme.mp4
//   bun scripts/render.ts --from 70 --to 80       a range (seconds)
//   bun scripts/render.ts --stills 5,30.2,75      PNG stills -> out/stills/
//   options: --workers 3  --out path  --cq 24 (NVENC) | --cpu --crf 20 (x264)  --no-build
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const args = process.argv.slice(2);
const opt = (k: string, d?: string) => {
  const i = args.indexOf('--' + k);
  return i >= 0 ? args[i + 1] : d;
};
const has = (k: string) => args.includes('--' + k);

const FPS = 60;
const W = 2560,
  H = 1440;
// the original WAV is not in the git repo; fall back to the preview m4a when it is missing
const WAV_PATH = resolve(ROOT, '..', 'とけちゃう、エメ.wav');
const WAV = existsSync(WAV_PATH) ? WAV_PATH : join(ROOT, 'public/audio/song.m4a');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 5199;
const audio = JSON.parse(readFileSync(join(ROOT, 'public/data/audio.json'), 'utf8'));
const DUR: number = audio.duration;

const stills = opt('stills')?.split(',').map(Number);
const from = parseFloat(opt('from', '0')!);
const to = Math.min(parseFloat(opt('to', String(DUR))!), DUR);
const workers = stills ? 1 : parseInt(opt('workers', '3')!);
// GPU encoder (NVENC) by default; --cpu uses libx264. --cq / --crf set quality.
const encoder = has('cpu')
  ? ['-c:v', 'libx264', '-preset', 'medium', '-crf', opt('crf', '20')!]
  : ['-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', opt('cq', '24')!, '-b:v', '0',
     '-maxrate', '45M', '-bufsize', '90M', '-spatial-aq', '1', '-temporal-aq', '1', '-rc-lookahead', '32'];
const out = resolve(opt('out', stills ? join(ROOT, 'out/stills') : join(ROOT, '..', 'mv/out/tokechau_eme.mp4'))!);
const tmp = join(ROOT, 'out/tmp');
mkdirSync(tmp, { recursive: true });

if (!has('no-build')) {
  const b = Bun.spawnSync(['bunx', 'vite', 'build', '--logLevel', 'warn'], { cwd: ROOT, stdout: 'inherit', stderr: 'inherit' });
  if (b.exitCode !== 0) process.exit(1);
}

// frames per job
const allFrames = stills
  ? stills.map((s) => Math.round(s * FPS))
  : Array.from({ length: Math.floor((to - from) * FPS + 1e-6) }, (_, i) => Math.round(from * FPS) + i);
const jobs: number[][] = [];
const per = Math.ceil(allFrames.length / workers);
for (let k = 0; k < workers; k++) jobs.push(allFrames.slice(k * per, (k + 1) * per));

function ffmpegFor(k: number) {
  const input = ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'];
  if (stills) {
    mkdirSync(out, { recursive: true });
    return Bun.spawn(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', ...input, '-vf', 'vflip', join(out, 'still_%03d.png')], {
      stdin: 'pipe',
      stdout: 'inherit',
      stderr: 'inherit',
    });
  }
  const seg = join(tmp, `seg_${k}.mp4`);
  return Bun.spawn(
    ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', ...input, '-vf', 'vflip', ...encoder, '-pix_fmt', 'yuv420p', '-g', '120', seg],
    { stdin: 'pipe', stdout: 'inherit', stderr: 'inherit' },
  );
}

const procs = jobs.map((_, k) => ffmpegFor(k));
const done = jobs.map(() => false);
const count = jobs.map(() => 0);
const t0 = performance.now();
let finished: () => void;
const allDone = new Promise<void>((r) => (finished = r));

const server = Bun.serve({
  port: PORT,
  fetch(req, srv) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const k = parseInt(url.searchParams.get('job') ?? '0');
      if (srv.upgrade(req, { data: { k, chain: Promise.resolve() } })) return;
      return new Response('no', { status: 400 });
    }
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const f = Bun.file(join(ROOT, 'dist', p));
    return new Response(f);
  },
  websocket: {
    maxPayloadLength: W * H * 4 + 1024,
    open(ws: any) {
      ws.send(JSON.stringify({ frames: jobs[ws.data.k] }));
    },
    message(ws: any, msg) {
      const k = ws.data.k;
      if (typeof msg === 'string') {
        if (msg.startsWith('error:')) {
          console.error(`worker ${k}: ${msg}`);
          process.exit(1);
        }
        if (msg === 'done') {
          ws.data.chain = ws.data.chain.then(async () => {
            await procs[k].stdin.end();
            await procs[k].exited;
            done[k] = true;
            console.log(`worker ${k} done`);
            if (done.every(Boolean)) finished();
          });
        }
        return;
      }
      ws.data.chain = ws.data.chain.then(async () => {
        procs[k].stdin.write(msg as Uint8Array);
        await procs[k].stdin.flush();
        count[k]++;
        ws.send('k');
      });
    },
  },
});

const chromes = jobs.map((_, k) => {
  const prof = join(tmp, `chrome_${k}`);
  return Bun.spawn(
    [CHROME, '--headless=new', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
      '--no-first-run', '--no-default-browser-check', '--mute-audio', `--user-data-dir=${prof}`, '--window-size=1280,800',
      `http://localhost:${PORT}/index.html?render=1&job=${k}`],
    { stdout: 'ignore', stderr: 'ignore' },
  );
});

const total = allFrames.length;
const tick = setInterval(() => {
  const n = count.reduce((a, b) => a + b, 0);
  const el = (performance.now() - t0) / 1000;
  const fps = n / Math.max(el, 1e-3);
  const eta = (total - n) / Math.max(fps, 1e-3);
  console.log(`${n}/${total} frames  ${fps.toFixed(1)} fps  eta ${(eta / 60).toFixed(1)} min`);
}, 10000);

await allDone;
clearInterval(tick);
for (const c of chromes) c.kill();
server.stop(true);

if (!stills) {
  const list = jobs.map((_, k) => `file '${join(tmp, `seg_${k}.mp4`).replace(/\\/g, '/')}'`).join('\n');
  writeFileSync(join(tmp, 'list.txt'), list);
  const offs = from > 0 ? ['-ss', String(from)] : [];
  const m = Bun.spawnSync(
    ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), ...offs, '-i', WAV,
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', out],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  if (m.exitCode !== 0) process.exit(1);
  for (let k = 0; k < jobs.length; k++) rmSync(join(tmp, `seg_${k}.mp4`), { force: true });
}
console.log(`wrote ${out} in ${((performance.now() - t0) / 60000).toFixed(1)} min`);
process.exit(0);
