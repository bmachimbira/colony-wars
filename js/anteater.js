// ─── Anteater (Boss Villain) ─────────────────────────────────
// A massive anteater that enters the map periodically,
// threatening both queens. Forces temporary truces.

let anteater = null;
let anteaterTimer = 45; // first spawn at 45s
let anteaterWarning = 0;

function spawnAnteater() {
  // Enter from a random edge
  const edge = Math.floor(Math.random() * 4);
  let x, y, dir;
  switch (edge) {
    case 0: x = 0; y = Math.floor(ROWS / 2); dir = 'right'; break;
    case 1: x = COLS - 1; y = Math.floor(ROWS / 2); dir = 'left'; break;
    case 2: x = Math.floor(COLS / 2); y = 0; dir = 'down'; break;
    case 3: x = Math.floor(COLS / 2); y = ROWS - 1; dir = 'up'; break;
  }

  // Clear entry point
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
        if (map[ny][nx] === T.DIRT) map[ny][nx] = T.DUG;
      }
    }
  }

  anteater = {
    x, y,
    dir,
    hp: 8,
    maxHp: 8,
    speed: 1.8,
    pathTimer: 0,
    nextTile: null,
    tongueTimer: 0,
    tongueActive: false,
    tongueCooldown: 3,
    tongueLength: 0,
    tongueDir: { dx: 0, dy: 0 },
    tongueMaxLength: 5,
    bobPhase: 0,
    hitFlash: 0,
    digTimer: 0,
  };

  playAnteaterRoar();
}

