export interface NavGrid {
  w: number;
  h: number;
  blocked: Uint8Array;
}

export interface PathNode {
  x: number;
  y: number;
}

export function createNavGrid(w: number, h: number): NavGrid {
  return { w, h, blocked: new Uint8Array(w * h) };
}

export function idxOf(grid: NavGrid, x: number, y: number): number {
  return y * grid.w + x;
}

export function isBlocked(grid: NavGrid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return true;
  return grid.blocked[idxOf(grid, x, y)] === 1;
}

export function setRectBlocked(grid: NavGrid, x: number, y: number, w: number, d: number, val: 0 | 1): void {
  for (let i = x; i < x + w; i++) {
    for (let j = y; j < y + d; j++) {
      if (i < 0 || j < 0 || i >= grid.w || j >= grid.h) continue;
      grid.blocked[idxOf(grid, i, j)] = val;
    }
  }
}

class MinHeap {
  private ids: number[] = [];
  private scores: number[] = [];

  get size(): number {
    return this.ids.length;
  }

  push(id: number, score: number): void {
    this.ids.push(id);
    this.scores.push(score);
    let i = this.ids.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.scores[parent] <= this.scores[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number {
    const top = this.ids[0];
    const lastId = this.ids.pop() as number;
    const lastScore = this.scores.pop() as number;
    if (this.ids.length > 0) {
      this.ids[0] = lastId;
      this.scores[0] = lastScore;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let smallest = i;
        if (l < this.ids.length && this.scores[l] < this.scores[smallest]) smallest = l;
        if (r < this.ids.length && this.scores[r] < this.scores[smallest]) smallest = r;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    const ti = this.ids[a];
    this.ids[a] = this.ids[b];
    this.ids[b] = ti;
    const ts = this.scores[a];
    this.scores[a] = this.scores[b];
    this.scores[b] = ts;
  }
}

const SQRT2 = Math.SQRT2;

function heuristic(x0: number, y0: number, x1: number, y1: number): number {
  const dx = Math.abs(x0 - x1);
  const dy = Math.abs(y0 - y1);
  return (dx + dy) + (SQRT2 - 2) * Math.min(dx, dy);
}

const NEIGHBORS: ReadonlyArray<[number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

export interface FindPathOptions {
  maxExpand?: number;
  simplify?: boolean;
}

export function findPath(
  grid: NavGrid,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  opts: FindPathOptions = {},
): PathNode[] | null {
  const { maxExpand = 8000, simplify = true } = opts;
  if (sx === tx && sy === ty) return [{ x: tx, y: ty }];
  if (isBlocked(grid, tx, ty)) return null;

  const size = grid.w * grid.h;
  const gScore = new Float32Array(size).fill(Infinity);
  const cameFrom = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);

  const startIdx = idxOf(grid, sx, sy);
  const targetIdx = idxOf(grid, tx, ty);
  gScore[startIdx] = 0;

  const heap = new MinHeap();
  heap.push(startIdx, heuristic(sx, sy, tx, ty));

  let expanded = 0;
  while (heap.size > 0 && expanded < maxExpand) {
    const current = heap.pop();
    if (current === targetIdx) {
      const path = reconstruct(cameFrom, current, grid.w);
      return simplify ? simplifyPath(grid, path) : path;
    }
    if (closed[current]) continue;
    closed[current] = 1;
    expanded++;

    const cx = current % grid.w;
    const cy = (current - cx) / grid.w;
    for (const [dx, dy, cost] of NEIGHBORS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (isBlocked(grid, nx, ny)) continue;
      if (dx !== 0 && dy !== 0) {
        if (isBlocked(grid, cx + dx, cy) || isBlocked(grid, cx, cy + dy)) continue;
      }
      const nIdx = idxOf(grid, nx, ny);
      if (closed[nIdx]) continue;
      const tentative = gScore[current] + cost;
      if (tentative < gScore[nIdx]) {
        gScore[nIdx] = tentative;
        cameFrom[nIdx] = current;
        heap.push(nIdx, tentative + heuristic(nx, ny, tx, ty));
      }
    }
  }
  return null;
}

function reconstruct(cameFrom: Int32Array, endIdx: number, w: number): PathNode[] {
  const out: PathNode[] = [];
  let cur = endIdx;
  let guard = 0;
  while (cur !== -1 && guard++ < 100000) {
    const x = cur % w;
    out.push({ x, y: (cur - x) / w });
    cur = cameFrom[cur];
  }
  out.reverse();
  return out;
}

function segmentClear(grid: NavGrid, ax: number, ay: number, bx: number, by: number): boolean {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 4) + 1;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = Math.round(ax + (bx - ax) * t);
    const y = Math.round(ay + (by - ay) * t);
    if (isBlocked(grid, x, y)) return false;
    const px = ax + (bx - ax) * t;
    const py = ay + (by - ay) * t;
    const fx = px - Math.floor(px);
    const fy = py - Math.floor(py);
    if (fx < 0.15 || fx > 0.85) {
      const sx = fx < 0.5 ? Math.floor(px) - 1 : Math.floor(px) + 1;
      if (isBlocked(grid, sx, y)) return false;
    }
    if (fy < 0.15 || fy > 0.85) {
      const sy = fy < 0.5 ? Math.floor(py) - 1 : Math.floor(py) + 1;
      if (isBlocked(grid, x, sy)) return false;
    }
  }
  return true;
}

function simplifyPath(grid: NavGrid, path: PathNode[]): PathNode[] {
  if (path.length <= 2) return path;
  const out: PathNode[] = [path[0]];
  let anchor = 0;
  for (let probe = 2; probe < path.length; probe++) {
    if (!segmentClear(grid, path[anchor].x, path[anchor].y, path[probe].x, path[probe].y)) {
      anchor = probe - 1;
      out.push(path[anchor]);
    }
  }
  out.push(path[path.length - 1]);
  return out;
}
