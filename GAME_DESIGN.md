# Colony Clash — Game Design Document v4

> **Queen vs. Queen — An Ant Colony Battle Arena**
> *"Risk the crown to build the swarm"*

**Platform:** Browser (HTML5 Canvas + Vanilla JS)
**Players:** 1 (vs AI) / 2 Local / 2 Online P2P
**Dependencies:** PeerJS (multiplayer only), zero build step

---

## 1. The Pitch

Colony Clash is a local/online multiplayer battle arena set underground in a network of ant tunnels. Each player **is the queen** of their colony — the most powerful and most important unit on the field. Choose from three unique insect champions (Ant, Beetle, Cockroach), each with a special ability. Two rival queens compete on procedurally generated maps with destructible terrain, round mutators, and environmental hazards.

**Lose your queen, lose the round. Instantly.**

### Core Hooks

1. **You ARE the queen.** Every move is high-stakes — one queen, one chance per round.
2. **Three champion types.** Ant drops traps, Beetle teleports, Cockroach deflects bullets.
3. **Spawn mounds as objectives.** Claim them for soldier allies, but risk your queen to do it.
4. **Destructible terrain creates new paths.** Shooting dirt carves tunnels. The map evolves.
5. **Round mutators.** Each round after round 1 gets random modifiers: cave-ins, toxic spores, darkness, frenzy.
6. **Anteater boss.** A terrifying NPC predator that hunts queens and eats soldiers.
7. **Hidden worms.** Find and eat worms hidden in dirt to restore HP.
8. **Tunnel regrowth.** Dug tiles slowly regrow back to dirt, keeping the map dynamic.
9. **Fog of war.** Vision is limited — explore carefully.

---

## 2. Visual Identity: "Underground Pseudo-3D"

### Graphics System

- **Tile seeds:** Per-tile random seed for visual variation (no two tiles look alike)
- **Dirt:** Variable color per tile, randomized grain lines, pebble dots on ~25%
- **Rock:** Bevel shading (light top-left, dark bottom-right), crack lines on ~30%, seed-based highlights
- **Puddle:** Animated dual wave lines with shimmer highlights
- **Tunnels:** Adaptive rounded corners with inner shadow depth stroke
- **Vignette overlay:** Pre-rendered radial gradient for atmospheric darkening
- **Ambient dust motes:** 25 floating particles for underground atmosphere
- **Screen shake:** Triggered on queen damage (6px), death (12px), and cave-in (4px)
- **Floating text:** Damage numbers, power-up names, and event callouts float upward and fade
- **Fog of war:** Unexplored tiles are black, explored-but-not-visible tiles are dimmed

### Character Rendering (Pseudo-3D)

All characters use `draw3DSegment()` for gradient-shaded body parts and `draw3DLeg()` for volumetric articulated legs with:
- Coxa joint, femur (thick), knee joint with specular dot, tibia (thinner), tarsus claws
- Large swing amplitude for visible walking animation
- Drop shadows under each body segment

### Color Palette

| Element | Hex |
|---|---|
| Background (deep earth) | `#2A1E10` |
| Dirt walls | `#5C4023` |
| Rocks | `#6B6B6B` |
| Water | `#2855A0` |
| Leaf litter | `#3A6828` |
| Dug tunnel | `#332810` |
| Spawn mound | `#E8C840` |

### Power-Up Colors

| Type | Color | Icon |
|---|---|---|
| Sugar Rush | `#44DD44` (green) | Crystal dots |
| Rapid Bite | `#FF8800` (orange) | Speed lines |
| Chitin Shield | `#44DDFF` (cyan) | Shield arc |
| Mega Acid | `#FF44FF` (magenta) | Starburst |

### Player Colors (8 choices each)

`#3066C8`, `#C83030`, `#30A830`, `#C8A030`, `#A030C8`, `#30C8C8`, `#C86030`, `#FFFFFF`

---

## 3. Champions

Players choose from three insect types at the character selection screen. Each has a unique special ability (3 uses per round).

### Ant
- **Special:** Drop Lethal Trap (Q / RShift / X) — places a poison dropping at current tile. Lasts 15s, deals 1 damage on contact.
- **Body:** Classic 3-segment (gaster with stinger, 2-node petiole, thorax), 6 articulated legs, elbowed antennae
- **Cooldown:** 1 second

