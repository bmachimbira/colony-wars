# Colony Clash — Game Design Document v2

> **Queen vs. Queen — An Ant Colony Battle Arena**
> *"Risk the crown to build the swarm"*

**Platform:** Browser (HTML5 Canvas + Vanilla JS, single HTML file)
**Players:** 2 Local (expandable to 4)
**Build time:** ~4 hours (hackathon sprint)
**Dependencies:** None — zero build step, zero server

---

## 1. The Pitch

Colony Clash is a local multiplayer battle arena set underground in a network of ant tunnels. Each player **is the queen** of their colony — the most powerful and most important unit on the field. Two rival queens compete on procedurally generated maps with destructible terrain, racing to claim spawn mounds that produce temporary allied soldiers, while timed AI waves of termites and rival swarms crash into the battlefield.

**Lose your queen, lose the round. Instantly.**

### Core Hooks

1. **You ARE the queen.** Every move is high-stakes because you're both the commander and the target. No respawns, no extra lives — one queen, one chance per round.

2. **Spawn mounds as objectives.** Glowing mounds appear randomly on the map throughout the round. Reach one to activate it and spawn 3–4 allied soldier ants. But you have to physically go there with your queen — risking everything for a tactical advantage.

3. **Destructible terrain creates new paths.** Shooting dirt walls doesn't just remove obstacles — it carves new tunnels. The map evolves as you play. Early game is tight corridors; late game is wide-open chaos.

4. **AI waves as chaos factor.** Termite raids eat through walls. Rival swarms hunt queens. Every wave reshapes the battlefield and forces adaptation.

---

## 2. Visual Identity: "Underground"

The entire game takes place underground. Rich brown earth tones dominate — dark soil backgrounds, lighter dirt walls, grey rocks, blue water puddles. The aesthetic is earthy, organic, and warm.

Queens are drawn as larger ants with a distinct crown/mandible shape and a subtle colony-color glow. Allied soldiers are smaller versions in the same color. AI creatures have their own distinct colors.

### Color Palette

| Element | Color | Hex |
|---|---|---|
| Background (deep earth) | Very dark brown | `#2A1E10` |
| Dirt walls (destructible) | Medium brown | `#5C4023` |
| Dirt wall border | Warm brown | `#7A5A38` |
| Rocks (indestructible) | Stone grey | `#6B6B6B` |
| Rock highlight | Light grey | `#8A8A8A` |
| Water (impassable) | Deep blue | `#2855A0` |
| Leaf litter (hide) | Muted green | `#3A6828` |
| Fungus (slippery) | Pale yellow-green | `#A8B848` |
| **Player 1 colony** | Royal blue | `#3066C8` |
| **Player 2 colony** | Crimson red | `#C83030` |
| Spawn mound (unclaimed) | Pulsing gold | `#E8C840` |
| Spawn mound (P1 claimed) | Blue-gold | `#3066C8` border + `#E8C840` fill |
| Spawn mound (P2 claimed) | Red-gold | `#C83030` border + `#E8C840` fill |
| Termite AI wave | Warm orange | `#C87830` |
| Beetle AI wave | Dark purple | `#6830A0` |
| Rival swarm AI | Neutral grey | `#888888` |
| Power-up glow | Gold | `#E8C840` |

### Visual Effects

- **Queen glow:** Subtle ambient glow in colony color around the queen at all times (identifies the queen clearly)
- **Queen crown:** Visual differentiator — larger mandibles or a small crown shape on the head segment
- **Ant bob:** 1–2px vertical oscillation on a 0.6s cycle while moving
- **Pheromone trail:** Fading colony-colored dots behind queen (opacity decays over 3s)
- **Dirt destruction:** Small particle burst (brown specks flying outward)
- **Spawn mound pulse:** Gold glow pulsing when unclaimed, shifts to colony color when claimed
- **Soldier spawn:** Soldiers "emerge" from the mound with a small dig-up animation
- **Damage feedback:** Queen's sketch gets scuffed/cracked with each HP lost
- **Death explosion:** Large particle burst in colony color when queen dies — dramatic, round-ending moment
- **Allied soldier timeout:** Soldiers fade out and crumble when their 20s timer expires

