#!/bin/bash
# usage: scripts/sheets.sh "t1,t2,..."   -> out/sheet_N.jpg (4x3 tiles, labelled)
set -e
cd "$(dirname "$0")/.."
rm -rf out/stills
bun scripts/render.ts --stills "$1" ${2:-} > /dev/null
n=$(ls out/stills/*.png | wc -l)
IFS=',' read -ra TS <<< "$1"
rm -f out/sheet_*.jpg
mkdir -p out/lab
for i in $(seq 1 $n); do
  f=$(printf "out/stills/still_%03d.png" $i)
  ffmpeg -hide_banner -loglevel error -y -i "$f" -vf "scale=640:360,drawtext=text='${TS[$((i-1))]}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6" "out/lab/$(printf %03d $i).png"
done
ffmpeg -hide_banner -loglevel error -y -i out/lab/%03d.png -vf "tile=4x3" out/sheet_%d.jpg
rm -rf out/lab
ls out/sheet_*.jpg
