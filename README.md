# The Velvet Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/musengbob/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/musengbob/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down night heist in a velvet-rope gallery. You are the thief: cross the
gallery floor, read the patrol guards' vision cones and the sweeping ceiling
cameras, lift three loot pieces — or crack the vault — and slip out to the
getaway van before the alarm fills.

## How to play

- **WASD / Arrows** — move
- **Shift** — sneak (slower, harder to spot, alarm fills slower)
- **Space** — dash (fast, but loud — the alarm fills faster)
- **E** — throw a coin (3) to lure the nearest guard to the spot
- **Q** — smoke puff (2) that blocks every vision cone for a few seconds
- **F** — hold beside the vault to crack it (3 seconds, exposed)
- **P** — pause · **M** — mute · **R** — restart · **Enter** — start

Grab all 3 loot pieces **or** crack the vault, then reach the glowing
GETAWAY exit. If the alarm meter fills, the guards converge and you lose a
life. Three lives. Ranked by time, loot, and times spotted.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — no build step, no network, no libraries. All art is drawn
procedurally on canvas; all sounds are WebAudio tones generated in code.

Entered on [make.fun](https://make.fun/?ref=t2hmjdyt&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards
