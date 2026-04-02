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
let tileSeed = [];
let screenShake = 0;
let dustMotes = [];

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
