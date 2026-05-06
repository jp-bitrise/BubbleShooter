import { BubbleColor, GridMap, Point, ShotPath } from './types';
import {
  cellCenter,
  cellKey,
  colsForRow,
  findLandingCell,
  getMaxRow,
  snapToCeiling,
} from './grid';

const STEP_FACTOR = 0.35; // step = BUBBLE_R * STEP_FACTOR

function interpolate(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

export function interpolateAlongPath(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const total = pathLength(points);
  const target = total * t;
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    );
    if (accumulated + seg >= target) {
      const localT = (target - accumulated) / seg;
      return interpolate(points[i - 1], points[i], localT);
    }
    accumulated += seg;
  }
  return points[points.length - 1];
}

export function getTotalPathLength(points: Point[]): number {
  return pathLength(points);
}

// Clamp aim angle so the player can't shoot sideways or backward.
// angle is measured from vertical (0 = straight up). Range: -π/2..+π/2.
export function clampAngle(raw: number): number {
  const MAX = (Math.PI / 180) * 80; // 80° from vertical
  return Math.max(-MAX, Math.min(MAX, raw));
}

export function angleFromTouch(
  touchX: number,
  touchY: number,
  launcherX: number,
  launcherY: number,
): number {
  const dx = touchX - launcherX;
  const dy = launcherY - touchY; // flip Y: positive dy means touch is above launcher
  if (dy <= 0) return 0; // pointing down or horizontal → snap to straight up
  return clampAngle(Math.atan2(dx, dy));
}

export function computeShotPath(
  startX: number,
  startY: number,
  angle: number,
  color: BubbleColor,
  grid: GridMap,
  cellSize: number,
  canvasWidth: number,
): ShotPath {
  const BUBBLE_R = cellSize * 0.46;
  const STEP = BUBBLE_R * STEP_FACTOR;
  const MAX_BOUNCES = 2;

  let px = startX;
  let py = startY;
  let dx = Math.sin(angle) * STEP;
  let dy = -Math.cos(angle) * STEP; // upward
  let bounces = 0;
  const points: Point[] = [{ x: px, y: py }];

  const maxRows = getMaxRow(grid) + 2;

  for (let i = 0; i < 15000; i++) {
    px += dx;
    py += dy;

    // Wall bounces
    if (dx < 0 && px < BUBBLE_R) {
      dx = -dx;
      px = BUBBLE_R;
      if (bounces < MAX_BOUNCES) {
        points.push({ x: px, y: py });
        bounces++;
      }
    } else if (dx > 0 && px > canvasWidth - BUBBLE_R) {
      dx = -dx;
      px = canvasWidth - BUBBLE_R;
      if (bounces < MAX_BOUNCES) {
        points.push({ x: px, y: py });
        bounces++;
      }
    }

    // Ceiling hit
    if (py - BUBBLE_R <= 0) {
      py = BUBBLE_R;
      const landing = snapToCeiling(px, grid, cellSize);
      if (landing) {
        const c = cellCenter(landing.row, landing.col, cellSize);
        points.push({ x: c.x, y: c.y });
        return { points, landingRow: landing.row, landingCol: landing.col, color };
      }
      points.push({ x: px, y: py });
      return { points, landingRow: 0, landingCol: 0, color };
    }

    // Grid collision: check nearby cells
    const rowHeight = cellSize * (Math.sqrt(3) / 2);
    const estRow = Math.round(py / rowHeight - 0.5);

    for (let dr = -1; dr <= 2; dr++) {
      const row = estRow + dr;
      if (row < 0 || row > maxRows) continue;
      const cols = colsForRow(row);
      const rowOff = row % 2 === 1 ? cellSize * 0.5 : 0;
      const estCol = Math.round((px - rowOff - cellSize * 0.5) / cellSize);

      for (let dc = -1; dc <= 2; dc++) {
        const col = estCol + dc;
        if (col < 0 || col >= cols) continue;
        if (!grid.has(cellKey(row, col))) continue;

        const c = cellCenter(row, col, cellSize);
        if (Math.hypot(px - c.x, py - c.y) < BUBBLE_R * 2 - 1) {
          const landing = findLandingCell(px, py, row, col, grid, cellSize);
          if (landing) {
            const lc = cellCenter(landing.row, landing.col, cellSize);
            points.push({ x: lc.x, y: lc.y });
            return {
              points,
              landingRow: landing.row,
              landingCol: landing.col,
              color,
            };
          }
        }
      }
    }
  }

  // Fallback: land at row 0 col 0
  return { points, landingRow: 0, landingCol: 0, color };
}
