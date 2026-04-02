# Colony Clash

**Queen vs. Queen — An Ant Colony Battle Arena**

A fast-paced local/online multiplayer battle arena where you ARE the queen. Choose your champion insect, fight in procedurally generated underground tunnels, claim spawn mounds for soldier allies, and destroy your rival. Built with HTML5 Canvas and vanilla JavaScript — zero dependencies, just open in a browser.

## Play

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

Or just open `index.html` directly in a browser.

## Game Modes

- **Single Player** — Press `1` on title screen to fight an AI opponent
- **Local 2 Player** — Press `2` or any key for local versus on one keyboard/gamepads
- **Online Multiplayer** — Press `O` to create/join a room via WebRTC (peer-to-peer)

## Champions

| Champion | Special Ability | Style |
|---|---|---|
| **Ant** | Drop lethal poison traps | Balanced, trap-based |
| **Beetle** | Teleport to escape danger | Armored, evasive |
| **Cockroach** | Deflect bullets back at attacker | Fast, defensive |

Each champion has 3 special uses per round. Choose your fighter and color on the character select screen.

## Controls

### Keyboard

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | W A S D | Arrow keys |
| Shoot | Space | Enter |
| Special | Q | Right Shift |
| Pause | Escape | Escape |

### Gamepad (Xbox)

| Action | Button |
|---|---|
| Move | D-pad / Left stick |
| Shoot | A / RB / RT |
| Special | X / LB |
| Start | Start button |

## Features

- **3 unique champion types** with special abilities
- **Pseudo-3D rendering** — gradient-shaded bodies, articulated legs, drop shadows
- **Procedural maps** — every round is different, with connectivity guaranteed
- **Destructible terrain** — shoot dirt to carve tunnels
- **Spawn mounds** — claim for soldier allies with attack/defend/kamikaze AI roles
- **4 power-ups** — Sugar Rush, Rapid Bite, Chitin Shield, Mega Acid
- **Anteater boss** — hunts queens, eats soldiers
- **Hidden worms** — eat for HP restore
- **6 round mutators** — Cave-In, Toxic Spores, Darkness, Frenzy, Flooded, Swarm
- **Fog of war** — limited vision, explore carefully
- **Tunnel regrowth** — dug tiles slowly revert to dirt
- **Procedural audio** — all sounds and music generated with Web Audio API
- **Online multiplayer** — PeerJS WebRTC with seeded PRNG for identical maps
- **Gamepad support** — full controller mapping with edge detection for menus
- **Narrative intro** — 7-page story with animated pixel art
- **Fighter select music** — dark 140 BPM beat
- **Pause menu** — Resume or Exit to character select
- **Dancing winner** — victory celebration screen with animated character

## Tech Stack

- HTML5 Canvas 2D
- Vanilla JavaScript (no frameworks)
- Web Audio API (procedural sounds + music)
- Web Speech API (voice announcements)
- Web Gamepad API
- PeerJS / WebRTC (online multiplayer)
- Zero build step — just static files

## Architecture

| File | Purpose |
|---|---|
| `index.html` | Entry point |
| `js/constants.js` | Config, colors, tile types, mutators |
| `js/state.js` | Canvas, input, all state variables |
| `js/map.js` | Procedural generation, BFS pathfinding |
| `js/entities.js` | Queens, bullets, soldiers, mounds, power-ups, worms |
| `js/game.js` | Game loop, round management, pause, mutators, fog |
| `js/render.js` | All rendering: pseudo-3D characters, terrain, HUD |
| `js/audio.js` | Procedural sounds, music, voice |
| `js/gamepad.js` | Controller support |
| `js/anteater.js` | Boss AI and rendering |
| `js/multiplayer.js` | P2P networking |
| `js/narrative-art.js` | Intro illustrations |
| `js/ai.js` | Single-player AI opponent |

## License

Hackathon project — built fast, shipped faster.
