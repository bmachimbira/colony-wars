// ─── Map Generation ──────────────────────────────────────────
function generateMap() {
  map = [];
  for (let y = 0; y < ROWS; y++) {
    map[y] = [];
    for (let x = 0; x < COLS; x++) {
      map[y][x] = T.DIRT;
    }
  }

  // Queen chambers — 3x3 clear zones
  const p1cx = 3, p1cy = ROWS - 4;
  const p2cx = COLS - 4, p2cy = 3;
  clearChamber(p1cx, p1cy);
  clearChamber(p2cx, p2cy);

  // Rock obstacles — fill ~25% of the playing field
  const targetRocks = Math.floor(COLS * ROWS * 0.25);
  let rockCount = 0;
  while (rockCount < targetRocks) {
    let rx, ry;
    do {
      rx = 2 + Math.floor(Math.random() * (COLS - 4));
      ry = 2 + Math.floor(Math.random() * (ROWS - 4));
    } while (nearChamber(rx, ry, p1cx, p1cy) || nearChamber(rx, ry, p2cx, p2cy));
    const size = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < size && rockCount < targetRocks; i++) {
      const ox = rx + Math.floor(Math.random() * 4) - 1;
      const oy = ry + Math.floor(Math.random() * 4) - 1;
      if (ox >= 0 && ox < COLS && oy >= 0 && oy < ROWS && map[oy][ox] !== T.ROCK) {
        if (!nearChamber(ox, oy, p1cx, p1cy) && !nearChamber(ox, oy, p2cx, p2cy)) {
          map[oy][ox] = T.ROCK;
          rockCount++;
        }
      }
    }
  }

  // Carve tunnel corridor connecting chambers
  carveTunnel(p1cx, p1cy, p2cx, p2cy);

  // Puddles (4-6)
  const numPuddles = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numPuddles; i++) {
    let px, py;
    do {
      px = 1 + Math.floor(Math.random() * (COLS - 2));
      py = 1 + Math.floor(Math.random() * (ROWS - 2));
    } while (map[py][px] !== T.DIRT || nearChamber(px, py, p1cx, p1cy) || nearChamber(px, py, p2cx, p2cy));
    map[py][px] = T.PUDDLE;
  }

  // Leaf litter (3-5)
  const numLeaves = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numLeaves; i++) {
    let lx, ly;
    do {
      lx = Math.floor(Math.random() * COLS);
      ly = Math.floor(Math.random() * ROWS);
    } while (map[ly][lx] !== T.DUG);
    map[ly][lx] = T.LEAF;
  }

  // BFS validation
  if (!bfsConnected(p1cx, p1cy, p2cx, p2cy)) {
    carveTunnel(p1cx, p1cy, p2cx, p2cy);
  }

  return { p1: { x: p1cx, y: p1cy }, p2: { x: p2cx, y: p2cy } };
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

function carveTunnel(x1, y1, x2, y2) {
  let x = x1, y = y1;
  while (x !== x2 || y !== y2) {
    if (map[y][x] === T.DIRT) map[y][x] = T.DUG;
    if (Math.random() < 0.5) {
      // Add some width to tunnel
      if (y-1 >= 0 && map[y-1][x] === T.DIRT && Math.random() < 0.3) map[y-1][x] = T.DUG;
      if (y+1 < ROWS && map[y+1][x] === T.DIRT && Math.random() < 0.3) map[y+1][x] = T.DUG;
    }
    if (x !== x2 && (y === y2 || Math.random() < 0.5)) {
      x += x < x2 ? 1 : -1;
    } else if (y !== y2) {
      y += y < y2 ? 1 : -1;
    }
  }
  if (map[y][x] === T.DIRT) map[y][x] = T.DUG;
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

function bfsPath(sx, sy, ex, ey) {
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
