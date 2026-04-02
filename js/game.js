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

  // Escape exits to character select from any gameplay state
  if (keys['Escape'] && (gameState === STATE.PLAYING || gameState === STATE.PAUSED || gameState === STATE.COUNTDOWN || gameState === STATE.ROUND_END)) {
    keys['Escape'] = false;
    scores = [0, 0];
    roundNum = 0;
    gameState = STATE.CHAR_SELECT;
    charSelect[0].ready = false;
    charSelect[1].ready = false;
    stopMusic();
    for (const k in keys) keys[k] = false;
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

  // Check win condition — eliminate dead queens, last one standing wins
  for (let i = 0; i < queens.length; i++) {
    if (queens[i].hp <= 0 && !queens[i].dead) {
      queens[i].dead = true;
      spawnParticles(queens[i].x, queens[i].y, queens[i].color, 30);
      playDeath();
    }
  }
  const alive = queens.filter(q => !q.dead);
  if (alive.length <= 1 && queens.length > 1) {
    if (alive.length === 1) {
      roundWinner = queens.indexOf(alive[0]);
      scores[roundWinner]++;
    } else {
      roundWinner = -1; // draw
    }
    gameState = STATE.ROUND_END;
    roundEndTimer = 3;
    return;
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

  // Seed the PRNG — host picks seed, guests use the same one
  if (!isOnline || isHost) {
    const seed = Date.now() ^ (Math.random() * 0xFFFFFFFF);
    seedRandom(seed);
    // Broadcast seed to all guests
    if (isOnline && isHost) {
      for (const pc of peerConns) {
        try { pc.conn.send({ type: 'seed', seed }); } catch (e) {}
      }
    }
  }
  // If guest, seed was already set via 'seed' message before GENERATING

  // Generate per-tile random seeds for visual variation
  tileSeed = [];
  for (let y = 0; y < ROWS; y++) {
    tileSeed[y] = [];
    for (let x = 0; x < COLS; x++) tileSeed[y][x] = gameRandom();
  }

  // Spawn ambient dust motes
  dustMotes = [];
  for (let i = 0; i < 25; i++) {
    dustMotes.push({
      x: gameRandom() * W, y: gameRandom() * H,
      vx: (gameRandom() - 0.5) * 8, vy: (gameRandom() - 0.5) * 4 - 2,
      size: 1 + gameRandom() * 2, alpha: 0.05 + gameRandom() * 0.1,
    });
  }

  const spawns = generateMap();

  droppings = [];
  const defaultColors = ['#3066C8', '#C83030', '#30A830', '#C8A030'];
  queens = [];
  for (let i = 0; i < playerCount; i++) {
    const pKey = 'p' + (i + 1);
    const spawn = spawns[pKey];
    const controls = PLAYER_CONTROLS[i];
    const cs = charSelect[i] || { charType: 0, colorIdx: i };
    queens.push(createQueen(
      spawn.x, spawn.y, pKey, controls,
      CHAR_TYPES[cs.charType] || 'ANT',
      CHAR_COLORS[cs.colorIdx] || defaultColors[i]
    ));
  }

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

    // Left arrow goes back a page
    if (keys['ArrowLeft'] && narrativePage > 0) {
      keys['ArrowLeft'] = false;
      narrativePage--;
      narrativeCharIndex = 0;
      narrativeCharTimer = 0;
      narrativePageReady = false;
    } else if (!narrativePageReady) {
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
  // Support both keyboard (clear key) and gamepad (edge-detected _gp0 keys)
  if ((keys['KeyW'] || keys['_gp0Up']) && !charSelect[0].ready) { charSelect[0].charType = (charSelect[0].charType + 2) % 3; keys['KeyW'] = false; keys['_gp0Up'] = false; }
  if ((keys['KeyS'] || keys['_gp0Down']) && !charSelect[0].ready) { charSelect[0].charType = (charSelect[0].charType + 1) % 3; keys['KeyS'] = false; keys['_gp0Down'] = false; }
  if ((keys['KeyA'] || keys['_gp0Left']) && !charSelect[0].ready) { charSelect[0].colorIdx = (charSelect[0].colorIdx + CHAR_COLORS.length - 1) % CHAR_COLORS.length; keys['KeyA'] = false; keys['_gp0Left'] = false; }
  if ((keys['KeyD'] || keys['_gp0Right']) && !charSelect[0].ready) { charSelect[0].colorIdx = (charSelect[0].colorIdx + 1) % CHAR_COLORS.length; keys['KeyD'] = false; keys['_gp0Right'] = false; }
  if (keys['Space']) { charSelect[0].ready = !charSelect[0].ready; keys['Space'] = false; }

  // P2: Arrows to change character/color, Enter to ready
  if ((keys['ArrowUp'] || keys['_gp1Up']) && !charSelect[1].ready) { charSelect[1].charType = (charSelect[1].charType + 2) % 3; keys['ArrowUp'] = false; keys['_gp1Up'] = false; }
  if ((keys['ArrowDown'] || keys['_gp1Down']) && !charSelect[1].ready) { charSelect[1].charType = (charSelect[1].charType + 1) % 3; keys['ArrowDown'] = false; keys['_gp1Down'] = false; }
  if ((keys['ArrowLeft'] || keys['_gp1Left']) && !charSelect[1].ready) { charSelect[1].colorIdx = (charSelect[1].colorIdx + CHAR_COLORS.length - 1) % CHAR_COLORS.length; keys['ArrowLeft'] = false; keys['_gp1Left'] = false; }
  if ((keys['ArrowRight'] || keys['_gp1Right']) && !charSelect[1].ready) { charSelect[1].colorIdx = (charSelect[1].colorIdx + 1) % CHAR_COLORS.length; keys['ArrowRight'] = false; keys['_gp1Right'] = false; }
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
