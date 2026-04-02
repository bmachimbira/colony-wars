# Colony Clash — Game Design Document v3

> **Queen vs. Queen — An Ant Colony Battle Arena**
> *"Risk the crown to build the swarm"*

**Platform:** Browser (HTML5 Canvas + Vanilla JS)
**Players:** 2 Local + Online P2P Multiplayer
**Dependencies:** PeerJS (multiplayer only), zero build step

---

## 1. The Pitch

Colony Clash is a local/online multiplayer battle arena set underground in a network of ant tunnels. Each player **is the queen** of their colony — the most powerful and most important unit on the field. Choose from three unique insect champions (Ant, Beetle, Cockroach), each with a special ability. Two rival queens compete on procedurally generated maps with destructible terrain, racing to claim spawn mounds, collect power-ups, and survive the anteater boss.

**Lose your queen, lose the round. Instantly.**

### Core Hooks

1. **You ARE the queen.** Every move is high-stakes. No respawns, no extra lives — one queen, one chance per round.
2. **Three champion types.** Ant drops traps, Beetle teleports, Cockroach deflects bullets — each plays differently.
3. **Spawn mounds as objectives.** Glowing mounds appear frequently. Claim them for soldier allies, but risk your queen to do it.
4. **Destructible terrain creates new paths.** Shooting dirt carves tunnels. The map evolves as you play.
5. **Anteater boss.** A terrifying NPC predator that hunts queens and eats soldiers.
6. **Hidden worms.** Find and eat worms hidden in dirt to restore HP.

---

## 2. Visual Identity: "Underground Pseudo-3D"

The game takes place underground with rich brown earth tones. All characters are rendered in **pseudo-3D** with radial gradient body segments, drop shadows, specular highlights, and volumetric articulated legs.

### Graphics System

- **Tile seeds:** Per-tile random seed for visual variation (no two tiles look alike)
- **Dirt:** Variable color per tile, randomized grain lines, pebble dots on ~25%
- **Rock:** Bevel shading (light top-left, dark bottom-right), crack lines on ~30%, seed-based highlights
- **Puddle:** Animated dual wave lines with shimmer highlights
- **Tunnels:** Adaptive rounded corners with inner shadow depth stroke
- **Vignette overlay:** Pre-rendered radial gradient for atmospheric darkening
- **Ambient dust motes:** 25 floating particles for underground atmosphere
- **Screen shake:** Triggered on queen damage (6px) and death (12px), decays at 0.85x/frame

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
| Dirt border | `#7A5A38` |
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
- **Special:** Drop Lethal Trap (Q / RShift) — places a poison dropping at current tile. Lasts 15s, deals 1 damage to enemy queen on contact.
- **Body:** Classic 3-segment (gaster with stinger, 2-node petiole, thorax), 6 articulated legs, elbowed 3-segment antennae
- **Cooldown:** 1 second

### Beetle
- **Special:** Fly (Q / RShift) — teleports to a random walkable tile within 5 tiles. Brief invincibility during flight.
- **Body:** Wide armored elytra with wing split line and vein grooves, rhinoceros horn with bezier curve, pronotum shield, 6 heavy legs, short clubbed antennae
- **Cooldown:** 2 seconds

### Cockroach
- **Special:** Deflect (Q / RShift) — belly-up mode for 1 second. Reflects incoming bullets back at the attacker.
- **Body:** Flat segmented abdomen with tergite bands, large pronotum with M-shape marking, 8 spindly legs, cerci tail prongs, very long whip antennae
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
| **Dirt** | Destructible (1 hit), blocks movement |
| **Rock** | Indestructible, blocks everything |
| **Puddle** | Impassable (blocks ants + projectiles), clustered 2-4 |
| **Leaf Litter** | Passable, decorative |
| **Dug/Tunnel** | Walkable, created when dirt destroyed |

### Procedural Generation

