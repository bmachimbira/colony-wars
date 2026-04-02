// ─── Map Generation ──────────────────────────────────────────
function generateMap() {
  map = [];
  for (let y = 0; y < ROWS; y++) {
    map[y] = [];
    for (let x = 0; x < COLS; x++) {
      map[y][x] = T.DIRT;
    }
  }

  // Queen chambers — 3x3 clear zones (4 corners)
  const p1cx = 3, p1cy = ROWS - 4;
  const p2cx = COLS - 4, p2cy = 3;
  const p3cx = 3, p3cy = 3;
  const p4cx = COLS - 4, p4cy = ROWS - 4;
  clearChamber(p1cx, p1cy);
  clearChamber(p2cx, p2cy);
  if (playerCount >= 3) clearChamber(p3cx, p3cy);
  if (playerCount >= 4) clearChamber(p4cx, p4cy);

  // Rock obstacles — fill ~15% of the playing field
  const targetRocks = Math.floor(COLS * ROWS * 0.15);
  let rockCount = 0;
  while (rockCount < targetRocks) {
    let rx, ry;
    do {
      rx = 2 + Math.floor(gameRandom() * (COLS - 4));
      ry = 2 + Math.floor(gameRandom() * (ROWS - 4));
    } while (nearAnyChamber(rx, ry));
    const size = 5 + Math.floor(gameRandom() * 8);
    for (let i = 0; i < size && rockCount < targetRocks; i++) {
      const ox = rx + Math.floor(gameRandom() * 4) - 1;
      const oy = ry + Math.floor(gameRandom() * 4) - 1;
      if (ox >= 0 && ox < COLS && oy >= 0 && oy < ROWS && map[oy][ox] !== T.ROCK) {
        if (!nearAnyChamber(ox, oy)) {
          map[oy][ox] = T.ROCK;
          rockCount++;
        }
      }
    }
  }

  // Carve tunnel corridors connecting all chambers
  carveTunnel(p1cx, p1cy, p2cx, p2cy, 'upper');
  carveTunnel(p1cx, p1cy, p2cx, p2cy, 'lower');
  if (playerCount >= 3) {
    carveTunnel(p1cx, p1cy, p3cx, p3cy, 'upper');
    carveTunnel(p2cx, p2cy, p3cx, p3cy, 'lower');
  }
  if (playerCount >= 4) {
    carveTunnel(p3cx, p3cy, p4cx, p4cy, 'upper');
    carveTunnel(p1cx, p1cy, p4cx, p4cy, 'lower');
  }

  // Water puddles (8-14, placed in clusters of 2-4)
  const numPuddleClusters = 4 + Math.floor(gameRandom() * 4);
  for (let c = 0; c < numPuddleClusters; c++) {
    let px, py, attempts = 0;
    do {
      px = 1 + Math.floor(gameRandom() * (COLS - 2));
      py = 1 + Math.floor(gameRandom() * (ROWS - 2));
      attempts++;
    } while (attempts < 100 && (map[py][px] !== T.DIRT || nearAnyChamber(px, py)));
    if (attempts < 100) {
      map[py][px] = T.PUDDLE;
      // Expand puddle cluster
      const clusterSize = 1 + Math.floor(gameRandom() * 3);
      for (let i = 0; i < clusterSize; i++) {
        const wx = px + Math.floor(gameRandom() * 3) - 1;
        const wy = py + Math.floor(gameRandom() * 3) - 1;
        if (wx >= 0 && wx < COLS && wy >= 0 && wy < ROWS && map[wy][wx] === T.DIRT) {
          if (!nearAnyChamber(wx, wy)) {
            map[wy][wx] = T.PUDDLE;
          }
        }
      }
    }
  }

  // Leaf litter (3-5)
  const numLeaves = 3 + Math.floor(gameRandom() * 3);
  for (let i = 0; i < numLeaves; i++) {
    let lx, ly;
    do {
      lx = Math.floor(gameRandom() * COLS);
      ly = Math.floor(gameRandom() * ROWS);
    } while (map[ly][lx] !== T.DUG);
    map[ly][lx] = T.LEAF;
  }

  // Ensure paths exist between all chambers
  if (!hasTwoDistinctPaths(p1cx, p1cy, p2cx, p2cy)) {
    carveTunnel(p1cx, p1cy, p2cx, p2cy, 'upper');
    carveTunnel(p1cx, p1cy, p2cx, p2cy, 'lower');
  }

  const spawns = {
    p1: { x: p1cx, y: p1cy },
    p2: { x: p2cx, y: p2cy },
    p3: { x: p3cx, y: p3cy },
    p4: { x: p4cx, y: p4cy },
  };

  // Helper closure used during map gen
  function nearAnyChamberLocal(x, y) {
    for (const key of Object.keys(spawns).slice(0, playerCount)) {
      if (nearChamber(x, y, spawns[key].x, spawns[key].y)) return true;
    }
    return false;
  }

  return spawns;
}

// Check if position is near any active player chamber
function nearAnyChamber(x, y) {
  // Fallback: check all 4 corners with generous margin
  const chambers = [
    { x: 3, y: ROWS - 4 },
    { x: COLS - 4, y: 3 },
    { x: 3, y: 3 },
    { x: COLS - 4, y: ROWS - 4 },
  ];
  for (let i = 0; i < playerCount; i++) {
    if (nearChamber(x, y, chambers[i].x, chambers[i].y)) return true;
  }
  return false;
}

