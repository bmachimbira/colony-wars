// ─── Update ──────────────────────────────────────────────────
function update(dt) {
  if (gameState === STATE.NARRATIVE) {
    updateNarrative(dt);
    return;
  }

  if (gameState === STATE.TITLE) {
    if (keys['KeyO']) {
      keys['KeyO'] = false;
      showMultiplayerMenu();
      return;
    }
    if (Object.values(keys).some(v => v)) {
      gameState = STATE.CHAR_SELECT;
      charSelect[0] = { charType: 0, colorIdx: 0, ready: false };
      charSelect[1] = { charType: 0, colorIdx: 1, ready: false };
      for (const k in keys) keys[k] = false;
    }
    return;
  }

  if (gameState === STATE.CHAR_SELECT) {
    updateCharSelect();
    return;
  }

  if (gameState === STATE.GENERATING) {
    startNewRound();
    return;
  }

  if (gameState === STATE.COUNTDOWN) {
    const prevSec = Math.ceil(countdownTimer);
    countdownTimer -= dt;
    const curSec = Math.ceil(countdownTimer);
    if (curSec !== prevSec && curSec > 0) playCountdownTick();
    if (countdownTimer <= 0) {
      gameState = STATE.PLAYING;
      playRoundStart();
    }
    return;
  }

  if (gameState === STATE.ROUND_END) {
    roundEndTimer -= dt;
    if (roundEndTimer <= 0) {
      if (scores[0] >= 3 || scores[1] >= 3) {
        gameState = STATE.MATCH_END;
        stopMusic();
        playMatchWin();
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
      gameState = STATE.CHAR_SELECT;
      charSelect[0].ready = false;
      charSelect[1].ready = false;
      // Clear all keys to prevent immediate restart
      for (const k in keys) keys[k] = false;
    }
    return;
  }

  if (gameState === STATE.PAUSED) {
    if (keys['Escape']) {
      keys['Escape'] = false;
      gameState = STATE.PLAYING;
    }
    return;
  }

  if (gameState === STATE.PLAYING && keys['Escape']) {
    keys['Escape'] = false;
    gameState = STATE.PAUSED;
    return;
  }

  if (gameState !== STATE.PLAYING) return;

  roundTimer += dt;

  // Decay screen shake
  if (screenShake > 0.1) screenShake *= 0.85;
  else screenShake = 0;

  // Update dust motes
  for (const d of dustMotes) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (d.x < 0) d.x = W;
    if (d.x > W) d.x = 0;
    if (d.y < 0) d.y = H;
    if (d.y > H) d.y = 0;
  }

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

  // Update worms
  updateWorms(dt);

  // Update anteater
  updateAnteater(dt);

  // Spawn mound logic
  updateMound(dt);

  // Power-up logic
  updatePowerUp(dt);

  // Update droppings
  updateDroppings(dt);

  // Check win condition
  for (let i = 0; i < queens.length; i++) {
    if (queens[i].hp <= 0) {
      roundWinner = 1 - i;
      scores[roundWinner]++;
      spawnParticles(queens[i].x, queens[i].y, queens[i].color, 30);
      playDeath();
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
  worms = [];
  mounds = [];
  powerUps = [];
  anteater = null;
  anteaterTimer = 45;
  anteaterWarning = 0;
  roundTimer = 0;
  moundTimer = 1;
  powerUpTimer = 1;
  waveTimer = 30;
  waveCount = 0;

  // Generate per-tile random seeds for visual variation
  tileSeed = [];
  for (let y = 0; y < ROWS; y++) {
    tileSeed[y] = [];
    for (let x = 0; x < COLS; x++) tileSeed[y][x] = Math.random();
  }

  // Spawn ambient dust motes
  dustMotes = [];
  for (let i = 0; i < 25; i++) {
    dustMotes.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 4 - 2,
      size: 1 + Math.random() * 2, alpha: 0.05 + Math.random() * 0.1,
    });
  }

  const spawns = generateMap();

  droppings = [];
  queens = [
    createQueen(spawns.p1.x, spawns.p1.y, 'p1', {
      up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'Space', special: 'KeyQ'
    }, CHAR_TYPES[charSelect[0].charType], CHAR_COLORS[charSelect[0].colorIdx]),
    createQueen(spawns.p2.x, spawns.p2.y, 'p2', {
      up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter', special: 'ShiftRight'
    }, CHAR_TYPES[charSelect[1].charType], CHAR_COLORS[charSelect[1].colorIdx]),
  ];

  startMusic();

  // Spawn decorative worms in tunnels
  spawnWorms();

  countdownTimer = 3;
  gameState = STATE.COUNTDOWN;
}

