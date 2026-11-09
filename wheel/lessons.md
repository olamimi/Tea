# Lessons (append after every critic round)
- Measure faces from the 3D scene (`tools/measure.js`): the v1 cut had a face >= 30% of frame height in 1% of frames; re-planning around face close-ups (CU helper in shots.js) took it to 31%.
- A prop stack in front of a character hides his head from every front angle: move the stack forward or shoot from behind his shoulder.
- Characters looking at something behind them show the back of their head in a close-up: make them look at the camera instead.
- Tilted slabs on building fronts read as floating planks; use balconies with railings.
- Transparent glass over a hero prop hazes the close-up (bloom + DOF); hide it in macro shots.
- Every cut, hit and reveal needs a synced sound effect (none in v1).
- The first full render measured luma 145 (refs 102-115), the same washed-out first try the reference workflow shows. A grade in assemble.sh (gamma 0.70, contrast 1.08, saturation 1.15) gives 118 and richer colour.
- A face-tracking close-up must centre on the head itself (hk: 1) when the character leans (pushing, ducking), or the face slides to the frame edge.
- Never put a // comment mid-line in the dense one-line JS: it silently swallows the code after it (twice now). Use /* */.
