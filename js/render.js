// ─── Drawing ─────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  if (gameState === STATE.NARRATIVE) {
    drawNarrative();
    return;
  }

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

  // Apply screen shake
  ctx.save();
  if (screenShake > 0.5) {
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
  }

  // Draw map
  const now = performance.now();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[y][x];
      const px = x * TILE, py = y * TILE;
      const seed = (tileSeed[y] && tileSeed[y][x]) || 0;

      if (t === T.DIRT) {
        // Per-tile color variation
        const bright = Math.floor(seed * 12) - 6;
        const r = 0x5C + bright, g = 0x40 + Math.floor(bright * 0.6), b = 0x23 + Math.floor(bright * 0.3);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, TILE, TILE);
        // Border
        ctx.strokeStyle = COLORS.dirtBord;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        // Randomized grain lines using seed (scaled to tile size)
        ctx.strokeStyle = COLORS.dirtBord;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        const S = TILE / 32; // scale factor relative to base 32px
        const ox = seed * 8 * S, oy = seed * 6 * S;
        ctx.moveTo(px + 3*S + ox, py + 8*S + oy); ctx.lineTo(px + 14*S + ox, py + 8*S + oy);
        ctx.moveTo(px + 10*S - ox, py + 20*S - oy); ctx.lineTo(px + 25*S - ox, py + 20*S - oy);
        ctx.moveTo(px + 2*S + oy, py + 15*S + ox); ctx.lineTo(px + 9*S + oy, py + 15*S + ox);
        ctx.stroke();
        // Pebble dots on ~25% of tiles
        if (seed > 0.75) {
          ctx.fillStyle = 'rgba(100,80,55,0.6)';
          ctx.beginPath();
          ctx.arc(px + (10 + seed * 12) * S, py + (12 + seed * 8) * S, 1.5 * S, 0, Math.PI * 2);
          ctx.fill();
          if (seed > 0.88) {
            ctx.beginPath();
            ctx.arc(px + (22 - seed * 6) * S, py + (24 - seed * 4) * S, 1 * S, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (t === T.ROCK) {
        const S = TILE / 32;
        // Base with subtle per-tile variation
        const rb = Math.floor(seed * 16) - 8;
        ctx.fillStyle = `rgb(${0x6B + rb},${0x6B + rb},${0x6B + rb})`;
        ctx.fillRect(px, py, TILE, TILE);
        // Shadow bevel (bottom-right darker)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(px + TILE - 4*S, py + 4*S, 4*S, TILE - 4*S);
        ctx.fillRect(px + 4*S, py + TILE - 4*S, TILE - 4*S, 4*S);
        // Light bevel (top-left lighter)
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px, py, TILE - 4*S, 3*S);
        ctx.fillRect(px, py, 3*S, TILE - 4*S);
        // Border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        // Seed-based highlight positions
        const hx1 = (4 + Math.floor(seed * 10)) * S, hy1 = (4 + Math.floor(seed * 8)) * S;
        const hx2 = (14 + Math.floor(seed * 8)) * S, hy2 = (14 + Math.floor(seed * 6)) * S;
        ctx.fillStyle = COLORS.rockHi;
        ctx.fillRect(px + hx1, py + hy1, 7*S, 4*S);
        ctx.fillRect(px + hx2, py + hy2, 5*S, 4*S);
        // Crack lines on ~30% of rocks
        if (seed > 0.7) {
          ctx.strokeStyle = 'rgba(40,40,40,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + (8 + seed * 10) * S, py + 4*S);
          ctx.lineTo(px + (12 + seed * 6) * S, py + 14*S);
          ctx.lineTo(px + (10 + seed * 8) * S, py + 24*S);
          ctx.stroke();
        }
      } else if (t === T.PUDDLE) {
        const S = TILE / 32;
        ctx.fillStyle = COLORS.puddle;
        ctx.fillRect(px, py, TILE, TILE);
        // Animated dual wave lines
        ctx.strokeStyle = '#4080D0';
        ctx.lineWidth = 1;
        const waveOff = Math.sin(now / 800 + seed * Math.PI * 2) * 3 * S;
        const waveOff2 = Math.sin(now / 600 + seed * Math.PI * 4) * 2 * S;
        ctx.beginPath();
        ctx.moveTo(px + 2*S, py + 10*S + waveOff);
        ctx.quadraticCurveTo(px + 12*S, py + 6*S + waveOff, px + 22*S, py + 10*S + waveOff);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(100,160,230,0.5)';
        ctx.beginPath();
        ctx.moveTo(px + 5*S, py + 18*S + waveOff2);
        ctx.quadraticCurveTo(px + 16*S, py + 22*S + waveOff2, px + 28*S, py + 18*S + waveOff2);
        ctx.stroke();
        // Subtle shimmer highlight
        ctx.fillStyle = 'rgba(150,200,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(px + 10*S + waveOff, py + 14*S, 4*S, 2*S, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === T.LEAF) {
        ctx.fillStyle = COLORS.dug;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.leaf;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(px + 8, py + 10, 6, 4, 0.3 + seed, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + 16, py + 16, 5, 3, -0.5 + seed * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Leaf vein
        ctx.strokeStyle = 'rgba(30,50,20,0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(px + 5, py + 10);
        ctx.lineTo(px + 11, py + 10);
        ctx.stroke();
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
        const rtl = (up || left) ? (up && left ? 0 : r * 0.5) : r;
        const rtr = (up || right) ? (up && right ? 0 : r * 0.5) : r;
        const rbr = (down || right) ? (down && right ? 0 : r * 0.5) : r;
        const rbl = (down || left) ? (down && left ? 0 : r * 0.5) : r;
        ctx.fillStyle = COLORS.dug;
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
        // Inner shadow for depth
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // Draw spawn mounds
  for (const mound of mounds) {
    const mx = mound.x * TILE + TILE / 2, my = mound.y * TILE + TILE / 2;
    const pulse = Math.sin(now / 200) * 0.3 + 0.7;

    if (mound.state === 'ACTIVE') {
      // Sonar ring beacon
      const ringPhase = (now / 1000) % 1;
      ctx.strokeStyle = COLORS.moundGold;
      ctx.lineWidth = 2;
      ctx.globalAlpha = (1 - ringPhase) * 0.5;
      ctx.beginPath();
      ctx.arc(mx, my, TILE * 0.3 + ringPhase * TILE * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Dome shape
      const grad = ctx.createRadialGradient(mx - 3, my - 3, 1, mx, my, TILE * 0.4);
      grad.addColorStop(0, '#FFE070');
      grad.addColorStop(1, '#C8A020');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, TILE * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Pulsing glow
      ctx.globalAlpha = pulse * 0.3;
      ctx.fillStyle = COLORS.moundGold;
      ctx.beginPath();
      ctx.arc(mx, my, TILE * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Sparkle dot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(mx - 4, my - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (mound.state === 'CLAIMED') {
      const col = mound.claimedBy === 'blue' ? COLORS.p1 : COLORS.p2;
      // Colony-colored dome
      const grad = ctx.createRadialGradient(mx - 3, my - 3, 1, mx, my, TILE * 0.4);
      grad.addColorStop(0, COLORS.moundGold);
      grad.addColorStop(1, col);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, TILE * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Colony border
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, TILE * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      // Flag marker
      ctx.fillStyle = col;
      ctx.fillRect(mx - 1, my - TILE * 0.5, 2, TILE * 0.35);
      ctx.beginPath();
      ctx.moveTo(mx + 1, my - TILE * 0.5);
      ctx.lineTo(mx + 8, my - TILE * 0.4);
      ctx.lineTo(mx + 1, my - TILE * 0.3);
      ctx.fill();
    }
  }

  // Draw power-ups with unique colors and icons
  for (const powerUp of powerUps) {
    const pcx = powerUp.x * TILE + TILE / 2, pcy = powerUp.y * TILE + TILE / 2;
    const pulse = Math.sin(now / 250) * 0.3 + 0.7;
    const col = POWER_COLORS[powerUp.type] || COLORS.powerUp;

    // Outer pulsing ring
    ctx.globalAlpha = pulse * 0.3;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pcx, pcy, TILE * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Filled circle with gradient
    const pg = ctx.createRadialGradient(pcx - 2, pcy - 2, 1, pcx, pcy, TILE * 0.35);
    pg.addColorStop(0, '#fff');
    pg.addColorStop(0.3, col);
    pg.addColorStop(1, col);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pcx, pcy, TILE * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Type-specific icons
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    if (powerUp.type === 'SUGAR') {
      // Crystal dots
      for (let ci = 0; ci < 3; ci++) {
        const a = (ci / 3) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(pcx + Math.cos(a) * 5, pcy + Math.sin(a) * 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (powerUp.type === 'RAPID') {
      // Speed lines
      ctx.beginPath();
      ctx.moveTo(pcx - 5, pcy - 3); ctx.lineTo(pcx + 5, pcy - 3);
      ctx.moveTo(pcx - 3, pcy); ctx.lineTo(pcx + 7, pcy);
      ctx.moveTo(pcx - 5, pcy + 3); ctx.lineTo(pcx + 5, pcy + 3);
      ctx.stroke();
    } else if (powerUp.type === 'SHIELD') {
      // Shield arc
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pcx, pcy, 6, -Math.PI * 0.8, Math.PI * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pcx, pcy, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (powerUp.type === 'MEGA') {
      // Starburst
      for (let si = 0; si < 4; si++) {
        const a = (si / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(pcx, pcy);
        ctx.lineTo(pcx + Math.cos(a) * 7, pcy + Math.sin(a) * 7);
        ctx.stroke();
      }
    }
  }

  // Draw worms (only visible once dirt is dug away)
  for (const w of worms) {
    const tile = map[w.y][w.x];
    if (tile === T.DUG || tile === T.TUNNEL) {
      drawWorm(w, 1);
    } else if (tile === T.DIRT) {
      drawWorm(w, 0.25);
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
      ctx.globalAlpha = 0.6 + Math.sin(now / 150) * 0.3;
      ctx.beginPath();
      ctx.arc(q.x * TILE + TILE / 2, q.y * TILE + TILE / 2, TILE * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      // Second ring for glow effect
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(q.x * TILE + TILE / 2, q.y * TILE + TILE / 2, TILE * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Draw bullets with glow
  for (const b of bullets) {
    const bpx = b.x * TILE, bpy = b.y * TILE;
    const isMega = b.blast >= 3;
    const radius = isMega ? 7 : 4;
    const glowCol = isMega ? '#FFAA44' : '#88FF44';

    ctx.save();
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = isMega ? 16 : 10;
    // Direction-aware ellipse
    ctx.translate(bpx, bpy);
    ctx.rotate(Math.atan2(b.dy, b.dx));
    ctx.fillStyle = glowCol;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.4, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bright core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.5, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw particles (upgraded: round with types)
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life / 0.4);
    if (p.type === 'trail') {
      // Glowing trail particle
      ctx.fillStyle = p.color;
      ctx.globalAlpha *= 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'sparkle') {
      // 4-point star
      ctx.fillStyle = p.color;
      const ss = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - ss);
      ctx.lineTo(p.x + ss * 0.3, p.y);
      ctx.lineTo(p.x, p.y + ss);
      ctx.lineTo(p.x - ss * 0.3, p.y);
      ctx.closePath();
      ctx.fill();
    } else {
      // Default round particle
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Vignette overlay
  ctx.drawImage(vignetteCanvas, 0, 0);

  // Ambient dust motes
  for (const d of dustMotes) {
    ctx.fillStyle = 'rgba(180,160,120,' + d.alpha + ')';
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // End screen shake transform
  ctx.restore();

  // Draw HUD (outside shake transform)
  drawHUD();

  // Countdown overlay
  if (gameState === STATE.COUNTDOWN) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    const num = Math.ceil(countdownTimer);
    // Bounce scale effect
    const frac = countdownTimer - Math.floor(countdownTimer);
    const scale = 1 + Math.max(0, frac - 0.7) * 2;
    ctx.save();
    ctx.translate(W / 2, H / 2 + 20);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(num, 0, 0);
    ctx.restore();
    ctx.fillStyle = '#ccc';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
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

  // Pause overlay
  if (gameState === STATE.PAUSED) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 10);
    ctx.fillStyle = '#999';
    ctx.font = '16px monospace';
    ctx.fillText('Press ESC to resume', W / 2, H / 2 + 35);
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

// ─── Helper: rounded rect ───
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Helper: draw heart shape ───
function drawHeart(cx, cy, size, filled) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, size * 0.1, 0, size);
  ctx.bezierCurveTo(size, size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
  ctx.closePath();
  if (filled) ctx.fill();
  else ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  const panelAlpha = 0.35;

  // P1 panel (left)
  ctx.fillStyle = 'rgba(0,0,0,' + panelAlpha + ')';
  roundRect(4, 4, 140, 22, 6);
  ctx.fill();

  // P1 label
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.p1;
  ctx.fillText('P1', 10, 19);

  // P1 hearts
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < queens[0].hp ? COLORS.p1 : 'rgba(100,100,100,0.4)';
    ctx.strokeStyle = i < queens[0].hp ? COLORS.p1 : 'rgba(100,100,100,0.4)';
    ctx.lineWidth = 1;
    drawHeart(36 + i * 16, 8, 6, i < queens[0].hp);
  }

  // P1 power-up indicator
  if (queens[0].activePowerUp) {
    const pcol = POWER_COLORS[queens[0].activePowerUp] || COLORS.powerUp;
    ctx.fillStyle = pcol;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(queens[0].activePowerUp, 88, 18);
    // Timer bar
    if (queens[0].powerUpTimer > 0) {
      const barW = 48 * Math.min(1, queens[0].powerUpTimer / 80);
      ctx.fillStyle = pcol;
      ctx.fillRect(88, 20, barW, 2);
    }
  }

  // P2 panel (right)
  ctx.fillStyle = 'rgba(0,0,0,' + panelAlpha + ')';
  roundRect(W - 144, 4, 140, 22, 6);
  ctx.fill();

  // P2 label
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.p2;
  ctx.fillText('P2', W - 10, 19);

  // P2 hearts
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < queens[1].hp ? COLORS.p2 : 'rgba(100,100,100,0.4)';
    ctx.strokeStyle = i < queens[1].hp ? COLORS.p2 : 'rgba(100,100,100,0.4)';
    ctx.lineWidth = 1;
    drawHeart(W - 82 + i * 16, 8, 6, i < queens[1].hp);
  }

  // P2 power-up indicator
  if (queens[1].activePowerUp) {
    const pcol = POWER_COLORS[queens[1].activePowerUp] || COLORS.powerUp;
    ctx.fillStyle = pcol;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(queens[1].activePowerUp, W - 88, 18);
    if (queens[1].powerUpTimer > 0) {
      const barW = 48 * Math.min(1, queens[1].powerUpTimer / 80);
      ctx.fillStyle = pcol;
      ctx.fillRect(W - 88 - barW, 20, barW, 2);
    }
  }

  // Round + score (center)
  ctx.fillStyle = 'rgba(0,0,0,' + panelAlpha + ')';
  roundRect(W / 2 - 80, 4, 160, 22, 6);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ccc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ROUND ' + roundNum + '  \u00B7  ' + scores[0] + '-' + scores[1], W / 2, 19);

  // Control hints
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.textAlign = 'left';
  ctx.fillText('WASD+SPACE', 8, H - 8);
  ctx.textAlign = 'right';
  ctx.fillText('ARROWS+ENTER', W - 8, H - 8);
}

function drawNarrative() {
  ctx.fillStyle = '#0E0A05';
  ctx.fillRect(0, 0, W, H);

  const page = NARRATIVE_PAGES[narrativePage];
  const fullText = page.lines.join('\n');
  const visibleText = fullText.substring(0, narrativeCharIndex);
  const visibleLines = visibleText.split('\n');

  // Subtle vignette
  const grad = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.7);
  grad.addColorStop(0, 'rgba(30,20,10,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Page indicator dots
  ctx.textAlign = 'center';
  const dotY = H * 0.18;
  for (let i = 0; i < NARRATIVE_PAGES.length; i++) {
    ctx.fillStyle = i === narrativePage ? page.color : '#333';
    ctx.beginPath();
    const dotX = W / 2 + (i - (NARRATIVE_PAGES.length - 1) / 2) * 18;
    ctx.arc(dotX, dotY, i === narrativePage ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.fillStyle = page.color;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  const titleY = H * 0.3;
  ctx.fillText(page.title, W / 2, titleY);

  // Underline
  const titleWidth = ctx.measureText(page.title).width;
  ctx.strokeStyle = page.color;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - titleWidth / 2, titleY + 8);
  ctx.lineTo(W / 2 + titleWidth / 2, titleY + 8);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Body text with typewriter effect
  ctx.fillStyle = '#B8A888';
  ctx.font = '15px monospace';
  ctx.textAlign = 'center';
  const lineHeight = 24;
  const startY = titleY + 50;

  for (let i = 0; i < visibleLines.length; i++) {
    const line = visibleLines[i];
    // Color highlights for special lines
    if (line.includes('[S]') || line.includes('[R]') || line.includes('[A]') || line.includes('[M]')) {
      ctx.fillStyle = COLORS.moundGold;
    } else if (line.includes('PLAYER 1')) {
      ctx.fillStyle = '#AAA';
    } else {
      ctx.fillStyle = '#B8A888';
    }
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  }

  // Pixel art illustration
  if (NARRATIVE_ART[narrativePage]) {
    NARRATIVE_ART[narrativePage](W / 2, startY + visibleLines.length * lineHeight + 20);
  }

  // Blinking cursor at end of text
  if (!narrativePageReady && Math.sin(performance.now() / 300) > 0) {
    const lastLine = visibleLines[visibleLines.length - 1] || '';
    const lastLineWidth = ctx.measureText(lastLine).width;
    const cursorX = W / 2 + lastLineWidth / 2 + 4;
    const cursorY = startY + (visibleLines.length - 1) * lineHeight;
    ctx.fillStyle = page.color;
    ctx.fillRect(cursorX, cursorY - 12, 8, 15);
  }

  // Bottom prompt
  if (narrativePageReady) {
    const blink = Math.sin(performance.now() / 400) > 0;
    if (blink) {
      ctx.fillStyle = '#666';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      const isLast = narrativePage >= NARRATIVE_PAGES.length - 1;
      ctx.fillText(isLast ? 'PRESS ANY KEY TO BEGIN' : 'PRESS ANY KEY TO CONTINUE', W / 2, H * 0.85);
    }
  }

  // Skip hint
  ctx.fillStyle = '#444';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Press any key to skip', W - 20, H - 15);
}

function drawTitle() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // Vignette on title
  ctx.drawImage(vignetteCanvas, 0, 0);

  // Animated ant silhouettes walking across
  const now = performance.now();
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 5; i++) {
    const ax = ((now / 40 + i * W / 5) % (W + 60)) - 30;
    const ay = H * 0.3 + i * 40 + Math.sin(now / 1000 + i) * 10;
    drawAnt(ax / TILE, ay / TILE, 'right', '#fff', 0.5, 1, false, now / 100 + i, 3);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.moundGold;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('COLONY CLASH', W / 2, H / 2 - 40);

  // Title glow
  ctx.save();
  ctx.shadowColor = COLORS.moundGold;
  ctx.shadowBlur = 20;
  ctx.fillText('COLONY CLASH', W / 2, H / 2 - 40);
  ctx.restore();

  ctx.fillStyle = '#999';
  ctx.font = '16px monospace';
  ctx.fillText('Queen vs. Queen \u2014 An Ant Colony Battle Arena', W / 2, H / 2 + 10);

  const blink = Math.sin(now / 500) > 0;
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
  ctx.drawImage(vignetteCanvas, 0, 0);

  const winner = scores[0] >= 3 ? 0 : 1;
  const col = winner === 0 ? COLORS.p1 : COLORS.p2;

  // Glow title
  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = 25;
  ctx.fillStyle = col;
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('P' + (winner + 1) + ' WINS!', W / 2, H / 2 - 30);
  ctx.restore();

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