// ─── Narrative ───────────────────────────────────────────────
function updateNarrative(dt) {
  // Start music on first frame of narrative
  if (!musicPlaying) startMusic();

  const page = NARRATIVE_PAGES[narrativePage];
  const fullText = page.lines.join('\n');

  // ESC skips entire intro
  if (keys['Escape']) {
    keys['Escape'] = false;
    gameState = STATE.TITLE;
    for (const k in keys) keys[k] = false;
    return;
  }

  // Typewriter effect
  if (!narrativePageReady) {
    narrativeCharTimer += dt;
    const charsPerSec = 40;
    narrativeCharIndex = Math.min(Math.floor(narrativeCharTimer * charsPerSec), fullText.length);
    if (narrativeCharIndex >= fullText.length) {
      narrativePageReady = true;
    }
  }

  // Wait for key release before accepting next press
  const anyKey = Object.values(keys).some(v => v);
  if (!anyKey) {
    narrativeKeyReleased = true;
  }

  if (anyKey && narrativeKeyReleased) {
    narrativeKeyReleased = false;

    if (!narrativePageReady) {
      // Skip typewriter — show full page immediately
      narrativeCharIndex = fullText.length;
      narrativePageReady = true;
    } else {
      // Next page
      narrativePage++;
      if (narrativePage >= NARRATIVE_PAGES.length) {
        gameState = STATE.TITLE;
        // Clear keys so title doesn't instantly skip
        for (const k in keys) keys[k] = false;
      } else {
        narrativeCharIndex = 0;
        narrativeCharTimer = 0;
        narrativePageReady = false;
      }
    }
  }
}

// ─── Game Loop ───────────────────────────────────────────────
let lastTime = 0;
function gameLoop(time) {
  try {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    pollGamepads();
    mpApplyRemoteInput();
    update(dt);
    mpSendInput(dt);
    draw();
  } catch (e) {
    console.error('Game loop error:', e);
  }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// ─── Character Selection ─────────────────────────────────────
function updateCharSelect() {
  // P1: W/S to change character, A/D to change color, Space to ready
  if (keys['KeyW'] && !charSelect[0].ready) { charSelect[0].charType = (charSelect[0].charType + 2) % 3; keys['KeyW'] = false; }
  if (keys['KeyS'] && !charSelect[0].ready) { charSelect[0].charType = (charSelect[0].charType + 1) % 3; keys['KeyS'] = false; }
  if (keys['KeyA'] && !charSelect[0].ready) { charSelect[0].colorIdx = (charSelect[0].colorIdx + CHAR_COLORS.length - 1) % CHAR_COLORS.length; keys['KeyA'] = false; }
  if (keys['KeyD'] && !charSelect[0].ready) { charSelect[0].colorIdx = (charSelect[0].colorIdx + 1) % CHAR_COLORS.length; keys['KeyD'] = false; }
  if (keys['Space']) { charSelect[0].ready = !charSelect[0].ready; keys['Space'] = false; }

  // P2: Arrows to change character/color, Enter to ready
  if (keys['ArrowUp'] && !charSelect[1].ready) { charSelect[1].charType = (charSelect[1].charType + 2) % 3; keys['ArrowUp'] = false; }
  if (keys['ArrowDown'] && !charSelect[1].ready) { charSelect[1].charType = (charSelect[1].charType + 1) % 3; keys['ArrowDown'] = false; }
  if (keys['ArrowLeft'] && !charSelect[1].ready) { charSelect[1].colorIdx = (charSelect[1].colorIdx + CHAR_COLORS.length - 1) % CHAR_COLORS.length; keys['ArrowLeft'] = false; }
  if (keys['ArrowRight'] && !charSelect[1].ready) { charSelect[1].colorIdx = (charSelect[1].colorIdx + 1) % CHAR_COLORS.length; keys['ArrowRight'] = false; }
  if (keys['Enter']) { charSelect[1].ready = !charSelect[1].ready; keys['Enter'] = false; }

  // Both ready — start game
  if (charSelect[0].ready && charSelect[1].ready) {
    gameState = STATE.GENERATING;
  }
}

// ─── Droppings (Ant special ability) ─────────────────────────
function updateDroppings(dt) {
  for (let i = droppings.length - 1; i >= 0; i--) {
    const d = droppings[i];
    d.lifetime -= dt;
    if (d.lifetime <= 0) { droppings.splice(i, 1); continue; }

    // Check if enemy queen steps on it
    for (const q of queens) {
      if (q.colony !== d.owner && q.invTimer <= 0) {
        if (Math.round(q.x) === d.x && Math.round(q.y) === d.y) {
          q.hp--;
          q.invTimer = 0.5;
          spawnParticles(d.x, d.y, '#5A3A20', 10);
          playHit();
          droppings.splice(i, 1);
          break;
        }
      }
    }
  }
}
