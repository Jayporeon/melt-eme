# とけちゃう、エメ — 動態歌詞 MV

歌手　Suno V6　／　作詞　Opus 5.5

> **內容提醒**：本作品描寫藥物過量使用（市售止咳藥）、身心障礙與孤立，請斟酌觀看。
> 若你正在經歷類似的困境，請向身邊的人或當地的心理支援專線求助。

這支 MV 的每一格畫面都是**程式即時算出來的**，沒有使用任何影片、照片或 AI 生成素材。
主角エメ不直接出現，只以水滴、藥片、泡泡、螺旋這些符號暗示；畫面的主體是**動態歌詞**：
每一段歌曲都有自己的文字動作（掉落堆積、直書、重擊、漂浮、溶化、螺旋、透明化、倒下、迴圈……），
歌詞每個字都在歌聲唱到的那一刻由灰轉藍。

同一套程式可以：

- 在**瀏覽器裡即時播放**（邊播邊算圖，可以拖時間、逐格看）
- **輸出成影片**（無頭 Chrome 逐格算圖 → ffmpeg 編碼，預設 2560×1440 60fps）

**線上觀看**：<https://jayporeon.github.io/melt-eme/>：瀏覽器即時算圖的 MV，載入後按空白鍵播放（需要支援 WebGL2 的瀏覽器，建議用電腦版 Chrome 或 Edge）。

