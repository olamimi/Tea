#!/usr/bin/env bash
# Frames + mix + captions -> final 1080x1920 MP4 with a light film grade.
set -euo pipefail
cd "$(dirname "$0")"
ffmpeg -y -v error -framerate 30 -i build/frames/f%05d.jpg -i build/mix.wav \
  -vf "curves=all='0/0 0.22/0.18 0.5/0.5 0.78/0.83 1/1',eq=saturation=1.22:contrast=1.04,unsharp=5:5:0.45:5:5:0,vignette=PI/6,ass=build/captions.ass" \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart \
  the-new-boy.mp4
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,codec_name -of compact the-new-boy.mp4
