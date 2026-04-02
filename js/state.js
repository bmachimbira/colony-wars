// ─── Canvas ──────────────────────────────────────────────────
const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

// ─── Input ───────────────────────────────────────────────────
const keys = {};
const keyboardKeys = {};
window.addEventListener('keydown', e => {
  // Don't intercept keys when typing in an input/textarea (multiplayer UI)
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  keyboardKeys[e.code] = true;
  keys[e.code] = true;
  e.preventDefault();
});
window.addEventListener('keyup', e => {
  keyboardKeys[e.code] = false;
  keys[e.code] = false;
});

// ─── Game State ──────────────────────────────────────────────
let gameState = localStorage.getItem('colonyClash_introSeen') ? STATE.TITLE : STATE.NARRATIVE;

// ─── Narrative ───────────────────────────────────────────────
const NARRATIVE_PAGES = [
  {
    title: 'BENEATH THE EARTH...',
    lines: [
      'Two rival colonies have broken into',
      'the same underground cavern.',
      '',
      'Food is scarce. Territory is everything.',
      'Only one queen can hold the nest.',
    ],
    color: '#C8A050',
  },
  {
    title: 'DIG. FIGHT. SWARM.',
    lines: [
      'Shoot acid to open tunnels and hunt',
      'the rival queen through the dark.',
      '',
      'Claim golden mounds to spawn soldiers.',
      'Grab power-ups when they appear.',
      '',
      'Pick your fighter on the next screen.',
    ],
    color: '#E8C840',
  },
  {
    title: 'STAY ALIVE.',
    lines: [
      'Worms can heal you.',
      'The anteater can ruin everyone.',
      '',
      'First to 3 rounds wins the cavern.',
      'The rest you can learn by playing.',
    ],
    color: '#C83030',
  },
];

let narrativePage = 0;
let narrativeCharIndex = 0;
let narrativeCharTimer = 0;
let narrativePageReady = false;
let narrativeKeyReleased = true;
let map = [];
let queens = [];
let bullets = [];
let particles = [];
let soldiers = [];
let mounds = [];
let powerUps = [];
let roundNum = 0;
let scores = [0, 0];
let roundTimer = 0;
let countdownTimer = 0;
let roundEndTimer = 0;
let roundWinner = -1;
let matchEndTimer = 0;
let pauseSelection = 0; // 0 = RESUME, 1 = EXIT
let moundTimer = 0;
let powerUpTimer = 0;
let waveTimer = 0;
let waveCount = 0;
let worms = [];
let tileSeed = [];
let screenShake = 0;
let dustMotes = [];
let droppings = [];
let floatingTexts = []; // { x, y, text, color, life, maxLife }

// ─── Round Mutators ─────────────────────────────────────────
let activeModifiers = [];       // array of mutator IDs active this round
let caveinTimer = 0;            // countdown to next cave-in shrink
let caveinRing = 0;             // current border depth (tiles converted to rock)
let toxicPools = [];            // { x, y, lifetime, damageTimer }
let toxicTimer = 0;             // countdown to next toxic pool spawn

// ─── Tunnel Regrowth ────────────────────────────────────────
let regrowthTimer = 0;
let lastDugTime = [];           // 2D array tracking when each tile was last dug

// ─── Fog of War ─────────────────────────────────────────────
let fogExplored = [];           // fogExplored[y][x] = true if any player has seen it
let fogVisible = [];            // fogVisible[y][x] = true if currently in vision
let pendingRoundSeed = null;

// Character selection state (up to 4 players)
let charSelect = [
  { charType: 0, colorIdx: 0, ready: false }, // P1
  { charType: 0, colorIdx: 1, ready: false }, // P2
  { charType: 1, colorIdx: 2, ready: false }, // P3
  { charType: 2, colorIdx: 3, ready: false }, // P4
];

// Pre-render vignette overlay
const vignetteCanvas = document.createElement('canvas');
vignetteCanvas.width = W;
vignetteCanvas.height = H;
const vctx = vignetteCanvas.getContext('2d');
const vgrad = vctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
vgrad.addColorStop(0, 'rgba(0,0,0,0)');
vgrad.addColorStop(1, 'rgba(0,0,0,0.45)');
vctx.fillStyle = vgrad;
vctx.fillRect(0, 0, W, H);
