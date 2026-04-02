// ─── Queen Creation ──────────────────────────────────────────
function createQueen(x, y, colony, controls, charType, color) {
  return {
    x, y, dir: 'right', hp: 3, speed: 3, colony,
    controls, canShoot: true, shootCooldown: 0,
    bobPhase: 0, moving: false, invTimer: 0, walkSoundTimer: 0,
    activePowerUp: null, powerUpTimer: 0, megaShots: 0,
    charType: charType || 'ANT',
    color: color || COLORS.p1,
    specialUses: 3, // max 3 special uses per round
    specialCooldown: 0,
    defendTimer: 0, // cockroach belly-up timer
    flyTimer: 0, // beetle fly timer
    flyTargetX: 0, flyTargetY: 0,
  };
}

// ─── Bullet Creation ─────────────────────────────────────────
function fireBullet(q) {
  // Limit projectiles per player
  const playerBullets = bullets.filter(b => b.owner === q.colony).length;
  if (playerBullets >= MAX_BULLETS_PER_PLAYER) return;

  const dx = { left: -1, right: 1, up: 0, down: 0 }[q.dir];
  const dy = { left: 0, right: 0, up: -1, down: 1 }[q.dir];
  const qx = Math.round(q.x), qy = Math.round(q.y);
  const bx = qx + dx, by = qy + dy;
  if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) return;
  const t = map[by][bx];
  if (t === T.ROCK || t === T.PUDDLE) return;

  playShoot();
  const speed = 5;
  const blast = q.activePowerUp === 'MEGA' ? 3 : 1;

  if (q.activePowerUp === 'RAPID') {
    // 3 projectiles in a spread
    const spreads = [
      { dx, dy },
      { dx: dx === 0 ? -1 : dx, dy: dy === 0 ? -1 : dy },
      { dx: dx === 0 ? 1 : dx, dy: dy === 0 ? 1 : dy },
    ];
    for (const s of spreads) {
      bullets.push({ x: q.x + 0.5, y: q.y + 0.5, dx: s.dx, dy: s.dy, speed, owner: q.colony, blast });
    }
  } else {
    bullets.push({ x: q.x + 0.5, y: q.y + 0.5, dx, dy, speed, owner: q.colony, blast });
  }

  if (q.activePowerUp === 'MEGA') {
    q.megaShots--;
    if (q.megaShots <= 0) { q.activePowerUp = null; q.powerUpTimer = 0; }
  }
}

// ─── Floating Text ───────────────────────────────────────────
function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({
    x: x * TILE + TILE / 2,
    y: y * TILE,
    text, color,
    life: 1.5,
    maxLife: 1.5,
  });
}

// ─── Particles ───────────────────────────────────────────────
function spawnParticles(x, y, color, count, type) {
  if (particles.length >= PARTICLE_CAP) return;
  for (let i = 0; i < count && particles.length < PARTICLE_CAP; i++) {
    const angle = gameRandom() * Math.PI * 2;
    const spd = 30 + gameRandom() * 60;
    particles.push({
      x: x * TILE + TILE / 2, y: y * TILE + TILE / 2,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      life: 0.3 + gameRandom() * 0.4, color, size: 2 + gameRandom() * 3,
      type: type || 'default',
    });
  }
}

function spawnTrailParticle(px, py, color) {
  if (particles.length >= PARTICLE_CAP) return;
  particles.push({
    x: px, y: py,
    vx: (gameRandom() - 0.5) * 10, vy: (gameRandom() - 0.5) * 10,
    life: 0.15 + gameRandom() * 0.1, color, size: 1.5 + gameRandom(),
    type: 'trail',
  });
}

