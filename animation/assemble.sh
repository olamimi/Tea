#!/usr/bin/env bash
# Frames + mix + captions -> final 1080x1920 MP4 with a light film grade.
set -euo pipefail
cd "$(dirname "$0")"
ffmpeg -y -v error -framerate 30 -i build/frames/f%05d.jpg -i build/mix.wav \
  -vf "scale=1080:1920:flags=lanczos,eq=saturation=1.10:contrast=1.05,vignette=PI/5,noise=alls=1:allf=t,ass=build/captions.ass" \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart \
  the-flood-bell.mp4
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,codec_name -of compact the-flood-bell.mp4
