# Character motion study: reference clip (frame-by-frame at 30 fps)

Frame numbers are in the reference at 30 fps (frame / 30 = seconds).

## 1. How the characters are built
- **These are 3D puppets with 2D faces, not flat cut-outs.**
  - The head is a real sphere with soft toon shading: lit on one side, falling off to the other.
  - The body is a soft capsule or cylinder with cloth shading.
  - The face (eyes, brows, mouth, mustache) is a drawn decal on the sphere.
- **Head turns move the face decal.** When a character looks left, right or up, the whole face slides across the sphere (court guards, f.183–196; guard on the rampart, f.1236–1242). This reads as a 3/4 view without any extra drawing.
- **Arms are thin black rubber-hose tubes ending in small ball hands.** They bend in smooth arcs with no visible elbow, and attach at the shoulder sides.
- **Feet are small dark ovals** that peek out from under the robe hem only when walking.
- **Props sit in the hands and move with them:** the lantern, spears, and the stick used to hold the bronze ball.

## 2. The "always alive" layer (never fully still)
- **Breathing / idle sway:** the body leans very slightly (±1–2°) over ~2–3 s, even in "static" shots (scholar f.92–118).
- **Head micro-tilt:** the head rolls a few degrees independently of the body, settling into a new angle on each phrase.
- **Blinks:**
  - Eyes collapse to a line or arc for **2–3 frames**, then reopen (scholar f.117–119, emperor f.739–740, lantern walk f.1328–1329).
  - Roughly every 2–4 s, irregular, and often **on a phrase change**.
- **Background characters keep living:** townsfolk sway, blink, and turn their faces toward events (gate, f.819–854).

## 3. Acting to the voice (the biggest gap)
- **Expressions change every 4–8 frames while a character talks**, keyed to stressed words, not to a fixed rhythm:
  - Scholar: "this ever" (f.104–118) goes narrow suspicious eyes → round wide eyes → blink.
  - "falls" (f.120–127): one eyebrow up, mouth open.
  - "out" (f.126–135): flat skeptical eyes → wide goggle eyes.
  - "run" (f.136–149): sweat drop pops in, eyes widen, mouth drops.
- **Eyebrows animate on their own:** one brow raised = skeptical, both up = alarm, inner ends up = worry.
- **Mouth shapes follow syllables:** closed line, small "o", wide oval, open "D", and a toothy grin for laughs, changing every **2–3 frames** on speech. The mustache rides on top of the mouth and moves with it (emperor f.752–779).
- **Talking head-bob:** a small nod or tilt on the stressed syllable of each phrase (guard f.1217–1240).
- **Eye shapes are a vocabulary:**
  - dots
  - half-lidded (lid line across the top)
  - squint lines
  - "^ ^" happy arcs
  - big double-circle goggle eyes (shock)
  - one-eye squint (smug)

## 4. Body acting
- **The whole body leans from the feet** like an inverted pendulum, so a lean reads as attitude:
  - The emperor tilts ~10–15° sideways while delivering "the world's most expensive toy" (f.746–779).
  - The head adds another tilt on top of the body lean (overlapping action).
- **Laughing (court, f.180–215):**
  - The face goes from frown to closed "^ ^" eyes plus a huge toothy mouth over ~6 frames.
  - The head throws back and to one side.
  - The body rocks and bounces **~4–5 times a second**, with small amplitude.
  - Neighbours lean toward each other and turn their faces inward: laughter is **shared between characters**, not done in isolation.
- **Anticipation → action → overshoot → settle:**
  - Before "run" the scholar freezes (eyes wide, f.136–140).
  - Then the arm swings up in an arc, the body leans into the move, and the camera snaps in with **white speed lines** (f.143–149).
- **Reactions ripple:** the main character reacts first, and side characters follow 3–8 frames later.

## 5. Locomotion
- **Walk (lantern walk, f.1320–1361):**
  - A soft side-to-side **waddle**: the body rocks ±4–6° on each step.
  - About **14 frames per full cycle** (~2 steps/s), with a tiny vertical bob on each footfall.
  - Feet alternate from under the hem.
  - The lantern swings like a pendulum and **lags behind** the body (follow-through).
  - The face keeps acting (sad brows, blinks) while walking.
- **Pulling a heavy load (f.900–935):**
  - The body leans hard forward (~25–30°) with a slow, heavy step bob.
  - The rope stays taut, the cart wheels turn, and the cart rocks slightly over bumps.
- **Run (panic, f.143–149 and 1110+):** a bigger bounce, the arms pump or flail, and the body leans forward.

## 6. Timing and spacing
- **Body motion is on ones.** Transforms (lean, tilt, sway, camera) update every frame and are eased: slow in and slow out, never linear.
- **Faces are "on keys".** Expression drawings swap on specific frames and then **hold** for 4–10 frames, with the body still moving underneath ("moving holds").
- **Accents land exactly on the word.** Expression changes and gestures hit on, or 1–2 frames before, the stressed syllable.

## 7. Effects that support the acting
- **Sweat drops:** a blue teardrop that pops on and then trembles slightly (scholar f.137+).
- **Speed lines:** thin white streaks radiating outward during fast camera pushes or sudden moves (f.143–149).
- **Dust puffs** when heavy objects move (gate, f.836–850).
- **Scene transitions are fast cross-dissolves (3–5 frames) combined with camera movement**, not whip pans.

## 8. What my version does differently (to fix)
| Reference | Mine (v2) |
|---|---|
| 3D sphere head with a shaded face decal that turns | Flat billboard always facing the camera |
| Expressions change every 4–8 frames, keyed to words | One expression per shot segment |
| Mouth shapes follow syllables, ~2–3 frames each | Random two-state mouth flap |
| Independent eyebrows, a large eye vocabulary | Fixed brow per expression |
| Body leans from the feet, head tilts on top | Small vertical breathing only |
| Rubber-hose arms that arc and follow through | Static poses that snap from one to the next |
| Waddle walk, ~14-frame cycle, feet, prop lag | Sliding with a bounce |
| Shared laughter (lean in, faces turn to each other) | Everyone bounces independently |
| Anticipation, overshoot, settle; sweat drops, speed lines | Not implemented |
| 3–5 frame cross-dissolves | Hard cuts |

## 9. Rebuild plan
1. **Puppet rig.** Sphere head with a face decal on a neck pivot, a capsule body with a pivot at the feet, two rubber-hose arms (bezier tubes) with IK-style hand targets, and feet under the hem. Props parent to the hands.
2. **Face system.**
   - Separate eye, brow and mouth layers drawn per frame.
   - Gaze offset slides the whole face across the sphere.
   - Viseme mouth shapes come from the narration's word timings (vowels → open shapes, m/b/p → closed).
3. **Acting tracks.** Per shot, a list of `{t, expr, brow, gaze, lean, headTilt, armPose}` keys, eased between, with expression holds and accents on stressed words.
4. **Procedural layers.** Idle sway, breathing, blinks on phrase boundaries, laugh bounce, waddle walk cycle, heavy pull, panic run, follow-through on props and hair/braid.
5. **Effects.** Sweat drops, speed lines, dust puffs; 4-frame cross-dissolves between shots.
