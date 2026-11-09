# Workflow study: "Make animated shorts with Claude Code (Full Workflow)"

Source: the user's upload (split zip, last part missing; fragmented mp4 recovered, ~10 min, Indonesian narration translated with Whisper).

## Their pipeline
1. **Measure** 3 reference shorts (millions of views) frame by frame into a target table, marking which numbers come from a script and which were counted by eye.
   - Shots per short: 32 / 53 / 48 (about 60 s each), so a cut every 1.2-1.9 s and a shot-size change every 1.6-2.6 s.
   - Locations: 5 / 7 / 7. Saturation: 64 / 49 / 44. Brightness (luma): 102 / 114 / 115.
   - Captions on 94-98% of frames, centred at 70.3% of the height, x-height 41 px and tall letters 53 px, outline 5.5-7 px, median 5 letters on screen.
2. **Story template** (all three refs follow it): a fact that sounds impossible in line 1, then a problem that gets worse so the viewer wants the explanation, then "you see..." turning toward the explanation, then the payoff that solves it, and a final-line twist. Real history is checked separately from the made-up jokes.
3. **Voice**: either your own recording or an ElevenLabs clone (about 1 credit per character). Get word timestamps; measure the real audio length before animating (their story said 56 s, the recording ran 70.3 s).
4. **Team of agents**: Opus as manager plus LOOK (style), CHAR (characters), WORLD (sets and props) and SHOTS (camera, animation, edit). They work from a CONTRACT.md that says who owns which files, what each hands over (manifest.json), and where to request changes (REQUESTS.md).
5. **Check script after every render** (37 checks, e.g. missing files, 1080x1920, brightness and colour against the refs, every shot). Passing the gate does NOT mean it looks right: their first 37/37 render had red ground and characters buried in the floor.
6. **Fresh critic subagent** scores the render against the reference using RUBRIC.md, 0-10 per criterion, with the exact second of every lost point. Self-grade was 6.5 when the fresh critic gave 4.2. Over 8+ rounds the score went 4.2 to 7.9. The critic can be wrong (it measured captions on a small image), so open the frame and confirm before fixing.
7. **Fix rounds**: one agent per weak moment ("knife", "pan", "tree", "clank", "opener"), each in its own folder, re-rendering only that range. Every lesson is written to lessons.md.
8. **Skill**: once the manual run works, pack it into a skill (MEASURE, VOICE, BUILD, CRITIC, POST). A new short then takes about 30 min, starting at about 6.2 instead of 4.2.
9. **Post**: Blotato MCP uploads to YouTube as private first.

## Their critic rubric (10 criteria, from the on-screen scorecard)
| # | Criterion | Target |
|---|---|---|
| 1 | Character acting | 2+ expression/pose changes per second, holds of 0.4 s or more |
| 2 | Face size | head at least 30% of frame height for at least 70% of frames |
| 3 | Sharpness | median Laplacian variance at least 1200 (ref 1690) |
| 4 | Beat on screen | every story beat visible (22 of 22) |
| 5 | World richness | at least 5 locations, flat ground under 25% of frame |
| 6 | Grade | close to the ref (sat about 162/255, luma about 102) |
| 7 | Comedy timing | a 0.5-1 s hold after each gag |
| 8 | Camera variety | at least 3 kinds of angle, no hard cuts |
| 9 | Captions | 40 px or more, centred at about 68% |
| 10 | Sound sync | a sound effect on every hit, within +/-2 frames |

Critic's typical fixes: two-shots where faces are only 14% of frame height should become single close shots; a prop sitting on the cheek instead of in the mouth; a gag cut away too quickly; a sound effect buried under the voice.

## What this changes in our pipeline
- Add `tools/measure.js` (exact face size per frame from the 3D scene, shot count, locations) and run it after every render.
- Re-plan shots around faces: close and medium-close singles for reactions, wides only to establish.
- Add a synced sound-effect layer (we had none).
- Run a fresh critic subagent on the render against the rubric, then verify its claims frame by frame before fixing.
- Keep `lessons.md`.
