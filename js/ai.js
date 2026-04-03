// ─── AI Opponent ─────────────────────────────────────────────
let singlePlayer = false;
let aiState = {
  thinkTimer: 0,
  targetX: 0,
  targetY: 0,
  mode: 'explore', // 'explore', 'hunt', 'flee', 'claim', 'powerup'
  shootTimer: 0,
  specialTimer: 0,
  strafeDir: 1,
};

function updateAI(dt) {
  if (!singlePlayer || queens.length < 2) return;
  const ai = queens[0]; // AI is P1 (WASD)
  if (ai.dead) return;
  const player = queens[1]; // Human is P2 (arrows)
  const c = ai.controls;

  // Clear AI keys each frame
  keys[c.up] = false;
  keys[c.down] = false;
  keys[c.left] = false;
  keys[c.right] = false;
  keys[c.shoot] = false;
  keys[c.special] = false;

  aiState.thinkTimer -= dt;
  aiState.shootTimer -= dt;
  aiState.specialTimer -= dt;

  const aix = Math.round(ai.x), aiy = Math.round(ai.y);
  const plx = Math.round(player.x), ply = Math.round(player.y);
  const distToPlayer = Math.abs(aix - plx) + Math.abs(aiy - ply);

  // Re-evaluate strategy periodically
  if (aiState.thinkTimer <= 0) {
    aiState.thinkTimer = 0.5 + Math.random() * 0.5;

    // Decide mode
    if (ai.hp <= 1 && distToPlayer < 8) {
      aiState.mode = 'flee';
    } else if (distToPlayer < 10) {
      aiState.mode = 'hunt';
    } else {
      // Check for nearby unclaimed mounds
      const nearMound = mounds.find(m => m.state === 'ACTIVE' &&
        Math.abs(m.x - aix) + Math.abs(m.y - aiy) < 15);
      // Check for nearby powerups
      const nearPower = powerUps.find(p =>
        Math.abs(p.x - aix) + Math.abs(p.y - aiy) < 12);

      if (nearPower) {
        aiState.mode = 'powerup';
        aiState.targetX = nearPower.x;
        aiState.targetY = nearPower.y;
      } else if (nearMound) {
        aiState.mode = 'claim';
        aiState.targetX = nearMound.x;
        aiState.targetY = nearMound.y;
      } else {
        aiState.mode = 'hunt';
      }
    }

    // Random strafe direction change
    if (Math.random() < 0.3) aiState.strafeDir *= -1;
  }

  // Execute mode
  let goalX, goalY;

  if (aiState.mode === 'flee') {
    // Move away from player
    goalX = aix + (aix - plx);
    goalY = aiy + (aiy - ply);
    goalX = Math.max(1, Math.min(COLS - 2, goalX));
    goalY = Math.max(1, Math.min(ROWS - 2, goalY));
  } else if (aiState.mode === 'hunt') {
    goalX = plx;
    goalY = ply;
  } else if (aiState.mode === 'claim' || aiState.mode === 'powerup') {
    goalX = aiState.targetX;
    goalY = aiState.targetY;
  } else {
    goalX = plx;
    goalY = ply;
  }

  // Pathfind toward goal
  const next = bfsPath(aix, aiy, goalX, goalY, true);
  if (next) {
    if (next.x > aix) keys[c.right] = true;
    else if (next.x < aix) keys[c.left] = true;
    if (next.y > aiy) keys[c.down] = true;
    else if (next.y < aiy) keys[c.up] = true;
  } else {
    // No path — shoot toward player to dig
    if (plx > aix) { keys[c.right] = true; ai.dir = 'right'; }
    else if (plx < aix) { keys[c.left] = true; ai.dir = 'left'; }
    else if (ply > aiy) { keys[c.down] = true; ai.dir = 'down'; }
    else if (ply < aiy) { keys[c.up] = true; ai.dir = 'up'; }
    keys[c.shoot] = true;
  }

  // Shooting logic
  if (aiState.shootTimer <= 0) {
    const dx = plx - aix, dy = ply - aiy;
    // Shoot if roughly aligned with player
    if ((Math.abs(dx) <= 1 && Math.abs(dy) <= 6) ||
        (Math.abs(dy) <= 1 && Math.abs(dx) <= 6)) {
      keys[c.shoot] = true;
      aiState.shootTimer = 0.3 + Math.random() * 0.3;
    }
    // Also shoot to dig when exploring
    if (aiState.mode !== 'flee') {
      const facingTile = getFacingTile(ai);
      if (facingTile && map[facingTile.y] && map[facingTile.y][facingTile.x] === T.DIRT) {
        keys[c.shoot] = true;
        aiState.shootTimer = 0.4;
      }
    }
  }

  // Special ability usage
  if (ai.specialUses > 0 && aiState.specialTimer <= 0) {
    if (ai.charType === 'COCKROACH') {
      // Use defend when bullet is close
      const incomingBullet = bullets.find(b =>
        b.owner !== ai.colony &&
        Math.abs(b.x - ai.x) < 2 && Math.abs(b.y - ai.y) < 2);
      if (incomingBullet) {
        keys[c.special] = true;
        aiState.specialTimer = 3;
      }
    } else if (ai.charType === 'BEETLE') {
      // Fly away when low HP and close to enemy
      if (ai.hp <= 1 && distToPlayer < 5) {
        keys[c.special] = true;
        aiState.specialTimer = 3;
      }
    } else if (ai.charType === 'ANT') {
      // Drop traps in tunnels near player path
      if (distToPlayer < 8 && distToPlayer > 3) {
        keys[c.special] = true;
        aiState.specialTimer = 5;
      }
    }
  }

  // Dodge incoming bullets
  for (const b of bullets) {
    if (b.owner === ai.colony) continue;
    const bDist = Math.abs(b.x - ai.x) + Math.abs(b.y - ai.y);
    if (bDist < 3) {
      // Strafe perpendicular to bullet direction
      if (b.dx !== 0) {
        keys[b.dy > 0 ? c.up : c.down] = true;
      } else {
        keys[b.dx > 0 ? c.up : c.down] = true;
      }
    }
  }
}

function getFacingTile(q) {
  const x = Math.round(q.x), y = Math.round(q.y);
  const offsets = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const [dx, dy] = offsets[q.dir] || [0, 0];
  const nx = x + dx, ny = y + dy;
  if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) return { x: nx, y: ny };
  return null;
}
