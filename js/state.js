// ─── Canvas ──────────────────────────────────────────────────
const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

// ─── Input ───────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
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
    title: 'YOU ARE THE QUEEN',
    lines: [
      'You are no ordinary ant. You are the queen —',
      'the heart and soul of your colony.',
      '',
      'If you fall, your colony falls with you.',
      'There are no second chances. No respawns.',
      'One queen. One life. Every move matters.',
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
let moundTimer = 0;
let powerUpTimer = 0;
let waveTimer = 0;
let waveCount = 0;
let worms = [];
