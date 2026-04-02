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
    if (keys['Digit1']) {
      // Single player vs AI
      singlePlayer = true;
      playerCount = 2;
      gameState = STATE.CHAR_SELECT;
      charSelect[0] = { charType: 0, colorIdx: 0, ready: false };
      charSelect[1] = { charType: Math.floor(Math.random() * 3), colorIdx: 1 + Math.floor(Math.random() * 7), ready: true };
      for (const k in keys) keys[k] = false;
      startCharSelectMusic();
      return;
    }
    if (keys['Digit2'] || Object.values(keys).some(v => v)) {
      singlePlayer = false;
      playerCount = 2;
      gameState = STATE.CHAR_SELECT;
      charSelect[0] = { charType: 0, colorIdx: 0, ready: false };
      charSelect[1] = { charType: 0, colorIdx: 1, ready: false };
      for (const k in keys) keys[k] = false;
      startCharSelectMusic();
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
      startCharSelectMusic();
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
    startCharSelectMusic();
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

  // Update AI
  updateAI(dt);

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

  // Update floating texts
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].y -= 30 * dt;
    floatingTexts[i].life -= dt;
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
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

  // Tunnel regrowth
  updateRegrowth(dt);

  // Mutator effects
  updateMutators(dt);

  // Update fog of war visibility
  updateFog();

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
  floatingTexts = [];

  // Initialize lastDugTime array
  lastDugTime = [];
  for (let y = 0; y < ROWS; y++) {
    lastDugTime[y] = [];
    for (let x = 0; x < COLS; x++) lastDugTime[y][x] = 0;
  }
  regrowthTimer = REGROWTH_INTERVAL;

  // Initialize fog arrays
  fogExplored = [];
  fogVisible = [];
  for (let y = 0; y < ROWS; y++) {
    fogExplored[y] = [];
    fogVisible[y] = [];
    for (let x = 0; x < COLS; x++) {
      fogExplored[y][x] = false;
      fogVisible[y][x] = false;
    }
  }

  // Pick round mutators
  activeModifiers = [];
  caveinTimer = CAVEIN_INTERVAL;
  caveinRing = 0;
  toxicPools = [];
  toxicTimer = 10;
  if (roundNum >= 2) {
    const pool = MUTATORS.map(m => m.id);
    // Shuffle with seeded PRNG
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(gameRandom() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const count = roundNum >= 3 ? 2 : 1;
    activeModifiers = pool.slice(0, count);
  }

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

  // Announce mutators
  if (activeModifiers.length > 0) {
    for (const modId of activeModifiers) {
      const mod = MUTATORS.find(m => m.id === modId);
      if (mod) announce(mod.name + ' active!');
    }
  }
}

// ─── Tunnel Regrowth ────────────────────────────────────────
function updateRegrowth(dt) {
  regrowthTimer -= dt;
  if (regrowthTimer > 0) return;
  regrowthTimer = REGROWTH_INTERVAL;

  const tilesPerCycle = Math.min(roundNum, 5); // 1 in round 1, up to 5
  let regrown = 0;
  let attempts = 0;

  while (regrown < tilesPerCycle && attempts < 200) {
    attempts++;
    const rx = Math.floor(gameRandom() * COLS);
    const ry = Math.floor(gameRandom() * ROWS);
    if (map[ry][rx] !== T.DUG) continue;
    // Don't regrow recently dug tiles
    if (roundTimer - lastDugTime[ry][rx] < REGROWTH_IMMUNITY) continue;
    // Don't regrow near entities
    let blocked = false;
    for (const q of queens) {
      if (Math.abs(Math.round(q.x) - rx) <= 2 && Math.abs(Math.round(q.y) - ry) <= 2) { blocked = true; break; }
    }
    if (blocked) continue;
    for (const s of soldiers) {
      if (Math.abs(Math.round(s.x) - rx) <= 1 && Math.abs(Math.round(s.y) - ry) <= 1) { blocked = true; break; }
    }
    if (blocked) continue;
    for (const m of mounds) {
      if (Math.abs(m.x - rx) <= 1 && Math.abs(m.y - ry) <= 1) { blocked = true; break; }
    }
    if (blocked) continue;

    map[ry][rx] = T.DIRT;
    spawnParticles(rx, ry, COLORS.dirt, 3);
    regrown++;
  }
}

