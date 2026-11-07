#!/usr/bin/env bash
# Frames + mix + captions -> final 1080x1920 MP4 with a light film grade.
set -euo pipefail
cd "$(dirname "$0")"
ffmpeg -y -v error -framerate 30 -i build/frames/f%05d.jpg -i build/mix.wav \
  -vf "eq=saturation=1.16:contrast=1.07:gamma=0.97,unsharp=5:5:0.45:5:5:0,vignette=PI/6,ass=build/captions.ass" \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart \
  the-flood-bell.mp4
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,codec_name -of compact the-flood-bell.mp4
