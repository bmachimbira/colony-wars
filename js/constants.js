// ─── Constants ───────────────────────────────────────────────
const TILE = 48;
const COLS = Math.floor(window.innerWidth / TILE);
const ROWS = Math.floor(window.innerHeight / TILE);
const W = COLS * TILE, H = ROWS * TILE;
const COLORS = {
  bg:       '#2A1E10',
  dirt:     '#5C4023',
  dirtBord: '#7A5A38',
  rock:     '#6B6B6B',
  rockHi:   '#8A8A8A',
  puddle:   '#2855A0',
  leaf:     '#3A6828',
  dug:      '#332810',
  p1:       '#3066C8',
  p2:       '#C83030',
  moundGold:'#E8C840',
  termite:  '#C87830',
  beetle:   '#6830A0',
  swarm:    '#888888',
  powerUp:  '#E8C840',
};

// Tile types
const T = { DIRT: 0, ROCK: 1, PUDDLE: 2, LEAF: 3, DUG: 4, TUNNEL: 5 };

// Game states
const STATE = { NARRATIVE: -1, TITLE: 0, CHAR_SELECT: 7, GENERATING: 1, COUNTDOWN: 2, PLAYING: 3, ROUND_END: 4, MATCH_END: 5, PAUSED: 6 };

// Character types
const CHAR_TYPES = ['ANT', 'BEETLE', 'COCKROACH'];
const CHAR_COLORS = ['#3066C8', '#C83030', '#30A830', '#C8A030', '#A030C8', '#30C8C8', '#C86030', '#FFFFFF'];

// ─── Seeded PRNG (mulberry32) for deterministic gameplay ─────
let gameSeed = Date.now();
function seedRandom(seed) {
  gameSeed = seed;
}
function seededRandom() {
  gameSeed |= 0;
  gameSeed = gameSeed + 0x6D2B79F5 | 0;
  let t = Math.imul(gameSeed ^ gameSeed >>> 15, 1 | gameSeed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
// Drop-in replacement for Math.random() in gameplay code
function gameRandom() { return seededRandom(); }

// Player controls (P1-P4)
const PLAYER_CONTROLS = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space', special: 'KeyQ' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter', special: 'ShiftRight' },
  { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', shoot: 'KeyH', special: 'KeyY' },
  { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6', shoot: 'Numpad0', special: 'NumpadDecimal' },
];

// Player count (set by multiplayer lobby or local)
let playerCount = 2;

// Power-up types
const POWER_TYPES = ['SUGAR', 'RAPID', 'SHIELD', 'MEGA'];
const MAX_BULLETS_PER_PLAYER = 3;
const PARTICLE_CAP = 200;

// Power-up colors
const POWER_COLORS = {
  SUGAR: '#44DD44',
  RAPID: '#FF8800',
  SHIELD: '#44DDFF',
  MEGA: '#FF44FF',
};
