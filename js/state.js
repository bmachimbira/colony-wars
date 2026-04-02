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
let gameState = STATE.TITLE;
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