// ─── Queen Update ────────────────────────────────────────────
function updateQueen(q, dt) {
  const c = q.controls;
  let mx = 0, my = 0;
  if (keys[c.up]) { my = -1; q.dir = 'up'; }
  if (keys[c.down]) { my = 1; q.dir = 'down'; }
  if (keys[c.left]) { mx = -1; q.dir = 'left'; }
  if (keys[c.right]) { mx = 1; q.dir = 'right'; }

  q.moving = mx !== 0 || my !== 0;
  if (q.moving) {
    q.bobPhase += dt * 10;
    q.walkSoundTimer -= dt;
    if (q.walkSoundTimer <= 0) {
      playWalk();
      q.walkSoundTimer = 0.15;
    }
  } else {
    q.walkSoundTimer = 0;
  }

  const speedMult = typeof getSpeedMultiplier === 'function' ? getSpeedMultiplier() : 1;
  const speed = (q.activePowerUp === 'SUGAR' ? q.speed * 2 : q.speed) * speedMult;

  if (mx !== 0) {
    const nx = q.x + mx * speed * dt;
    const tileX = Math.round(nx);
    if (tileX >= 0 && tileX < COLS && canWalk(tileX, Math.round(q.y))) {
      q.x = nx;
    }
  }
  if (my !== 0) {
    const ny = q.y + my * speed * dt;
    const tileY = Math.round(ny);
    if (tileY >= 0 && tileY < ROWS && canWalk(Math.round(q.x), tileY)) {
      q.y = ny;
    }
  }

  // Clamp
  q.x = Math.max(0, Math.min(COLS - 1, q.x));
  q.y = Math.max(0, Math.min(ROWS - 1, q.y));

  // Shoot cooldown
  q.shootCooldown -= dt;
  if (keys[c.shoot] && q.shootCooldown <= 0) {
    fireBullet(q);
    q.shootCooldown = 0.3;
  }

  // Invincibility timer
  if (q.invTimer > 0) q.invTimer -= dt;

  // Power-up timer
  if (q.activePowerUp && q.activePowerUp !== 'MEGA' && q.activePowerUp !== 'SHIELD') {
    q.powerUpTimer -= dt;
    if (q.powerUpTimer <= 0) { q.activePowerUp = null; }
  }

  // Special ability cooldown
  if (q.specialCooldown > 0) q.specialCooldown -= dt;
  if (q.defendTimer > 0) q.defendTimer -= dt;

  // Beetle fly animation
  if (q.flyTimer > 0) {
    q.flyTimer -= dt;
    const progress = 1 - (q.flyTimer / 0.3);
    q.x += (q.flyTargetX - q.x) * progress * dt * 10;
    q.y += (q.flyTargetY - q.y) * progress * dt * 10;
    if (q.flyTimer <= 0) {
      q.x = q.flyTargetX;
      q.y = q.flyTargetY;
    }
  }

  // Special ability activation
  if (keys[q.controls.special] && q.specialUses > 0 && q.specialCooldown <= 0) {
    keys[q.controls.special] = false;
    if (q.charType === 'COCKROACH') {
      // Belly-up deflect mode for 1 second
      q.defendTimer = 1.0;
      q.specialUses--;
      q.specialCooldown = 2;
    } else if (q.charType === 'BEETLE') {
      // Fly to a nearby tunnel tile
      const candidates = [];
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = Math.round(q.x) + dx, ny = Math.round(q.y) + dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && canWalk(nx, ny)) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist >= 3) candidates.push({ x: nx, y: ny });
          }
        }
      }
      if (candidates.length > 0) {
        const target = candidates[Math.floor(gameRandom() * candidates.length)];
        q.flyTargetX = target.x;
        q.flyTargetY = target.y;
        q.flyTimer = 0.3;
        q.invTimer = 0.4;
        q.specialUses--;
        q.specialCooldown = 2;
        spawnParticles(Math.round(q.x), Math.round(q.y), q.color, 6);
      }
    } else if (q.charType === 'ANT') {
      // Drop a lethal dropping at current position
      const dx = Math.round(q.x), dy = Math.round(q.y);
      droppings.push({ x: dx, y: dy, owner: q.colony, lifetime: 15 });
      q.specialUses--;
      q.specialCooldown = 1;
      spawnParticles(dx, dy, '#5A3A20', 4);
    }
  }

  // Check spawn mound claim
  for (const m of mounds) {
    if (m.state === 'ACTIVE' && Math.round(q.x) === m.x && Math.round(q.y) === m.y) {
      m.state = 'CLAIMED';
      m.claimedBy = q.colony;
      m.soldiersRemaining = 3;
      m.spawnTimer = 0.5;
      playMoundClaim();
      spawnFloatingText(q.x, q.y, 'MOUND CLAIMED!', '#E8C840');
      announce('Mound claimed!');
    }
  }

  // Check power-up collection
  for (let pi = powerUps.length - 1; pi >= 0; pi--) {
    if (Math.round(q.x) === powerUps[pi].x && Math.round(q.y) === powerUps[pi].y) {
      const puType = powerUps[pi].type;
      applyPowerUp(q, powerUps[pi]);
      playPowerUp();
      const puName = POWER_UP_NAMES[puType] || puType;
      const puColor = (typeof POWER_COLORS !== 'undefined' && POWER_COLORS[puType]) || '#E8C840';
      spawnFloatingText(q.x, q.y, puName, puColor);
      announce(puName);
      powerUps.splice(pi, 1);
    }
  }
}

