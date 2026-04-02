// ─── Drawing ─────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  if (gameState === STATE.TITLE) {
    drawTitle();
    return;
  }

  if (gameState === STATE.GENERATING) {
    return;
  }

  if (gameState === STATE.MATCH_END) {
    drawMatchEnd();
    return;
  }

  if (!map.length || !queens.length) return;

  // Draw map
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[y][x];
      const px = x * TILE, py = y * TILE;

      if (t === T.DIRT) {
        ctx.fillStyle = COLORS.dirt;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = COLORS.dirtBord;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        // Grain lines
        ctx.strokeStyle = COLORS.dirtBord;
        ctx.beginPath();
        ctx.moveTo(px + 5, py + 10); ctx.lineTo(px + 16, py + 10);
        ctx.moveTo(px + 14, py + 22); ctx.lineTo(px + 27, py + 22);
        ctx.moveTo(px + 3, py + 17); ctx.lineTo(px + 10, py + 17);
        ctx.stroke();
      } else if (t === T.ROCK) {
        ctx.fillStyle = COLORS.rock;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = COLORS.rockHi;
        ctx.fillRect(px + 6, py + 6, 8, 5);
        ctx.fillRect(px + 18, py + 16, 6, 5);
        ctx.fillRect(px + 4, py + 20, 5, 4);
      } else if (t === T.PUDDLE) {
        ctx.fillStyle = COLORS.puddle;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#4080D0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 10); ctx.quadraticCurveTo(px + 12, py + 6, px + 21, py + 10);
        ctx.stroke();
      } else if (t === T.LEAF) {
        ctx.fillStyle = COLORS.dug;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.leaf;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(px + 8, py + 10, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + 16, py + 16, 5, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (t === T.DUG || t === T.TUNNEL) {
        ctx.fillStyle = COLORS.dirt;
        ctx.fillRect(px, py, TILE, TILE);
        // Draw rounded tunnel shape
        const r = TILE * 0.35;
        const isOpen = (dx, dy) => {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
          const nt = map[ny][nx];
          return nt === T.DUG || nt === T.TUNNEL || nt === T.LEAF;
        };
        const up = isOpen(0, -1), down = isOpen(0, 1), left = isOpen(-1, 0), right = isOpen(1, 0);
        const tl = isOpen(-1, -1), tr = isOpen(1, -1), bl = isOpen(-1, 1), br = isOpen(1, 1);
        ctx.fillStyle = COLORS.dug;
        ctx.beginPath();
        // Top-left corner
        if (up && left && tl) { ctx.moveTo(px, py); }
        else if (up && left) { ctx.moveTo(px, py); }
        else if (up) { ctx.moveTo(px + r, py); ctx.quadraticCurveTo(px, py, px, py + r); ctx.lineTo(px, py); ctx.moveTo(px + r, py); }
        else if (left) { ctx.moveTo(px, py + r); ctx.quadraticCurveTo(px, py, px + r, py); ctx.lineTo(px, py); ctx.moveTo(px, py + r); }
        else { ctx.moveTo(px + r, py); }
        // Draw as rounded rect with selective corners
        const rtl = (up || left) ? (up && left ? 0 : r * 0.5) : r;
        const rtr = (up || right) ? (up && right ? 0 : r * 0.5) : r;
        const rbr = (down || right) ? (down && right ? 0 : r * 0.5) : r;
        const rbl = (down || left) ? (down && left ? 0 : r * 0.5) : r;
        ctx.beginPath();
        ctx.moveTo(px + rtl, py);
        ctx.lineTo(px + TILE - rtr, py);
        if (rtr > 0) ctx.quadraticCurveTo(px + TILE, py, px + TILE, py + rtr);
        else ctx.lineTo(px + TILE, py);
        ctx.lineTo(px + TILE, py + TILE - rbr);
        if (rbr > 0) ctx.quadraticCurveTo(px + TILE, py + TILE, px + TILE - rbr, py + TILE);
        else ctx.lineTo(px + TILE, py + TILE);
        ctx.lineTo(px + rbl, py + TILE);
        if (rbl > 0) ctx.quadraticCurveTo(px, py + TILE, px, py + TILE - rbl);
        else ctx.lineTo(px, py + TILE);
        ctx.lineTo(px, py + rtl);
        if (rtl > 0) ctx.quadraticCurveTo(px, py, px + rtl, py);
        else ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Draw spawn mounds
  for (const mound of mounds) {
    const mx = mound.x * TILE, my = mound.y * TILE;
    const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
    if (mound.state === 'ACTIVE') {
      ctx.fillStyle = COLORS.moundGold;
      ctx.globalAlpha = pulse;
      ctx.fillRect(mx + 2, my + 2, TILE - 4, TILE - 4);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COLORS.moundGold;
      ctx.lineWidth = 2;
      ctx.strokeRect(mx + 1, my + 1, TILE - 2, TILE - 2);
    } else if (mound.state === 'CLAIMED') {
      const col = mound.claimedBy === 'blue' ? COLORS.p1 : COLORS.p2;
      ctx.fillStyle = COLORS.moundGold;
      ctx.fillRect(mx + 2, my + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.strokeRect(mx + 1, my + 1, TILE - 2, TILE - 2);
    }
  }

  // Draw power-ups
  for (const powerUp of powerUps) {
    const px = powerUp.x * TILE, py = powerUp.y * TILE;
    const pulse = Math.sin(performance.now() / 250) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.powerUp;
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py + TILE / 2, TILE * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Type indicator
    ctx.fillStyle = '#000';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    const label = { SUGAR: 'S', RAPID: 'R', SHIELD: 'A', MEGA: 'M' }[powerUp.type];
    ctx.fillText(label, px + TILE / 2, py + TILE / 2 + 3);
  }

  // Draw worms (only visible once dirt is dug away)
  for (const w of worms) {
    const tile = map[w.y][w.x];
    if (tile === T.DUG || tile === T.TUNNEL) {
      drawWorm(w, 1);
    } else if (tile === T.DIRT) {
      // Subtle hint — small wiggle poking out of the dirt
      drawWorm(w, 0.5);
    }
  }

  // Draw soldiers
  for (const s of soldiers) {
    drawAnt(s.x, s.y, s.dir, s.colony === 'blue' ? COLORS.p1 : COLORS.p2, 0.7, s.lifetime < 3 ? 0.5 : 1, false, performance.now() / 100);
  }

  // Draw queens
  for (const q of queens) {
    if (q.invTimer > 0 && Math.floor(q.invTimer * 10) % 2 === 0) continue;
    const col = q.colony === 'blue' ? COLORS.p1 : COLORS.p2;

    // Glow
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    drawAnt(q.x, q.y, q.dir, col, 1, 1, true, q.moving ? q.bobPhase : 0, q.hp);
    ctx.restore();

    // Shield indicator
    if (q.activePowerUp === 'SHIELD') {
      ctx.strokeStyle = '#88DDFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(q.x * TILE + TILE / 2, q.y * TILE + TILE / 2, TILE * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw bullets
  for (const b of bullets) {
    ctx.fillStyle = '#88FF44';
    ctx.beginPath();
    ctx.arc(b.x * TILE, b.y * TILE, b.blast >= 3 ? 7 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw particles
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 0.7;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Draw HUD
  drawHUD();

  // Countdown overlay
  if (gameState === STATE.COUNTDOWN) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(countdownTimer), W / 2, H / 2 + 20);
    ctx.font = '18px monospace';
    ctx.fillText('ROUND ' + roundNum, W / 2, H / 2 - 50);
  }

  // Round end overlay
  if (gameState === STATE.ROUND_END) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    const winCol = roundWinner === 0 ? COLORS.p1 : COLORS.p2;
    const loser = roundWinner === 0 ? 'RED' : 'BLUE';
    ctx.fillStyle = winCol;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(loser + ' COLONY FALLS', W / 2, H / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('P' + (roundWinner + 1) + ' WINS THE ROUND', W / 2, H / 2 + 20);
    ctx.font = '16px monospace';
    ctx.fillText(scores[0] + ' - ' + scores[1], W / 2, H / 2 + 55);
  }
}

function drawAnt(x, y, dir, color, scale, alpha, isQueen, bobPhase, hp) {
  const px = x * TILE + TILE / 2;
  const py = y * TILE + TILE / 2 + (bobPhase ? Math.sin(bobPhase) * 2 : 0);
  const s = TILE * 0.45 * scale;
  const walkPhase = bobPhase || 0;
  const t = performance.now() / 1000;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(px, py);

  const angles = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  ctx.rotate(angles[dir] || 0);

  // ── 6 Animated Legs (3 per side, alternating tripod gait) ──
  ctx.strokeStyle = color;
  ctx.lineWidth = isQueen ? 2 : 1.5;
  ctx.lineCap = 'round';
  const legPositions = [-0.35, 0.0, 0.35];
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const phase = (i % 2 === 0) ? walkPhase : walkPhase + Math.PI;
      const swing = Math.sin(phase) * 0.25;
      const hipX = legPositions[i] * s;
      const hipY = side * s * 0.3;
      const kneeX = hipX + swing * s * 0.5;
      const kneeY = side * s * 0.7;
      const footX = hipX - swing * s * 0.3;
      const footY = side * s * 1.1;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
      ctx.stroke();
    }
  }

  // ── Body segments with shading ──
  ctx.fillStyle = color;
  // Abdomen
  ctx.beginPath();
  ctx.ellipse(-s * 0.85, 0, s * 0.55, s * (isQueen ? 0.5 : 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-s * 0.75, -s * 0.15, s * 0.25, s * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();
  if (isQueen) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    for (let si = -1; si <= 1; si++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.85 + si * s * 0.18, -s * 0.4);
      ctx.lineTo(-s * 0.85 + si * s * 0.18, s * 0.4);
      ctx.stroke();
    }
  }

  // Petiole (narrow waist)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(-s * 0.25, 0, s * 0.12, s * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thorax
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(s * 0.1, 0, s * 0.35, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(s * 0.15, -s * 0.1, s * 0.18, s * 0.1, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(s * 0.65, 0, s * 0.3, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(s * 0.75, -s * 0.12, s * 0.08, 0, Math.PI * 2);
  ctx.arc(s * 0.75, s * 0.12, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(s * 0.78, -s * 0.12, s * 0.04, 0, Math.PI * 2);
  ctx.arc(s * 0.78, s * 0.12, s * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Mandibles
  ctx.strokeStyle = isQueen ? '#FFD700' : color;
  ctx.lineWidth = isQueen ? 2.5 : 1.5;
  ctx.lineCap = 'round';
  const mandibleOpen = isQueen ? Math.sin(t * 3) * 0.15 + 0.3 : 0.2;
  ctx.beginPath();
  ctx.moveTo(s * 0.9, -s * 0.1);
  ctx.quadraticCurveTo(s * 1.1, -s * mandibleOpen, s * 1.2, -s * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.9, s * 0.1);
  ctx.quadraticCurveTo(s * 1.1, s * mandibleOpen, s * 1.2, s * 0.05);
  ctx.stroke();

  // ── Antennae (animated, segmented) ──
  ctx.strokeStyle = color;
  ctx.lineWidth = isQueen ? 1.8 : 1.2;
  const antSway1 = Math.sin(t * 4 + 0.5) * 0.15;
  const antSway2 = Math.sin(t * 4 + 2.5) * 0.15;
  ctx.beginPath();
  ctx.moveTo(s * 0.85, -s * 0.2);
  ctx.quadraticCurveTo(s * 1.1, -s * (0.55 + antSway1), s * 1.4, -s * (0.75 + antSway1));
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(s * 1.4, -s * (0.75 + antSway1), s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.85, s * 0.2);
  ctx.quadraticCurveTo(s * 1.1, s * (0.55 + antSway2), s * 1.4, s * (0.75 + antSway2));
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(s * 1.4, s * (0.75 + antSway2), s * 0.06, 0, Math.PI * 2);
  ctx.fill();

  if (isQueen) {
    // Crown (3 points above head)
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s * 0.45, -s * 0.28);
    ctx.lineTo(s * 0.5, -s * 0.55);
    ctx.lineTo(s * 0.6, -s * 0.32);
    ctx.lineTo(s * 0.65, -s * 0.6);
    ctx.lineTo(s * 0.75, -s * 0.3);
    ctx.lineTo(s * 0.8, -s * 0.5);
    ctx.lineTo(s * 0.85, -s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown jewel
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(s * 0.65, -s * 0.42, s * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Damage cracks
    if (hp !== undefined && hp < 3) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      if (hp <= 2) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.2);
        ctx.lineTo(-s * 0.3, 0);
        ctx.lineTo(-s * 0.1, s * 0.15);
        ctx.stroke();
      }
      if (hp <= 1) {
        ctx.beginPath();
        ctx.moveTo(s * 0.1, -s * 0.3);
        ctx.lineTo(s * 0.3, -s * 0.05);
        ctx.lineTo(s * 0.5, s * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.2, s * 0.1);
        ctx.lineTo(s * 0.35, s * 0.3);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function drawWorm(w, alpha) {
  const px = w.x * TILE + TILE / 2;
  const py = w.y * TILE + TILE / 2;
  const segLen = TILE * 0.18;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(px, py);

  // Draw segmented body trailing behind head
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < w.segments; i++) {
    const t = i / w.segments;
    const wiggle = Math.sin(w.wigglePhase + i * 1.2) * TILE * 0.12;
    const sx = -i * segLen;
    const sy = wiggle;
    const size = TILE * (0.14 - t * 0.04);

    // Body segment
    ctx.fillStyle = i === 0 ? '#D4856A' : '#C47A62';
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();

    // Segment ring
    if (i > 0) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Head highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(TILE * 0.04, -TILE * 0.03, TILE * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Tiny eyes
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(TILE * 0.08, -TILE * 0.05, 1.5, 0, Math.PI * 2);
  ctx.arc(TILE * 0.08, TILE * 0.05, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHUD() {
  // P1 HP
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.p1;
  let hpText = 'P1: ';
  for (let i = 0; i < queens[0].hp; i++) hpText += '\u2665';
  ctx.fillText(hpText, 8, 18);
  if (queens[0].activePowerUp) {
    ctx.fillStyle = COLORS.powerUp;
    ctx.fillText('[' + queens[0].activePowerUp + ']', 100, 18);
  }

  // P2 HP
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.p2;
  hpText = 'P2: ';
  for (let i = 0; i < queens[1].hp; i++) hpText += '\u2665';
  ctx.fillText(hpText, W - 8, 18);
  if (queens[1].activePowerUp) {
    ctx.fillStyle = COLORS.powerUp;
    ctx.fillText('[' + queens[1].activePowerUp + ']', W - 100, 18);
  }

  // Round + score
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ccc';
  ctx.fillText('ROUND ' + roundNum + '  \u00B7  ' + scores[0] + '-' + scores[1], W / 2, 18);

  // Control hints
  ctx.font = '10px monospace';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'left';
  ctx.fillText('WASD+SPACE', 8, H - 8);
  ctx.textAlign = 'right';
  ctx.fillText('ARROWS+ENTER', W - 8, H - 8);
}

function drawTitle() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.moundGold;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('COLONY CLASH', W / 2, H / 2 - 40);

  ctx.fillStyle = '#999';
  ctx.font = '16px monospace';
  ctx.fillText('Queen vs. Queen \u2014 An Ant Colony Battle Arena', W / 2, H / 2 + 10);

  const blink = Math.sin(performance.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = '#ccc';
    ctx.font = '14px monospace';
    ctx.fillText('PRESS ANY KEY TO START', W / 2, H / 2 + 60);
  }

  ctx.fillStyle = COLORS.p1;
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('P1: WASD + SPACE', W / 2 - 150, H / 2 + 110);
  ctx.fillStyle = COLORS.p2;
  ctx.textAlign = 'right';
  ctx.fillText('P2: ARROWS + ENTER', W / 2 + 150, H / 2 + 110);

  ctx.fillStyle = '#666';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Gamepads supported: D-pad/Stick + A/RB/RT to shoot', W / 2, H / 2 + 135);
}

function drawMatchEnd() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  const winner = scores[0] >= 3 ? 0 : 1;
  const col = winner === 0 ? COLORS.p1 : COLORS.p2;

  ctx.fillStyle = col;
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('P' + (winner + 1) + ' WINS!', W / 2, H / 2 - 30);

  ctx.fillStyle = '#ccc';
  ctx.font = '22px monospace';
  ctx.fillText(scores[0] + ' - ' + scores[1], W / 2, H / 2 + 20);

  const blink = Math.sin(performance.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = '#999';
    ctx.font = '14px monospace';
    ctx.fillText('PRESS ANY KEY TO RESTART', W / 2, H / 2 + 70);
  }
}
