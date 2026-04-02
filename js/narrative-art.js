// ─── Narrative Pixel Art (anime-inspired) ────────────────────
// Each function draws an illustration for a narrative page.
// Art is drawn in a region below the text.

const PX = 4; // pixel size for pixel art

function drawPixelBlock(cx, cy, pixels, palette) {
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const c = pixels[y][x];
      if (c === '.') continue; // transparent
      ctx.fillStyle = palette[c] || '#F0F';
      ctx.fillRect(cx + x * PX, cy + y * PX, PX, PX);
    }
  }
}

// ─── Page 0: Underground cavern with two tunnels ─────────────
function drawNarrativeArt0(cx, cy) {
  const t = performance.now() / 1000;

  // Cavern background
  ctx.fillStyle = '#1A1208';
  ctx.fillRect(cx - 160, cy, 320, 160);

  // Dirt layers
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#3D2A14' : '#4A3520';
    ctx.fillRect(cx - 160, cy + i * 20, 320, 20);
  }

  // Left tunnel (blue colony)
  ctx.fillStyle = '#1A1008';
  ctx.beginPath();
  ctx.moveTo(cx - 160, cy + 60);
  ctx.quadraticCurveTo(cx - 80, cy + 50, cx - 20, cy + 80);
  ctx.lineTo(cx - 20, cy + 100);
  ctx.quadraticCurveTo(cx - 80, cy + 80, cx - 160, cy + 90);
  ctx.fill();

  // Right tunnel (red colony)
  ctx.fillStyle = '#1A1008';
  ctx.beginPath();
  ctx.moveTo(cx + 160, cy + 40);
  ctx.quadraticCurveTo(cx + 80, cy + 50, cx + 20, cy + 80);
  ctx.lineTo(cx + 20, cy + 100);
  ctx.quadraticCurveTo(cx + 80, cy + 80, cx + 160, cy + 70);
  ctx.fill();

  // Central cavern (meeting point)
  ctx.fillStyle = '#120D06';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 90, 40, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes in left tunnel (blue)
  const blink1 = Math.sin(t * 2) > 0.8 ? 0 : 1;
  if (blink1) {
    ctx.fillStyle = COLORS.p1;
    ctx.shadowColor = COLORS.p1;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx - 100, cy + 70, 3, 0, Math.PI * 2);
    ctx.arc(cx - 90, cy + 70, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Glowing eyes in right tunnel (red)
  const blink2 = Math.sin(t * 2 + 1) > 0.8 ? 0 : 1;
  if (blink2) {
    ctx.fillStyle = COLORS.p2;
    ctx.shadowColor = COLORS.p2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx + 90, cy + 55, 3, 0, Math.PI * 2);
    ctx.arc(cx + 100, cy + 55, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Sparkle particles in cavern
  for (let i = 0; i < 5; i++) {
    const sparkX = cx + Math.sin(t * 0.7 + i * 1.3) * 30;
    const sparkY = cy + 85 + Math.cos(t * 0.5 + i * 0.9) * 10;
    const alpha = Math.sin(t * 2 + i) * 0.3 + 0.4;
    ctx.fillStyle = `rgba(232,200,64,${alpha})`;
    ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
  }
}

// ─── Page 1: Large anime queen ant with crown ────────────────
function drawNarrativeArt1(cx, cy) {
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 1.5) * 3;

  ctx.save();
  ctx.translate(cx, cy + 60 + bob);

  // Glow aura
  const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
  grad.addColorStop(0, 'rgba(232,200,64,0.15)');
  grad.addColorStop(1, 'rgba(232,200,64,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen
  ctx.fillStyle = '#C83030';
  ctx.beginPath();
  ctx.ellipse(-30, 5, 22, 18, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Abdomen shine
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-25, -3, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Abdomen stripes
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-30 + i * 8, -12);
    ctx.lineTo(-30 + i * 8, 18);
    ctx.stroke();
  }

  // Petiole
  ctx.fillStyle = '#C83030';
  ctx.beginPath();
  ctx.ellipse(-5, 3, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thorax
  ctx.fillStyle = '#C83030';
  ctx.beginPath();
  ctx.ellipse(12, 0, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.ellipse(14, -5, 8, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#C83030';
  ctx.beginPath();
  ctx.ellipse(35, -2, 14, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Big anime eyes
  const blinkAmt = Math.sin(t * 3) > 0.92 ? 0.2 : 1;
  // Left eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(31, -7, 6, 7 * blinkAmt, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#220000';
  ctx.beginPath();
  ctx.ellipse(32, -7, 4, 5 * blinkAmt, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye sparkle
  if (blinkAmt > 0.5) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(30, -9, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Right eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(31, 5, 6, 7 * blinkAmt, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#220000';
  ctx.beginPath();
  ctx.ellipse(32, 5, 4, 5 * blinkAmt, 0, 0, Math.PI * 2);
  ctx.fill();
  if (blinkAmt > 0.5) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(30, 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mandibles (animated)
  const mandOpen = Math.sin(t * 2) * 0.1 + 0.2;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(46, -5);
  ctx.quadraticCurveTo(55, -12 * mandOpen - 5, 58, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(46, 3);
  ctx.quadraticCurveTo(55, 12 * mandOpen + 3, 58, 0);
  ctx.stroke();

  // Antennae
  const sway1 = Math.sin(t * 2.5) * 0.15;
  const sway2 = Math.sin(t * 2.5 + 1.5) * 0.15;
  ctx.strokeStyle = '#C83030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(42, -10);
  ctx.quadraticCurveTo(55, -30 + sway1 * 40, 65, -38 + sway1 * 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(42, 8);
  ctx.quadraticCurveTo(55, 28 + sway2 * 40, 65, 36 + sway2 * 30);
  ctx.stroke();
  // Antenna tips
  ctx.fillStyle = '#C83030';
  ctx.beginPath();
  ctx.arc(65, -38 + sway1 * 30, 3, 0, Math.PI * 2);
  ctx.arc(65, 36 + sway2 * 30, 3, 0, Math.PI * 2);
  ctx.fill();

  // Legs (3 pairs)
  ctx.strokeStyle = '#A02828';
  ctx.lineWidth = 2;
  const legPos = [-20, 0, 15];
  for (let i = 0; i < 3; i++) {
    const phase = Math.sin(t * 3 + i * 1.2) * 4;
    // Top legs
    ctx.beginPath();
    ctx.moveTo(legPos[i], -12);
    ctx.quadraticCurveTo(legPos[i] - 5, -28 + phase, legPos[i] - 12, -35 + phase);
    ctx.stroke();
    // Bottom legs
    ctx.beginPath();
    ctx.moveTo(legPos[i], 14);
    ctx.quadraticCurveTo(legPos[i] - 5, 30 - phase, legPos[i] - 12, 37 - phase);
    ctx.stroke();
  }

  // Crown
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(25, -18);
  ctx.lineTo(28, -28);
  ctx.lineTo(32, -20);
  ctx.lineTo(36, -30);
  ctx.lineTo(40, -20);
  ctx.lineTo(43, -27);
  ctx.lineTo(45, -16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FF4444';
  ctx.beginPath();
  ctx.arc(35, -24, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Page 2: Action scene — shooting acid ────────────────────
function drawNarrativeArt2(cx, cy) {
  const t = performance.now() / 1000;

  // Blue queen on left shooting
  ctx.save();
  ctx.translate(cx - 80, cy + 60);

  // Body
  ctx.fillStyle = COLORS.p1;
  ctx.beginPath();
  ctx.ellipse(-12, 0, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(2, 0, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(14, 0, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(18, -3, 3, 0, Math.PI * 2);
  ctx.arc(18, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(19, -3, 1.5, 0, Math.PI * 2);
  ctx.arc(19, 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Crown
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(10, -10); ctx.lineTo(12, -16); ctx.lineTo(15, -11);
  ctx.lineTo(17, -17); ctx.lineTo(20, -10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Acid projectiles flying right
  for (let i = 0; i < 4; i++) {
    const bx = cx - 50 + ((t * 80 + i * 40) % 160);
    const by = cy + 58 + Math.sin(t * 5 + i) * 3;
    const alpha = 1 - ((t * 80 + i * 40) % 160) / 160;
    ctx.fillStyle = `rgba(136,255,68,${alpha})`;
    ctx.shadowColor = '#88FF44';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Dirt wall being destroyed on right
  const explodePhase = (t * 0.8) % 1;
  const wallX = cx + 80;
  const wallY = cy + 40;

  // Remaining dirt blocks
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      if (dy < 2 && dx === 1 && explodePhase > 0.5) continue; // hole
      ctx.fillStyle = COLORS.dirt;
      ctx.fillRect(wallX + dx * 14, wallY + dy * 14, 13, 13);
      ctx.strokeStyle = COLORS.dirtBord;
      ctx.lineWidth = 1;
      ctx.strokeRect(wallX + dx * 14, wallY + dy * 14, 13, 13);
    }
  }

  // Explosion particles
  if (explodePhase > 0.4 && explodePhase < 0.8) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = (explodePhase - 0.4) * 80;
      const px = wallX + 14 + Math.cos(angle) * dist;
      const py = wallY + 14 + Math.sin(angle) * dist;
      ctx.fillStyle = COLORS.dirtBord;
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }
  }

  // Spawn mound with golden glow
  const moundX = cx + 30;
  const moundY = cy + 90;
  const pulse = Math.sin(t * 3) * 0.3 + 0.7;
  ctx.fillStyle = COLORS.moundGold;
  ctx.globalAlpha = pulse;
  ctx.fillRect(moundX, moundY, 18, 18);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.moundGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(moundX, moundY, 18, 18);

  // Small soldier ants emerging
  for (let i = 0; i < 2; i++) {
    const sx = moundX + 9 + Math.sin(t * 2 + i * 3) * 20;
    const sy = moundY - 5 - i * 12;
    ctx.fillStyle = COLORS.p1;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 5, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Page 3: Power-ups display ───────────────────────────────
function drawNarrativeArt3(cx, cy) {
  const t = performance.now() / 1000;
  const items = [
    { label: 'S', color: '#FFFFFF', name: 'Speed', glow: '#AAEEFF' },
    { label: 'R', color: '#FF6644', name: 'Rapid', glow: '#FF6644' },
    { label: 'A', color: '#88DDFF', name: 'Shield', glow: '#88DDFF' },
    { label: 'M', color: '#88FF44', name: 'Mega', glow: '#88FF44' },
  ];

  const spacing = 80;
  const startX = cx - (items.length - 1) * spacing / 2;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const ix = startX + i * spacing;
    const iy = cy + 50;
    const bounce = Math.sin(t * 2 + i * 0.8) * 5;

    // Glow
    ctx.save();
    ctx.shadowColor = item.glow;
    ctx.shadowBlur = 12 + Math.sin(t * 3 + i) * 5;

    // Orb
    ctx.fillStyle = COLORS.moundGold;
    ctx.beginPath();
    ctx.arc(ix, iy + bounce, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    // Label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, ix, iy + bounce + 5);

    // Sparkle orbiting
    const sparkAngle = t * 3 + i * 1.5;
    const sparkX = ix + Math.cos(sparkAngle) * 22;
    const sparkY = iy + bounce + Math.sin(sparkAngle) * 22;
    ctx.fillStyle = item.glow;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Name below
    ctx.fillStyle = item.color;
    ctx.font = '10px monospace';
    ctx.fillText(item.name, ix, iy + 35 + bounce);
  }
}

// ─── Page 4: Two ants facing off ─────────────────────────────
function drawNarrativeArt4(cx, cy) {
  const t = performance.now() / 1000;

  // VS divider
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VS', cx, cy + 65);

  // Blue queen (left)
  drawNarrativeQueen(cx - 70, cy + 60, COLORS.p1, t, false);

  // Red queen (right)
  drawNarrativeQueen(cx + 70, cy + 60, COLORS.p2, t, true);

  // Lightning between them
  ctx.strokeStyle = `rgba(255,215,0,${Math.sin(t * 6) * 0.3 + 0.5})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 25, cy + 55);
  ctx.lineTo(cx - 10, cy + 65);
  ctx.lineTo(cx - 18, cy + 65);
  ctx.lineTo(cx, cy + 75);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 25, cy + 55);
  ctx.lineTo(cx + 10, cy + 65);
  ctx.lineTo(cx + 18, cy + 65);
  ctx.lineTo(cx, cy + 75);
  ctx.stroke();
}

function drawNarrativeQueen(x, y, color, t, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  const bob = Math.sin(t * 2) * 2;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(-10, bob, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(2, bob, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, bob, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(16, bob - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(17, bob - 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Sparkle
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(15, bob - 4.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Crown
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(8, bob - 9); ctx.lineTo(10, bob - 15); ctx.lineTo(13, bob - 10);
  ctx.lineTo(15, bob - 16); ctx.lineTo(18, bob - 9);
  ctx.closePath();
  ctx.fill();

  // Antennae
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const sway = Math.sin(t * 3) * 5;
  ctx.beginPath();
  ctx.moveTo(17, bob - 5);
  ctx.quadraticCurveTo(25, bob - 18 + sway, 30, bob - 22 + sway);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(17, bob + 2);
  ctx.quadraticCurveTo(25, bob + 15 - sway, 30, bob + 19 - sway);
  ctx.stroke();

  ctx.restore();
}

// ─── Master dispatch ─────────────────────────────────────────
const NARRATIVE_ART = [
  drawNarrativeArt0,
  drawNarrativeArt1,
  drawNarrativeArt2,
  drawNarrativeArt3,
  drawNarrativeArt4,
];
