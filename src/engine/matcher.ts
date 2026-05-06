import { GridMap } from './types';
import { cellKey, COLS_EVEN, getNeighbors, isValidCell } from './grid';

export interface MatchResult {
  newGrid: GridMap;
  poppedCount: number;
  fallenCount: number;
}

// BFS: find all cells connected to (startRow, startCol) with the same color.
function findCluster(
  grid: GridMap,
  startRow: number,
  startCol: number,
): Set<string> {
  const color = grid.get(cellKey(startRow, startCol));
  if (!color) return new Set();

  const visited = new Set<string>();
  const queue: Array<{ row: number; col: number }> = [
    { row: startRow, col: startCol },
  ];

  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    const key = cellKey(row, col);
    if (visited.has(key)) continue;
    if (grid.get(key) !== color) continue;
    visited.add(key);
    for (const n of getNeighbors(row, col)) {
      if (isValidCell(n.row, n.col) && !visited.has(cellKey(n.row, n.col))) {
        queue.push(n);
      }
    }
  }
  return visited;
}

// BFS from all ceiling cells (row 0) to find which bubbles are still attached.
function findConnectedToCeiling(grid: GridMap): Set<string> {
  const connected = new Set<string>();
  const queue: Array<{ row: number; col: number }> = [];

  for (let col = 0; col < COLS_EVEN; col++) {
    const key = cellKey(0, col);
    if (grid.has(key)) {
      queue.push({ row: 0, col });
    }
  }

  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    const key = cellKey(row, col);
    if (connected.has(key)) continue;
    if (!grid.has(key)) continue;
    connected.add(key);
    for (const n of getNeighbors(row, col)) {
      if (isValidCell(n.row, n.col) && !connected.has(cellKey(n.row, n.col))) {
        queue.push(n);
      }
    }
  }
  return connected;
}

// Process a shot that just placed a bubble at (row, col).
// Returns the updated grid and score contribution.
export function applyShot(
  grid: GridMap,
  row: number,
  col: number,
): MatchResult {
  const cluster = findCluster(grid, row, col);

  if (cluster.size < 3) {
    return { newGrid: grid, poppedCount: 0, fallenCount: 0 };
  }

  // Remove the matched cluster
  const afterPop: GridMap = new Map(grid);
  for (const key of cluster) {
    afterPop.delete(key);
  }

  // Find bubbles no longer connected to ceiling
  const connected = findConnectedToCeiling(afterPop);
  const fallen: string[] = [];
  for (const key of afterPop.keys()) {
    if (!connected.has(key)) fallen.push(key);
  }

  const afterFall: GridMap = new Map(afterPop);
  for (const key of fallen) {
    afterFall.delete(key);
  }

  return {
    newGrid: afterFall,
    poppedCount: cluster.size,
    fallenCount: fallen.length,
  };
}