### Beetle
- **Special:** Fly (Q / RShift / X) — teleports to a random walkable tile within 5 tiles. Brief invincibility.
- **Body:** Wide armored elytra with vein grooves, rhinoceros horn, pronotum shield, 6 heavy legs, clubbed antennae
- **Cooldown:** 2 seconds

### Cockroach
- **Special:** Deflect (Q / RShift / X) — belly-up mode for 1 second. Reflects incoming bullets.
- **Body:** Flat segmented abdomen with tergite bands, large pronotum with M-marking, 8 spindly legs, cerci, long whip antennae
- **Cooldown:** 2 seconds

All champions share: 3 HP, speed 3, same projectile, crown when queen.

---

## 4. The Map

### Tile Size
- `TILE = 48px` (1.5x scale for visibility)
- Grid: `COLS × ROWS` fills the screen dynamically

### Tile Types

| Tile | Behaviour |
|---|---|
| **Dirt** | Destructible (1 hit), blocks movement. Can regrow. |
| **Rock** | Indestructible, blocks everything |
| **Puddle** | Impassable, clustered 2-4 |
| **Leaf Litter** | Passable, decorative |
| **Dug/Tunnel** | Walkable, created when dirt destroyed |

### Procedural Generation

1. Queen chambers (3×3 clear) at opposite corners
2. Rock clusters (~15% coverage)
3. Two distinct tunnel corridors (upper + lower bias)
4. Tunnel carving **forces through rocks** to guarantee connectivity
5. Puddle clusters (8-14 water tiles)
6. Leaf litter (3-5)
7. BFS validation ensures 2 distinct paths exist

### Tunnel Regrowth

- Every 8 seconds, 1-5 random DUG tiles (scaling with round number) revert to DIRT
- 5-second immunity after a tile is dug before it can regrow
- Won't regrow near players, soldiers, or mounds

---

## 5. Round Mutators

Starting from round 2, each round receives 1-2 random mutators that modify gameplay.

| Mutator | Effect |
|---|---|
| **Flooded Tunnels** | Speed modifier affects all movement |
| **Darkness** | Reduced vision radius (4 tiles instead of 7) |
| **Cave-In** | Map border shrinks every 15 seconds (converts tiles to rock) |
| **Swarm** | Increased soldier spawn rates |
| **Toxic Spores** | Acid pools spawn every 10 seconds, deal damage to queens standing on them |
| **Frenzy** | Increased speed for all entities |

Active mutators are announced at round start.

---

## 6. Fog of War

- Each player has limited vision (7 tile radius, 4 in Darkness mutator)
- Soldiers provide 3-tile vision radius
- Unexplored tiles render as black
- Explored but not visible tiles are dimmed
- Entities outside vision are hidden

---

## 7. Spawn Mounds

| Property | Value |
|---|---|
| Spawn rate | Every 1-2 seconds |
| Max on map | 3 simultaneously |
| Min distance | 8 tiles (Manhattan) between mounds |
| Unclaimed duration | 10 seconds |
| Soldiers per mound | 3 |
| Soldier spawn interval | Every 2.5 seconds |

### Allied Soldiers

| Property | Value |
|---|---|
| HP | 1 |
| Speed | 3.5 tiles/sec (2× in kamikaze mode) |
| Lifetime | 100 seconds |
| AI Roles | **Attack** (flank enemy queen), **Defend** (protect own queen at low HP), **Kamikaze** (last 5s, rush enemy at double speed) |
| Group behavior | Slow down if ahead of allies to maintain formation |
| Shooting | Line-of-sight within 5 tiles, 1.5s cooldown |

---

## 8. Power-Ups

| Property | Value |
|---|---|
| Spawn rate | Every 1 second |
| Max on map | 3 simultaneously |
| Min distance | 6 tiles (Manhattan) |
| Despawn timer | 15 seconds |

| Type | Effect | Duration |
|---|---|---|
| Sugar Rush | 2× movement speed | 80 seconds |
| Rapid Bite | 3 spread projectiles | 80 seconds |
| Chitin Shield | Absorbs next hit | Until hit |
| Mega Acid | 3×3 destruction, glow bullets | 30 shots |

---

## 9. Combat

