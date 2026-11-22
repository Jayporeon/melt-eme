# とけちゃう、エメ (Tokechau, Eme) — a kinetic-lyric music video

Vocals　Suno V6　／　Lyrics　Opus 5.5

Eme is a Vaporeon fan character created by ぴょんこ ([X: @pyon_ko_](https://x.com/pyon_ko_)).
エメは ぴょんこさん（X: @pyon_ko_）による シャワーズの二次創作キャラクターです。

> **Content note:** this work depicts misuse of over-the-counter cough medicine (overdose), disability and isolation.
> If you are going through something similar, please reach out to someone you trust or to a local mental-health helpline.

Every frame of this music video is **computed by code**. No footage, photos or AI-generated images are used.
Eme, the main character, never appears directly; she is only hinted at through drops of water, tablets, bubbles and spirals.
The picture is the **lyrics in motion**: every section of the song has its own way of moving the words
(falling into a pile, vertical writing, slams, floating, melting, a spiral, turning see-through, toppling over, an endless loop…),
and every character turns from grey to blue at the moment it is sung.

The same code can:

- **play live in the browser**, rendering each frame as it plays (seek, step frame by frame)
- **export a video**: headless Chrome renders every frame and ffmpeg encodes it (2560×1440, 60 fps by default)

**Watch online:** <https://jayporeon.github.io/melt-eme/> — the MV rendered live in your browser, on a computer or a phone. Once it has loaded, tap the picture (or press **Space**) to play (needs a browser with WebGL2).

The rendered video files (2560×1440, about 1.4 GB; 1920×1080, about 467 MB) are too large for the repository. Download them from [Releases](https://github.com/Jayporeon/melt-eme/releases), or render them yourself (see [Export a video](#export-a-video)).

### Files not in this repository

To keep the repository small, these files are not included (they are listed in `.gitignore`):

- the original song and the stems as WAV (`とけちゃう、エメ.wav`, `0 Lead Vocals.wav` … `7 Other.wav`, about 430 MB in total)
- the rendered videos (`mv/out/`)

**The live preview and video export do not need them**: the preview plays `video/public/audio/song.m4a`, and the export uses that m4a when the WAV is missing.
You only need to put the song and stems back in the project root to **regenerate the lyric timing** (see [How the lyric timing is made](#how-the-lyric-timing-is-made)).

---

## Lyrics

Times are when each line starts to be sung (taken from the lead-vocal stem by forced alignment; see [How the lyric timing is made](#how-the-lyric-timing-is-made)).

### Intro

*music box, whispered vocals*

| Time | Lyrics | English |
|---|---|---|
| 0:08.22 | はろー はろー エメだよ | Hello, hello, it's Eme |
| 0:10.71 | 今日も 生きてる 偉いでしょ？ | Still alive today. Aren't I doing great? |

### Verse 1

| Time | Lyrics | English |
|---|---|---|
| 0:15.23 | 東京の 小さな ワンルーム | A tiny one-room in Tokyo |
| 0:18.83 | 今日の おやつは なあに？ | What's for snacks today? |
| 0:22.21 | ブロンと メジコン 並べたら | I line up Bron and Medicon |
| 0:25.13 | 白い つぶつぶ ぷち・ぷち・ぷち | Little white beads, pop, pop, pop |
| 0:28.98 | 咳も 熱も ないけれど | No cough, no fever, but still |
| 0:31.98 | お水で 流して ごくごく ごくん | Wash it down with water, gulp, gulp, gulp |
| 0:35.98 | 空っぽの 瓶が ころころり | The empty bottle rolls away |
| 0:39.14 | 手帳の 写真だけ 笑ってる | Only the photo in my disability handbook is smiling |

### Pre-Chorus

*build up, vocal chops*

| Time | Lyrics | English |
|---|---|---|
| 0:43.87 | 数えるのは もう やめた | I stopped counting a while ago |
| 0:47.27 | 水色の お腹に 白い粒 | Little white beads in my light-blue belly |
| 0:51.07 | 透けて きらきら 星みたい | See-through and glittering like stars |
| 0:54.01 | 黄色い ひれから 雫が ぽたり | A drop falls from my yellow fins |
| 0:58.30 | 「合法だから 平気だよ」 | "It's legal, so it's fine" |
| 1:03.06 | 誰に 言い訳 してるの？ | Who am I making excuses to? |
| 1:09.05 | 溶けて・溶けて・溶け 溶け 溶けて…… | Melting, melting, melt, melt, melting... |

### Chorus

| Time | Lyrics | English |
|---|---|---|
| 1:12.78 | ぷち・ぷち・ごくん 溶けちゃう | Pop, pop, gulp, I'm melting |
| 1:16.36 | ふわ・ふわ・ひれから 溶けちゃう | Floaty, floaty, melting from my fins |
| 1:19.96 | とろ・とろ・尻尾も 溶けちゃう | Gooey, gooey, my tail is melting too |
| 1:22.95 | エメは お薬色の お水 | Eme is water the colour of medicine |
| 1:27.19 | 見ないで 見ないで 透けちゃうよ | Don't look, don't look, I'm turning see-through |
| 1:30.77 | ぐる・ぐる・おめめが 回るよ | Round, round, my eyes are spinning |
| 1:34.39 | 水に 溶けたら 見えないの | Melt into water and no one can see me |
| 1:37.56 | ばいばい 現実 また明日 | Bye-bye, reality, see you tomorrow |

### Drop

*squishy wobble bass, glittery synth riff, vocal chops*

| Time | Lyrics | English |
|---|---|---|
| 1:41.62 | （ぷち・ぷち・ごくん と・と・と・と・溶けちゃう） | (pop, pop, gulp, m-m-melting) |
| 1:45.26 | （ぷち・ぷち・ごくん エ・エ・エ・エ・エメ・エメ） | (pop, pop, gulp, E-E-Eme) |
| 1:48.86 | （ぷち・ぷち・ごくん と・と・と・と・溶けちゃう） | (pop, pop, gulp, m-m-melting) |
| 1:52.47 | （ぷち・ぷち・ごくん エ・エ・エ・エ・エメ・エメ） | (pop, pop, gulp, E-E-Eme) |

### Verse 2

| Time | Lyrics | English |
|---|---|---|
| 1:56.09 | 青い 体 ぽかぽか 痒い | My blue body is warm and itchy |
| 1:59.62 | 世界が 薄い 膜の 向こう | The world is behind a thin film |
| 2:03.22 | 幸せ みたいな ものが ふわり | Something like happiness floats by |
| 2:06.41 | 触ると 割れちゃう シャボン玉 | A soap bubble that bursts when I touch it |
| 2:10.03 | 切れ目は 寒くて 気持ち悪い | The comedown is cold and makes me sick |
| 2:13.19 | トイレの 床が 一番 優しい | The bathroom floor is the kindest thing |
| 2:16.35 | 怖く なるほど ひれが とろとろ | The scarier it gets, the more my fins drip |
| 2:20.41 | どうせ 明日も この形 | I'll be this same shape tomorrow anyway |

### Bridge

*stutter, glitch breakdown*

| Time | Lyrics | English |
|---|---|---|
| 2:24.48 | き・き・昨日も 同じ 天井 | Y-y-yesterday, the same ceiling |
| 2:28.14 | あ・あ・明日も 同じ 天井 | T-t-tomorrow, the same ceiling |
| 2:31.48 | な・な・治りたいとか 思わない | I don't even w-w-want to get better |
| 2:35.09 | 治ったって 行くとこ ないし | Even if I got better, there's nowhere to go |
| 2:38.95 | ね・ね・年金の 日が 来たら | Wh-wh-when pension day comes |
| 2:42.55 | ま・ま・また お薬 買いに 行く | I'll g-g-go buy more medicine again |
| 2:45.94 | 溶けて 固まって また 溶けて | Melt, harden, and melt again |
| 2:49.72 | その 繰り返し それだけ | Over and over, that's all |

### Final Chorus

| Time | Lyrics | English |
|---|---|---|
| 2:53.82 | ぷち・ぷち・ごくん 溶けちゃう | Pop, pop, gulp, I'm melting |
| 2:57.40 | ふわ・ふわ・ひれから 溶けちゃう | Floaty, floaty, melting from my fins |
| 3:01.00 | とろ・とろ・尻尾も 全部 溶けて | Gooey, gooey, my tail, all of me melts |
| 3:04.22 | エメは お薬色の お水 | Eme is water the colour of medicine |
| 3:08.23 | 見ないで 見ないで 透けちゃうよ | Don't look, don't look, I'm turning see-through |
| 3:11.31 | ……って 誰も 見てないか | ...oh, nobody's watching anyway |
| 3:15.43 | 水に 溶けたら 見えないの | Melt into water and no one can see me |
| 3:18.61 | ばいばい 現実 また明日 | Bye-bye, reality, see you tomorrow |

### Chorus

| Time | Lyrics | English |
|---|---|---|
| 3:22.70 | ぷち・ぷち・ごくん と・と・と・と・溶けちゃう | (pop, pop, gulp, m-m-melting) |
| 3:26.30 | ぷち・ぷち・ごくん エ・エ・エ・エ・エメ エメ | (pop, pop, gulp, E-E-Eme) |
| 3:29.80 | ぷち・ぷち・ごくん と・と・と・と・溶けちゃう | (pop, pop, gulp, m-m-melting) |
| 3:33.52 | ま・ま・ま・ま・ま・ま・ま・ま・また明日 | (s-s-s-s-see you tomorrow) |
| 3:37.56 | おやすみ おやすみ エメ | Good night, good night, Eme |
| 3:41.17 | 明日 形が あったら | If I still have a shape tomorrow |
| 3:44.76 | また ぷちぷち しようかな | Maybe I'll pop a few again |
| 3:51.99 | ……しようかな | ...maybe I will |

---

## Watch live in the browser

```powershell
cd video
```

```powershell
bun install
```

```powershell
bun run dev
```

Open <http://localhost:5177> in a browser. Click or tap the picture (or press **Space**) to start playback (browsers need one click or key press before they allow sound).

**On a phone or tablet:** tap the picture to play or pause. A control bar (play / pause, time, seek bar, fullscreen) appears at the bottom whenever you tap, and hides itself after a few seconds while playing. Phones render at 960×540 to keep playback smooth. Turn the phone sideways, or use the fullscreen button, for a bigger picture.

**On a computer:** click the picture or use the control bar, or the keyboard:

| Key | Action |
|---|---|
| Space | play / pause |
| ← / → | back / forward 1 s (hold Shift for 5 s) |
| , / . | back / forward one frame (1/60 s) |
| [ / ] | jump to the previous / next section |
| f | fullscreen |
| h | hide / show the debug line (time, beat, scene) in the top-left corner |

URL parameters:

- `?t=74` — start at 74 s (e.g. <http://localhost:5177/?t=74>)
- `?scale=1` — canvas resolution factor. The preview defaults to `0.6667` (1280×720) on a computer and `0.5` (960×540) on a phone; `1` is 1920×1080 and `1.3333` is the 2560×1440 used for export

The preview and the export run **the same code**, and each frame depends only on the song time (no random numbers, no wall clock), so what you see in the preview is exactly what gets exported.
When you save a change in `video/src/`, the browser reloads automatically.

> In the Claude Code desktop app, the `mv-preview` entry in `.claude/launch.json` opens the preview directly.

### Publish as a web page (GitHub Pages)

`.github/workflows/pages.yml` runs `vite build` and publishes the result to GitHub Pages on every push to `main`.
The first time, open the repository's **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
The published page is identical to the local preview (same keys, same `?t=` and `?scale=` parameters) and runs in any browser with WebGL2.

---

## Export a video

Needs Google Chrome (headless rendering) and ffmpeg.

```powershell
cd video
```

```powershell
bun run render -- --out ../mv/out/tokechau_eme.mp4
```

How it works: `vite build` first, then 4 headless Chrome instances each render a range of frames; every frame's RGBA pixels go over a WebSocket to ffmpeg, and at the end the segments are joined and muxed with the song audio.
The full video takes about 4 minutes on an RTX 5060.

| Option | Meaning |
|---|---|
| `--out path` | output file (default `../mv/out/tokechau_eme.mp4`) |
| `--from 70 --to 80` | render only 70–80 s |
| `--stills 5,30.2,75` | render PNG stills at these times into `video/out/stills/` |
| `--workers 4` | number of Chrome instances |
| `--cq 24` | NVENC quality (lower = better and larger) |
| `--cpu --crf 20` | encode with libx264 instead of the GPU |
| `--no-build` | skip `vite build` |

Other resolutions (scaling down the 1440p export looks better than rendering at a lower resolution):

```powershell
ffmpeg -i ../mv/out/tokechau_eme.mp4 -vf "scale=1920:1080:flags=lanczos" -c:v h264_nvenc -preset p7 -tune hq -multipass fullres -rc vbr -cq 22 -b:v 0 -maxrate 15M -bufsize 30M -spatial-aq 1 -temporal-aq 1 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart ../mv/out/tokechau_eme_1080p.mp4
```

(`-maxrate 15M` gives about 470 MB for 1080p; for 720p use `scale=1280:720` with `-maxrate 4M`, about 125 MB. Without an NVIDIA GPU, replace `h264_nvenc …` with `libx264 -preset slow -crf 20`.)

---

## Requirements

| Tool | Used for | Version used |
|---|---|---|
| [Bun](https://bun.sh) | packages, preview server, export script | 1.4.4 |
| Google Chrome | headless rendering for video export | 157 |
| ffmpeg (with `h264_nvenc`, or use `--cpu`) | encoding | 9.0.2 |
| Python 3.13 | only to **regenerate the lyric timing** | 3.13.17 |

Python packages (in a `.venv` at the project root):

```powershell
py -3.13 -m venv .venv
```

```powershell
.venv\Scripts\python.exe -m pip install torch==2.7.1 torchaudio==2.7.1 --index-url https://download.pytorch.org/whl/cpu
```

```powershell
.venv\Scripts\python.exe -m pip install -r video/analysis/requirements.txt
```

Run the Python scripts with `-X utf8` (on Windows the default encoding misreads Japanese).

---

## How the lyric timing is made

You don't need this to change the visuals; only when you **edit the lyrics in `lyrics.txt`**.

1. **Lyrics:** `lyrics.txt` (Japanese, split by `[Section]` tags; a line may end with a timestamp, which gets overwritten).
   **English:** `video/analysis/translation_en.txt`, one line per sung line (section tags excluded).
2. **Speech recognition** (once): faster-whisper large-v3 transcribes the lead-vocal stem, giving rough word times → `asr_lead.json`
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/asr_lead.py
   ```
3. **First alignment:** every mora is matched to a note of the lead-vocal MIDI (`MIDI/0 Lead Vocals.mid`), then the lyric data is built
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/align_audio.py --no-fa --write-txt
   ```
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/build_data.py
   ```
4. **Forced alignment:** Meta's multilingual MMS aligner (torchaudio) places each romanised mora on the point where the lead vocal actually sings it → `fa_times.json` (downloads a 1.2 GB model the first time)
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/force_align.py
   ```
5. **Final alignment:** forced alignment first, MIDI as a fallback, plus hand corrections; writes the timestamps back into `lyrics.txt` and produces `video/public/data/lyrics.json`
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/align_audio.py --write-txt
   ```
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/build_data.py
   ```

Checking tools:

- `sync_check.py` — per line: time difference from the speech recognition and what it heard
- `probe.py 82.5 86.8` — the lead vocal's loudness, pitch and onsets over that range next to the current mora times, for checking a line by eye

`align_audio.py` holds a few hand-correction tables (`MANUAL`, `MANUAL_MORA` and the rules for accepting forced-alignment times), recording fixes made after listening to and inspecting each line. If you change a line so that its number of morae changes, update its correction too.

Each line's **end time** is when the lead vocal actually goes quiet (held vowels included), so words never disappear before they have been sung out.

`audio.json` (beats, sections, drum hits, per-stem loudness) is built by `build_data.py` from the beat map in `mv/data/song.json`, `MIDI/` and the stem WAVs.

---

## Folder layout

```
lyrics.txt                    lyrics (Japanese, sections and timestamps)
とけちゃう、エメ.wav            the song (not in the repo)
0 Lead Vocals.wav …           stems: lead vocal, backing vocals, drums, bass… (not in the repo)
MIDI/                         MIDI for each stem
mv/out/                       rendered videos (not in the repo)
video/
  index.html, vite.config.ts  preview page
  src/main.ts                 loads data and fonts; preview mode / export mode
  src/timeline.ts             which scene plays in which section, and where the cuts are
  src/engine/                 the engine
    engine.ts                 per frame: scene draws text → background shader → composite → bloom → final grade
    shaders.ts                GLSL: backgrounds (night room, water, soap film, tiles, ceiling, stripes), melt / wobble / glitch, post
    type.ts                   text layout, subtitles, drop / tablet / bubble shapes
    lyrics.ts, audio.ts       lyric and audio data (per-character times, beats, loudness)
    palette.ts                colours (sky blue throughout; lilac only for the medicine names; pink and yellow once each)
  src/scenes/                 one kinetic-lyric scene per section (see the table below)
  scripts/render.ts           video export
  scripts/sheets.sh           renders a contact sheet of stills for checking
  public/data/                lyrics.json, audio.json
  public/audio/song.m4a       audio for the preview
  analysis/                   Python scripts that make the lyric timing
```

## The sections

| Section | Scene file | How the lyrics move |
|---|---|---|
| Intro | `intro.ts` | music-box dots in the dark; the title drops in letter by letter, then melts; a whisper makes the title flash; whispered lines surface out of blur |
| Verse 1 | `verse1.ts` | a tiny room; each line falls to the floor once sung and piles up like clutter; ブロン is a bottle with a purple label, メジコン a purple box; ぷち pops tablets out of a blister pack; the bottle rolls away |
| Pre-Chorus | `prechorus.ts` | vertical writing; a counter stops at やめた; tablets turn into stars; a yellow drop falls; mirrored words turn round; the line shakes through the た・た・た chops; 溶けて five times, bigger and melting |
| Chorus | `chorus.ts` | sky-blue water; ぷち and ごくん slam in; ふわ floats up; とろとろ stretches and sags; the line floats on the surface with a reflection; turns see-through; a spiral; dissolves into bubbles; is carried off by a wave |
| Drop | `drop.ts` | stripes and a wallpaper of the word; one big card per vocal chop; ぷち and ごくん pop tablets; everything melts away at the end |
| Verse 2 | `verse2.ts` | blurred words behind a soap film; 幸せ inside a bubble that bursts; the comedown: bathroom tiles, double vision, words toppling onto the floor and melting into a puddle |
| Bridge | `bridge.ts` | the ceiling; stutter glitches; the same 天井 every day; words circling the edge of the frame; a calendar with pension day; melt and set again; an endless roll |
| Outro | `outro.ts` | the music box returns; words close like eyes; drops become words; end title, credits and the character credit |

Fonts (all from [Fontsource](https://fontsource.org), SIL Open Font License): Dela Gothic One, Hachi Maru Pop, M PLUS 1, DotGothic16, Klee One, Shippori Mincho B1, Zen Maru Gothic, IBM Plex Mono.

# エメ originally created by ぴょんこ (X: @Pyon_ko_)
