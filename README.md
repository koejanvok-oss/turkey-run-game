# Gobble Dash — The Great Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/koejanvok-oss/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/koejanvok-oss/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete, original turkey escape game built for the make.fun bounty
[turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01).
The farmer is coming for dinner. You are dinner. Run 1000 metres from the farmyard,
through the barn and across the kitchen, to the woods — before he catches you.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and visit
http://localhost:8080). No network, no build step, no install.

| Key | Action |
| --- | --- |
| Space / ↑ / W (or click) | Jump — over fences, pumpkins, rolling pins and the oven |
| ↓ / S (hold) | Slide under low branches — and hide inside a haystack |
| P / Esc | Pause |
| M | Mute |

## The game

- **The chase.** The farmer runs behind you with a pitchfork. Every stumble costs a
  heart and lets him gain ground; run clean and you pull away. If he reaches you —
  or your three hearts run out — you are caught.
- **Three stages.** The farmyard (fences, pumpkins, low branches), the barn (rolling
  pins join in), and the kitchen (a blazing oven to jump and a carving knife swinging
  from the ceiling — jump it while it is low, run under it while it is high).
- **Hide.** Hold ↓ inside a haystack and the turkey ducks out of sight: the farmer
  loses the trail (+25 points) while you catch your breath.
- **Score.** Distance in metres, corn (+10), golden feathers (+50), hides (+25) and a
  bonus for each new stage. Reach 1000 m and you escape to the woods.
- **Feel.** Synthesized Web Audio sounds (gobble, jump, pickup, the farmer's shout,
  a fanfare for escape), a HUD with score, distance, hearts and the farmer's gap,
  stage banners, and title / pause / caught / escaped screens with restart.

## Layout

- `game/index.html` — the page; `game/src/main.js` — boot and the fixed-step loop
- `game/src/world.js` — the run: turkey, farmer, hazards, stages, scoring
- `game/src/render.js` — all canvas art: turkey, farmer, farm, barn, kitchen, HUD
- `game/src/shots.js` — deterministic screenshot scenes with an autopilot
- `game/src/config.js` — tuning and palette; `game/src/random.js` — seeded RNG
- `game/src/audio.js` — synthesized sounds; `game/src/input.js` — keyboard + mouse
- `main.ts` — the hand-in program (copies `game/` + `screenshots/`, writes the dossier)
- `screenshots/` — real renders of this game: title, farmyard run, kitchen run, caught

## Screenshots

Deterministic scenes via `?shot=start|play|kitchen|end&seed=N` (see `shots.json`).
All art, sounds and names are original work drawn and written for this entry.

## License

MIT — see `LICENSE`.
