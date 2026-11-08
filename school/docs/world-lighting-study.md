# World & lighting study (pixel-by-pixel), excluding character design

Sources: "Why Humans Can't Pick Random Numbers" (47 s, 1,414 frames) and "This Knight Found the Ultimate Loophole"
(41 s, 1,220 frames), both 720×1280. Every pixel of every frame was measured with `tools/pixel_study.py`.
Our last render, *The New Boy*, was measured the same way (scaled to 720×1280) for comparison.

## 1. Measured numbers

| Metric | Numbers ref | Knight ref | **Ours (New Boy)** | Target |
|---|---|---|---|---|
| Warm hues (330–50°) among colored pixels | 80% | 68% | **51%** | 70–80% |
| Teal (170–220°) | 10% | 12% | 8% | 10–12% |
| Green (80–150°) | 2% | 5% | **28%** | ≤5% |
| Median brightness (0–255) | 162 | 135 | 141 | 140–160 |
| Darkest 5% of pixels | 51 | 49 | **16** | ~50 (no deep blacks) |
| Median saturation | 0.35 | 0.45 | **0.10** | 0.35–0.45 |
| Vignette (corner ÷ centre brightness) | 0.85 | 0.79 | **0.58** | ~0.8 |
| Sharpness, centre band ÷ top+bottom | 3.8× | 4.6× | 4.2× | ~4× (OK) |
| Average shadow color (darkest 15%) | rgb(90,61,53) | rgb(76,53,47) | **rgb(35,33,40)** | warm brown ~rgb(80,57,50) |
| Average highlight color (brightest 10%) | rgb(244,228,196) | rgb(238,227,208) | rgb(230,229,217) | warm cream ~rgb(240,228,200) |
| Grain (high-pass std in flat areas) | 0.42 | 0.47 | 0.39 | ~0.45 (OK) |
| Brightness swing between seconds (std) | 20 | 16 | 17 | OK |
| Frames identical to the previous frame | 1 | 3 | — | smooth 30 fps |

**Biggest gaps in ours:**
1. **Shadows are near-black and slightly blue.** The references' shadows are a warm, mid-dark brown, and their darkest pixels sit around 50.
2. **Colors are washed out.** Our median saturation is 0.10, against 0.35–0.45.
3. **Too much green** (classroom walls, chalkboard) and not enough warm field.
4. **The vignette is too heavy:** our corners drop to 58% of the centre's brightness, against about 80%.
5. **Highlights are neutral white** instead of warm cream.

## 2. Light, by eye at 1:1 (full-resolution crops)

- **Atmospheric perspective:** distant layers (forest trunks, city, mountains) get lighter, lower in contrast and slightly bluer or hazier, then blurred. Every scene has 3–4 visible depth planes.
- **Light shafts:** soft vertical or diagonal haze columns in the forest and from windows, screen-blended so they lighten what they cross, never making a hard-edged beam.
- **Sun discs and glows:** a big soft radial glow at the sun (sunset, golden-hour office). Objects in front pick up a warm edge glow.
- **Long cast shadows across the ground at sunset:** fence posts and characters throw long dark-purple stripes toward the camera, with light rays between them.
- **Windows are light sources:** interiors always show a bright sky or sunset through a window (sometimes with blinds). That window is the brightest thing in the frame and tints the room warm.
- **Shadows are colored, never grey:** warm brown indoors, plum or purple at sunset and dusk, deep blue at night.
- **Sparkles and motes:** small 4-point glints on metal and glass, and floating dust or bokeh dots in sunlit air.

## 3. World construction

- **Environments are inked too, but lighter:** buildings, signs, furniture and props have thin dark-brown outlines of about 1–3 px at 720, much thinner than the characters' ink. Our sets have no outlines, so they read as plain CG.
- **Painted surfaces, not flat CG:**
  - walls get soft gradients and a hand-painted feel
  - ground gets scattered detail (leaves, gravel, specks)
  - wood gets visible grain strokes
  - skies are smooth multi-stop gradients with stylized clouds
- **Detail density:** every set has readable themed signage, framed pictures, plants and clutter. The middle-ground is busy, while the background is simplified by haze and blur.
- **Color scheme per scene:** a warm dominant (peach, orange, brown) with one teal or blue accent (windows, a chair, a sign), plus green only in nature scenes.

## 4. Grading arc

Saturation and warmth follow the story beat:
- **Numbers video:** saturation dips to 0.20 when the culprit is caught, peaks at 0.48 at the reveal, and ends cool and dark (brightness about 112) in jail.
- **Knight video:** warmth (R−B) swings from −30, a cold blue night, to +85, a golden sunset ending.

## 5. Changes for our world (character design untouched)

1. **Warm, lifted shadows:**
   - warm brown ambient and ground light indoors; plum at dusk; deep blue only at night
   - lift the blacks so the darkest 5% sits around 45–50
2. **Saturation up:** richer wall, floor and prop colors, aiming for a median of about 0.35–0.4.
3. **Re-palette the classroom:** warm peach or sand walls with teal accents (door, chairs, window frames); chalkboard dark teal rather than green.
4. **Lighter vignette:** corner brightness about 0.8 of the centre.
5. **Warm highlights:** sun and window light in warm cream.
6. **Window light as the key light** in every interior: a bright sky through the windows plus soft light shafts and a blinds pattern.
7. **Thin brown outlines on set pieces and props** (about 2–4 px at 1080).
8. **Painted textures:** soft wall gradients, wood grain, floor specks.
9. **Haze and depth:** distant planes lighter, lower contrast, blurred. Floating dust motes in sunlit areas.
10. **Grade by story beat:**
    - warm and bright normally
    - drained (saturation about 0.2) at the accusation
    - cooler in the principal's office
    - golden at vindication

## 6. Borrowed from the references' characters (our character DESIGN stays as is)
Only things that add to our design without changing how the characters are built or drawn:

1. **Scene light tints the white heads.** Measured on near-white pixels: night rgb(203,214,223) bluish,
   forest rgb(203,203,185) yellow-green, sunset rgb(248,238,228) warm, office ~(216,210,200). Heads are never
   pure white; they sit at ~205-230 and take the scene's light colour. Ours are self-lit white everywhere,
   so: cut the head's self-glow so key/fill light colours them (keep them the brightest thing on the character).
2. **Light and shadow land ON characters.** Window-blind stripes across faces, a dark band from a door frame,
   tree-dapple in forests. Characters receive scene shadows (not just cast them).
3. **Soft contact shadow** under every character so they sit on the floor rather than float.
4. **Colour casting by role (via clothing/accessories, not body design).** Culprit mustard vs auditor purple
   (complements), police blue. For The New Boy: give the accuser, the new boy and the real thief clearly
   different accent colours (hair clip, bag, cardigan) and seed the thief's colour early as a quiet clue.
5. **Props carry the story and get their own close-ups.** Magnifying glass over the forged digits,
   a giant gold coin, the pardon scroll with readable lettering. For us: the note, the bag, the two bills and
   the single bill as big readable insert shots.
6. **Foreground character framing.** A big face or prop in the foreground with the payoff behind it
   (magnifying glass in front of the panicking face). Good for accusation and reveal beats.
7. **Background extras in varied colours** (queue at the pardon stall) make places feel lived-in.