1. Queen chambers (3×3 clear) at opposite corners
2. Rock clusters (~15% coverage)
3. Two distinct tunnel corridors (upper + lower bias) connecting chambers
4. Tunnel carving **forces through rocks** to guarantee connectivity
5. Puddle clusters (8-14 water tiles)
6. Leaf litter (3-5)
7. BFS validation ensures 2 distinct paths exist between chambers

---

## 5. Spawn Mounds

| Property | Value |
|---|---|
| Spawn rate | Every 1-2 seconds |
| Max on map | 3 simultaneously |
| Min distance between | 8 tiles (Manhattan) |
| Unclaimed duration | 10 seconds |
| Claim method | Queen walks onto tile |
| Soldiers per mound | 3 |
| Soldier spawn interval | Every 2.5 seconds |
| Connectivity check | Mounds only spawn on tiles connected to queens |

### Visual States
- **Active:** Gold dome with radial gradient, expanding sonar ring beacon, sparkle dot
- **Claimed:** Colony-colored gradient dome with flag marker
- **Depleted:** Removed from map

### Allied Soldiers

| Property | Value |
|---|---|
| HP | 1 |
| Speed | 3.5 tiles/sec |
| Lifetime | 100 seconds |
| AI | BFS pathfind toward enemy queen (can dig through dirt) |
| Shooting | Line-of-sight within 5 tiles, 1.5s cooldown |

---

## 6. Power-Ups

| Property | Value |
|---|---|
| Spawn rate | Every 1 second |
| Max on map | 3 simultaneously |
| Min distance between | 6 tiles (Manhattan) |
| Despawn timer | 15 seconds |

### Power-Up Effects

| Type | Effect | Duration |
|---|---|---|
| Sugar Rush | 2× movement speed | 80 seconds |
| Rapid Bite | 3 simultaneous spread projectiles | 80 seconds |
| Chitin Shield | Absorbs next hit | Until hit |
| Mega Acid | 3×3 dirt destruction, glow bullets | 30 shots |

---

## 7. Combat

### Projectiles
- **Max in flight:** 3 per player
- **Speed:** 5 tiles/sec
- **Bullet-bullet collision:** Bullets from different players destroy each other
- **Trail particles:** 40% chance per frame to spawn glowing trail
- **Rendering:** Direction-aware ellipse with glow (shadowBlur), bright white core

### Droppings (Ant Special)
- Placed at queen's tile, lasts 15 seconds
- Deals 1 damage to enemy queen on contact
- Visual: brown cluster with opacity fade

---

## 8. Anteater Boss

| Property | Value |
|---|---|
| First spawn | 45 seconds into round |
| Respawn interval | Every 60 seconds |
| HP | 8 |
| Warning | 3-second flashing banner before arrival |
| Movement | Pathfinds toward nearest queen, digs through dirt |
| Tongue attack | 5-tile range in cardinal directions |
| Contact damage | 1 HP to queens |
| Eats soldiers | Devours on contact or via tongue |

---

## 9. Worms

- **3-6 worms** hidden in dirt tiles at round start
- Wiggling segmented body (4-7 segments) with animation
- Semi-visible in dirt (alpha 0.25), fully visible in tunnels
- **Eating a worm restores 1 HP** to the queen
- Incentivizes exploring and digging

---

## 10. Round Structure

### Game States

`NARRATIVE → TITLE → CHAR_SELECT → GENERATING → COUNTDOWN → PLAYING → ROUND_END → MATCH_END`

Additional: `PAUSED` (Escape key)

### Flow

1. **Narrative intro** — 7-page typewriter story with animated pixel art illustrations
2. **Title screen** — "Colony Clash" with glowing text, walking ant silhouettes, vignette
3. **Character select** — Choose champion type (Ant/Beetle/Cockroach) and color (8 options)
4. **Map generates** — Fresh procedural map each round
5. **3-2-1 countdown** — Bounce-scale animation
6. **Combat phase** — Queens fight, mounds/power-ups spawn frequently, anteater arrives at 45s
7. **Round ends** when a queen reaches 0 HP
8. **Best of 5** — First to 3 round wins

---

## 11. Controls