// ─── Bullet Update ───────────────────────────────────────────
function updateBullets(dt) {
  const bulletSpeedMult = typeof getSpeedMultiplier === 'function' ? getSpeedMultiplier() : 1;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx * b.speed * bulletSpeedMult * dt;
    b.y += b.dy * b.speed * bulletSpeedMult * dt;

    // Spawn trail particle
    if (gameRandom() < 0.4) {
      spawnTrailParticle(b.x * TILE, b.y * TILE, b.blast >= 3 ? '#FFAA44' : '#88FF44');
    }

    const tx = Math.floor(b.x), ty = Math.floor(b.y);

    // Out of bounds
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) {
      bullets.splice(i, 1);
      continue;
    }

    // Hit terrain
    const tile = map[ty][tx];
    if (tile === T.ROCK || tile === T.PUDDLE) {
      bullets.splice(i, 1);
      continue;
    }
    if (tile === T.DIRT) {
      // Destroy dirt
      if (b.blast >= 3) {
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = tx + dx, ny = ty + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && map[ny][nx] === T.DIRT) {
              map[ny][nx] = T.DUG;
              if (lastDugTime[ny]) lastDugTime[ny][nx] = roundTimer;
              spawnParticles(nx, ny, COLORS.dirtBord, 3);
            }
          }
      } else {
        map[ty][tx] = T.DUG;
        if (lastDugTime[ty]) lastDugTime[ty][tx] = roundTimer;
        spawnParticles(tx, ty, COLORS.dirtBord, 5);
      }
      playDirtBreak();
      bullets.splice(i, 1);
      continue;
    }

    // Hit queens
    for (const q of queens) {
      if (q.colony !== b.owner && q.invTimer <= 0) {
        if (Math.abs(q.x - b.x + 0.5) < 0.6 && Math.abs(q.y - b.y + 0.5) < 0.6) {
          // Cockroach belly-up deflects bullets
          if (q.charType === 'COCKROACH' && q.defendTimer > 0) {
            b.dx = -b.dx;
            b.dy = -b.dy;
            b.owner = q.colony; // bounced bullet now belongs to cockroach
            spawnParticles(Math.round(q.x), Math.round(q.y), q.color, 6);
            break;
          }
          if (q.activePowerUp === 'SHIELD') {
            q.activePowerUp = null;
            spawnFloatingText(q.x, q.y, 'BLOCKED!', '#44DDFF');
          } else {
            q.hp--;
            q.invTimer = 0.5;
            screenShake = q.hp <= 0 ? 12 : 6;
            spawnFloatingText(q.x, q.y, '-1 HP', '#FF4444');
            if (q.hp <= 1 && q.hp > 0) announce('Critical health!');
          }
          playHit();
          spawnParticles(Math.round(q.x), Math.round(q.y), q.color, 8);
          bullets.splice(i, 1);
          break;
        }
      }
    }

    // Hit soldiers
    for (let s = soldiers.length - 1; s >= 0; s--) {
      const sol = soldiers[s];
      if (sol.colony !== b.owner) {
        if (Math.abs(sol.x - b.x + 0.5) < 0.6 && Math.abs(sol.y - b.y + 0.5) < 0.6) {
          const solOwner = queens.find(q => q.colony === sol.colony);
          spawnParticles(Math.round(sol.x), Math.round(sol.y), solOwner ? solOwner.color : '#888', 5);
          soldiers.splice(s, 1);
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  // Bullet-bullet collision (destroy each other)
  const toRemove = new Set();
  for (let i = 0; i < bullets.length; i++) {
    for (let j = i + 1; j < bullets.length; j++) {
      if (bullets[i].owner !== bullets[j].owner) {
        if (Math.abs(bullets[i].x - bullets[j].x) < 0.5 && Math.abs(bullets[i].y - bullets[j].y) < 0.5) {
          spawnParticles(Math.floor(bullets[i].x), Math.floor(bullets[i].y), '#88FF44', 4);
          toRemove.add(i);
          toRemove.add(j);
        }
      }
    }
  }
  if (toRemove.size > 0) {
    const indices = [...toRemove].sort((a, b) => b - a);
    for (const idx of indices) bullets.splice(idx, 1);
  }
}

// ─── Soldiers ────────────────────────────────────────────────
function updateSoldiers(dt) {
  for (let i = soldiers.length - 1; i >= 0; i--) {
    const s = soldiers[i];
    s.lifetime -= dt;
    if (s.lifetime <= 0) {
      soldiers.splice(i, 1);
      continue;
    }

    // Find enemy queen and own queen
    const enemy = queens.find(q => q.colony !== s.colony && !q.dead);
    const ownQueen = queens.find(q => q.colony === s.colony);
    if (!enemy) continue;

    // ── Role transitions ──
    if (s.lifetime < 5) {
      if (s.role !== 'kamikaze') {
        s.role = 'kamikaze';
        s.pathTimer = 0;
      }
    } else if (ownQueen && ownQueen.hp <= 1 && !ownQueen.dead) {
      const distToQueen = Math.abs(Math.round(s.x) - Math.round(ownQueen.x)) + Math.abs(Math.round(s.y) - Math.round(ownQueen.y));
      if (distToQueen <= 6) {
        if (s.role !== 'defend') { s.role = 'defend'; s.pathTimer = 0; }
      } else {
        s.role = 'attack';
      }
    } else {
      s.role = 'attack';
    }

    // ── Determine target based on role ──
    let targetX, targetY;
    const sMult = typeof getSpeedMultiplier === 'function' ? getSpeedMultiplier() : 1;
    const moveSpeed = (s.role === 'kamikaze' ? s.speed * 2 : s.speed) * sMult;
    const pathInterval = s.role === 'kamikaze' ? 1 : 2;

    if (s.role === 'defend' && ownQueen) {
      // Target nearest enemy entity to own queen
      let nearestDist = Infinity;
      targetX = Math.round(enemy.x);
      targetY = Math.round(enemy.y);
      for (const es of soldiers) {
        if (es.colony === s.colony) continue;
        const d = Math.abs(Math.round(es.x) - Math.round(ownQueen.x)) + Math.abs(Math.round(es.y) - Math.round(ownQueen.y));
        if (d < nearestDist) { nearestDist = d; targetX = Math.round(es.x); targetY = Math.round(es.y); }
      }
      const queenDist = Math.abs(Math.round(enemy.x) - Math.round(ownQueen.x)) + Math.abs(Math.round(enemy.y) - Math.round(ownQueen.y));
      if (queenDist < nearestDist) { targetX = Math.round(enemy.x); targetY = Math.round(enemy.y); }
    } else if (s.role === 'kamikaze') {
      targetX = Math.round(enemy.x);
      targetY = Math.round(enemy.y);
    } else {
      // Attack with flank offset
      targetX = Math.max(0, Math.min(COLS - 1, Math.round(enemy.x) + (s.flankX || 0)));
      targetY = Math.max(0, Math.min(ROWS - 1, Math.round(enemy.y) + (s.flankY || 0)));
      if (!canWalk(targetX, targetY) && map[targetY] && map[targetY][targetX] !== T.DIRT) {
        targetX = Math.round(enemy.x);
        targetY = Math.round(enemy.y);
      }
    }

    // BFS pathfind
    s.pathTimer -= dt;
    if (s.pathTimer <= 0 || !s.nextTile) {
      s.pathTimer = pathInterval;
      s.nextTile = bfsPath(Math.round(s.x), Math.round(s.y), targetX, targetY, true);
    }

    // ── Group advance: slow down if ahead of allies ──
    if (s.role === 'attack') {
      let nearbyAllies = 0, alliesAhead = 0;
      const sx = Math.round(s.x), sy = Math.round(s.y);
      const myDist = Math.abs(sx - Math.round(enemy.x)) + Math.abs(sy - Math.round(enemy.y));
      for (const ally of soldiers) {
        if (ally === s || ally.colony !== s.colony) continue;
        const ad = Math.abs(Math.round(ally.x) - sx) + Math.abs(Math.round(ally.y) - sy);
        if (ad <= 4) {
          nearbyAllies++;
          if (Math.abs(Math.round(ally.x) - Math.round(enemy.x)) + Math.abs(Math.round(ally.y) - Math.round(enemy.y)) <= myDist) alliesAhead++;
        }
      }
      if (nearbyAllies >= 2 && alliesAhead < nearbyAllies / 2 && myDist > 3) {
        s.pathTimer += dt * 0.5;
      }
    }

    // Move toward next tile
    if (s.nextTile) {
      const dx = s.nextTile.x - s.x;
      const dy = s.nextTile.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.1) {
        s.x = s.nextTile.x;
        s.y = s.nextTile.y;
        if (map[s.nextTile.y] && map[s.nextTile.y][s.nextTile.x] === T.DIRT) {
          map[s.nextTile.y][s.nextTile.x] = T.DUG;
          if (lastDugTime[s.nextTile.y]) lastDugTime[s.nextTile.y][s.nextTile.x] = roundTimer;
          spawnParticles(s.nextTile.x, s.nextTile.y, COLORS.dirtBord, 3);
        }
        s.nextTile = bfsPath(Math.round(s.x), Math.round(s.y), targetX, targetY, true);
      } else {
        s.x += (dx / dist) * moveSpeed * dt;
        s.y += (dy / dist) * moveSpeed * dt;
        const tx = Math.round(s.x), ty = Math.round(s.y);
        if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS && map[ty][tx] === T.DIRT) {
          map[ty][tx] = T.DUG;
          if (lastDugTime[ty]) lastDugTime[ty][tx] = roundTimer;
          spawnParticles(tx, ty, COLORS.dirtBord, 2);
        }
        if (Math.abs(dx) > Math.abs(dy)) s.dir = dx > 0 ? 'right' : 'left';
        else s.dir = dy > 0 ? 'down' : 'up';
      }
    }

    // Shoot at enemies — cardinal alignment OR close enough to fire toward them
    s.shootCooldown -= dt;
    if (s.shootCooldown <= 0) {
      const shootTargets = [enemy];
      if (s.role === 'defend') {
        for (const es of soldiers) { if (es.colony !== s.colony) shootTargets.push(es); }
      }
      for (const target of shootTargets) {
        const edx = Math.round(target.x) - Math.round(s.x);
        const edy = Math.round(target.y) - Math.round(s.y);
        const dist = Math.abs(edx) + Math.abs(edy);
        // Fire if aligned (classic) OR within 4 tiles (close combat)
        const aligned = (edx === 0 && Math.abs(edy) <= 5) || (edy === 0 && Math.abs(edx) <= 5);
        const closeEnough = dist <= 4;
        if (aligned || closeEnough) {
          // Pick dominant axis to fire along
          let bdir;
          if (Math.abs(edx) >= Math.abs(edy)) {
            bdir = edx > 0 ? 'right' : 'left';
          } else {
            bdir = edy > 0 ? 'down' : 'up';
          }
          const bdx = { left: -1, right: 1, up: 0, down: 0 }[bdir];
          const bdy = { left: 0, right: 0, up: -1, down: 1 }[bdir];
          bullets.push({ x: s.x + 0.5, y: s.y + 0.5, dx: bdx, dy: bdy, speed: 5, owner: s.colony, blast: 1 });
          s.shootCooldown = 1.5;
          break;
        }
      }
    }
  }
}

