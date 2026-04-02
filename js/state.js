// ─── Canvas ──────────────────────────────────────────────────
const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

// ─── Input ───────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  // Don't intercept keys when typing in an input/textarea (multiplayer UI)
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  keys[e.code] = true;
  e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── Game State ──────────────────────────────────────────────
let gameState = STATE.NARRATIVE;

// ─── Narrative ───────────────────────────────────────────────
const NARRATIVE_PAGES = [
  {
    title: 'DEEP BENEATH THE EARTH...',
    lines: [
      'Two rival ant colonies have tunneled',
      'into the same underground cavern.',
      '',
      'Resources are scarce. Territory is everything.',
      'There is no room for two queens.',
    ],
    color: '#C8A050',
  },
  {
    title: 'CHOOSE YOUR CHAMPION',
    lines: [
      'Three warriors answer the call to battle:',
      '',
      'The Ant — drops lethal acid traps',
      'The Beetle — takes flight to escape danger',
      'The Cockroach — deflects enemy bullets',
      '',
      'Each has a unique ability. Choose wisely.',
      'If your champion falls, your colony falls.',
      'No second chances. No respawns.',
    ],
    color: '#E8C840',
  },
  {
    title: 'DIG. FIGHT. CONQUER.',
    lines: [
      'Shoot acid to carve tunnels through the dirt.',
      'Navigate the underground maze to find your enemy.',
      '',
      'Claim golden spawn mounds to summon soldier ants',
      'that will hunt the rival queen.',
      '',
      'But beware — you must go there yourself.',
      'Risk the crown to build the swarm.',
    ],
    color: '#88FF44',
  },
  {
    title: 'THE UNDERGROUND TEEMS WITH LIFE',
    lines: [
      'You are not alone down here...',
      '',
      'Worms burrow through the dirt. Dig them up',
      'and devour them to restore your health.',
      '',
      'Soldier ants from spawn mounds fight fiercely,',
      'but their loyalty only lasts so long.',
      '',
      'And beware the tremors...',
    ],
    color: '#D4856A',
  },
  {
    title: 'THE ANTEATER',
    lines: [
      'A colossal predator lurks above.',
      '',
      'The Anteater will breach the tunnels',
      'and hunt the nearest queen with its',
      'devastating tongue attack.',
      '',
      'It devours soldiers whole. It digs through walls.',
      'It fears nothing — except enough acid.',
      '',
      'When the ground shakes, set aside your rivalry.',
      'Or use the chaos to your advantage.',
    ],
    color: '#C83030',
  },
  {
    title: 'POWER OF THE COLONY',
    lines: [
      'Collect power-ups scattered through the tunnels:',
      '',
      '  [S] Sugar Rush  — blazing speed',
      '  [R] Rapid Bite  — triple shot',
      '  [A] Chitin Shield — absorb a hit',
      '  [M] Mega Acid   — massive destruction',
      '',
      'Use them wisely. The underground favors the bold.',
    ],
    color: '#E8C840',
  },
  {
    title: 'HOW TO PLAY',
    lines: [
      '         PLAYER 1          PLAYER 2',
      '        ─────────          ─────────',
      '  Move:  W A S D      Move:  Arrow Keys',
      '  Shoot: SPACE        Shoot: ENTER',
      '',
      '  Gamepads: D-pad/Stick + A/RB/RT',
      '',
      'First to win 3 rounds claims the cavern.',
      '',
      'Destroy the rival queen. Long live the colony.',
    ],
    color: '#FFFFFF',
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