---

## 3. The Map

Each round generates a fresh map on a tile grid of approximately **28×22 tiles** (each tile is 24×24 pixels, giving a play area of 672×528px).

### Tile Types

| Tile | Type | Behaviour | Visual |
|---|---|---|---|
| **Dirt** | `DIRT` | Destructible, 1 hit from acid spray | Medium brown blocks with grain texture lines |
| **Rock** | `ROCK` | Indestructible | Grey blocks with pebble highlights, heavier border |
| **Puddle** | `PUDDLE` | Impassable (blocks ants + projectiles) | Blue with wavy surface highlight lines |
| **Leaf Litter** | `LEAF` | Passable, hides ant underneath | Scattered green leaf shapes, semi-transparent |
| **Tunnel** | `TUNNEL` | Open ground (default empty space) | Dark earth background `#2A1E10` |
| **Dug Out** | `DUG` | Created when dirt is destroyed | Slightly lighter than tunnel `#332810` |

**Stretch tiles (cut if time tight):**

| Tile | Type | Behaviour | Visual |
|---|---|---|---|
| Fungus | `FUNGUS` | Passable, ants slide with momentum | Yellow-green patches |

### Procedural Generation Rules

1. Place P1 queen chamber (bottom-left quadrant) and P2 queen chamber (bottom-right quadrant) — each is a 3×3 clear zone with the queen starting in the center
2. Place rock clusters as permanent landmarks (3–5 clusters of 2–4 rocks each) — these create strategic anchors and chokepoints
3. Fill remaining space with dirt
4. Carve guaranteed tunnel corridors connecting both queen chambers (ensures the game is always playable)
5. Scatter puddles (4–6) as impassable obstacles — never blocking the only path between chambers
6. Place leaf litter patches (3–5) in strategic positions near chokepoints
7. **Validate:** BFS/flood fill confirms both queen chambers are reachable from each other

**Symmetry:** Soft diagonal mirror (top-left to bottom-right) with 15–20% random variation. Fair but not identical.

---

## 4. The Queen (Player Character)

The player IS the queen. This is the single most important design decision — it creates constant tension because every action risks the round.

### Queen Stats

| Property | Value | Notes |
|---|---|---|
| HP | 3 | Pristine → scuffed → cracked → dead |
| Lives | 1 | **Sudden death — lose the queen, lose the round** |
| Movement speed | 3 tiles/sec | Base speed, boosted by Sugar Rush power-up |
| Direction | 4-way | Up/down/left/right, facing changes instantly |
| Projectile | Acid spray | 1 active bullet at a time (default) |
| Bullet speed | 5 tiles/sec | Faster than queen movement |
| Size | Slightly larger than soldiers | ~1.3× visual size, still occupies 1 tile |

### Queen Visual Distinction

The queen must be **immediately recognizable** as different from allied soldiers and enemy units:

- **Larger body** — all three segments (abdomen, thorax, head) are ~30% bigger
- **Crown/mandibles** — exaggerated mandibles or a small crown shape on the head
- **Colony glow** — persistent subtle glow halo in colony color
- **Antennae** — longer, more prominent than soldiers
- **Damage states:** 3 HP = pristine, 2 HP = one visible crack/scuff, 1 HP = heavy damage, flickering glow

---

## 5. Spawn Mounds (Core Strategic Mechanic)

Spawn mounds are the signature mechanic that makes Colony Clash unique. They create a constant risk/reward decision: **risk your queen to claim a mound and gain temporary reinforcements, or play it safe and let your opponent build an army.**

### Spawn Mound Rules