// ─── Spawn Mounds ────────────────────────────────────────────
function updateMound(dt) {
  moundTimer -= dt;

  // Update existing mounds
  for (let i = mounds.length - 1; i >= 0; i--) {
    const m = mounds[i];
    if (m.state === 'ACTIVE') {
      m.activeTimer -= dt;
      if (m.activeTimer <= 0) {
        mounds.splice(i, 1);
      }
    } else if (m.state === 'CLAIMED') {
      m.spawnTimer -= dt;
      if (m.spawnTimer <= 0 && m.soldiersRemaining > 0) {
        const swarmActive = activeModifiers.includes('SWARM');
        soldiers.push({
          x: m.x, y: m.y, dir: 'up', hp: 1, speed: 3.5,
          colony: m.claimedBy, lifetime: swarmActive ? 50 : 100, pathTimer: 0,
          nextTile: null, shootCooldown: 1,
          role: 'attack',
          flankX: Math.floor(gameRandom() * 7) - 3,
          flankY: Math.floor(gameRandom() * 7) - 3,
        });
        playSoldierSpawn();
        m.soldiersRemaining--;
        m.spawnTimer = swarmActive ? 1.25 : 2.5;
      }
      if (m.soldiersRemaining <= 0 && m.spawnTimer <= 0) {
        mounds.splice(i, 1);
      }
    }
  }

  // Spawn new mound (5x more often, max 3 at once)
  if (moundTimer <= 0 && roundTimer > 5 && mounds.length < 3) {
    let mx, my, attempts = 0;
    do {
      mx = Math.floor(gameRandom() * COLS);
      my = Math.floor(gameRandom() * ROWS);
      attempts++;
    } while (attempts < 100 && (map[my][mx] !== T.DUG ||
      (Math.abs(mx - queens[0].x) + Math.abs(my - queens[0].y) < 5) ||
      (Math.abs(mx - queens[1].x) + Math.abs(my - queens[1].y) < 5) ||
      mounds.some(m => Math.abs(mx - m.x) + Math.abs(my - m.y) < 8) ||
      powerUps.some(p => Math.abs(mx - p.x) + Math.abs(my - p.y) < 6) ||
      !bfsConnected(mx, my, Math.round(queens[0].x), Math.round(queens[0].y))));

    if (attempts < 100) {
      mounds.push({ x: mx, y: my, state: 'ACTIVE', claimedBy: null, soldiersRemaining: 0, spawnTimer: 0, activeTimer: 10 });
      spawnFloatingText(mx, my, 'SPAWN MOUND!', '#E8C840');
    }
    moundTimer = 1 + gameRandom() * 1;
  }
}

