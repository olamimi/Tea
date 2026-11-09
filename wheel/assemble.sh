#!/usr/bin/env bash
# Frames + mix + captions -> final 1080x1920 MP4 with a light film grade.
set -euo pipefail
cd "$(dirname "$0")"
ffmpeg -y -v error -framerate 30 -i build/frames/f%05d.jpg -i build/mix.wav \
  -vf "eq=gamma=0.70:contrast=1.08:saturation=1.15,unsharp=5:5:0.35:5:5:0,noise=alls=4:allf=t,ass=build/captions.ass" \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart \
  the-wheel.mp4
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,codec_name -of compact the-wheel.mp4
