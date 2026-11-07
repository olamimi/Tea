# The Flood Bell

An original ~63 s vertical (9:16) animated short. Its style is modelled on the analysed reference clip:
- Doodle characters (round white heads, ink brows, stick arms) on billboards inside lit 3D sets.
- One-to-two-word pop captions.
- A narrator over a constant orchestral bed (ducked under the voice).
- Hard cuts, each with a soft whoosh.
- A colour script per act: warm court, sunset exile, moonlit crisis, hazy aftermath, an inside-the-device cutaway, and a crane-out finale.

Story beats follow the reference's structure: mocked inventor → false alarm → banishment → night twist → disaster → how it works → ironic punchline.

## Pipeline
| Step | File | Tooling |
|---|---|---|
| Script | `story.json` | — |
| Narration + word timings | `tts.py` | Kokoro TTS (`kokoro-onnx`, voice `af_heart`) |
| Characters | `src/chars.js` | Canvas 2D → textures |
| Sets (hall, river valley, well cutaway) | `src/sets.js` | Three.js |
| Shot list / cameras / acting | `src/shots.js` | Three.js, timed to word timestamps |
| Renderer (bloom, log depth buffer) | `src/main.js`, `index.html` | Three.js in headless Chromium |
| Frame capture | `render.js` | Playwright |
| Orchestral score + bells | `score.py` | MIDI (mido) → FluidSynth + FluidR3 GM soundfont |
| SFX + ducking + mix | `audio.py` | NumPy / SciPy |
| Captions | `captions.py` | ASS subtitles |
| Final encode | `assemble.sh` | ffmpeg |

## Rebuild
```bash
npm i three@0.170.0 && pip install kokoro-onnx soundfile scipy mido
apt-get install fluidsynth fluid-soundfont-gm
# models: kokoro-v1.0.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0)
python3 tts.py <models_dir>        # build/voice.wav + build/timeline.json
node render.js --workers 3          # build/frames/*.jpg  (preview: --from 0 --to 1904 --step 45 --out build/preview)
python3 score.py && python3 audio.py
ffmpeg -i build/mix_raw.wav -af "acompressor=threshold=-20dB:ratio=3:attack=10:release=150:makeup=4dB,loudnorm=I=-14:TP=-1.0:LRA=4" build/mix.wav
python3 captions.py
./assemble.sh                       # -> the-flood-bell.mp4
```