### Projectiles
- **Max in flight:** 3 per player
- **Speed:** 5 tiles/sec (affected by mutator speed multiplier)
- **Bullet-bullet collision:** Bullets from different players destroy each other
- **Trail particles:** 40% chance per frame
- **Rendering:** Direction-aware ellipse with glow, bright white core

### Droppings (Ant Special)
- Placed at queen's tile, lasts 15 seconds
- Deals 1 damage to enemy queen on contact

---

## 10. Anteater Boss

| Property | Value |
|---|---|
| First spawn | 45 seconds into round |
| Respawn interval | Every 60 seconds |
| HP | 8 |
| Warning | 3-second flashing banner |
| Movement | Pathfinds toward nearest queen, digs through dirt |
| Tongue attack | 5-tile range in cardinal directions |
| Contact damage | 1 HP to queens |
| Eats soldiers | Devours on contact or via tongue |

---

## 11. Worms

- **3-6 worms** hidden in dirt tiles at round start
- Wiggling segmented body (4-7 segments)
- Semi-visible in dirt (alpha 0.25), fully visible in tunnels
- **Eating a worm restores 1 HP**
- Floating text: "WORM +1 HP"

---

## 12. Round Structure

### Game States

`NARRATIVE → TITLE → CHAR_SELECT → GENERATING → COUNTDOWN → PLAYING → PAUSED → ROUND_END → MATCH_END`

### Flow

1. **Narrative intro** — 7-page typewriter story with animated pixel art
2. **Title screen** — Press 1 for Single Player (vs AI), 2 or any key for Local 2P, O for Online
3. **Character select** — Choose champion + color. Fighter select music plays (140 BPM dark beat)
4. **Map generates** — Fresh procedural map each round
5. **3-2-1 countdown** — Bounce-scale animation, "FIGHT!" voice at start
6. **Combat phase** — Queens fight, mutators active from round 2+
7. **Pause menu** — Escape opens menu: Resume / Exit to Menu
8. **Round ends** — Winner announced with glow: "P1 ANT WINS THE ROUND"
9. **Best of 5** — First to 3 wins
10. **Match end** — Large dancing winner character with victory sparkles, stays until keypress

---

## 13. Controls

### Keyboard

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | `W` `A` `S` `D` | Arrow keys |
| Shoot | `Space` | `Enter` |
| Special ability | `Q` | `Right Shift` |
| Pause | `Escape` | `Escape` |

### Gamepad (Xbox layout)

| Action | Button |
|---|---|
| Move | D-pad or left stick (0.3 deadzone) |
| Shoot | A (0), RB (5), RT (7) |
| Special | X (2), LB (4) |
| Start | Button 9 (menu navigation) |

Edge-detected directions in character select to prevent rapid cycling.

---

## 14. Single Player (vs AI)

- Press `1` on title screen to start single player
- AI controls P2 with multiple behavior modes:
  - **Explore** — Wander and look for objectives
  - **Hunt** — Chase enemy queen
  - **Flee** — Retreat when low HP
  - **Claim** — Go to unclaimed mounds
  - **Powerup** — Collect nearby power-ups
- AI uses special abilities contextually
- AI difficulty scales naturally with game mechanics

---

## 15. Multiplayer

### Online P2P (PeerJS + WebRTC)
- Direct peer-to-peer connection, no dedicated server
- 4-character room codes (unambiguous alphanumeric)
- Seeded PRNG ensures identical map generation on both clients
- Input synchronization at ~60 Hz
- Online status indicator on title screen

### Local
- Two players on same keyboard or gamepads

---

## 16. Audio

### Procedural Sound (Web Audio API)
All sounds generated in-browser with oscillators — no audio files.

**Sound effects:** shoot, dirt break, hit, death, mound claim, power-up collect, countdown tick, "FIGHT!" voice (slow, deep), soldier spawn, walk footsteps, match win fanfare, anteater roar/tongue/death

**Fighter Select Music:** 140 BPM dark industrial beat — kick drum, hi-hat, detuned minor chord pad, sawtooth bass riff. Starts on char select, stops when game begins.

**In-Game Music:** Bass drone, rhythmic pulse, ambient pad, randomized pentatonic melody. 2-second fade in, 1-second fade out.

**Voice Announcements:** Web Speech API for event callouts (power-ups, mound claims, mutators, critical health, "FIGHT!")

---

## 17. HUD

