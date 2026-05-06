import { BubbleColor, BUBBLE_COLORS, GridMap, Point } from './types';

export const COLS_EVEN = 9;
export const COLS_ODD = 8;

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function colsForRow(row: number): number {
  return row % 2 === 0 ? COLS_EVEN : COLS_ODD;
}

// Returns the canvas-space center of a hex cell.
export function cellCenter(row: number, col: number, cellSize: number): Point {
  const rowOffset = row % 2 === 1 ? cellSize * 0.5 : 0;
  const x = col * cellSize + cellSize * 0.5 + rowOffset;
  const y = row * (cellSize * (Math.sqrt(3) / 2)) + cellSize * 0.5;
  return { x, y };
}

// Hex neighbours using offset-coordinate rules.
export function getNeighbors(
  row: number,
  col: number,
): Array<{ row: number; col: number }> {
  if (row % 2 === 0) {
    return [
      { row, col: col - 1 },
      { row, col: col + 1 },
      { row: row - 1, col: col - 1 },
      { row: row - 1, col },
      { row: row + 1, col: col - 1 },
      { row: row + 1, col },
    ];
  } else {
    return [
      { row, col: col - 1 },
      { row, col: col + 1 },
      { row: row - 1, col },
      { row: row - 1, col: col + 1 },
      { row: row + 1, col },
      { row: row + 1, col: col + 1 },
    ];
  }
}

export function isValidCell(row: number, col: number): boolean {
  if (row < 0) return false;
  return col >= 0 && col < colsForRow(row);
}

export function getMaxRow(grid: GridMap): number {
  let max = -1;
  for (const key of grid.keys()) {
    const r = parseInt(key.split(',')[0], 10);
    if (r > max) max = r;
  }
  return max;
}

// Shifts all existing bubbles down by one row and inserts a new row 0.
export function addRowAtTop(
  grid: GridMap,
  newRowBubbles: Map<number, BubbleColor>,
): GridMap {
  const next: GridMap = new Map();
  for (const [key, color] of grid) {
    const [r, c] = key.split(',').map(Number);
    next.set(cellKey(r + 1, c), color);
  }
  for (const [col, color] of newRowBubbles) {
    next.set(cellKey(0, col), color);
  }
  return next;
}

export function generateRandomRow(rowIndex: number): Map<number, BubbleColor> {
  const cols = colsForRow(rowIndex);
  const result = new Map<number, BubbleColor>();
  for (let col = 0; col < cols; col++) {
    result.set(
      col,
      BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    );
  }
  return result;
}

// Returns candidate empty cells adjacent to a bubble hit at (px, py).
// Checks neighbours of the closest occupied cell to the impact point.
export function findLandingCell(
  px: number,
  py: number,
  hitRow: number,
  hitCol: number,
  grid: GridMap,
  cellSize: number,
): { row: number; col: number } | null {
  const neighbours = getNeighbors(hitRow, hitCol);
  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;

  for (const n of neighbours) {
    if (!isValidCell(n.row, n.col)) continue;
    if (grid.has(cellKey(n.row, n.col))) continue;
    const c = cellCenter(n.row, n.col, cellSize);
    const d = Math.hypot(c.x - px, c.y - py);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

// Snap an incoming bubble that hits the ceiling to the nearest empty cell in row 0.
export function snapToCeiling(
  px: number,
  grid: GridMap,
  cellSize: number,
): { row: number; col: number } | null {
  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;

  for (let row = 0; row <= 1; row++) {
    const cols = colsForRow(row);
    for (let col = 0; col < cols; col++) {
      if (grid.has(cellKey(row, col))) continue;
      const c = cellCenter(row, col, cellSize);
      const d = Math.abs(c.x - px);
      if (d < bestDist) {
        bestDist = d;
        best = { row, col };
      }
    }
  }
  return best;
}
