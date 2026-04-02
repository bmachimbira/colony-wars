// ─── Constants ───────────────────────────────────────────────
const TILE = 32;
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
const STATE = { TITLE: 0, GENERATING: 1, COUNTDOWN: 2, PLAYING: 3, ROUND_END: 4, MATCH_END: 5, PAUSED: 6 };

// Power-up types
const POWER_TYPES = ['SUGAR', 'RAPID', 'SHIELD', 'MEGA'];
const MAX_BULLETS_PER_PLAYER = 3;