// ─── Power-Ups ───────────────────────────────────────────────
function updatePowerUp(dt) {
  powerUpTimer -= dt;

  // Update existing powerups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].despawnTimer -= dt;
    if (powerUps[i].despawnTimer <= 0) {
      powerUps.splice(i, 1);
    }
  }

  // Spawn new powerup (5x more often, max 3 at once)
  if (powerUpTimer <= 0 && roundTimer > 3 && powerUps.length < 3) {
    let px, py, attempts = 0;
    do {
      px = Math.floor(gameRandom() * COLS);
      py = Math.floor(gameRandom() * ROWS);
      attempts++;
    } while (attempts < 100 && (map[py][px] !== T.DUG ||
      powerUps.some(p => Math.abs(px - p.x) + Math.abs(py - p.y) < 6) ||
      mounds.some(m => Math.abs(px - m.x) + Math.abs(py - m.y) < 6)));

    if (attempts < 100) {
      powerUps.push({
        x: px, y: py,
        type: POWER_TYPES[Math.floor(gameRandom() * POWER_TYPES.length)],
        despawnTimer: 15,
      });
      playPowerUpAppear();
    }
    powerUpTimer = 1;
  }
}

function applyPowerUp(q, pu) {
  q.activePowerUp = pu.type;
  switch (pu.type) {
    case 'SUGAR': q.powerUpTimer = 80; break;
    case 'RAPID': q.powerUpTimer = 80; break;
    case 'SHIELD': break; // lasts until hit
    case 'MEGA': q.megaShots = 30; break;
  }
}