- **Semi-transparent rounded panels** behind text groups
- **Canvas-drawn heart icons** (filled = HP, outlined = lost)
- **Character type label** next to player name
- **Special ability counter** with large circles
- **Power-up indicator** with color-coded timer bar
- **Round/score** centered
- **Floating text** for damage, pickups, and events
- **Mutator indicators** shown during gameplay
- **Control hints** at bottom corners
- **"ESC to pause"** hint during gameplay

---

## 18. Particle System

| Type | Visual | Usage |
|---|---|---|
| Default | Round, alpha fade | Dirt destruction, hits, explosions |
| Trail | Glowing, small | Bullet trails |
| Sparkle | 4-point star | Power-up effects, victory screen |
| Cap | 200 max particles | Performance safety |

---

## 19. Technical Architecture

### Files

| File | Purpose |
|---|---|
| `index.html` | Entry point, loads all scripts |
| `js/constants.js` | TILE size, colors, states, character types, mutator definitions |
| `js/state.js` | Canvas, input, state variables, narrative pages, vignette, fog arrays |
| `js/map.js` | Procedural generation, BFS pathfinding, connectivity validation |
| `js/entities.js` | Queens, bullets, soldiers, mounds, power-ups, worms, particles, floating text |
| `js/game.js` | Game loop, round management, char select, pause menu, mutators, regrowth, fog, droppings |
| `js/render.js` | All drawing: pseudo-3D characters, terrain, HUD, overlays, pause menu, match end |
| `js/audio.js` | Web Audio API sounds, music, fighter select music, voice announcements |
| `js/gamepad.js` | Gamepad API with edge detection for menus |
| `js/anteater.js` | Anteater boss AI, rendering, tongue attack |
| `js/multiplayer.js` | PeerJS P2P networking with seeded PRNG sync |
| `js/narrative-art.js` | Animated pixel art illustrations for narrative pages |
| `js/ai.js` | Single-player AI opponent with multiple behavior modes |

### Performance
- Tile seed lookups (array index, zero cost)
- Particle cap at 200
- Bullet shadowBlur limited to max 6 bullets
- Vignette: single `drawImage` of pre-rendered canvas
- BFS pathfinding on manageable grid size
- Seeded PRNG for deterministic multiplayer

---

## 20. Build Status

### Completed
- [x] Core movement, shooting, dirt destruction
- [x] Round system (best of 5, sudden death)
- [x] Procedural map generation with connectivity guarantee
- [x] Spawn mounds (multiple, spread, connectivity-checked)
- [x] Allied soldiers (BFS pathfinding, dirt digging, roles: attack/defend/kamikaze)
- [x] Power-ups (4 types, unique colors/icons, multiple on map)
- [x] Three champion types with special abilities
- [x] Character selection screen with 3D portraits
- [x] Fighter select music (140 BPM dark beat)
- [x] Anteater boss
- [x] Worms (hidden HP restore)
- [x] Droppings trap mechanic
- [x] Pseudo-3D character rendering (gradients, shadows, specular)
- [x] Articulated leg animation system
- [x] Terrain visual variation (seeds, animated puddles, rock bevels)
- [x] Atmospheric effects (vignette, dust motes)
- [x] Bullet glow, trails, direction-aware rendering
- [x] Screen shake
- [x] Polished HUD (panels, drawn hearts, timer bars)
- [x] Floating text system (damage, pickups, events)
- [x] Narrative intro with animated art
- [x] Procedural audio (sounds + music + voice)
- [x] "FIGHT!" voice announcement at round start
- [x] Gamepad support (including X/LB for special)
- [x] Edge-detected gamepad for menus
- [x] Online P2P multiplayer with seeded PRNG
- [x] Single player vs AI
- [x] Pause menu (Resume / Exit to Menu)
- [x] Projectile limits and bullet-bullet collision
- [x] Round mutators (6 types, starting round 2)
- [x] Fog of war
- [x] Tunnel regrowth
- [x] Toxic pools (mutator)
- [x] Cave-in border shrink (mutator)
- [x] Dancing winner on match end screen
- [x] Victory sparkles and spotlight effects
- [x] Bounce-scale countdown animation
- [x] Title screen with glow and walking ant silhouettes
- [x] Winner-focused round/match end screens

### Future Ideas
- 4-player mode (free-for-all or 2v2)
- Additional champion types
- Map editor
- Spectator mode
- Tournament bracket system
