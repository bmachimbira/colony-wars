// ─── Update ──────────────────────────────────────────────────
function update(dt) {
  if (gameState === STATE.TITLE) {
    if (Object.values(keys).some(v => v)) {
      gameState = STATE.GENERATING;
    }
    return;
  }

  if (gameState === STATE.GENERATING) {
    startNewRound();
    return;
  }

  if (gameState === STATE.COUNTDOWN) {
    countdownTimer -= dt;
    if (countdownTimer <= 0) gameState = STATE.PLAYING;
    return;
  }

  if (gameState === STATE.ROUND_END) {
    roundEndTimer -= dt;
    if (roundEndTimer <= 0) {
      if (scores[0] >= 3 || scores[1] >= 3) {
        gameState = STATE.MATCH_END;
      } else {
        gameState = STATE.GENERATING;
      }
    }
    return;
  }

  if (gameState === STATE.MATCH_END) {
    if (Object.values(keys).some(v => v)) {
      scores = [0, 0];
      roundNum = 0;
      gameState = STATE.TITLE;
      // Clear all keys to prevent immediate restart
      for (const k in keys) keys[k] = false;
    }
    return;
  }

  if (gameState !== STATE.PLAYING) return;

  roundTimer += dt;

  // Update queens
  for (const q of queens) {
    updateQueen(q, dt);
  }

  // Update bullets
  updateBullets(dt);

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Update soldiers
  updateSoldiers(dt);

  // Spawn mound logic
  updateMound(dt);

  // Power-up logic
  updatePowerUp(dt);

  // Check win condition
  for (let i = 0; i < queens.length; i++) {
    if (queens[i].hp <= 0) {
      roundWinner = 1 - i;
      scores[roundWinner]++;
      spawnParticles(queens[i].x, queens[i].y, queens[i].colony === 'blue' ? COLORS.p1 : COLORS.p2, 30);
      gameState = STATE.ROUND_END;
      roundEndTimer = 3;
      return;
    }
  }
}

// ─── Start Round ─────────────────────────────────────────────
function startNewRound() {
  roundNum++;
  bullets = [];
  particles = [];
  soldiers = [];
  mounds = [];
  powerUps = [];
  roundTimer = 0;
  moundTimer = 1;
  powerUpTimer = 1;
  waveTimer = 30;
  waveCount = 0;

  const spawns = generateMap();

  queens = [
    createQueen(spawns.p1.x, spawns.p1.y, 'blue', {
      up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space'
    }),
    createQueen(spawns.p2.x, spawns.p2.y, 'red', {
      up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter'
    }),
  ];

  countdownTimer = 3;
  gameState = STATE.COUNTDOWN;
}

// ─── Game Loop ───────────────────────────────────────────────
let lastTime = 0;
function gameLoop(time) {
  try {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    update(dt);
    draw();
  } catch (e) {
    console.error('Game loop error:', e);
  }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
