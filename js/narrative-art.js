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

// ─── Page 1: Three champions showcase ────────────────────────
function drawNarrativeArt1(cx, cy) {
  const t = performance.now() / 1000;
  const chars = [
    { name: 'ANT', color: '#C83030', x: -90, ability: 'TRAPS' },
    { name: 'BEETLE', color: '#3066C8', x: 0, ability: 'FLIGHT' },
    { name: 'COCKROACH', color: '#30A830', x: 90, ability: 'DEFLECT' },
  ];

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const bob = Math.sin(t * 1.5 + i * 1) * 4;
    const px = cx + c.x;
    const py = cy + 50 + bob;

    // Glow
    ctx.save();
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 15 + Math.sin(t * 2 + i) * 5;

    ctx.translate(px, py);

    if (c.name === 'ANT') {
      // Ant body
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.ellipse(-12, 0, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2, 0, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(14, 0, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(18, -3, 3, 0, Math.PI * 2); ctx.arc(18, 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(19, -3, 1.5, 0, Math.PI * 2); ctx.arc(19, 3, 1.5, 0, Math.PI * 2); ctx.fill();
      // Crown
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(10, -10); ctx.lineTo(12, -16); ctx.lineTo(15, -11);
      ctx.lineTo(17, -17); ctx.lineTo(20, -10);
      ctx.closePath(); ctx.fill();
      // Antennae
      ctx.strokeStyle = c.color; ctx.lineWidth = 1.5;
      const sw = Math.sin(t * 3 + i) * 4;
      ctx.beginPath(); ctx.moveTo(20, -5); ctx.quadraticCurveTo(28, -16 + sw, 32, -20 + sw); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, 3); ctx.quadraticCurveTo(28, 14 - sw, 32, 18 - sw); ctx.stroke();
    } else if (c.name === 'BEETLE') {
      // Beetle — round armored body
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
      // Shell line
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
      // Shell shine
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.ellipse(-4, -4, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
      // Head
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.ellipse(14, 0, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(17, -3, 2.5, 0, Math.PI * 2); ctx.arc(17, 3, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(18, -3, 1.2, 0, Math.PI * 2); ctx.arc(18, 3, 1.2, 0, Math.PI * 2); ctx.fill();
      // Wings (if flying animation)
      const wingFlap = Math.sin(t * 8) * 0.3;
      ctx.fillStyle = 'rgba(150,200,255,0.25)';
      ctx.beginPath(); ctx.ellipse(-5, -14 + wingFlap * 10, 12, 5, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-5, 14 - wingFlap * 10, 12, 5, 0.4, 0, Math.PI * 2); ctx.fill();
      // Crown
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(10, -8); ctx.lineTo(12, -14); ctx.lineTo(15, -9);
      ctx.lineTo(17, -15); ctx.lineTo(20, -8);
      ctx.closePath(); ctx.fill();
    } else if (c.name === 'COCKROACH') {
      // Cockroach — flat oval body
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.ellipse(-8, 0, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
      // Shell plates
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(-8, 0, 10, 9, 0.1, 0, Math.PI * 2); ctx.stroke();
      // Head
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.ellipse(10, 0, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(14, -3, 2.5, 0, Math.PI * 2); ctx.arc(14, 3, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(15, -3, 1.2, 0, Math.PI * 2); ctx.arc(15, 3, 1.2, 0, Math.PI * 2); ctx.fill();
      // Long antennae
      ctx.strokeStyle = c.color; ctx.lineWidth = 1;
      const csw = Math.sin(t * 4 + i) * 6;
      ctx.beginPath(); ctx.moveTo(15, -4); ctx.quadraticCurveTo(25, -15 + csw, 35, -20 + csw); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, 4); ctx.quadraticCurveTo(25, 15 - csw, 35, 20 - csw); ctx.stroke();
      // Shield shimmer
      const shimmer = Math.sin(t * 3 + i) * 0.3 + 0.3;
      ctx.strokeStyle = `rgba(100,255,100,${shimmer})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.stroke();
      // Crown
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(6, -8); ctx.lineTo(8, -14); ctx.lineTo(11, -9);
      ctx.lineTo(13, -15); ctx.lineTo(16, -8);
      ctx.closePath(); ctx.fill();
    }

    ctx.restore();

    // Label below
    ctx.fillStyle = c.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c.name, px, cy + 85);
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText(c.ability, px, cy + 97);
  }
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

// ─── Page 5 (new): Worms and underground life ───────────────
function drawNarrativeArtWorms(cx, cy) {
  const t = performance.now() / 1000;

  // Dirt cross-section
  ctx.fillStyle = '#3D2A14';
  ctx.fillRect(cx - 120, cy + 10, 240, 80);
  ctx.fillStyle = '#4A3520';
  ctx.fillRect(cx - 120, cy + 30, 240, 20);
  ctx.fillStyle = '#3D2A14';
  ctx.fillRect(cx - 120, cy + 60, 240, 30);

  // Tunnel carved through
  ctx.fillStyle = '#1A1008';
  ctx.beginPath();
  ctx.moveTo(cx - 120, cy + 40);
  ctx.quadraticCurveTo(cx - 40, cy + 30, cx, cy + 45);
  ctx.quadraticCurveTo(cx + 40, cy + 60, cx + 120, cy + 50);
  ctx.lineTo(cx + 120, cy + 65);
  ctx.quadraticCurveTo(cx + 40, cy + 75, cx, cy + 60);
  ctx.quadraticCurveTo(cx - 40, cy + 45, cx - 120, cy + 55);
  ctx.fill();

  // Worms in the dirt (wiggling)
  for (let w = 0; w < 3; w++) {
    const wx = cx - 60 + w * 60;
    const wy = cy + 25 + (w % 2) * 35;
    ctx.strokeStyle = '#D4856A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    for (let s = 1; s <= 4; s++) {
      const sx = wx + s * 8;
      const sy = wy + Math.sin(t * 4 + w + s * 1.2) * 4;
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    // Head
    ctx.fillStyle = '#D4856A';
    ctx.beginPath();
    ctx.arc(wx, wy, 3, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(wx + 1, wy - 1.5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heart icon floating up (HP restore)
  const heartY = cy + 15 + Math.sin(t * 2) * 5;
  ctx.fillStyle = '#FF4444';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u2665', cx + 80, heartY);
  ctx.fillStyle = '#44FF44';
  ctx.font = '12px monospace';
  ctx.fillText('+1', cx + 95, heartY);

  // Small queen eating worm
  const qx = cx - 90, qy = cy + 48;
  ctx.fillStyle = COLORS.p1;
  ctx.beginPath();
  ctx.ellipse(qx, qy, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(qx + 8, qy, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(qx + 5, qy - 6); ctx.lineTo(qx + 7, qy - 10);
  ctx.lineTo(qx + 9, qy - 6); ctx.lineTo(qx + 11, qy - 10);
  ctx.lineTo(qx + 13, qy - 5);
  ctx.closePath();
  ctx.fill();
}

// ─── Page 6 (new): The Anteater ──────────────────────────────
function drawNarrativeArtAnteater(cx, cy) {
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 1.2) * 3;

  ctx.save();
  ctx.translate(cx, cy + 55 + bob);

  // Shadow beneath
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 30, 60, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bushy tail
  const tailWag = Math.sin(t * 2.5) * 0.15;
  ctx.save();
  ctx.translate(-55, -5);
  ctx.rotate(tailWag);
  ctx.fillStyle = '#5A4210';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 28, 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hind body
  ctx.fillStyle = '#6B4F10';
  ctx.beginPath();
  ctx.ellipse(-30, 0, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main body
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body stripe
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 20, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.ellipse(25, -3, 15, 13, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Long snout
  ctx.fillStyle = '#A07820';
  ctx.beginPath();
  ctx.moveTo(35, -5);
  ctx.quadraticCurveTo(60, -3, 75, 0);
  ctx.quadraticCurveTo(60, 3, 35, 5);
  ctx.closePath();
  ctx.fill();

  // Tongue lashing out (animated)
  const tongueLen = (Math.sin(t * 2) + 1) * 25;
  if (tongueLen > 10) {
    ctx.strokeStyle = '#FF6688';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const wave = Math.sin(t * 15) * 3;
    ctx.beginPath();
    ctx.moveTo(75, 0);
    ctx.quadraticCurveTo(75 + tongueLen / 2, wave, 75 + tongueLen, wave * 0.5);
    ctx.stroke();
    // Tongue tip
    ctx.fillStyle = '#FF4466';
    ctx.beginPath();
    ctx.arc(75 + tongueLen, wave * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eye (menacing red glint)
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(30, -10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#CC2222';
  ctx.beginPath();
  ctx.arc(29, -11, 2, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.fillStyle = '#6B4F10';
  ctx.beginPath();
  ctx.ellipse(22, -16, 5, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#6B4F10';
  const legSwing = Math.sin(t * 3);
  const legPairs = [[-20, 1], [-20, -1], [10, 1], [10, -1]];
  for (let i = 0; i < legPairs.length; i++) {
    const [lx, side] = legPairs[i];
    const sw = (i % 2 === 0 ? legSwing : -legSwing) * 5;
    ctx.beginPath();
    ctx.ellipse(lx + sw, side * 22, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Claws
    ctx.fillStyle = '#444';
    for (let c = -1; c <= 1; c++) {
      ctx.beginPath();
      ctx.arc(lx + sw + c * 3, side * 29, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#6B4F10';
  }

  // Nostrils
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(73, -1.5, 1.5, 0, Math.PI * 2);
  ctx.arc(73, 1.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Danger indicator
  const flash = Math.sin(t * 4) > 0;
  if (flash) {
    ctx.fillStyle = '#CC3333';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!! DANGER !!', cx, cy + 105);
  }
}

// ─── Master dispatch ─────────────────────────────────────────
const NARRATIVE_ART = [
  drawNarrativeArt0,         // Deep beneath the earth
  drawNarrativeArt1,         // You are the queen
  drawNarrativeArt2,         // Dig. Fight. Conquer.
  drawNarrativeArtWorms,     // Underground life (worms)
  drawNarrativeArtAnteater,  // The Anteater
  drawNarrativeArt3,         // Power of the Colony
  drawNarrativeArt4,         // How to Play
];