輸出的影片檔（2560×1440 約 1.4 GB、1920×1080 約 467 MB）太大，不放在 repo 裡；請到 [Releases](https://github.com/Jayporeon/melt-eme/releases) 下載，或用〈輸出影片〉自己算出來。

### 這個 repo 裡沒有的檔案

為了控制大小，以下檔案沒有上傳（列在 `.gitignore`）：

- 原曲與分軌 WAV（`とけちゃう、エメ.wav`、`0 Lead Vocals.wav` … `7 Other.wav`，共約 430 MB）
- 輸出的影片（`mv/out/`）

**即時預覽和輸出影片不需要它們**：預覽用的是 `video/public/audio/song.m4a`，輸出影片時會自動改用 m4a（有 WAV 時用 WAV）。
只有要**重新產生歌詞時間**（〈歌詞時間怎麼來的〉）才需要把原曲和分軌放回專案根目錄。

---

## 完整歌詞

時間為每句開始唱的時間（由主唱音軌強制對齊而得，見〈歌詞時間怎麼來的〉）。

### Intro（前奏）

*music box, whispered vocals*

| 時間 | 歌詞 | English |
|---|---|---|
| 0:08.22 | はろー はろー エメだよ | Hello, hello, it's Eme |
| 0:10.71 | 今日も 生きてる 偉いでしょ？ | Still alive today. Aren't I doing great? |

### Verse 1（主歌 1）

| 時間 | 歌詞 | English |
|---|---|---|
| 0:15.23 | 東京の 小さな ワンルーム | A tiny one-room in Tokyo |
| 0:18.83 | 今日の おやつは なあに？ | What's for snacks today? |
| 0:22.21 | ブロンと メジコン 並べたら | I line up Bron and Medicon |
| 0:25.13 | 白い つぶつぶ ぷち・ぷち・ぷち | Little white beads, pop, pop, pop |
| 0:28.98 | 咳も 熱も ないけれど | No cough, no fever, but still |
| 0:31.98 | お水で 流して ごくごく ごくん | Wash it down with water, gulp, gulp, gulp |
| 0:35.98 | 空っぽの 瓶が ころころり | The empty bottle rolls away |
| 0:39.14 | 手帳の 写真だけ 笑ってる | Only the photo in my disability handbook is smiling |

### Pre-Chorus（預副歌）

*build up, vocal chops*

| 時間 | 歌詞 | English |
|---|---|---|
| 0:43.87 | 数えるのは もう やめた | I stopped counting a while ago |
| 0:47.27 | 水色の お腹に 白い粒 | Little white beads in my light-blue belly |
| 0:51.07 | 透けて きらきら 星みたい | See-through and glittering like stars |
| 0:54.01 | 黄色い ひれから 雫が ぽたり | A drop falls from my yellow fins |
| 0:58.30 | 「合法だから 平気だよ」 | "It's legal, so it's fine" |
| 1:03.06 | 誰に 言い訳 してるの？ | Who am I making excuses to? |
| 1:09.05 | 溶けて・溶けて・溶け 溶け 溶けて…… | Melting, melting, melt, melt, melting... |

### Chorus（副歌）

| 時間 | 歌詞 | English |
|---|---|---|
| 1:12.78 | ぷち・ぷち・ごくん 溶けちゃう | Pop, pop, gulp, I'm melting |
| 1:16.36 | ふわ・ふわ・ひれから 溶けちゃう | Floaty, floaty, melting from my fins |
| 1:19.96 | とろ・とろ・尻尾も 溶けちゃう | Gooey, gooey, my tail is melting too |
| 1:22.95 | エメは お薬色の お水 | Eme is water the colour of medicine |
| 1:27.19 | 見ないで 見ないで 透けちゃうよ | Don't look, don't look, I'm turning see-through |
| 1:30.77 | ぐる・ぐる・おめめが 回るよ | Round, round, my eyes are spinning |
| 1:34.39 | 水に 溶けたら 見えないの | Melt into water and no one can see me |
| 1:37.56 | ばいばい 現実 また明日 | Bye-bye, reality, see you tomorrow |

### Drop（間奏 Drop）

*squishy wobble bass, glittery synth riff, vocal chops*

| 時間 | 歌詞 | English |
|---|---|---|
| 1:41.62 | （ぷち・ぷち・ごくん と・と・と・と・溶けちゃう） | (pop, pop, gulp, m-m-melting) |
| 1:45.26 | （ぷち・ぷち・ごくん エ・エ・エ・エ・エメ・エメ） | (pop, pop, gulp, E-E-Eme) |
| 1:48.86 | （ぷち・ぷち・ごくん と・と・と・と・溶けちゃう） | (pop, pop, gulp, m-m-melting) |
| 1:52.47 | （ぷち・ぷち・ごくん エ・エ・エ・エ・エメ・エメ） | (pop, pop, gulp, E-E-Eme) |

### Verse 2（主歌 2）

| 時間 | 歌詞 | English |
|---|---|---|
| 1:56.09 | 青い 体 ぽかぽか 痒い | My blue body is warm and itchy |
| 1:59.62 | 世界が 薄い 膜の 向こう | The world is behind a thin film |
| 2:03.22 | 幸せ みたいな ものが ふわり | Something like happiness floats by |
| 2:06.41 | 触ると 割れちゃう シャボン玉 | A soap bubble that bursts when I touch it |
| 2:10.03 | 切れ目は 寒くて 気持ち悪い | The comedown is cold and makes me sick |
| 2:13.19 | トイレの 床が 一番 優しい | The bathroom floor is the kindest thing |
| 2:16.35 | 怖く なるほど ひれが とろとろ | The scarier it gets, the more my fins drip |
| 2:20.41 | どうせ 明日も この形 | I'll be this same shape tomorrow anyway |

### Bridge（橋段）

*stutter, glitch breakdown*

| 時間 | 歌詞 | English |
|---|---|---|
| 2:24.48 | き・き・昨日も 同じ 天井 | Y-y-yesterday, the same ceiling |
| 2:28.14 | あ・あ・明日も 同じ 天井 | T-t-tomorrow, the same ceiling |
| 2:31.48 | な・な・治りたいとか 思わない | I don't even w-w-want to get better |
| 2:35.09 | 治ったって 行くとこ ないし | Even if I got better, there's nowhere to go |
| 2:38.95 | ね・ね・年金の 日が 来たら | Wh-wh-when pension day comes |
| 2:42.55 | ま・ま・また お薬 買いに 行く | I'll g-g-go buy more medicine again |
| 2:45.94 | 溶けて 固まって また 溶けて | Melt, harden, and melt again |
| 2:49.72 | その 繰り返し それだけ | Over and over, that's all |

### Final Chorus（最後副歌）

| 時間 | 歌詞 | English |
|---|---|---|
| 2:53.82 | ぷち・ぷち・ごくん 溶けちゃう | Pop, pop, gulp, I'm melting |
| 2:57.40 | ふわ・ふわ・ひれから 溶けちゃう | Floaty, floaty, melting from my fins |
| 3:01.00 | とろ・とろ・尻尾も 全部 溶けて | Gooey, gooey, my tail, all of me melts |
| 3:04.22 | エメは お薬色の お水 | Eme is water the colour of medicine |
| 3:08.23 | 見ないで 見ないで 透けちゃうよ | Don't look, don't look, I'm turning see-through |
| 3:11.31 | ……って 誰も 見てないか | ...oh, nobody's watching anyway |
| 3:15.43 | 水に 溶けたら 見えないの | Melt into water and no one can see me |
| 3:18.61 | ばいばい 現実 また明日 | Bye-bye, reality, see you tomorrow |

### Chorus（副歌）

| 時間 | 歌詞 | English |
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

## 在瀏覽器即時觀看

```powershell
cd video
```

```powershell
bun install
```

```powershell
bun run dev
```

用 Chrome（或 Edge）開啟 <http://localhost:5177>。畫面載入後按 **空白鍵** 開始播放（瀏覽器規定要有一次按鍵才能出聲）。

| 按鍵 | 功能 |
|---|---|
| 空白鍵 | 播放／暫停 |
| ← / → | 往前／往後 1 秒（按住 Shift 為 5 秒） |
| , / . | 往前／往後 1 格（1/60 秒） |
| [ / ] | 跳到上一段／下一段 |
| h | 隱藏／顯示左下角的時間列 |

網址參數：

- `?t=74`：從第 74 秒開始（例：<http://localhost:5177/?t=74>）
- `?scale=1`：畫布解析度倍率。預覽預設 `0.6667`（1280×720）；`1` 為 1920×1080，`1.3333` 為輸出用的 2560×1440

預覽和輸出用的是**同一份程式**，每一格畫面只由「歌曲時間」決定（不使用亂數或系統時間），所以預覽看到的就是輸出的結果。
改了 `video/src/` 裡的程式，存檔後瀏覽器會自動重新載入。

> 在 Claude Code 桌面版裡也可以用 `.claude/launch.json` 的 `mv-preview` 直接開啟預覽。

### 架成網頁（GitHub Pages）

`.github/workflows/pages.yml` 會在每次推送到 `main` 時自動 `vite build` 並發佈到 GitHub Pages。
第一次使用時到 repo 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
發佈的網頁和本機預覽完全一樣（同樣的按鍵、`?t=`、`?scale=` 參數），在任何有 WebGL2 的瀏覽器都能看。

---

## 輸出影片

需要 Google Chrome（無頭模式算圖）和 ffmpeg。

```powershell
cd video
```

```powershell
bun run render -- --out ../mv/out/tokechau_eme.mp4
```

流程：先 `vite build`，再開 4 個無頭 Chrome 分段算圖，每一格的 RGBA 透過 WebSocket 送給 ffmpeg 編碼，最後把分段接起來並混入原始 WAV 音訊。
RTX 5060 上全片約 4 分鐘。

| 參數 | 說明 |
|---|---|
| `--out 路徑` | 輸出檔（預設 `../mv/out/tokechau_eme.mp4`） |
| `--from 70 --to 80` | 只輸出 70–80 秒 |
| `--stills 5,30.2,75` | 只輸出這幾個時間點的 PNG 截圖到 `video/out/stills/` |
| `--workers 4` | 同時開幾個 Chrome |
| `--cq 24` | NVENC 畫質（越小越好、越大檔） |
| `--cpu --crf 20` | 不用顯卡，改用 libx264 編碼 |
| `--no-build` | 跳過 `vite build` |

縮成其他解析度（從 1440p 版本縮小，畫質比直接算低解析度好）：

```powershell
ffmpeg -i ../mv/out/tokechau_eme.mp4 -vf "scale=1920:1080:flags=lanczos" -c:v h264_nvenc -preset p7 -tune hq -multipass fullres -rc vbr -cq 22 -b:v 0 -maxrate 15M -bufsize 30M -spatial-aq 1 -temporal-aq 1 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart ../mv/out/tokechau_eme_1080p.mp4
```

（`-maxrate 15M` 讓 1080p 全片約 470 MB；720p 用 `scale=1280:720` 與 `-maxrate 4M` 約 125 MB。沒有 NVIDIA 顯卡就把 `h264_nvenc …` 換成 `libx264 -preset slow -crf 20`。）

---

## 環境需求

| 工具 | 用途 | 本機版本 |
|---|---|---|
| [Bun](https://bun.sh) | 安裝套件、預覽伺服器、輸出腳本 | 1.4.4 |
| Google Chrome | 輸出影片時的無頭算圖 | 157 |
| ffmpeg（需含 `h264_nvenc`，或改用 `--cpu`） | 編碼 | 9.0.2 |
| Python 3.13 | 只有要**重新產生歌詞時間**才需要 | 3.13.17 |

Python 套件（在專案根目錄建立 `.venv`）：

```powershell
py -3.13 -m venv .venv
```

```powershell
.venv\Scripts\python.exe -m pip install torch==2.7.1 torchaudio==2.7.1 --index-url https://download.pytorch.org/whl/cpu
```

```powershell
.venv\Scripts\python.exe -m pip install -r video/analysis/requirements.txt
```

執行 Python 腳本時請加 `-X utf8`（Windows 預設編碼會讀錯日文）。

---

## 歌詞時間怎麼來的

只改畫面不需要這一段；**改了 `lyrics.txt` 的歌詞**才要重跑。

1. **歌詞**：`lyrics.txt`（日文，用 `[段落]` 分段，每行可帶時間戳，但最後會被覆寫）。
   **英文**：`video/analysis/translation_en.txt`，一行對應一句唱的歌詞（不含段落標籤）。
2. **語音辨識**（只需跑一次）：faster-whisper large-v3 聽寫主唱音軌，得到每個字的大概時間 → `asr_lead.json`
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/asr_lead.py
   ```
3. **第一次對齊**：把每個音節對到主唱 MIDI 的音符（`MIDI/0 Lead Vocals.mid`），產生歌詞資料
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/align_audio.py --no-fa --write-txt
   ```
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/build_data.py
   ```
4. **強制對齊**：用 Meta 的 MMS 多語言對齊模型（torchaudio），把羅馬拼音化的每個音節對到主唱音軌實際出聲的位置 → `fa_times.json`（第一次會下載約 1.2 GB 模型）
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/force_align.py
   ```
5. **最終對齊**：以強制對齊為主、MIDI 為輔，再套用手動修正，寫回 `lyrics.txt` 的時間戳並產生 `video/public/data/lyrics.json`
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/align_audio.py --write-txt
   ```
   ```powershell
   .venv\Scripts\python.exe -X utf8 video/analysis/build_data.py
   ```

檢查工具：

- `sync_check.py`：每句歌詞和語音辨識結果的時間差、聽到的內容
- `probe.py 82.5 86.8`：列出該時段主唱的音量、音高、起音點，以及目前每個音節的時間，用來逐句核對

`align_audio.py` 裡有幾張手動修正表（`MANUAL`、`MANUAL_MORA`、強制對齊的採用規則），記錄了逐句聽過、看過音軌後的修正，改歌詞時如果某句的音節數變了，對應的修正要一起更新。

每句的**結束時間**取主唱音軌真正安靜下來的時間（含拉長的尾音），所以字不會在歌聲結束前消失。

`audio.json`（拍點、段落、鼓點、各音軌音量）由 `build_data.py` 從 `mv/data/song.json` 的拍點表和 `MIDI/`、各分軌 WAV 產生。

---

## 資料夾結構

```
lyrics.txt                    歌詞（日文，含段落與時間戳）
とけちゃう、エメ.wav            原曲
0 Lead Vocals.wav …           分軌（主唱、和聲、鼓、貝斯…）
MIDI/                         各分軌的 MIDI
mv/out/                       輸出的影片
mv/NOTES.md                   製作紀錄（每一版改了什麼、為什麼）
video/
  index.html, vite.config.ts  預覽頁面
  src/main.ts                 載入資料與字型；預覽模式／輸出模式
  src/timeline.ts             各段落使用哪個場景、在哪裡切換
  src/engine/                 引擎
    engine.ts                 每一格：場景畫字 → 背景著色器 → 合成 → 光暈 → 最終調色
    shaders.ts                GLSL：背景（夜晚房間、水中、肥皂膜、磁磚、天花板、斜紋）、融化／晃動／故障、後製
    type.ts                   文字排版、字幕、水滴／藥片／泡泡等圖形
    lyrics.ts, audio.ts       歌詞與音訊資料的讀取（逐字時間、拍點、音量）
    palette.ts                配色（天藍為主；紫色只用於藥名；粉紅、黃色各只出現一次）
  src/scenes/                 每段歌的動態歌詞場景（見下表）
  scripts/render.ts           輸出影片
  scripts/sheets.sh           輸出截圖拼圖，用來檢查
  public/data/                lyrics.json、audio.json
  public/audio/song.m4a       預覽用音訊
  analysis/                   產生歌詞時間的 Python 腳本
```

## 各段的畫面

| 段落 | 場景檔 | 動態歌詞的做法 |
|---|---|---|
| 前奏 | `intro.ts` | 黑暗中的音樂盒音點；標題逐字落下後融化；氣聲讓標題閃一下；耳語歌詞從模糊中浮現 |
| 主歌 1 | `verse1.ts` | 小房間框；每句唱完後字掉到地上堆成雜物；ブロン 是貼紫標籤的藥瓶、メジコン 是紫色紙盒；ぷち 時藥板彈出藥丸；瓶子滾動 |
| 預副歌 | `prechorus.ts` | 直書；數字計數器停在「やめた」；藥片變星星；黃色水滴落下；鏡像字翻正；「た・た・た」連打時抖動；「溶けて」五段越來越大並融化 |
| 副歌 | `chorus.ts` | 天藍水中；ぷち・ごくん 重擊；ふわ 往上漂；とろとろ 拉長下垂；浮在水面的倒影；變透明；螺旋；溶成泡泡；被浪捲走 |
| Drop | `drop.ts` | 斜紋與滿版文字壁紙；每個人聲切片一張大字卡；ぷち・ごくん 彈出藥丸；最後整個融化 |
| 主歌 2 | `verse2.ts` | 肥皂膜後的模糊文字；しあわせ 在泡泡裡然後破掉；退藥後的浴室磁磚、重影、字倒在地上、融成一灘 |
| 橋段 | `bridge.ts` | 天花板；結巴故障；同一個天井；繞著畫面邊緣打轉的字；年金日的月曆；溶解又凝固；無限滾動 |
| 尾聲 | `outro.ts` | 音樂盒回來；字像眼睛一樣閉上；水滴變成字；片尾標題與字幕 |

字型（全部來自 [Fontsource](https://fontsource.org)，SIL Open Font License）：Dela Gothic One、Hachi Maru Pop、M PLUS 1、DotGothic16、Klee One、Shippori Mincho B1、Zen Maru Gothic、IBM Plex Mono。