// ─── Mutator Effects ────────────────────────────────────────
function updateMutators(dt) {
  // Cave-In: shrink map border
  if (activeModifiers.includes('CAVEIN')) {
    caveinTimer -= dt;
    if (caveinTimer <= 0) {
      caveinTimer = CAVEIN_INTERVAL;
      caveinRing++;
      screenShake = 4;
      playDirtBreak();
      // Convert border ring to rock
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (x < caveinRing || x >= COLS - caveinRing || y < caveinRing || y >= ROWS - caveinRing) {
            if (map[y][x] !== T.ROCK) {
              map[y][x] = T.ROCK;
            }
          }
        }
      }
      if (caveinRing <= 3) {
        spawnFloatingText(Math.floor(COLS / 2), Math.floor(ROWS / 2), 'CAVE-IN!', '#8A6A4A');
        announce('Cave in!');
      }
    }
  }

  // Toxic: spawn acid pools
  if (activeModifiers.includes('TOXIC')) {
    toxicTimer -= dt;
    if (toxicTimer <= 0) {
      toxicTimer = 10;
      let tx, ty, att = 0;
      do {
        tx = Math.floor(gameRandom() * COLS);
        ty = Math.floor(gameRandom() * ROWS);
        att++;
      } while (att < 100 && map[ty][tx] !== T.DUG);
      if (att < 100) {
        toxicPools.push({ x: tx, y: ty, lifetime: 12, damageTimer: 0 });
        spawnParticles(tx, ty, '#44CC44', 6);
      }
    }

    // Update toxic pools
    for (let i = toxicPools.length - 1; i >= 0; i--) {
      const tp = toxicPools[i];
      tp.lifetime -= dt;
      if (tp.lifetime <= 0) { toxicPools.splice(i, 1); continue; }
      tp.damageTimer -= dt;
      // Damage queens standing on toxic
      for (const q of queens) {
        if (q.invTimer <= 0 && Math.round(q.x) === tp.x && Math.round(q.y) === tp.y) {
          if (tp.damageTimer <= 0) {
            q.hp--;
            q.invTimer = 0.5;
            screenShake = 3;
            spawnParticles(tp.x, tp.y, '#44CC44', 8);
            spawnFloatingText(q.x, q.y, 'TOXIC!', '#44CC44');
            playHit();
            tp.damageTimer = 2; // don't damage again for 2s
          }
        }
      }
    }
  }
}

// ─── Fog of War ─────────────────────────────────────────────
function updateFog() {
  const visionRadius = activeModifiers.includes('DARKNESS') ? FOG_DARKNESS_RADIUS : FOG_VISION_RADIUS;

  // Reset visibility
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      fogVisible[y][x] = false;
    }
  }

  // Mark visible tiles from all local queens + their soldiers
  for (const q of queens) {
    if (q.dead) continue;
    const qx = Math.round(q.x), qy = Math.round(q.y);
    markVisible(qx, qy, visionRadius);
  }

  // Soldiers extend vision
  for (const s of soldiers) {
    markVisible(Math.round(s.x), Math.round(s.y), FOG_SOLDIER_RADIUS);
  }

  // Update explored map
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (fogVisible[y][x]) fogExplored[y][x] = true;
    }
  }
}

function markVisible(cx, cy, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > radius) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
        fogVisible[ny][nx] = true;
      }
    }
  }
}

// ─── Speed Multiplier (used by entities) ────────────────────
function getSpeedMultiplier() {
  let mult = 1;
  if (activeModifiers.includes('FLOODED')) mult *= 0.7;
  if (activeModifiers.includes('FRENZY')) mult *= 1.5;
  return mult;
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
    localStorage.setItem('colonyClash_introSeen', '1');
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
        localStorage.setItem('colonyClash_introSeen', '1');
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

  // In single player, P2 is always ready (AI)
  if (singlePlayer) charSelect[1].ready = true;

  // Both ready — start game
  if (charSelect[0].ready && charSelect[1].ready) {
    stopCharSelectMusic();
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