function updateAnteater(dt) {
  // Spawn timer
  if (!anteater) {
    if (anteaterWarning > 0) {
      anteaterWarning -= dt;
      if (anteaterWarning <= 0) {
        spawnAnteater();
      }
      return;
    }
    anteaterTimer -= dt;
    if (anteaterTimer <= 0 && roundTimer > 30) {
      anteaterWarning = 3; // 3 second warning
      anteaterTimer = 60; // next one in 60s
    }
    return;
  }

  const a = anteater;
  a.bobPhase += dt * 4;
  if (a.hitFlash > 0) a.hitFlash -= dt;

  // Find nearest queen
  let nearestQ = null;
  let nearestDist = Infinity;
  for (const q of queens) {
    const d = Math.abs(q.x - a.x) + Math.abs(q.y - a.y);
    if (d < nearestDist) { nearestDist = d; nearestQ = q; }
  }

  // Pathfind toward nearest queen
  a.pathTimer -= dt;
  if (a.pathTimer <= 0 || !a.nextTile) {
    a.pathTimer = 1.5;
    if (nearestQ) {
      a.nextTile = anteaterBfsPath(Math.round(a.x), Math.round(a.y), Math.round(nearestQ.x), Math.round(nearestQ.y));
    }
  }

  // Move — anteater digs through dirt!
  if (a.nextTile) {
    const dx = a.nextTile.x - a.x;
    const dy = a.nextTile.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.15) {
      a.x = a.nextTile.x;
      a.y = a.nextTile.y;
      if (nearestQ) {
        a.nextTile = anteaterBfsPath(Math.round(a.x), Math.round(a.y), Math.round(nearestQ.x), Math.round(nearestQ.y));
      }
    } else {
      // Dig through dirt ahead
      const tx = Math.round(a.x + (dx / dist) * 0.8);
      const ty = Math.round(a.y + (dy / dist) * 0.8);
      if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS && map[ty][tx] === T.DIRT) {
        map[ty][tx] = T.DUG;
        spawnParticles(tx, ty, COLORS.dirtBord, 3);
      }

      a.x += (dx / dist) * a.speed * dt;
      a.y += (dy / dist) * a.speed * dt;

      if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left';
      else a.dir = dy > 0 ? 'down' : 'up';
    }
  }

  // Tongue attack
  a.tongueCooldown -= dt;
  if (a.tongueActive) {
    a.tongueLength += dt * 18;
    if (a.tongueLength >= a.tongueMaxLength) {
      a.tongueActive = false;
      a.tongueLength = 0;
      a.tongueCooldown = 3;
    }
    // Tongue damage — check along the tongue line
    const tdx = a.tongueDir.dx;
    const tdy = a.tongueDir.dy;
    for (let i = 1; i <= Math.floor(a.tongueLength); i++) {
      const tx = Math.round(a.x) + tdx * i;
      const ty = Math.round(a.y) + tdy * i;

      // Hit queens
      for (const q of queens) {
        if (Math.round(q.x) === tx && Math.round(q.y) === ty && q.invTimer <= 0) {
          if (q.activePowerUp === 'SHIELD') {
            q.activePowerUp = null;
          } else {
            q.hp--;
            q.invTimer = 0.8;
          }
          playHit();
          spawnParticles(tx, ty, q.colony === 'blue' ? COLORS.p1 : COLORS.p2, 8);
        }
      }

      // Eat soldiers
      for (let s = soldiers.length - 1; s >= 0; s--) {
        if (Math.round(soldiers[s].x) === tx && Math.round(soldiers[s].y) === ty) {
          spawnParticles(tx, ty, soldiers[s].colony === 'blue' ? COLORS.p1 : COLORS.p2, 5);
          soldiers.splice(s, 1);
        }
      }
    }
  } else if (a.tongueCooldown <= 0 && nearestQ && nearestDist < 7) {
    // Launch tongue attack toward nearest queen
    const qdx = Math.round(nearestQ.x) - Math.round(a.x);
    const qdy = Math.round(nearestQ.y) - Math.round(a.y);
    if (qdx === 0 || qdy === 0) {
      // Only attack in cardinal directions
      a.tongueActive = true;
      a.tongueLength = 0;
      a.tongueDir = {
        dx: qdx === 0 ? 0 : (qdx > 0 ? 1 : -1),
        dy: qdy === 0 ? 0 : (qdy > 0 ? 1 : -1)
      };
      playAnteaterTongue();
    }
  }

  // Eat soldiers on contact (walking over them)
  for (let s = soldiers.length - 1; s >= 0; s--) {
    if (Math.abs(soldiers[s].x - a.x) < 1.2 && Math.abs(soldiers[s].y - a.y) < 1.2) {
      spawnParticles(Math.round(soldiers[s].x), Math.round(soldiers[s].y),
        soldiers[s].colony === 'blue' ? COLORS.p1 : COLORS.p2, 5);
      soldiers.splice(s, 1);
    }
  }

  // Take damage from bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (Math.abs(b.x - a.x - 0.5) < 1.2 && Math.abs(b.y - a.y - 0.5) < 1.2) {
      a.hp--;
      a.hitFlash = 0.15;
      spawnParticles(Math.round(a.x), Math.round(a.y), '#C87830', 6);
      bullets.splice(i, 1);
      if (a.hp <= 0) {
        // Anteater defeated!
        spawnParticles(a.x, a.y, '#C87830', 25);
        spawnParticles(a.x, a.y, '#FFD700', 15);
        playAnteaterDeath();
        anteater = null;
        return;
      }
    }
  }

  // Damage queen on direct contact
  for (const q of queens) {
    if (Math.abs(q.x - a.x) < 1.2 && Math.abs(q.y - a.y) < 1.2 && q.invTimer <= 0) {
      if (q.activePowerUp === 'SHIELD') {
        q.activePowerUp = null;
      } else {
        q.hp--;
        q.invTimer = 0.8;
      }
      playHit();
      spawnParticles(Math.round(q.x), Math.round(q.y), q.colony === 'blue' ? COLORS.p1 : COLORS.p2, 10);
    }
  }
}

// BFS that can walk through dirt (anteater digs)
function anteaterBfsPath(sx, sy, ex, ey) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const queue = [[sx, sy]];
  visited[sy][sx] = true;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    if (cx === ex && cy === ey) {
      let px = ex, py = ey;
      while (parent[py][px]) {
        const [ppx, ppy] = parent[py][px];
        if (ppx === sx && ppy === sy) return { x: px, y: py };
        px = ppx; py = ppy;
      }
      return { x: ex, y: ey };
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny][nx]) {
        const t = map[ny][nx];
        if (t !== T.ROCK && t !== T.PUDDLE) { // can walk through dirt!
          visited[ny][nx] = true;
          parent[ny][nx] = [cx, cy];
          queue.push([nx, ny]);
        }
      }
    }
  }
  return null;
}

