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

---

# Additional references: "The Pink Prison Cell Experiment" and "Why Perfect Railroads Don't Work"
Both are 720×1280, 30 fps, about 65 s, and in the same house style. Frame numbers below are per video.

## A. Bodies and costume (confirms the 3D-puppet build)
- **Most characters have visible legs:** two thin black stick legs with small dark shoes.
  - The knees bend in smooth arcs.
  - Weight shifts from one leg to the other, and a character may lift one foot while idling (big inmate, f.756–762).
  - Robed characters (first reference) simply hide the legs.
- **The body is a soft 3D capsule** whose shape varies by character:
  - tall and thin (scientist)
  - a wide egg (big inmate)
  - a hunched barrel (railroad boss)
- **Hats and hair are real 3D objects that ride on the head:**
  - a striped newsboy cap
  - a bowler hat
  - a guard's cap
  - a curly hair mass
  - grey hair wrapping the back of the head (boss, f.427–462)
  - When a head tilts or turns, they tilt with it and stay attached.
- **Costume details are painted on the body:** ties, buttons, name badges, chest patches, waistcoats.
- **Props are held in the hands and animate with them:** a long-pole paint roller, a saw, knitting needles, a cane, a stopwatch.

## B. Faces: an expanded vocabulary
- **Gritted-teeth grimace:** a rectangle of teeth with vertical lines, used for anxiety or rage (pacing inmate f.1464–1469; rage f.1922–1934).
- **An evil grin with dark, narrowed eyes** at the peak of rage (f.1935–1945).
- **Content closed-eye smile ("^ ^" plus a soft smile) held for a long time**, alive only through breathing and the hands (knitting, f.1740–1787).
- **Side-glance:** the eyes shift to the corner of the face before the head turns (f.1901–1910).
- **Skin color is an emotion.** Anger floods the face purple **from the chin upward like rising liquid** over about 5 frames (f.517–521), then stays purple while the character talks.
- **Steam puffs:** white cloud puffs burst from both sides of the head, rise, puff up and fade, re-spawning every ~8–10 frames (f.525–569).

## C. Escalation is staged in beats, not switched
The rage beat (f.1899–1945, ~1.5 s) goes through about eight readable steps, each held 3–6 frames:
1. Calm smile.
2. Side-glance.
3. Flat stare.
4. Brows knit.
5. Grimace with teeth.
6. Goggle eyes plus gritted teeth.
7. The knitting needles **snap**, and fragments fly off as small objects.
8. Arms fly up into a flex pose, followed by an evil grin.

At the same time, the world reacts: **red crack lines grow across the walls and floor**, the image darkens at the edges, and the camera pulls back.

## D. Action cycles
- **Painting with a roller (f.1–48):**
  - The arm and pole sweep up and down in arcs.
  - The body bobs and leans to follow each stroke, and the head tilts with the effort.
  - The paint **appears exactly where the roller has passed**.
  - Midway, the character turns to the camera while still working.
- **Sawing (railroad f.1–48):**
  - The character crouches, and the arm pumps back and forth about every 6 frames.
  - The body pumps with each stroke, and **sparks** fly at the contact point.
  - The head turns from the work (eyes shut with effort) to the camera with a smug look.
- **Knitting (f.1740–1787):**
  - The two needles circle in small alternating loops about every 4–6 frames.
  - The scarf grows longer, and the ball of yarn sits beside the character.
- **Walking with legs (scientist scene, f.512–527):**
  - Straight stick legs alternate, about **8 frames per step**.
  - The arms swing opposite to the legs, with a small vertical bob.
- **Panic pacing (f.1458–1469):**
  - Longer strides with the body leaning forward, and the hair bouncing on top.
  - The character walks **at the camera**, which pulls back.
- **Sitting:**
  - Legs dangle off the bench and swing a little.
  - Hands gesture (raised palm, scratching) while the face does small reactions (f.1410–1450).

## E. Staging with the camera
- **Characters lean right into a wide-angle lens:**
  - The boss bends ~45° toward the camera until his head fills the frame (f.427–466).
  - Then he straightens up as the camera pulls back.
  - The wide lens makes the head huge and the body small, which gives comic emphasis.
- **Two-shots with characters interacting:**
  - The worker leans into the foreground while the boss reacts behind him (f.1335–1379).
  - Heads turn toward whoever is speaking.
- Sparks, debris and puffs are **small 3D effects lit by the scene**, not flat overlays.

## F. Additions to the rebuild plan
1. **Leg rig:** stick legs with knee bend, a walk cycle (~8 frames per step), idle weight shifts, a sitting pose with dangling legs, and a crouch.
2. **Hat and hair attachments** parented to the head.
3. **Face-tint channel:** color fills from the chin upward over ~5 frames. Plus a steam-puff emitter.
4. **Emotion escalation helper:** builds a staged sequence of expression holds (3–6 frames each) leading into a climax pose.
5. **Prop actions:** a looping work motion where the body follows the hands (pull, push, saw, hammer, ring), with effects (sparks, dust, debris) at the contact point.
6. **Lean-into-lens beats:** bend at the waist toward the camera, using a wide lens.