function clearChamber(cx, cy) {
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (cy+dy >= 0 && cy+dy < ROWS && cx+dx >= 0 && cx+dx < COLS)
        map[cy+dy][cx+dx] = T.DUG;
}

function nearChamber(x, y, cx, cy) {
  return Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2;
}

function carveTunnel(x1, y1, x2, y2, bias) {
  // Bias 'upper' routes via top of map, 'lower' via bottom
  const midX = Math.floor((x1 + x2) / 2);
  let midY;
  if (bias === 'upper') {
    midY = Math.max(1, Math.floor(Math.min(y1, y2) * 0.3) + Math.floor(gameRandom() * 3));
  } else if (bias === 'lower') {
    midY = Math.min(ROWS - 2, Math.floor(Math.max(y1, y2) + (ROWS - Math.max(y1, y2)) * 0.7) + Math.floor(gameRandom() * 3));
  } else {
    midY = Math.floor((y1 + y2) / 2);
  }

  // Carve from start to midpoint, then midpoint to end
  carveSegment(x1, y1, midX, midY);
  carveSegment(midX, midY, x2, y2);
}

function carveSegment(x1, y1, x2, y2) {
  let x = x1, y = y1;
  while (x !== x2 || y !== y2) {
    // Force through rocks to guarantee connectivity
    if (map[y][x] === T.DIRT || map[y][x] === T.ROCK) map[y][x] = T.DUG;
    if (gameRandom() < 0.5) {
      if (y-1 >= 0 && (map[y-1][x] === T.DIRT) && gameRandom() < 0.3) map[y-1][x] = T.DUG;
      if (y+1 < ROWS && (map[y+1][x] === T.DIRT) && gameRandom() < 0.3) map[y+1][x] = T.DUG;
    }
    if (x !== x2 && (y === y2 || gameRandom() < 0.5)) {
      x += x < x2 ? 1 : -1;
    } else if (y !== y2) {
      y += y < y2 ? 1 : -1;
    }
  }
  if (map[y][x] === T.DIRT || map[y][x] === T.ROCK) map[y][x] = T.DUG;
}

function hasTwoDistinctPaths(x1, y1, x2, y2) {
  // Find first path via BFS
  const path1 = bfsFullPath(x1, y1, x2, y2);
  if (!path1) return false;

  // Temporarily block the middle section of path1 (not start/end)
  const blocked = [];
  for (let i = Math.floor(path1.length * 0.3); i < Math.floor(path1.length * 0.7); i++) {
    const [bx, by] = path1[i];
    if (map[by][bx] === T.DUG || map[by][bx] === T.TUNNEL) {
      blocked.push({ x: bx, y: by, orig: map[by][bx] });
      map[by][bx] = T.ROCK; // temporarily block
    }
  }

  // Check if second path exists
  const connected = bfsConnected(x1, y1, x2, y2);

  // Restore blocked tiles
  for (const b of blocked) map[b.y][b.x] = b.orig;

  return connected;
}

function bfsFullPath(x1, y1, x2, y2) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const queue = [[x1, y1]];
  visited[y1][x1] = true;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    if (cx === x2 && cy === y2) {
      const path = [[x2, y2]];
      let px = x2, py = y2;
      while (parent[py][px]) {
        [px, py] = parent[py][px];
        path.push([px, py]);
      }
      return path.reverse();
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny][nx]) {
        const t = map[ny][nx];
        if (t !== T.ROCK && t !== T.PUDDLE && t !== T.DIRT) {
          visited[ny][nx] = true;
          parent[ny][nx] = [cx, cy];
          queue.push([nx, ny]);
        }
      }
    }
  }
  return null;
}

function bfsConnected(x1, y1, x2, y2) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const queue = [[x1, y1]];
  visited[y1][x1] = true;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    if (cx === x2 && cy === y2) return true;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny][nx]) {
        const t = map[ny][nx];
        if (t !== T.ROCK && t !== T.PUDDLE && t !== T.DIRT) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }
  return false;
}

function canWalk(tx, ty) {
  if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return false;
  const t = map[ty][tx];
  return t === T.DUG || t === T.TUNNEL || t === T.LEAF;
}

function bfsPath(sx, sy, ex, ey, allowDirt) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const queue = [[sx, sy]];
  visited[sy][sx] = true;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    if (cx === ex && cy === ey) {
      // Trace back to find first step
      let px = ex, py = ey;
      while (parent[py][px]) {
        const [ppx, ppy] = parent[py][px];
        if (ppx === sx && ppy === sy) return { x: px, y: py };
        px = ppx;
        py = ppy;
      }
      return { x: ex, y: ey };
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny][nx]) {
        const t = map[ny][nx];
        if (t !== T.ROCK && t !== T.PUDDLE && (allowDirt || t !== T.DIRT)) {
          visited[ny][nx] = true;
          parent[ny][nx] = [cx, cy];
          queue.push([nx, ny]);
        }
      }
    }
  }
  return null;
}
