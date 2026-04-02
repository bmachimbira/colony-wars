# Colony Clash Enhancement Pack

## Overview

Four interconnected features to deepen gameplay: round mutators for variety, tunnel regrowth for territory pressure, fog of war for tension, and improved soldier AI for smarter combat.

## 1. Round Mutators

### Mutator Pool

| ID | Name | Effect |
|----|------|--------|
| FLOODED | Flooded Tunnels | Movement 30% slower for all entities |
| DARKNESS | Darkness | Fog of war vision radius reduced from 7 to 4 tiles |
| CAVEIN | Cave-In | Map border shrinks inward 1 tile every 15s (edges become rock) |
| SWARM | Swarm | Mound soldiers spawn 2x faster, live half as long |
| TOXIC | Toxic Spores | Random acid pools appear every 10s, damage queens on contact |
| FRENZY | Frenzy | All movement and bullet speed +50% |

### Stacking Rules

- Round 1: No mutator
- Round 2: 1 random mutator
- Rounds 3+: 2 random mutators (no duplicates within a round)

### Selection

Host picks mutators using seeded PRNG (deterministic for multiplayer sync). Mutators announced during countdown phase with floating text and voice.

### Implementation

- `MUTATORS` constant array with IDs and display names
- `activeModifiers` array in state, populated in `startNewRound()`
- Game systems check `activeModifiers.includes('ID')` for behavior changes
- Speed modifier: `getSpeedMultiplier()` returns combined multiplier from FLOODED/FRENZY
- CAVEIN: `caveinTimer` ticks in update, `caveinRing` tracks current border depth
- TOXIC: `toxicTimer` spawns acid pools on DUG tiles, pools stored in `toxicPools` array
- HUD shows active modifier icons top-center

## 2. Tunnel Regrowth

### Mechanic

- Every 8 seconds, 1 random DUG tile with no entity nearby reverts to DIRT
- Rate increases by +1 tile per regrowth cycle per round number (round 3 = 3 tiles per cycle)
- Tiles are protected if within 2 tiles of any queen, soldier, mound, or power-up
- Tiles dug in the last 5 seconds are immune (tracked via `lastDugTime` array)

### Visual

- Brief dirt-colored particle puff when tile regrows
- Subtle animation: tile fills in over ~0.3s (fade from DUG to DIRT color)

### Implementation

- `regrowthTimer` in state (counts down from 8)
- `lastDugTime[][]` parallel 2D array — set to `roundTimer` when tile becomes DUG
- `updateRegrowth(dt)` called from update loop
- Regrowth candidates: DUG tiles where `roundTimer - lastDugTime > 5` and no entity within 2 tiles

## 3. Fog of War

### Vision

- Each queen has vision radius of 7 tiles (Manhattan distance)
- DARKNESS mutator reduces to 4 tiles
- Own soldiers extend vision by 3 tiles around themselves
- Previously explored tiles shown as dim (40% brightness) — unexplored tiles fully dark
- Enemies, power-ups, mounds outside vision are not rendered

### Explored Map

- `explored[][]` 2D boolean array per player (indexed by player number)
- Updated each frame from queen + soldier positions
- Persists within a round (you remember where you've been)

### Mini-Map

- Position: top-right corner, 120x94px (proportional to COLS/ROWS)
- Shows: all explored terrain, queen positions (colored dots), owned soldier positions (small dots)
- Enemy queens only shown if in vision
- Border matches player color, slight transparency (80% opacity)

### Implementation

- `fogExplored[playerIdx][y][x]` boolean arrays
- `isVisible(x, y, playerIdx)` — checks Manhattan distance from queen + soldiers
- Render: after drawing all gameplay, draw black overlay with alpha on non-visible tiles, dim overlay on explored-but-not-visible tiles
- Mini-map: separate draw pass after HUD, uses `ctx.drawImage` of a small offscreen canvas
- Local multiplayer consideration: fog applies to BOTH players on the same screen. Each player sees their own fog. For shared screen, show union of both players' vision (otherwise it penalizes both).

### Shared Screen Decision

Since this is local multiplayer on one screen, fog of war shows the **union** of all local players' vision. Both players see what either can see. This prevents the awkward "you can see the screen anyway" problem. Online multiplayer could use per-player fog in a future update.

## 4. Better Soldier AI

### Current Behavior

Soldiers BFS to enemy queen, move toward her, shoot when in line of sight within 5 tiles.

### New Behavior

#### Roles

Each soldier has a `role` field:
- `'attack'` (default) — flank and engage enemy queen
- `'defend'` — protect own queen when she's low HP
- `'kamikaze'` — rush with double speed when lifetime < 5s

#### Flanking

- At spawn, each soldier gets a `flankOffset` of {dx, dy} where dx/dy are random -3 to +3
- Attack target is enemy queen position + flankOffset (clamped to map bounds)
- This spreads soldiers so they don't all stack on the same tile

#### Group Advance

- Every 2s pathfind cycle, soldiers check if allies are within 4 tiles
- If 2+ allies nearby and all moving to attack, they share the same recalculated path target
- Solo soldiers advance normally (no waiting)

#### Defend Mode

- Triggers when own queen HP <= 1 AND soldier is within 6 tiles of own queen
- Soldier targets nearest enemy (queen or soldier) to own queen instead of enemy queen
- Returns to attack when own queen HP > 1

#### Kamikaze

- When soldier lifetime < 5s, role switches to kamikaze
- Movement speed doubles, pathfind timer halved (1s instead of 2s)
- Visual: soldier flashes red

### Implementation

- Add fields to soldier object: `role`, `flankOffset`, `allyGroup`
- Modify `updateSoldiers()` in entities.js
- Role transitions checked each pathfind cycle
- Flank offset assigned at spawn in `updateMound()`

## File Changes

| File | Changes |
|------|---------|
| constants.js | MUTATORS array, fog/regrowth constants |
| state.js | activeModifiers, regrowthTimer, lastDugTime, fogExplored, caveinRing, toxicPools |
| game.js | Mutator selection in startNewRound(), regrowth/toxic/cavein update calls, fog reset |
| entities.js | Soldier AI roles/flanking/defend/kamikaze, toxic pool damage check |
| render.js | Fog overlay, mini-map, mutator HUD icons, soldier flash for kamikaze, cavein border |
| audio.js | Regrowth sound, mutator announcement, cavein rumble |