| Property | Value |
|---|---|
| First mound appears | 15 seconds into round |
| New mound appears | Every 20–25 seconds (randomized) |
| Active mounds at once | 1 (next one spawns after current is claimed or expires) |
| Unclaimed duration | 12 seconds before it disappears |
| Claim method | Queen walks onto the mound tile |
| Soldiers produced | 3–4 (randomized) |
| Soldier spawn rate | 1 every 2.5 seconds after claiming |
| Soldier lifetime | 20 seconds from spawn |
| Mound placement | Random empty tunnel tile, minimum 5 tiles from either queen |

### Spawn Mound Lifecycle

```
INACTIVE → mound timer elapses → APPEARING (1s glow-in animation)
APPEARING → animation complete → ACTIVE (pulsing gold, unclaimed)
ACTIVE → queen walks onto it → CLAIMED (shifts to colony color)
ACTIVE → 12s timeout → FADING (2s fade-out) → INACTIVE
CLAIMED → all soldiers produced → DEPLETED (crumbles away) → INACTIVE
```

### Allied Soldier Behaviour

Allied soldiers spawned from mounds are AI-controlled allies:

| Property | Value |
|---|---|
| HP | 1 (one hit kill) |
| Speed | 3.5 tiles/sec (slightly faster than queen) |
| Damage | 1 HP per hit (same as queen's acid) |
| Lifetime | 20 seconds from spawn |
| AI behaviour | Aggressive — pathfind toward enemy queen |
| Bullet | 1 active acid spray, same as queen |
| Friendly fire | No — cannot damage own queen or own soldiers |

**Design intent:** Soldiers are a burst of tactical pressure. 3–4 aggressive ants hunting the enemy queen for 20 seconds is terrifying, but not permanent. The opponent can choose to fight them head-on (risky — wastes time and HP), flee and wait them out (gives up map control), or try to kill the enemy queen while she's exposed after claiming.

### Strategic Implications

- **Risk vs. reward:** Going to a mound means leaving your safe zone. The enemy knows where the mound is too — it's a trap opportunity.
- **Map reading:** Mound location matters. A mound near your side is low-risk. A mound near the enemy or in open terrain is high-risk.
- **Timing:** Claiming right before an AI wave arrives means your soldiers AND the wave hit the enemy simultaneously.
- **Counter-play:** If you see the enemy heading for a mound, you can rush to intercept, camp the mound, or use the distraction to dig toward their chamber.

---

## 6. Round Structure

### Flow

1. **Map generates** — fresh procedural map, 3-second countdown with both queens visible at chambers
2. **Combat phase** — queens fight, terrain gets destroyed, spawn mounds appear
3. **First spawn mound** appears at 15s
4. **AI waves** spawn on timer (first wave at 30s, then every 20s)
5. **New spawn mounds** continue appearing every 20–25s
6. **Round ends instantly** when a queen reaches 0 HP

### Match Format

- **Best of 5 rounds** — first to 3 round wins takes the match
- **No round timer** — AI waves and spawn mounds ensure rounds don't stall
- **Between rounds:** 3-second score screen showing round winner and match score
- **New map each round** — fresh procedural generation

### Round End Sequence

When a queen dies:
1. Queen death explosion (large particle burst in colony color)
2. All other entities freeze in place
3. **"BLUE COLONY FALLS"** / **"RED COLONY FALLS"** banner (1.5s)
4. **"P1 WINS THE ROUND"** / **"P2 WINS THE ROUND"** (1.5s)
5. Match score update
6. Transition to next round (or match end)

---

## 7. AI Waves

AI waves are the chaos factor. They disrupt entrenched positions, reshape the map, and force queens out of hiding. Every wave spawns 2–4 AI creatures from random tunnel edges.

### Wave Schedule

| Event | Time |
|---|---|
| First wave | 30 seconds |
| Subsequent waves | Every 20 seconds |
| Escalation | +1 creature per wave after wave 3 |

### Wave Types

| Wave | Creature | Color | Count | HP | Behaviour |
|---|---|---|---|---|---|
| **Termite Raid** | Termites | Orange `#C87830` | 3–4 | 1 | Wander randomly, **eat dirt walls** — creating chaos paths. Don't attack ants. |
| **Rival Swarm** | Worker ants | Grey `#888888` | 3–4 | 1 | Aggressive, **target nearest queen**. Fast but fragile. |
| **Beetle Rampage** | Beetles | Purple `#6830A0` | 2–3 | 2 | Wander randomly, shoot in random directions. Slow but tanky. |
| **Centipede** | Centipede | Yellow-green `#A0B830` | 1 | 3 | Single long creature that snakes through tunnels, blocks paths, shoots sideways. |

### Wave Mechanics

- **Announcement:** 3-second warning banner: `~ TERMITE RAID APPROACHING ~`
- **Spawn:** From random tunnel tiles at map edges, never inside queen chambers
- **Timeout:** AI creatures self-destruct after 15 seconds (small poof animation)
- **No score value:** Killing AI gives no advantage — only removes threats
- **Wave type:** Random selection, weighted toward termites (40%) and rival swarms (30%)

### Design Intent by Wave Type

- **Termites** are the most interesting — they reshape the map. They might open a flank you were hiding behind, or create a shortcut to the enemy queen. Map control is temporary.
- **Rival swarms** force movement. If you're camping, 3–4 ants hunting you will flush you out.
- **Beetles** are obstacles. Tanky, random, and disruptive — they block corridors and spray projectiles unpredictably.
- **Centipede** is a stretch goal — physically blocks tunnels like a moving wall.

---

## 8. Power-Ups

Power-ups spawn as food crumbs on random empty tiles every 15 seconds. Only one active on the map at a time. They glow gold and disappear after 10 seconds if not collected.

### Power-Up Table

| Power-Up | Visual | Effect | Duration |
|---|---|---|---|
| **Sugar Rush** | White crystal | 2× movement speed | 8 seconds |
| **Rapid Bite** | Triple fang marks | 3 simultaneous acid projectiles | 8 seconds |
| **Chitin Shield** | Shell/armor shape | Absorbs next hit (+1 effective HP, doesn't stack) | Until hit or 15s |
| **Mega Acid** | Large green droplet | Projectiles destroy 3×3 dirt area | 3 shots |

**Stretch goal power-up:**

| Power-Up | Visual | Effect | Duration |
|---|---|---|---|
| Pheromone Freeze | Spiral symbol | Opponent's queen freezes for 2 seconds | Instant |

### Visual Feedback

- Active power-up shown as icon next to player name in HUD
- Queen gets visual modifier: speed trail (Sugar Rush), fang overlay (Rapid Bite), shell glow (Chitin Shield), enlarged projectile (Mega Acid)

---

## 9. Controls

### Keyboard Layout

| Action | Player 1 | Player 2 |
|---|---|---|
| Move Up | `W` | `↑` Arrow |
| Move Down | `S` | `↓` Arrow |
| Move Left | `A` | `←` Arrow |
| Move Right | `D` | `→` Arrow |
| Shoot | `Space` | `Enter` |

### 4-Player Expansion (Next Hackathon)

| Player | Movement | Shoot | Colony Color |
|---|---|---|---|
| Player 3 | `I` `J` `K` `L` | `H` | Green `#30A848` |
| Player 4 | Numpad `8` `4` `5` `6` | Numpad `0` | Purple `#8830C8` |

**Implementation:** Input handler stores a config array per player. Adding players is a config change — `playerConfigs[]` array with key bindings and colony color.

---

## 10. HUD

Minimal, thematic, monospace font in colony colors.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ P1: ♥♥♥ [shield]     ROUND 2  ·  1-1     [rapid] P2: ♥♥♥ │
│                                                         │
│                      (play area)                        │
│                                                         │
│               ~ TERMITE RAID APPROACHING ~              │
│                                                         │
│ WASD+SPACE            ROUND 2  ·  1:47        ARROWS+ENTER │
└─────────────────────────────────────────────────────────┘
```

- **Top-left:** P1 HP hearts (colony blue) + active power-up icon
- **Top-right:** P2 HP hearts (colony red) + active power-up icon
- **Top-center:** Round number, match score
- **Bottom-center:** Wave announcement banner (when relevant), wave countdown timer
- **Bottom-corners:** Control hints (subtle, can hide after first round)

### Between Rounds

Full-screen overlay:
- Round winner in large text with colony color
- Match score updated
- "Next round in 3..." countdown
- New map preview fading in behind

---

## 11. Game States

| State | Description | Transition | Trigger |
|---|---|---|---|
| `TITLE` | "Colony Clash" logo, "Press any key" | → `GENERATING` | Any key |
| `GENERATING` | Map procedural generation (brief) | → `COUNTDOWN` | Map ready |
| `COUNTDOWN` | 3-2-1 countdown, queens visible at chambers | → `PLAYING` | Timer ends |
| `PLAYING` | Active gameplay — combat, waves, mounds | → `ROUND_END` | A queen dies |
| `ROUND_END` | Winner announced, score updated, 3s pause | → `GENERATING` or `MATCH_END` | Timer ends |
| `MATCH_END` | Final winner, "Press any key to restart" | → `TITLE` | Any key |

---

## 12. Technical Architecture

### Stack

- **Single HTML file** — everything in one file, open in any browser
- **HTML5 Canvas** — 2D rendering context
- **Vanilla JavaScript** — no frameworks, no libraries
- **Web Audio API** — procedural sounds (stretch goal)

### Canvas Setup

```
Canvas size: 672×528px (28 tiles × 24px, 22 tiles × 24px)
Scaled to fit viewport with CSS (maintain aspect ratio)
Background: #2A1E10 (deep earth)
```

### Core Game Loop

```
requestAnimationFrame loop:
1. Calculate delta time (capped at 50ms to prevent spiral)
2. Process input → keyboard state object
3. Update game state:
   a. Queen movement + collision
   b. Bullet movement + collision (dirt destruction, ant damage)
   c. Allied soldier AI (pathfinding toward enemy queen)
   d. AI wave creatures (behaviour per type)
   e. Spawn mound timers (appear, claim, timeout, despawn)
   f. Power-up timers (spawn, collect, expire)
   g. Wave manager (countdown, spawn, escalation)
   h. Check win condition (queen HP ≤ 0)
4. Render frame:
   a. Clear canvas
   b. Draw terrain grid (tile by tile)
   c. Draw spawn mound (if active)
   d. Draw power-up (if active)
   e. Draw pheromone trails
   f. Draw AI creatures
   g. Draw allied soldiers
   h. Draw queens (on top of everything)
   i. Draw bullets
   j. Draw particles
   k. Draw HUD overlay
5. Loop
```

### Data Structures

```javascript
// Map — 2D array
map[y][x] = { type: 'DIRT' | 'ROCK' | 'PUDDLE' | 'LEAF' | 'TUNNEL' | 'DUG' }

// Queen (player)
queen = {
  x, y,              // tile position (float for smooth movement)
  dir,               // 'up' | 'down' | 'left' | 'right'
  hp: 3,             // 1–3
  speed: 3,          // tiles/sec
  colony: 'blue',    // or 'red'
  activePowerUp: null,
  powerUpTimer: 0,
  invincible: false,
  invincibleTimer: 0,
  bobPhase: 0,       // for walk animation
  pheromoneTrail: [] // [{x, y, age}]
}

// Bullet
bullet = {
  x, y, dir, speed: 5,
  owner: 'blue',     // colony that fired it
  blastRadius: 1     // 1 default, 3 for Mega Acid
}

// Allied soldier (from spawn mound)
soldier = {
  x, y, dir,
  hp: 1,
  speed: 3.5,
  colony: 'blue',
  lifetime: 20,      // seconds remaining
  target: null,      // enemy queen reference
  bullet: null       // active projectile
}

// Spawn mound
mound = {
  x, y,
  state: 'INACTIVE' | 'APPEARING' | 'ACTIVE' | 'CLAIMED' | 'FADING' | 'DEPLETED',
  claimedBy: null,   // 'blue' | 'red'
  soldiersRemaining: 0,
  spawnTimer: 0,
  activeTimer: 0     // time remaining before unclaimed mound disappears
}

// AI wave creature
creature = {
  x, y, dir,
  type: 'termite' | 'swarm' | 'beetle' | 'centipede',
  hp: 1,             // varies by type
  speed: 2.5,        // varies by type
  lifetime: 15,
  behaviour: fn      // AI function reference
}

// Power-up
powerUp = {
  x, y,
  type: 'SUGAR' | 'RAPID' | 'SHIELD' | 'MEGA',
  despawnTimer: 10
}

// Wave manager
waveManager = {
  nextWaveTimer: 30,  // seconds until next wave
  waveCount: 0,
  activeCreatures: []
}

// Mound manager
moundManager = {
  nextMoundTimer: 15,
  activeMound: null
}
```

### Collision System

Tile-based on 24×24px grid. All entities occupy one tile.

| Collision | Result |
|---|---|
| Queen vs. dirt/rock/puddle | Block movement |
| Queen vs. leaf litter | Allow movement, set hidden flag |
| Queen vs. spawn mound | Claim mound (if unclaimed) |
| Queen vs. power-up | Collect, apply effect |
| Bullet vs. dirt | Destroy tile (→ DUG), remove bullet, spawn particles |
| Bullet vs. rock | Remove bullet, no effect |
| Bullet vs. puddle | Remove bullet, no effect |
| Bullet vs. enemy queen | Apply 1 damage, remove bullet |
| Bullet vs. enemy soldier | Kill soldier, remove bullet |
| Bullet vs. AI creature | Apply 1 damage, remove bullet |
| Bullet vs. allied unit | Pass through (no friendly fire) |

### AI Pathfinding

Simple implementation suitable for hackathon:

- **Allied soldiers:** BFS pathfind toward enemy queen position, recalculate every 2 seconds. If no path, wander randomly.
- **Termites:** Random walk — pick a random adjacent tile, prefer dirt tiles (they eat them). Change direction every 1–2 seconds.
- **Rival swarm:** BFS toward nearest queen, recalculate every 1.5 seconds. Faster recalculation than soldiers.
- **Beetles:** Random walk, shoot in facing direction every 2 seconds.

BFS is computed on the tile grid — cheap at 28×22 (616 tiles).

---

## 13. Build Plan (4-Hour Sprint)

Each phase builds on the previous and results in a playable state.

### Phase 1: Core (60 min)
**Goal:** Two queens moving on a static map, shooting and destroying dirt.

- [ ] HTML boilerplate + canvas setup (672×528, scaled)
- [ ] Tile grid data structure and rendering
- [ ] Hard-coded test map (dirt, rock, tunnel)
- [ ] Player input handling (WASD + Arrows)
- [ ] Queen movement with grid snapping and smooth interpolation
- [ ] Queen rendering (three-segment body, legs, antennae)
- [ ] Bullet firing, travel, and dirt destruction
- [ ] Basic collision detection (queen vs. walls, bullet vs. tiles)
- [ ] Bullet vs. queen damage

**Playable checkpoint:** Two queens can move, shoot, destroy terrain, and damage each other.

### Phase 2: Round System (30 min)
**Goal:** Sudden death rounds with match scoring.

- [ ] Queen HP display and damage visual states
- [ ] Death detection → round end trigger
- [ ] Round end sequence (explosion, banner, score)
- [ ] Game state machine (TITLE → COUNTDOWN → PLAYING → ROUND_END → MATCH_END)
- [ ] Match scoring (best of 5)
- [ ] Title screen
- [ ] Countdown screen (3-2-1)

**Playable checkpoint:** Full game loop — title → play → round end → next round → match winner.

### Phase 3: Map Generation (45 min)
**Goal:** Every round gets a unique, fair, procedural map.

- [ ] Queen chamber placement (3×3 clear zones)
- [ ] Rock cluster placement (3–5 clusters)
- [ ] Dirt fill
- [ ] Tunnel corridor carving (connecting both chambers)
- [ ] Puddle placement (never blocking only path)
- [ ] Leaf litter placement
- [ ] BFS validation (both chambers reachable)

**Playable checkpoint:** Every round has a fresh, unique, playable map.

### Phase 4: Spawn Mounds (45 min)
**Goal:** The core strategic mechanic — queens risk themselves to claim mounds and spawn allies.

- [ ] Mound manager — timer, random placement, lifecycle states
- [ ] Mound rendering (gold pulse, colony color when claimed)
- [ ] Queen claims mound on contact
- [ ] Allied soldier spawning (3–4 per mound, 1 every 2.5s)
- [ ] Soldier AI — BFS pathfind toward enemy queen
- [ ] Soldier shooting and combat
- [ ] Soldier 20s lifetime timer + fade-out death
- [ ] Mound depletion and removal

**Playable checkpoint:** Spawn mounds appear, queens can claim them, allied soldiers fight for the claiming colony. This is where the game gets INTERESTING.

### Phase 5: AI Waves (30 min)
**Goal:** Timed chaos waves that disrupt the battlefield.

- [ ] Wave manager — countdown timer, announcement banner
- [ ] Termite AI (random walk + eat dirt)
- [ ] Rival swarm AI (pathfind toward nearest queen)
- [ ] AI self-destruct timer (15s)
- [ ] Wave escalation (+1 creature after wave 3)
- [ ] Wave type random selection

**Playable checkpoint:** AI waves create chaos, termites reshape the map, swarms hunt queens.

### Phase 6: Power-Ups (20 min)
**Goal:** Food crumb power-ups with temporary abilities.

- [ ] Power-up spawn timer and placement
- [ ] Collection on queen contact
- [ ] Sugar Rush (2× speed, 8s)
- [ ] Rapid Bite (3 bullets, 8s)
- [ ] Chitin Shield (+1 HP absorb)
- [ ] Mega Acid (3×3 destruction, 3 shots)
- [ ] HUD power-up indicator

**Playable checkpoint:** Power-ups add tactical variety and pickup decisions.

### Phase 7: Polish (10 min)
**Goal:** Juice for the demo.

- [ ] Ant bob animation during movement
- [ ] Pheromone trail particles
- [ ] Dirt destruction particle burst
- [ ] Screen shake on queen death
- [ ] Smooth camera (if canvas larger than viewport)

---

## 14. What to Cut if Time is Tight

In priority order — **cut from the bottom first:**

1. **Phase 7 polish** — game plays fine without particles and bob
2. **Beetle and centipede wave types** — just termites + rival swarms is enough
3. **Leaf litter tiles** — visual-only hiding is low-value
4. **Wave escalation** — flat wave count works fine
5. **Mega Acid power-up** — 3×3 blast is flashy but not essential
6. **Chitin Shield power-up** — just do Sugar Rush + Rapid Bite

### Non-Negotiable Core (Minimum Viable Game)

These features MUST ship for the game to work:

- Two queens on a map, moving and shooting
- Dirt destruction (the map-reshaping hook)
- Sudden death (queen dies → round over)
- Procedurally generated maps
- Spawn mounds with allied soldiers (the signature mechanic)
- At least one AI wave type (termites — they reshape the map)
- At least one power-up type (Sugar Rush — simplest to implement)
- Match scoring (best of 5)

---

## 15. Future Expansion (Next Hackathon)

- **4-player mode** — 4 queen chambers (corners), free-for-all or 2v2
- **Queen abilities** — each colony has a unique queen power (e.g., blue queen digs faster, red queen's soldiers are stronger)
- **Tunnel regrowth** — destroyed dirt slowly grows back over 60s
- **Sound design** — Web Audio API procedural sounds (chittering, acid spit, dirt crumble)
- **Gamepad support** — Gamepad API for controllers
- **Online multiplayer** — WebSocket-based netcode (major effort, separate project)
- **Map editor** — custom map creation tool
- **Spectator mode** — camera follows the action for tournament display