// ─── Worms (hidden in dirt, give extra life when eaten) ──────
function spawnWorms() {
  const count = 3 + Math.floor(gameRandom() * 4); // 3-6 worms
  for (let i = 0; i < count; i++) {
    let wx, wy, attempts = 0;
    do {
      wx = Math.floor(gameRandom() * COLS);
      wy = Math.floor(gameRandom() * ROWS);
      attempts++;
    } while (attempts < 100 && map[wy][wx] !== T.DIRT);
    if (attempts < 100) {
      worms.push({
        x: wx, y: wy,
        wigglePhase: gameRandom() * Math.PI * 2,
        segments: 4 + Math.floor(gameRandom() * 3),
      });
    }
  }
}

function updateWorms(dt) {
  for (const w of worms) {
    w.wigglePhase += dt * 5;
  }

  // Check if any queen is on a worm's tile (tile must be dug out first)
  for (const q of queens) {
    const qx = Math.round(q.x), qy = Math.round(q.y);
    for (let i = worms.length - 1; i >= 0; i--) {
      const w = worms[i];
      if (w.x === qx && w.y === qy && canWalk(qx, qy)) {
        q.hp++;
        spawnParticles(w.x, w.y, '#D4856A', 8);
        spawnFloatingText(q.x, q.y, 'WORM +1 HP', '#D4856A');
        announce('Worm devoured!');
        worms.splice(i, 1);
      }
    }
  }
}
