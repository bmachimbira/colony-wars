// ─── Queen Creation ──────────────────────────────────────────
function createQueen(x, y, colony, controls) {
  return {
    x, y, dir: 'right', hp: 3, speed: 3, colony,
    controls, canShoot: true, shootCooldown: 0,
    bobPhase: 0, moving: false, invTimer: 0, walkSoundTimer: 0,
    activePowerUp: null, powerUpTimer: 0, megaShots: 0,
  };
}

// ─── Bullet Creation ─────────────────────────────────────────
function fireBullet(q) {
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

// ─── Particles ───────────────────────────────────────────────
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 30 + Math.random() * 60;
    particles.push({
      x: x * TILE + TILE / 2, y: y * TILE + TILE / 2,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      life: 0.3 + Math.random() * 0.4, color, size: 2 + Math.random() * 3,
    });
  }
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

  const speed = q.activePowerUp === 'SUGAR' ? q.speed * 2 : q.speed;

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

  // Check spawn mound claim
  if (mound && mound.state === 'ACTIVE') {
    if (Math.round(q.x) === mound.x && Math.round(q.y) === mound.y) {
      mound.state = 'CLAIMED';
      mound.claimedBy = q.colony;
      mound.soldiersRemaining = 3;
      mound.spawnTimer = 0.5;
      playMoundClaim();
    }
  }

  // Check power-up collection
  if (powerUp) {
    if (Math.round(q.x) === powerUp.x && Math.round(q.y) === powerUp.y) {
      applyPowerUp(q, powerUp);
      playPowerUp();
      powerUp = null;
    }
  }
}

// ─── Bullet Update ───────────────────────────────────────────
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx * b.speed * dt;
    b.y += b.dy * b.speed * dt;

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
              spawnParticles(nx, ny, COLORS.dirtBord, 3);
            }
          }
      } else {
        map[ty][tx] = T.DUG;
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
          if (q.activePowerUp === 'SHIELD') {
            q.activePowerUp = null;
          } else {
            q.hp--;
            q.invTimer = 0.5;
          }
          playHit();
          spawnParticles(Math.round(q.x), Math.round(q.y), q.colony === 'blue' ? COLORS.p1 : COLORS.p2, 8);
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
          spawnParticles(Math.round(sol.x), Math.round(sol.y), sol.colony === 'blue' ? COLORS.p1 : COLORS.p2, 5);
          soldiers.splice(s, 1);
          bullets.splice(i, 1);
          break;
        }
      }
    }
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

    // Find enemy queen
    const enemy = queens.find(q => q.colony !== s.colony);
    if (!enemy) continue;

    // BFS pathfind every 2 seconds
    s.pathTimer -= dt;
    if (s.pathTimer <= 0 || !s.nextTile) {
      s.pathTimer = 2;
      s.nextTile = bfsPath(Math.round(s.x), Math.round(s.y), Math.round(enemy.x), Math.round(enemy.y));
    }

    // Move toward next tile
    if (s.nextTile) {
      const dx = s.nextTile.x - s.x;
      const dy = s.nextTile.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.1) {
        s.x = s.nextTile.x;
        s.y = s.nextTile.y;
        s.nextTile = bfsPath(Math.round(s.x), Math.round(s.y), Math.round(enemy.x), Math.round(enemy.y));
      } else {
        s.x += (dx / dist) * s.speed * dt;
        s.y += (dy / dist) * s.speed * dt;
        // Update direction for rendering
        if (Math.abs(dx) > Math.abs(dy)) s.dir = dx > 0 ? 'right' : 'left';
        else s.dir = dy > 0 ? 'down' : 'up';
      }
    }

    // Shoot at enemy queen if close and in line
    s.shootCooldown -= dt;
    if (s.shootCooldown <= 0) {
      const edx = Math.round(enemy.x) - Math.round(s.x);
      const edy = Math.round(enemy.y) - Math.round(s.y);
      if ((edx === 0 && Math.abs(edy) <= 5) || (edy === 0 && Math.abs(edx) <= 5)) {
        const bdir = edx === 0 ? (edy > 0 ? 'down' : 'up') : (edx > 0 ? 'right' : 'left');
        const bdx = { left: -1, right: 1, up: 0, down: 0 }[bdir];
        const bdy = { left: 0, right: 0, up: -1, down: 1 }[bdir];
        bullets.push({ x: s.x + 0.5, y: s.y + 0.5, dx: bdx, dy: bdy, speed: 5, owner: s.colony, blast: 1 });
        s.shootCooldown = 1.5;
      }
    }
  }
}

// ─── Spawn Mounds ────────────────────────────────────────────
function updateMound(dt) {
  moundTimer -= dt;

  if (mound) {
    if (mound.state === 'ACTIVE') {
      mound.activeTimer -= dt;
      if (mound.activeTimer <= 0) {
        mound = null;
        moundTimer = 5 + Math.random() * 5;
      }
    } else if (mound.state === 'CLAIMED') {
      mound.spawnTimer -= dt;
      if (mound.spawnTimer <= 0 && mound.soldiersRemaining > 0) {
        // Spawn soldier
        soldiers.push({
          x: mound.x, y: mound.y, dir: 'up', hp: 1, speed: 3.5,
          colony: mound.claimedBy, lifetime: 20, pathTimer: 0,
          nextTile: null, shootCooldown: 1,
        });
        playSoldierSpawn();
        mound.soldiersRemaining--;
        mound.spawnTimer = 2.5;
      }
      if (mound.soldiersRemaining <= 0 && mound.spawnTimer <= 0) {
        mound = null;
        moundTimer = 5 + Math.random() * 5;
      }
    }
  } else if (moundTimer <= 0 && roundTimer > 5) {
    // Spawn new mound
    let mx, my, attempts = 0;
    do {
      mx = Math.floor(Math.random() * COLS);
      my = Math.floor(Math.random() * ROWS);
      attempts++;
    } while (attempts < 100 && (map[my][mx] !== T.DUG ||
      (Math.abs(mx - queens[0].x) + Math.abs(my - queens[0].y) < 5) ||
      (Math.abs(mx - queens[1].x) + Math.abs(my - queens[1].y) < 5)));

    if (attempts < 100) {
      mound = { x: mx, y: my, state: 'ACTIVE', claimedBy: null, soldiersRemaining: 0, spawnTimer: 0, activeTimer: 10 };
    }
    moundTimer = 5 + Math.random() * 5;
  }
}

// ─── Power-Ups ───────────────────────────────────────────────
function updatePowerUp(dt) {
  powerUpTimer -= dt;

  if (powerUp) {
    powerUp.despawnTimer -= dt;
    if (powerUp.despawnTimer <= 0) {
      powerUp = null;
      powerUpTimer = 5;
    }
  } else if (powerUpTimer <= 0 && roundTimer > 3) {
    let px, py, attempts = 0;
    do {
      px = Math.floor(Math.random() * COLS);
      py = Math.floor(Math.random() * ROWS);
      attempts++;
    } while (attempts < 100 && map[py][px] !== T.DUG);

    if (attempts < 100) {
      powerUp = {
        x: px, y: py,
        type: POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)],
        despawnTimer: 15,
      };
    }
    powerUpTimer = 5;
  }
}

function applyPowerUp(q, pu) {
  q.activePowerUp = pu.type;
  switch (pu.type) {
    case 'SUGAR': q.powerUpTimer = 16; break;
    case 'RAPID': q.powerUpTimer = 16; break;
    case 'SHIELD': break; // lasts until hit
    case 'MEGA': q.megaShots = 6; break;
  }
}