// ─── Anteater Rendering ──────────────────────────────────────
function drawAnteater() {
  if (!anteater && anteaterWarning <= 0) return;

  // Warning banner
  if (!anteater && anteaterWarning > 0) {
    const flash = Math.sin(performance.now() / 150) > 0;
    if (flash) {
      ctx.fillStyle = '#C83030';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!! ANTEATER APPROACHING !!', W / 2, H * 0.92);
    }
    return;
  }

  const a = anteater;
  const px = a.x * TILE + TILE / 2;
  const py = a.y * TILE + TILE / 2;
  const bob = Math.sin(a.bobPhase) * 2;
  const t = performance.now() / 1000;

  ctx.save();
  ctx.translate(px, py + bob);

  const angles = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  ctx.rotate(angles[a.dir] || 0);

  // Hit flash
  const baseColor = a.hitFlash > 0 ? '#FFF' : '#8B6914';
  const darkColor = a.hitFlash > 0 ? '#FCC' : '#6B4F10';
  const snoutColor = a.hitFlash > 0 ? '#FEE' : '#A07820';

  // ── Body (large, takes ~3 tiles) ──
  // Hindquarters
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(-TILE * 1.1, 0, TILE * 0.6, TILE * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main body
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(-TILE * 0.3, 0, TILE * 0.7, TILE * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body stripe pattern
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(-TILE * 0.3, 0, TILE * 0.5, TILE * 0.55, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(TILE * 0.35, 0, TILE * 0.4, TILE * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Long snout
  ctx.fillStyle = snoutColor;
  ctx.beginPath();
  ctx.moveTo(TILE * 0.6, -TILE * 0.12);
  ctx.quadraticCurveTo(TILE * 1.2, -TILE * 0.05, TILE * 1.5, 0);
  ctx.quadraticCurveTo(TILE * 1.2, TILE * 0.05, TILE * 0.6, TILE * 0.12);
  ctx.closePath();
  ctx.fill();

  // Snout stripe
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(TILE * 0.7, 0);
  ctx.lineTo(TILE * 1.4, 0);
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(TILE * 1.45, -TILE * 0.03, 2, 0, Math.PI * 2);
  ctx.arc(TILE * 1.45, TILE * 0.03, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eye — small and beady
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(TILE * 0.55, -TILE * 0.18, TILE * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // Eye glint
  ctx.fillStyle = '#C83030';
  ctx.beginPath();
  ctx.arc(TILE * 0.53, -TILE * 0.2, TILE * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(TILE * 0.4, -TILE * 0.3, TILE * 0.1, TILE * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Bushy tail
  ctx.fillStyle = darkColor;
  const tailWag = Math.sin(t * 3) * 0.2;
  ctx.save();
  ctx.translate(-TILE * 1.5, 0);
  ctx.rotate(tailWag);
  ctx.beginPath();
  ctx.ellipse(0, 0, TILE * 0.5, TILE * 0.7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Tail fur streaks
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-TILE * 0.3, i * TILE * 0.15);
    ctx.lineTo(TILE * 0.3, i * TILE * 0.18);
    ctx.stroke();
  }
  ctx.restore();

  // Legs (4, with walking animation)
  ctx.fillStyle = darkColor;
  const legPhase = a.bobPhase;
  const legs = [
    { x: -TILE * 0.7, side: -1 },
    { x: -TILE * 0.7, side: 1 },
    { x: TILE * 0.1, side: -1 },
    { x: TILE * 0.1, side: 1 },
  ];
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const swing = Math.sin(legPhase + i * Math.PI / 2) * TILE * 0.15;
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(leg.x + swing, leg.side * TILE * 0.6, TILE * 0.12, TILE * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Claws
    ctx.fillStyle = '#444';
    for (let c = -1; c <= 1; c++) {
      ctx.beginPath();
      ctx.arc(leg.x + swing + c * 4, leg.side * TILE * 0.78, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Tongue (when attacking) ──
  if (a.tongueActive && a.tongueLength > 0) {
    ctx.strokeStyle = '#FF6688';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const tongueEndX = a.tongueDir.dx * a.tongueLength * TILE;
    const tongueEndY = a.tongueDir.dy * a.tongueLength * TILE;
    // Draw in world space (undo rotation)
    ctx.restore();
    ctx.save();
    ctx.translate(px, py + bob);
    ctx.strokeStyle = '#FF6688';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const waviness = Math.sin(performance.now() / 50) * 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      tongueEndX / 2 + waviness,
      tongueEndY / 2 + waviness,
      tongueEndX, tongueEndY
    );
    ctx.stroke();
    // Tongue tip
    ctx.fillStyle = '#FF4466';
    ctx.beginPath();
    ctx.arc(tongueEndX, tongueEndY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // HP bar above anteater
  const barW = TILE * 2;
  const barH = 4;
  const barX = px - barW / 2;
  const barY = py - TILE * 0.9;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = a.hp > 3 ? '#88CC44' : a.hp > 1 ? '#CCAA22' : '#CC3333';
  ctx.fillRect(barX, barY, barW * (a.hp / a.maxHp), barH);
}