### Keyboard

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | `W` `A` `S` `D` | Arrow keys |
| Shoot | `Space` | `Enter` |
| Special ability | `Q` | `Right Shift` |
| Pause | `Escape` | `Escape` |

### Gamepad

- **Movement:** D-pad or left stick (0.3 deadzone)
- **Shoot:** A button (0), RB (5), or RT (7)
- **Start:** Button 9 for menu navigation

---

## 12. Multiplayer

### Online P2P (PeerJS + WebRTC)
- Direct peer-to-peer connection, no dedicated server
- 4-character room codes (unambiguous alphanumeric)
- Input synchronization at ~60 Hz
- Online status indicator on title screen

### Local
- Two players on same keyboard or gamepads

---

## 13. Audio

### Procedural Sound (Web Audio API)
All sounds generated in-browser with oscillators — no audio files.

**Sound effects:** shoot, dirt break, hit, death, mound claim/appear, power-up collect/appear, countdown tick, round start, soldier spawn, walk footsteps, match win, anteater roar/tongue/death

**Background music:** Bass drone, rhythmic pulse, ambient pad, randomized melody on pentatonic scale. 2-second fade in, 1-second fade out.

---

## 14. HUD

- **Semi-transparent rounded panels** behind all text groups
- **Canvas-drawn heart icons** (filled = remaining HP, outlined = lost)
- **Character type label** next to player name
- **Special ability counter** (Q:3/3 or RS:3/3)
- **Power-up indicator** with color-coded timer bar
- **Round/score** centered
- **Control hints** at bottom corners

---

## 15. Particle System

| Type | Visual | Usage |
|---|---|---|
| Default | Round, alpha fade | Dirt destruction, hits, explosions |
| Trail | Glowing, small | Bullet trails |
| Sparkle | 4-point star | Power-up effects |
| Cap | 200 max particles | Performance safety |

---

## 16. Technical Architecture

### Files

| File | Purpose |
|---|---|
| `index.html` | Entry point, loads all scripts |
| `js/constants.js` | TILE size, colors, game states, character types |
| `js/state.js` | Canvas setup, input, game state variables, narrative pages, vignette |
| `js/map.js` | Procedural generation, BFS pathfinding, connectivity validation |
| `js/entities.js` | Queens, bullets, soldiers, mounds, power-ups, worms, particles |
| `js/game.js` | Game loop, update logic, round management, narrative, char select |
| `js/render.js` | All drawing: pseudo-3D characters, terrain, HUD, overlays |
| `js/audio.js` | Web Audio API procedural sounds and music |
| `js/gamepad.js` | Gamepad API integration |
| `js/anteater.js` | Anteater boss AI, rendering, tongue attack |
| `js/multiplayer.js` | PeerJS P2P networking |
| `js/narrative-art.js` | Animated pixel art illustrations for narrative pages |

### Performance
- Tile seed lookups (array index, zero cost)
- Particle cap at 200
- Bullet shadowBlur limited to max 6 bullets
- Vignette: single `drawImage` of pre-rendered canvas
- BFS pathfinding on manageable grid size

---

## 17. Build Status

### Completed
- [x] Core movement, shooting, dirt destruction
- [x] Round system (best of 5, sudden death)
- [x] Procedural map generation with connectivity guarantee
- [x] Spawn mounds (multiple, spread, connectivity-checked)
- [x] Allied soldiers (BFS pathfinding, dirt digging)
- [x] Power-ups (4 types, unique colors/icons, multiple on map)
- [x] Three champion types with special abilities
- [x] Character selection screen
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
- [x] Narrative intro with animated art
- [x] Procedural audio (sounds + music)
- [x] Gamepad support
- [x] Online P2P multiplayer
- [x] Pause functionality
- [x] Projectile limits and bullet-bullet collision
- [x] Bounce-scale countdown animation
- [x] Title screen with glow and walking ant silhouettes

### Future Ideas
- 4-player mode (free-for-all or 2v2)
- Additional champion types
- Tunnel regrowth over time
- Map editor
- Spectator mode
- Tournament bracket system
